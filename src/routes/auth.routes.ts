import { Router, Request, Response } from "express";
import {
  authenticate,
  authenticateSSO,
} from "../middlewares/authenticate.utils";
import { login, updateADUserDepartment } from "../controllers/auth.controller";
// import { ldapAuthenticate } from "../controllers/auth.controller";

const router = Router();

// POST /auth/sso/callback
router.post("/sso/callback", (req: Request, res: Response) => {
  // OIDC SSO callback logic (Azure AD/Google Workspace)
  console.log("SSO Callback:", req.body);
  res.status(501).json({ message: "Not implemented" });
});

// POST /auth/sso/logout
router.post("/sso/logout", (req: Request, res: Response) => {
  // OIDC SSO logout logic (Azure AD/Google Workspace)
  console.log("SSO Logout:", req.body);
  res.status(501).json({ message: "Not implemented" });
});

router.post("/login", login);
router.post("/update-profile", updateADUserDepartment);
router.get("/sso", authenticateSSO);
// router.post("/ldap", ldapAuthenticate);

export default router;
