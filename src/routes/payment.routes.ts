import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth.middleware";
import {
  getPayments,
  getPayment,
  createNewPayment,
  removePayment,
} from "../controllers/payment.controller";

const router = Router();

router.use(authenticate, authorize("ADMIN", "MANAGER", "CASHIER"));

router.get("/", getPayments);
router.get("/:id", getPayment);
router.post("/", createNewPayment);
router.delete("/:id", removePayment);

export default router;