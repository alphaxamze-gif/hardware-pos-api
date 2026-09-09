import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import authRoutes from "./routes/auth.routes";

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);

import { authenticate, authorize, AuthRequest } from "./middleware/auth.middleware";

// Protected route example
app.get("/api/me", authenticate, (req: AuthRequest, res) => {
  res.json({
    message: "You are authenticated",
    user: req.user,
  });
});

// Admin only route example
app.get("/api/admin-only", authenticate, authorize("ADMIN"), (req: AuthRequest, res) => {
  res.json({
    message: "Welcome Admin",
    user: req.user,
  });
});

// Test routes
app.get("/", (req, res) => {
  res.json({
    message: "Hardware POS API is running",
    currency: process.env.CURRENCY,
    vat: process.env.DEFAULT_VAT_RATE,
  });
});

app.get("/health", async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: "ok", database: "connected" });
  } catch (error) {
    res.status(500).json({ status: "error", database: "disconnected" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});