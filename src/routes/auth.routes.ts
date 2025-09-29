import { Router, Request, Response } from "express";
import { authenticate } from "../middlewares/authenticate.utils";

const router = Router();

// POST /auth/sso/callback
router.post("/sso/callback", (req: Request, res: Response) => {
  // OIDC SSO callback logic (Azure AD/Google Workspace)
  res.status(501).json({ message: "Not implemented" });
});

router.post("/login", authenticate);

export default router;
