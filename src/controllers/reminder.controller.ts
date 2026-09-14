import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import {
  getCustomerDues,
  getSupplierDues,
  getAllDues,
} from "../services/reminder.service";

export const getCustomerDueList = async (req: AuthRequest, res: Response) => {
  try {
    const dues = await getCustomerDues();
    res.json(dues);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getSupplierDueList = async (req: AuthRequest, res: Response) => {
  try {
    const dues = await getSupplierDues();
    res.json(dues);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getDueSummary = async (req: AuthRequest, res: Response) => {
  try {
    const summary = await getAllDues();
    res.json(summary);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};