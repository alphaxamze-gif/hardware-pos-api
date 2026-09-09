import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth.middleware";
import {
  getUsers,
  getUser,
  createNewUser,
  updateExistingUser,
  removeUser,
} from "../controllers/user.controller";

const router = Router();

// All user routes require authentication + ADMIN role
router.use(authenticate, authorize("ADMIN"));

router.get("/", getUsers);
router.get("/:id", getUser);
router.post("/", createNewUser);
router.put("/:id", updateExistingUser);
router.delete("/:id", removeUser);

export default router;