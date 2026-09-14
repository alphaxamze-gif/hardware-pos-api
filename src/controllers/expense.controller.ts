import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import {
  getAllExpenses,
  getExpenseById,
  createExpense,
  updateExpense,
  deleteExpense,
} from "../services/expense.service";

export const getExpenses = async (req: AuthRequest, res: Response) => {
  try {
    const expenses = await getAllExpenses();
    res.json(expenses);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getExpense = async (req: AuthRequest, res: Response) => {
  try {
    const expense = await getExpenseById(String(req.params.id));
    res.json(expense);
  } catch (error: any) {
    res.status(404).json({ message: error.message });
  }
};

export const createNewExpense = async (req: AuthRequest, res: Response) => {
  try {
    const { title, category, amount, paymentMethod, reference, notes, expenseDate } = req.body;

    if (!title || !amount) {
      return res.status(400).json({ message: "Title and amount are required" });
    }

    const expense = await createExpense({
      title,
      category,
      amount,
      paymentMethod,
      reference,
      notes,
      expenseDate,
    });

    res.status(201).json(expense);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const updateExistingExpense = async (req: AuthRequest, res: Response) => {
  try {
    const expense = await updateExpense(String(req.params.id), req.body);
    res.json(expense);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const removeExpense = async (req: AuthRequest, res: Response) => {
  try {
    const result = await deleteExpense(String(req.params.id));
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};