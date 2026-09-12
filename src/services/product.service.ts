import { PrismaClient, Unit } from "@prisma/client";

const prisma = new PrismaClient();

export const getAllProducts = async () => {
  return prisma.product.findMany({
    include: {
      category: {
        select: { id: true, name: true },
      },
    },
    orderBy: { name: "asc" },
  });
};

export const getProductById = async (id: string) => {
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      category: {
        select: { id: true, name: true },
      },
    },
  });

  if (!product) {
    throw new Error("Product not found");
  }

  return product;
};

export const createProduct = async (data: {
  name: string;
  sku?: string;
  description?: string;
  categoryId: string;
  costPrice?: number;
  sellingPrice: number;
  currentStock?: number;
  minStockLevel?: number;
  unit?: Unit;
}) => {
  // Check if category exists
  const category = await prisma.category.findUnique({
    where: { id: data.categoryId },
  });

  if (!category) {
    throw new Error("Category not found");
  }

  return prisma.product.create({
    data: {
      name: data.name,
      sku: data.sku,
      description: data.description,
      categoryId: data.categoryId,
      costPrice: data.costPrice || 0,
      sellingPrice: data.sellingPrice,
      currentStock: data.currentStock || 0,
      minStockLevel: data.minStockLevel || 0,
      unit: data.unit || "PIECE",
    },
    include: {
      category: {
        select: { id: true, name: true },
      },
    },
  });
};

export const updateProduct = async (id: string, data: any) => {
  const product = await prisma.product.findUnique({ where: { id } });

  if (!product) {
    throw new Error("Product not found");
  }

  return prisma.product.update({
    where: { id },
    data,
    include: {
      category: {
        select: { id: true, name: true },
      },
    },
  });
};

export const deleteProduct = async (id: string) => {
  const product = await prisma.product.findUnique({ where: { id } });

  if (!product) {
    throw new Error("Product not found");
  }

  await prisma.product.delete({ where: { id } });
  return { message: "Product deleted successfully" };
};