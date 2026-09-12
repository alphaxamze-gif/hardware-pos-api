import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = "hardware-pos-secret-123";   // temporary hardcoded
export interface AuthRequest extends Request {
  user?: {
    userId: string;
    role: string;
  };
}
export const authenticate = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  console.log("=== AUTH DEBUG ===");
  console.log("Authorization header:", authHeader);

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    console.log("Problem: No Bearer token found");
    return res.status(401).json({ message: "Access denied. No token provided." });
  }

  const token = authHeader.split(" ")[1];
  console.log("Extracted token:", token);

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: string;
      role: string;
    };

    console.log("Token successfully decoded:", decoded);
    req.user = decoded;
    next();
  } catch (error: any) {
    console.log("JWT verify error:", error.message);
    return res.status(401).json({ message: "Invalid or expired token." });
  }
};

// Optional: Role-based middleware
export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Forbidden. Insufficient permissions." });
    }

    next();
  };
};