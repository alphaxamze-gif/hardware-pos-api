import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth.middleware";
import {
  getSuppliers,
  getSupplier,
  createNewSupplier,
  updateExistingSupplier,
  removeSupplier,
} from "../controllers/supplier.controller";

const router = Router();

router.use(authenticate, authorize("ADMIN", "MANAGER"));

router.get("/", getSuppliers);
router.get("/:id", getSupplier);
router.post("/", createNewSupplier);
router.put("/:id", updateExistingSupplier);
router.delete("/:id", removeSupplier);

export default router;