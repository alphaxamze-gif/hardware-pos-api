import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../services/category.service";

export const getCategories = async (req: AuthRequest, res: Response) => {
  try {
    const categories = await getAllCategories();
    res.json(categories);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getCategory = async (req: AuthRequest, res: Response) => {
  try {
    const category = await getCategoryById(req.params.id);
    res.json(category);
  } catch (error: any) {
    res.status(404).json({ message: error.message });
  }
};

export const createNewCategory = async (req: AuthRequest, res: Response) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Category name is required" });
    }

    const category = await createCategory({ name, description });
    res.status(201).json(category);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const updateExistingCategory = async (req: AuthRequest, res: Response) => {
  try {
    const category = await updateCategory(req.params.id, req.body);
    res.json(category);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const removeCategory = async (req: AuthRequest, res: Response) => {
  try {
    const result = await deleteCategory(req.params.id);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};