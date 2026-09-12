import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth.middleware";
import {
  getCategories,
  getCategory,
  createNewCategory,
  updateExistingCategory,
  removeCategory,
} from "../controllers/category.controller";

const router = Router();

// Only Admin and Manager can manage categories
router.use(authenticate, authorize("ADMIN", "MANAGER"));

router.get("/", getCategories);
router.get("/:id", getCategory);
router.post("/", createNewCategory);
router.put("/:id", updateExistingCategory);
router.delete("/:id", removeCategory);

export default router;