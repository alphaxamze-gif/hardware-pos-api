import jwt from "jsonwebtoken";

const JWT_SECRET = "hardware-pos-secret-123";   // temporary hardcoded

export const generateToken = (userId: string, role: string) => {
  return jwt.sign({ userId, role }, JWT_SECRET, { expiresIn: "7d" });
};