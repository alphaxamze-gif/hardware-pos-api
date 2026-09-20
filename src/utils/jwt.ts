import jwt from "jsonwebtoken";

const getJwtSecret = (): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not set in environment variables");
  }
  return secret;
};

export const generateToken = (userId: string, role: string) => {
  return jwt.sign({ userId, role }, getJwtSecret(), { expiresIn: "7d" });
};
