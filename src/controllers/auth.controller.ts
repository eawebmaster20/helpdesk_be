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

export async function login(req: Request, res: Response) {
  try {
    const user = await ldapAuthenticate(req, res, () => {});
    console.log(user);
    // const result = await db.query("SELECT * FROM users WHERE email = $1 OR userPrincipalName = $2 OR name = $3", [
    //   user.mail,
    //   user.userPrincipalName,
    //   user.name,
    // ]);
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    res.status(200).json({ message: "Login successful", user });
  } catch (err) {
    res.status(500).json({ message: "Database error", error: err });
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

async function ldapAuthenticate(req: any, res: any, next: any) {
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
    // res
    //   .status(200)
    //   .json({
    //     message: "LDAP authentication successful",
    //     value: searchResult.searchEntries[0],
    //   });
  } catch (error) {
    // console.error("LDAP bind error:", error);
    next(error);
    return res.status(500).json({ message: "authentication failed" });
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
