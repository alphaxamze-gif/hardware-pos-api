import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth.middleware";
import {
  getProducts,
  getProduct,
  createNewProduct,
  updateExistingProduct,
  removeProduct,
} from "../controllers/product.controller";

const router = Router();

router.use(authenticate, authorize("ADMIN", "MANAGER"));

router.get("/", getProducts);
router.get("/:id", getProduct);
router.post("/", createNewProduct);
router.put("/:id", updateExistingProduct);
router.delete("/:id", removeProduct);

export default router;