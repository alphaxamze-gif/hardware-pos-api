import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
} from "../services/user.service";

export const getUsers = async (req: AuthRequest, res: Response) => {
  try {
    const users = await getAllUsers();
    res.json(users);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getUser = async (req: AuthRequest, res: Response) => {
  try {
    const user = await getUserById(String(req.params.id));
    res.json(user);
  } catch (error: any) {
    res.status(404).json({ message: error.message });
  }
};

export const createNewUser = async (req: AuthRequest, res: Response) => {
  try {
    const { email, password, firstName, lastName, role } = req.body;

    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({ message: "Required fields missing" });
    }

    const user = await createUser({ email, password, firstName, lastName, role });
    res.status(201).json(user);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const updateExistingUser = async (req: AuthRequest, res: Response) => {
  try {
    const user = await updateUser(String(req.params.id), req.body);
    res.json(user);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const removeUser = async (req: AuthRequest, res: Response) => {
  try {
    const result = await deleteUser(String(req.params.id));
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};