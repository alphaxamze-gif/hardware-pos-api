import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth.middleware";
import {
  getCustomerDueList,
  getSupplierDueList,
  getDueSummary,
} from "../controllers/reminder.controller";

const router = Router();

router.use(authenticate, authorize("ADMIN", "MANAGER"));

router.get("/customers", getCustomerDueList);
router.get("/suppliers", getSupplierDueList);
router.get("/", getDueSummary);

export default router;