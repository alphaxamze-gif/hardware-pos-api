import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth.middleware";
import {
  getCustomers,
  getCustomer,
  createNewCustomer,
  updateExistingCustomer,
  removeCustomer,
} from "../controllers/customer.controller";

const router = Router();

router.use(authenticate, authorize("ADMIN", "MANAGER", "CASHIER"));

router.get("/", getCustomers);
router.get("/:id", getCustomer);
router.post("/", createNewCustomer);
router.put("/:id", updateExistingCustomer);
router.delete("/:id", removeCustomer);

export default router;