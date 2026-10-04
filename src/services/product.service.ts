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
  "imageUrl",
] as const;

const PRODUCT_PROTECTED_FIELDS = [
  "currentStock",
  "id",
  "createdAt",
  "updatedAt",
] as const;

const assertNonNegative = (value: unknown, fieldName: string) => {
  if (value === undefined || value === null) {
    return;
  }
  if (typeof value !== "number" || Number.isNaN(value) || value < 0) {
    throw new Error(`${fieldName} must be greater than or equal to 0`);
  }
};

const normalizeImageUrl = (value: unknown): string | null | undefined => {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  if (typeof value !== "string") {
    throw new Error("imageUrl must be a string URL or empty");
  }
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (!/^https?:\/\//i.test(trimmed)) {
    throw new Error("imageUrl must start with http:// or https://");
  }
  return trimmed;
};

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
  imageUrl?: string | null;
}) => {
  assertNonNegative(data.currentStock, "currentStock");
  assertNonNegative(data.sellingPrice, "sellingPrice");
  assertNonNegative(data.costPrice, "costPrice");
  assertNonNegative(data.minStockLevel, "minStockLevel");

  const imageUrl = normalizeImageUrl(data.imageUrl);

  const category = await prisma.category.findUnique({
    where: { id: data.categoryId },
  });

  if (!category) {
    throw new Error("Category not found");
  }

  if (category.isActive === false) {
    throw new Error("Cannot add product to an inactive category");
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
      imageUrl: imageUrl ?? null,
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

  if (Object.prototype.hasOwnProperty.call(data, "sellingPrice")) {
    assertNonNegative(data.sellingPrice, "sellingPrice");
  }
  if (Object.prototype.hasOwnProperty.call(data, "costPrice")) {
    assertNonNegative(data.costPrice, "costPrice");
  }
  if (Object.prototype.hasOwnProperty.call(data, "minStockLevel")) {
    assertNonNegative(data.minStockLevel, "minStockLevel");
  }

  const updateData: Record<string, unknown> = {};
  for (const key of PRODUCT_ALLOWED_UPDATE_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      if (key === "imageUrl") {
        updateData.imageUrl = normalizeImageUrl(data.imageUrl);
      } else {
        updateData[key] = data[key];
      }
    }
  }

  if (Object.keys(updateData).length === 0) {
    throw new Error(
      "No valid fields to update. Allowed: name, sku, description, categoryId, costPrice, sellingPrice, minStockLevel, unit, isActive, imageUrl"
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

  if (product.isActive === false) {
    return {
      message: "Product is already inactive",
      product,
    };
  }

  const deactivated = await prisma.product.update({
    where: { id },
    data: { isActive: false },
    include: {
      category: {
        select: { id: true, name: true },
      },
    },
  });

  return {
    message:
      "Product deactivated. It remains in history (purchases/sales) but cannot be sold.",
    product: deactivated,
  };
};
