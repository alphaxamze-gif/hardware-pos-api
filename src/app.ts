import express from "express";
import cors from "cors";
import { PrismaClient } from "@prisma/client";
import categoryRoutes from "./routes/category.routes";
import userRoutes from "./routes/user.routes";
import authRoutes from "./routes/auth.routes";
import productRoutes from "./routes/product.routes";
import customerRoutes from "./routes/customer.routes";
import supplierRoutes from "./routes/supplier.routes";
import purchaseRoutes from "./routes/purchase.routes";
import saleRoutes from "./routes/sale.routes";
import paymentRoutes from "./routes/payment.routes";
import expenseRoutes from "./routes/expense.routes";
import dashboardRoutes from "./routes/dashboard.routes";
import reminderRoutes from "./routes/reminder.routes";
import { authenticate, authorize, AuthRequest } from "./middleware/auth.middleware";

const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/products", productRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/suppliers", supplierRoutes);
app.use("/api/purchases", purchaseRoutes);
app.use("/api/sales", saleRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/expenses", expenseRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/reminders", reminderRoutes);

app.get("/api/me", authenticate, (req: AuthRequest, res) => {
  res.json({
    message: "You are authenticated",
    user: req.user,
  });
});

app.get("/api/admin-only", authenticate, authorize("ADMIN"), (req: AuthRequest, res) => {
  res.json({
    message: "Welcome Admin",
    user: req.user,
  });
});

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
  } catch {
    res.status(500).json({ status: "error", database: "disconnected" });
  }
});

export default app;
