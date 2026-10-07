import jwt from "jsonwebtoken";

const accessSecret = process.env.JWT_ACCESS_SECRET!;
const refreshSecret = process.env.JWT_REFRESH_SECRET!;

export function generateAccessToken(userId: string): string {
  return jwt.sign(
    { userId },
    accessSecret,
    { expiresIn: "15m" }
  );
}

export function generateRefreshToken(userId: string): string {
  return jwt.sign(
    { userId },
    refreshSecret,
    { expiresIn: "7d" }
  );
}