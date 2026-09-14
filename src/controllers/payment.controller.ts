import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import {
  getAllPayments,
  getPaymentById,
  createPayment,
  deletePayment,
} from "../services/payment.service";

export const getPayments = async (req: AuthRequest, res: Response) => {
  try {
    const payments = await getAllPayments();
    res.json(payments);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getPayment = async (req: AuthRequest, res: Response) => {
  try {
    const payment = await getPaymentById(String(req.params.id));
    res.json(payment);
  } catch (error: any) {
    res.status(404).json({ message: error.message });
  }
};

export const createNewPayment = async (req: AuthRequest, res: Response) => {
  try {
    const { type, amount, paymentMethod, reference, notes, customerId, supplierId } = req.body;

    if (!type || !amount) {
      return res.status(400).json({ message: "type and amount are required" });
    }

    const payment = await createPayment({
      type,
      amount,
      paymentMethod,
      reference,
      notes,
      customerId,
      supplierId,
    });

    res.status(201).json(payment);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const removePayment = async (req: AuthRequest, res: Response) => {
  try {
    const result = await deletePayment(String(req.params.id));
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};