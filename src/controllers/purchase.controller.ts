import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import {
  getAllPurchases,
  getPurchaseById,
  createPurchase,
  deletePurchase,
} from "../services/purchase.service";

export const getPurchases = async (req: AuthRequest, res: Response) => {
  try {
    const purchases = await getAllPurchases();
    res.json(purchases);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getPurchase = async (req: AuthRequest, res: Response) => {
  try {
    const purchase = await getPurchaseById(String(req.params.id));
    res.json(purchase);
  } catch (error: any) {
    res.status(404).json({ message: error.message });
  }
};

export const createNewPurchase = async (req: AuthRequest, res: Response) => {
  try {
    const { supplierId, invoiceNumber, notes, amountPaid, items } = req.body;

    if (!supplierId || !items || items.length === 0) {
      return res.status(400).json({
        message: "supplierId and items are required",
      });
    }

    const purchase = await createPurchase({
      supplierId,
      invoiceNumber,
      notes,
      amountPaid,
      items,
    });

    res.status(201).json(purchase);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const removePurchase = async (req: AuthRequest, res: Response) => {
  try {
    const result = await deletePurchase(String(req.params.id));
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};