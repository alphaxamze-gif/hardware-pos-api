import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import {
  getAllSales,
  getSaleById,
  createSale,
  deleteSale,
} from "../services/sale.service";

export const getSales = async (req: AuthRequest, res: Response) => {
  try {
    const sales = await getAllSales();
    res.json(sales);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getSale = async (req: AuthRequest, res: Response) => {
  try {
    const sale = await getSaleById(String(req.params.id));
    res.json(sale);
  } catch (error: any) {
    res.status(404).json({ message: error.message });
  }
};

export const createNewSale = async (req: AuthRequest, res: Response) => {
  try {
    const {
      customerId,
      invoiceNumber,
      notes,
      discount,
      taxAmount,
      amountPaid,
      paymentMethod,
      items,
    } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: "Items are required" });
    }

    const sale = await createSale({
      customerId,
      invoiceNumber,
      notes,
      discount,
      taxAmount,
      amountPaid,
      paymentMethod,
      items,
    });

    res.status(201).json(sale);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const removeSale = async (req: AuthRequest, res: Response) => {
  try {
    const result = await deleteSale(String(req.params.id));
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};