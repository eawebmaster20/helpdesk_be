import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import dotenv from "dotenv";
import { JwtPayload, UserJwtPayload } from "../types/auth";

// Ensure environment variables are loaded
dotenv.config();

// Password hashing
export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = process.env.BCRYPT_SALT_ROUNDS
    ? parseInt(process.env.BCRYPT_SALT_ROUNDS)
    : 10;
  return await bcrypt.hash(password, saltRounds);
};

export const comparePassword = async (
  password: string,
  hash: string
): Promise<boolean> => {
  return await bcrypt.compare(password, hash);
};

// JWT utilities - Company tokens
export const generateToken = (
  payload: Omit<JwtPayload, "iat" | "exp">
): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not defined in environment variables");
  }

  return jwt.sign(payload as string | Buffer | object, secret, {
    expiresIn: "1d",
  });
};

export const verifyToken = (token: string): JwtPayload => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not defined in environment variables");
  }

  return jwt.verify(token, secret) as JwtPayload;
};

// JWT utilities - User tokens
export const generateUserToken = (
  payload: Omit<UserJwtPayload, "iat" | "exp">
): string => {
  const secret = process.env.JWT_SECRET;
  const expiresIn = process.env.JWT_EXPIRES_IN || "1d";
  if (!secret) {
    throw new Error("JWT_SECRET is not defined in environment variables");
  }

  return jwt.sign(payload, secret, {
    expiresIn: expiresIn as jwt.SignOptions["expiresIn"],
  });
};

export const generateUserRefreshToken = (): string => {
  const secret = process.env.JWT_REFRESH_SECRET;
  if (!secret) {
    throw new Error(
      "JWT_REFRESH_SECRET is not defined in environment variables"
    );
  }

  return jwt.sign({}, secret, {
    expiresIn: process.env.NODE_ENV === "production" ? "1d" : "1d",
  });
};

export const verifyUserToken = (token: string): UserJwtPayload => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not defined in environment variables");
  }

  return jwt.verify(token, secret) as UserJwtPayload;
};

export const verifyUserRefreshToken = (token: string): void => {
  const secret = process.env.JWT_REFRESH_SECRET;
  if (!secret) {
    throw new Error(
      "JWT_REFRESH_SECRET is not defined in environment variables"
    );
  }

  jwt.verify(token, secret);
};

// Generate secure random tokens
export const generateSecureToken = (): string => {
  return uuidv4() + "-" + Date.now().toString(36);
};

// Email validation
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@starassurance\.com$/;
  return emailRegex.test(email);
};

// Password strength validation
export const isStrongPassword = (password: string): boolean => {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
};

// Sanitize user input
export const sanitizeString = (input: string): string => {
  return input.trim().replace(/[<>]/g, "");
};

// Generate username suggestions
export const generateUsernameFromName = (name: string): string => {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "")
      .substring(0, 20) + Math.floor(Math.random() * 1000)
  );
};
