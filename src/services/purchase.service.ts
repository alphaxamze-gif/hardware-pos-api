import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const getAllPurchases = async () => {
  return prisma.purchase.findMany({
    include: {
      supplier: {
        select: { id: true, name: true },
      },
      items: {
        include: {
          product: {
            select: { id: true, name: true, unit: true },
          },
        },
      },
    },
    orderBy: { purchaseDate: "desc" },
  });
};

export const getPurchaseById = async (id: string) => {
  const purchase = await prisma.purchase.findUnique({
    where: { id },
    include: {
      supplier: true,
      items: {
        include: {
          product: true,
        },
      },
    },
  });

  if (!purchase) {
    throw new Error("Purchase not found");
  }

  return purchase;
};

export const createPurchase = async (data: {
  supplierId: string;
  invoiceNumber?: string;
  notes?: string;
  amountPaid?: number;
  items: {
    productId: string;
    quantity: number;
    unitCost: number;
  }[];
}) => {
  const supplier = await prisma.supplier.findUnique({
    where: { id: data.supplierId },
  });
  if (!supplier) {
    throw new Error("Supplier not found");
  }

  if (!data.items || data.items.length === 0) {
    throw new Error("At least one item is required");
  }

  for (const item of data.items) {
    if (item.quantity == null || item.quantity <= 0) {
      throw new Error(
        `Purchase item quantity must be greater than 0 (productId: ${item.productId})`
      );
    }
    if (item.unitCost == null || item.unitCost <= 0) {
      throw new Error(
        `Purchase item unitCost must be greater than 0 (productId: ${item.productId})`
      );
    }
  }

  let totalAmount = 0;
  const itemsData = data.items.map((item) => {
    const totalCost = item.quantity * item.unitCost;
    totalAmount += totalCost;
    return {
      productId: item.productId,
      quantity: item.quantity,
      unitCost: item.unitCost,
      totalCost,
    };
  });

  const amountPaid = data.amountPaid || 0;
  const dueAmount = totalAmount - amountPaid;

  const purchase = await prisma.$transaction(async (tx) => {
    for (const item of data.items) {
      const product = await tx.product.findUnique({
        where: { id: item.productId },
      });

      if (!product) {
        throw new Error(`Product not found: ${item.productId}`);
      }

      if (!product.isActive) {
        throw new Error(
          `Product is inactive and cannot be purchased: ${product.name}`
        );
      }
    }

    const newPurchase = await tx.purchase.create({
      data: {
        supplierId: data.supplierId,
        invoiceNumber: data.invoiceNumber,
        notes: data.notes,
        totalAmount,
        amountPaid,
        items: {
          create: itemsData,
        },
      },
      include: {
        supplier: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    for (const item of data.items) {
      await tx.product.update({
        where: { id: item.productId },
        data: {
          currentStock: {
            increment: item.quantity,
          },
        },
      });
    }

    if (dueAmount > 0) {
      await tx.supplier.update({
        where: { id: data.supplierId },
        data: {
          currentDue: {
            increment: dueAmount,
          },
        },
      });
    }

    return newPurchase;
  });

  return purchase;
};

export const deletePurchase = async (_id: string) => {
  throw new Error(
    "Destructive deletion of purchases is not supported. Void/reversal will be introduced later."
  );
};
