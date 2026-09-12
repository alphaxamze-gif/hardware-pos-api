import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../services/product.service";

export const getProducts = async (req: AuthRequest, res: Response) => {
  try {
    const products = await getAllProducts();
    res.json(products);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getProduct = async (req: AuthRequest, res: Response) => {
  try {
    const product = await getProductById(String(req.params.id));
    res.json(product);
  } catch (error: any) {
    res.status(404).json({ message: error.message });
  }
};

export const createNewProduct = async (req: AuthRequest, res: Response) => {
  try {
    const {
      name,
      sku,
      description,
      categoryId,
      costPrice,
      sellingPrice,
      currentStock,
      minStockLevel,
      unit,
    } = req.body;

    if (!name || !categoryId || sellingPrice === undefined) {
      return res.status(400).json({
        message: "Name, categoryId and sellingPrice are required",
      });
    }

    const product = await createProduct({
      name,
      sku,
      description,
      categoryId,
      costPrice,
      sellingPrice,
      currentStock,
      minStockLevel,
      unit,
    });

    res.status(201).json(product);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const updateExistingProduct = async (req: AuthRequest, res: Response) => {
  try {
    const product = await updateProduct(String(req.params.id), req.body);
    res.json(product);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const removeProduct = async (req: AuthRequest, res: Response) => {
  try {
    const result = await deleteProduct(String(req.params.id));
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};