import { PrismaClient, Unit } from "@prisma/client";

const prisma = new PrismaClient();

const PRODUCT_ALLOWED_UPDATE_FIELDS = [
  "name",
  "sku",
  "description",
  "categoryId",
  "costPrice",
  "sellingPrice",
  "minStockLevel",
  "unit",
  "isActive",
] as const;

const PRODUCT_PROTECTED_FIELDS = [
  "currentStock",
  "id",
  "createdAt",
  "updatedAt",
] as const;

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

export const updateProduct = async (id: string, data: Record<string, unknown>) => {
  const product = await prisma.product.findUnique({ where: { id } });

  if (!product) {
    throw new Error("Product not found");
  }

  const incomingKeys = Object.keys(data);
  const protectedPresent = incomingKeys.filter((key) =>
    (PRODUCT_PROTECTED_FIELDS as readonly string[]).includes(key)
  );

  if (protectedPresent.length > 0) {
    throw new Error(
      `Cannot update protected field(s): ${protectedPresent.join(", ")}. currentStock is system-owned and changed only by purchases and sales.`
    );
  }

  const updateData: Record<string, unknown> = {};
  for (const key of PRODUCT_ALLOWED_UPDATE_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      updateData[key] = data[key];
    }
  }

  if (Object.keys(updateData).length === 0) {
    throw new Error(
      "No valid fields to update. Allowed: name, sku, description, categoryId, costPrice, sellingPrice, minStockLevel, unit, isActive"
    );
  }

  return prisma.product.update({
    where: { id },
    data: updateData,
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
