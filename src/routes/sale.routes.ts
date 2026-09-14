import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth.middleware";
import {
  getSales,
  getSale,
  createNewSale,
  removeSale,
} from "../controllers/sale.controller";

const router = Router();

router.use(authenticate, authorize("ADMIN", "MANAGER", "CASHIER"));

router.get("/", getSales);
router.get("/:id", getSale);
router.post("/", createNewSale);
router.delete("/:id", removeSale);

export default router;