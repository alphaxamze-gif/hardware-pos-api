import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth.middleware";
import {
  getExpenses,
  getExpense,
  createNewExpense,
  updateExistingExpense,
  removeExpense,
} from "../controllers/expense.controller";

const router = Router();

router.use(authenticate, authorize("ADMIN", "MANAGER"));

router.get("/", getExpenses);
router.get("/:id", getExpense);
router.post("/", createNewExpense);
router.put("/:id", updateExistingExpense);
router.delete("/:id", removeExpense);

export default router;