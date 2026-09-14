import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import {
  getAllSuppliers,
  getSupplierById,
  createSupplier,
  updateSupplier,
  deleteSupplier,
} from "../services/supplier.service";

export const getSuppliers = async (req: AuthRequest, res: Response) => {
  try {
    const suppliers = await getAllSuppliers();
    res.json(suppliers);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getSupplier = async (req: AuthRequest, res: Response) => {
  try {
    const supplier = await getSupplierById(String(req.params.id));
    res.json(supplier);
  } catch (error: any) {
    res.status(404).json({ message: error.message });
  }
};

export const createNewSupplier = async (req: AuthRequest, res: Response) => {
  try {
    const { name, phone, email, address } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Supplier name is required" });
    }

    const supplier = await createSupplier({ name, phone, email, address });
    res.status(201).json(supplier);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const updateExistingSupplier = async (req: AuthRequest, res: Response) => {
  try {
    const supplier = await updateSupplier(String(req.params.id), req.body);
    res.json(supplier);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const removeSupplier = async (req: AuthRequest, res: Response) => {
  try {
    const result = await deleteSupplier(String(req.params.id));
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};