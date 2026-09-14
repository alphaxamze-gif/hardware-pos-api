import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth.middleware";
import { getDashboard } from "../controllers/dashboard.controller";

const router = Router();

router.use(authenticate, authorize("ADMIN", "MANAGER"));

router.get("/", getDashboard);

export default router;