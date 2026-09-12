"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const user_routes_1 = __importDefault(require("./routes/user.routes"));
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const client_1 = require("@prisma/client");
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const prisma = new client_1.PrismaClient();
const PORT = process.env.PORT || 3000;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Routes
app.use("/api/auth", auth_routes_1.default);
app.use("/api/users", user_routes_1.default);
const auth_middleware_1 = require("./middleware/auth.middleware");
// Protected route example
app.get("/api/me", auth_middleware_1.authenticate, (req, res) => {
    res.json({
        message: "You are authenticated",
        user: req.user,
    });
});
// Admin only route example
app.get("/api/admin-only", auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)("ADMIN"), (req, res) => {
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
        await prisma.$queryRaw `SELECT 1`;
        res.json({ status: "ok", database: "connected" });
    }
    catch (error) {
        res.status(500).json({ status: "error", database: "disconnected" });
    }
});
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
