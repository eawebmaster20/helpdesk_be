import nodemailer from "nodemailer";
import dotenv from "dotenv";
import { User } from "../models/ticket.model";
// import { User } from '../types';

// Ensure environment variables are loaded
dotenv.config();

// Create transporter
const createTransporter = () => {
  if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER) {
    console.warn(
      "Email configuration not found. Email features will be disabled."
    );
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT || "587"),
    secure: parseInt(process.env.EMAIL_PORT || "587") === 465,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
};

const transporter = createTransporter();

export const sendTestEmail = async (to: string): Promise<boolean> => {
  if (!transporter) {
    console.warn("Email transporter not initialized. Test email not sent.");
    return false;
  }

  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to,
      subject: "Test Email",
      text: "This is a test email from the Helpdesk API.",
    };

    await transporter.sendMail(mailOptions);
    console.log(`Test email sent to ${to}`);
    return true;
  } catch (error) {
    console.error("Failed to send test email:", error);
    return false;
  }
};

// Send password setup email
export const sendPasswordSetupEmail = async (
  email: string,
  resetToken: string
): Promise<boolean> => {
  const frontendUrl = process.env.FRONTEND_URL;
  if (!transporter && !frontendUrl) {
    console.log(`Password setup email would be sent to ${email}`);
    return false;
  }

  try {
    console.log(`🔗 Setup URL: ${frontendUrl}/?token=${resetToken}`);
    const setupUrl = `${frontendUrl}/?token=${resetToken}`;

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: "Set Up Your Service Desk Account Password",
      html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #4F46E5;">Welcome to Subscription App!</h2>
                <p>Hello Brightest star,</p>
                <p>Your account has been created successfully. Please click the button below to set up your password:</p>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${setupUrl}" 
                    style="background-color: #4F46E5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">
                    Set Up Password
                    </a>
                </div>
                
                <p>Or copy and paste this link in your browser:</p>
                <p style="word-break: break-all; color: #6B7280;">${setupUrl}</p>
                
                <hr style="margin: 30px 0; border: none; border-top: 1px solid #E5E7EB;">
                
                <p style="color: #6B7280; font-size: 14px;">
                    This link will expire in 24 hours for security reasons.<br>
                    If you didn't expect this email, please ignore it.
                </p>
                
                <p style="color: #6B7280; font-size: 12px;">
                    Best regards,<br>
                    The Subscription App Team
                </p>
                </div>
            `,
      text: `
                Welcome to Subscription App!

                Hello Brightest star,

                Your account has been created successfully. Please visit the following link to set up your password:
                
                ${setupUrl}
                
                This link will expire in 24 hours for security reasons.
                If you didn't expect this email, please ignore it.
                
                Best regards,
                The Subscription App Team
            `,
    };

    await transporter!.sendMail(mailOptions);
    console.log(`Password setup email sent to ${email}`);
    return true;
  } catch (error) {
    console.error("Failed to send password setup email:", error);
    return false;
  }
};

export default transporter;
