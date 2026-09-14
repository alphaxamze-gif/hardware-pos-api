import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import {
  getAllCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
} from "../services/customer.service";

export const getCustomers = async (req: AuthRequest, res: Response) => {
  try {
    const customers = await getAllCustomers();
    res.json(customers);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getCustomer = async (req: AuthRequest, res: Response) => {
  try {
    const customer = await getCustomerById(String(req.params.id));
    res.json(customer);
  } catch (error: any) {
    res.status(404).json({ message: error.message });
  }
};

export const createNewCustomer = async (req: AuthRequest, res: Response) => {
  try {
    const { name, phone, email, address, creditLimit } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Customer name is required" });
    }

    const customer = await createCustomer({
      name,
      phone,
      email,
      address,
      creditLimit,
    });

    res.status(201).json(customer);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const updateExistingCustomer = async (req: AuthRequest, res: Response) => {
  try {
    const customer = await updateCustomer(String(req.params.id), req.body);
    res.json(customer);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const removeCustomer = async (req: AuthRequest, res: Response) => {
  try {
    const result = await deleteCustomer(String(req.params.id));
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};