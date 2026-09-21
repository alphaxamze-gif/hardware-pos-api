import { PrismaClient, PaymentMethod } from "@prisma/client";

const prisma = new PrismaClient();

export const getAllSales = async () => {
  return prisma.sale.findMany({
    include: {
      customer: {
        select: { id: true, name: true, phone: true },
      },
      items: {
        include: {
          product: {
            select: { id: true, name: true, unit: true },
          },
        },
      },
    },
    orderBy: { saleDate: "desc" },
  });
};

export const getSaleById = async (id: string) => {
  const sale = await prisma.sale.findUnique({
    where: { id },
    include: {
      customer: true,
      items: {
        include: {
          product: true,
        },
      },
    },
  });

  if (!sale) {
    throw new Error("Sale not found");
  }

  return sale;
};

export const createSale = async (data: {
  customerId?: string;
  invoiceNumber?: string;
  notes?: string;
  discount?: number;
  taxAmount?: number;
  amountPaid?: number;
  paymentMethod?: PaymentMethod;
  createdById: string;
  items: {
    productId: string;
    quantity: number;
    unitPrice: number;
  }[];
}) => {
  if (!data.createdById) {
    throw new Error("createdById is required");
  }

  if (!data.items || data.items.length === 0) {
    throw new Error("At least one item is required");
  }

  for (const item of data.items) {
    if (item.quantity == null || item.quantity <= 0) {
      throw new Error(
        `Sale item quantity must be greater than 0 (productId: ${item.productId})`
      );
    }
    if (item.unitPrice == null || item.unitPrice <= 0) {
      throw new Error(
        `Sale item unitPrice must be greater than 0 (productId: ${item.productId})`
      );
    }
  }

  let subtotal = 0;
  const itemsData = data.items.map((item) => {
    const totalPrice = item.quantity * item.unitPrice;
    subtotal += totalPrice;
    return {
      productId: item.productId,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalPrice,
    };
  });

  const discount = data.discount || 0;
  const taxAmount = data.taxAmount || 0;
  const totalAmount = subtotal - discount + taxAmount;
  const amountPaid = data.amountPaid || 0;
  const paymentMethod = data.paymentMethod || "CASH";

  const sale = await prisma.$transaction(async (tx) => {
    // Atomic conditional stock reservation (concurrency-safe)
    for (const item of data.items) {
      const updated = await tx.product.updateMany({
        where: {
          id: item.productId,
          isActive: true,
          currentStock: { gte: item.quantity },
        },
        data: {
          currentStock: { decrement: item.quantity },
        },
      });

      if (updated.count !== 1) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
        });

        if (!product) {
          throw new Error(`Product not found: ${item.productId}`);
        }
        if (!product.isActive) {
          throw new Error(
            `Product is inactive and cannot be sold: ${product.name}`
          );
        }
        throw new Error(
          `Insufficient stock for ${product.name}. Available: ${product.currentStock}`
        );
      }
    }

    const newSale = await tx.sale.create({
      data: {
        customerId: data.customerId,
        invoiceNumber: data.invoiceNumber,
        notes: data.notes,
        subtotal,
        discount,
        taxAmount,
        totalAmount,
        amountPaid,
        paymentMethod,
        createdById: data.createdById,
        items: {
          create: itemsData,
        },
      },
      include: {
        customer: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (paymentMethod === "CREDIT" && data.customerId) {
      const dueAmount = totalAmount - amountPaid;
      if (dueAmount > 0) {
        await tx.customer.update({
          where: { id: data.customerId },
          data: {
            currentDue: {
              increment: dueAmount,
            },
          },
        });
      }
    }

    return newSale;
  });

  return sale;
};

export const deleteSale = async (_id: string) => {
  throw new Error(
    "Destructive deletion of sales is not supported. Void/reversal will be introduced later."
  );
};
