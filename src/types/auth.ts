export interface JwtPayload {
  id: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}
export interface UserJwtPayload {
  id: string;
  email: string;
  iat?: number;
  exp?: number;
}
