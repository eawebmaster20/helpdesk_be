import { getUserByEmail } from "../models/users.model";
import { sendPasswordSetupEmail } from "../utils/email";
import {
  comparePassword,
  generateSecureToken,
  isValidEmail,
} from "./jwt.utils";

export async function authenticate(req: any, res: any, next: any) {
  if (!req.email) return res.status(401).json({ message: "Unauthorized" });
  const emailValid = isValidEmail(req.email);
  if (!emailValid) return res.status(400).json({ message: "Invalid email" });
  const user = await getUserByEmail(req.email);
  if (user) {
    const passwordMatch = await comparePassword(
      req.password,
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
    const emailSent = await sendPasswordSetupEmail(user, resetToken);
  }
}
