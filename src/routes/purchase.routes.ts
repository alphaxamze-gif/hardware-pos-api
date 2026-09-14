import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth.middleware";
import {
  getPurchases,
  getPurchase,
  createNewPurchase,
  removePurchase,
} from "../controllers/purchase.controller";

const router = Router();

router.use(authenticate, authorize("ADMIN", "MANAGER"));

router.get("/", getPurchases);
router.get("/:id", getPurchase);
router.post("/", createNewPurchase);
router.delete("/:id", removePurchase);

export default router;