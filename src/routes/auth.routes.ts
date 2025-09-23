import { Router, Request, Response } from "express";

const router = Router();

// POST /auth/sso/callback
router.post("/sso/callback", (req: Request, res: Response) => {
  // OIDC SSO callback logic (Azure AD/Google Workspace)
  res.status(501).json({ message: "Not implemented" });
});

// GET /me
router.get("/me", (req: Request, res: Response) => {
  // Return user profile & permissions
  res.status(501).json({ message: "Not implemented" });
});

export default router;
