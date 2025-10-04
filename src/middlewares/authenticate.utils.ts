import { getUserByEmail } from "../models/users.model";
import { sendPasswordSetupEmail } from "../utils/email";
import {
  comparePassword,
  generateSecureToken,
  isValidEmail,
} from "./jwt.utils";
import * as adal from "adal-node";

export async function authenticate(req: any, res: any, next: any) {
  const [email, password] = [req.body.email, req.body.password];
  if (!email) return res.status(401).json({ message: "Unauthorized" });
  const emailValid = isValidEmail(email);
  if (!emailValid) return res.status(400).json({ message: "Invalid email" });
  const user = await getUserByEmail(req.email);
  console.log(user.rows);
  if (user.rows.length) {
    const passwordMatch = await comparePassword(
      password,
      user.rows[0].password
    );
    if (passwordMatch) {
      const { password, ...userWithoutPassword } = user.rows[0];
      req.user = userWithoutPassword;
      next();
    } else {
      res.status(401).json({ message: "Unauthorized" });
    }
  } else {
    const resetToken = generateSecureToken();
    const emailSent = await sendPasswordSetupEmail(email, resetToken);
    if (emailSent) {
      // Store resetToken in DB with expiry (not implemented here)
      res.status(403).json({
        message:
          "User not found. A password setup email has been sent if the email is registered.",
      });
    } else {
      res
        .status(500)
        .json({ message: "Failed to send password setup email. Try again." });
    }
  }
}

export const adConfig = {
  tenant: process.env.AZURE_TENANT_ID || "",
  authorityHostUrl: "https://login.windows.net",
  clientId: process.env.AZURE_CLIENT_ID || "",
  username: process.env.AZURE_USERNAME || "",
  password: process.env.AZURE_PASSWORD || "",
  clientSecret: process.env.AZURE_CLIENT_SECRET || "",
  // clientSecret: process.env.AZURE_CLIENT_SECRET || "",
  resource: process.env.AZURE_RESOURCE || "",
};

export async function authenticateSSO(req: any, res: any, next: any) {
  const authorityUrl = `${adConfig.authorityHostUrl}/${adConfig.tenant}`;
  const context = new adal.AuthenticationContext(authorityUrl);
  // context.acquireTokenWithClientCredentials(
  //   adConfig.resource,
  //   adConfig.clientId,
  //   adConfig.clientSecret,
  //   (err, tokenResponse) => {
  //     if (err) {
  //       console.log("Failed to acquire token:", err);
  //       // return res.json({ message: "SSO Authentication failed" });
  //     } else {
  //       const accessToken = tokenResponse;
  //       console.log("Access Token:", accessToken);
  //       return res.status(200);
  //       // .json({ message: "SSO Authentication successful" });
  //       // You can use the accessToken to authenticate API requests
  //     }
  //   }
  // );
  // Placeholder for SSO authentication logic
  // Implement OIDC SSO authentication (Azure AD/Google Workspace) here
  context.acquireTokenWithUsernamePassword(
    adConfig.resource,
    adConfig.username,
    adConfig.password,
    adConfig.clientId,
    (err, tokenResponse) => {
      if (err) {
        console.log("Failed to acquire token:", err);
        return res.status(401).json({ message: "SSO Authentication failed" });
      } else {
        console.log("Access Token:", tokenResponse);
        return res.json({ message: "SSO Authentication successful" });
        // You can use the accessToken to authenticate API requests
      }
    }
  );
}
