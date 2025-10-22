import { Request, Response } from "express";
import {
  getUsersModel,
  insertUserModel,
  updateUserModel,
} from "../models/users.model";
import { authenticate } from "../middlewares/authenticate.utils";
import { verify } from "crypto";

import { Client, Attribute, Change } from "ldapts";
import { db } from "../db";
import { parseLDAPDN } from "../utils/ldap";
import { generateUserToken } from "../middlewares/jwt.utils";
import { error } from "console";

export async function login(req: Request, res: Response) {
  try {
    const ldapUser: any = await ldapAuthenticate(req, res);
    
    if (!ldapUser || !ldapUser.dn) {
      return res.status(401).json({ message: "LDAP authentication failed", status: 'error', error: ldapUser});
    }
    
    // Parse LDAP DN to get user information
    const payload = parseLDAPDN(ldapUser.dn);
    const userEmail = ldapUser.userPrincipalName || ldapUser.mail || '';
    
    // Check if user exists in database
    const existingUserResult = await db.query(
      "SELECT * FROM users WHERE email = $1",
      [userEmail]
    );
    
    let dbUser;
    if (existingUserResult.rows.length === 0) {
      // User doesn't exist, create new user
      let departmentId = null;
      let branchId = null;
      
      // Find department ID by matching department name (case-insensitive)
      if (payload.department) {
        const departmentResult = await db.query(
          "SELECT id FROM departments WHERE LOWER(name) = LOWER($1)",
          [payload.department]
        );
        
        if (departmentResult.rows.length > 0) {
          departmentId = departmentResult.rows[0].id;
        }
      }

      // Find branch ID by matching branch name (case-insensitive)
      if (payload.branch) {
        const branchResult = await db.query(
          "SELECT id FROM branches WHERE LOWER(name) = LOWER($1)",
          [payload.branch]
        );

        if (branchResult.rows.length > 0) {
          branchId = branchResult.rows[0].id;
        }
      }
      
      // Create new user
      const newUserResult = await db.query(
        `INSERT INTO users (name, email, role, department_id, branch_id) 
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [payload.name, userEmail, '0', departmentId, branchId]
      );
      
      dbUser = newUserResult.rows[0];
    } else {
      // User exists, use existing user data
      dbUser = existingUserResult.rows[0];
    }
    
    // Fetch user with department data (replace department_id with actual department object)
    const userWithDeptResult = await db.query(`
      SELECT 
        u.id,
        u.name,
        u.email,
        u.role,
        u.created_at,
        u.updated_at,
        d.id as department_id,
        d.name as department_name,
        d.head_id as department_head_id,
        b.id as branch_id,
        b.name as branch_name,
        b.head_id as branch_head_id
      FROM users u
      LEFT JOIN departments d ON u.department_id = d.id
      LEFT JOIN branches b ON u.branch_id = b.id
      WHERE u.id = $1
    `, [dbUser.id]);
    
    const userWithDept = userWithDeptResult.rows[0];
    
    // Format user object with department data
    const formattedUser = {
      id: userWithDept.id,
      name: userWithDept.name,
      email: userWithDept.email,
      role: userWithDept.role,
      created_at: userWithDept.created_at,
      updated_at: userWithDept.updated_at,
      department: userWithDept.department_id ? {
        id: userWithDept.department_id,
        name: userWithDept.department_name,
        head_id: userWithDept.department_head_id
      } : null,
      branch: userWithDept.branch_id ? {
        id: userWithDept.branch_id,
        name: userWithDept.branch_name,
        head_id: userWithDept.branch_head_id
      } : null,
      ldapUser
    };
    
    // Generate JWT token
    const token = generateUserToken({
      id: dbUser.id,
      email: dbUser.email
    });
    
    // Return success response with user data and token
    res.status(200).json({ 
      message: "Login successful", 
      data: {
        user: formattedUser,
        token: token,
      }, 
      status: 'success' 
    });
    
  } catch (err) {
    // console.error('Login error:', err);
    res.status(500).json({ message: "Authentication error", error: err, status: 'error' });
  }
}

export async function createUser(req: Request, res: Response) {
  const { name, email, role, departmentId } = req.body;
  if (!name || !email || !role) {
    return res
      .status(400)
      .json({ message: "name, email, and role are required" });
  }
  try {
    const result = await insertUserModel(name, email, role, departmentId);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: "Database error", error: err });
  }
}

export async function updateUser(req: Request, res: Response) {
  const { id } = req.params;
  const { name, email, role, departmentId } = req.body;
  try {
    const result = await updateUserModel(id, name, email, role, departmentId);
    if (result.rowCount === 0) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: "Database error", error: err });
  }
}

async function ldapAuthenticate(req: any, res: any) {
  // console.log("login for " + req.body.username);
  let client;
  try {
    client = new Client({ url: process.env.LDAP_URL || "" });
    await client.bind(
      process.env.LDAP_SERVICE_ACCOUNT_UPN || "",
      process.env.LDAP_SERVICE_ACCOUNT_PASSWORD || ""
    );
    console.log("LDAP bind successful");
    const opts = {
      filter: `(sAMAccountName=${req.body.username})`,
      // filter: "(objectClass=user)",
      scope: "sub" as const,
      attributes: ["*"],
    };

    const searchResult = await client.search(
      process.env.LDAP_BASE_DN || "",
      opts
    );
    const userDN = searchResult.searchEntries[0].distinguishedName as string;
    await client.unbind();
    const userClient = new Client({ url: process.env.LDAP_URL || "" });
    await userClient.bind(userDN, req.body.password);
    return searchResult.searchEntries[0];
  } catch (error) {
    return error;
  } finally {
    if (client) {
      await client.unbind();
    }
  }
}

//  * Update a user's department in Active Directory.
//  * @param username sAMAccountName of the user
//  * @param newDepartment new department name
//  * @returns true if update succeeded, false otherwise

export async function updateADUserDepartment(req: any, res: any, next: any) {
  const { username, department, email, departmentNumber } = req.body;
  const client = new Client({ url: process.env.LDAP_URL || "" });
  try {
    await client.bind(
      process.env.LDAP_SERVICE_ACCOUNT_UPN || "",
      process.env.LDAP_SERVICE_ACCOUNT_PASSWORD || ""
    );

    // Search for user DN
    const opts = {
      filter: `(sAMAccountName=${username})`,
      scope: "sub" as const,
      attributes: ["*"],
    };
    const searchResult = await client.search(
      process.env.LDAP_BASE_DN || "",
      opts
    );
    if (searchResult.searchEntries.length === 0) {
      throw new Error("User not found");
    }
    const userDN = searchResult.searchEntries[0].distinguishedName as string;

    // Update department attribute
    await client.modify(userDN, [
      new Change({
        operation: "replace",
        modification: new Attribute({
          type: "department",
          values: [department],
        }),
      }),
      new Change({
        operation: "replace",
        modification: new Attribute({
          type: "mail",
          values: [email],
        }),
      }),
      new Change({
        operation: "replace",
        modification: new Attribute({
          type: "mail",
          values: [email],
        }),
      }),
      new Change({
        operation: "replace",
        modification: new Attribute({
          type: "departmentNumber",
          values: [departmentNumber],
        }),
      }),
    ]);
    res.status(200).json({ message: "User department updated successfully" });
  } catch (error) {
    console.error("LDAP update error:", error);
    res.status(500).json({ message: "Failed to update user department" });
  } finally {
    await client.unbind();
  }
}
