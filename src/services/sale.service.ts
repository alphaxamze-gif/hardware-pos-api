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
  items: {
    productId: string;
    quantity: number;
    unitPrice: number;
  }[];
}) => {
  if (!data.items || data.items.length === 0) {
    throw new Error("At least one item is required");
  }

  // Calculate totals
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

  // Use transaction
  const sale = await prisma.$transaction(async (tx) => {
    // 1. Check stock availability
    for (const item of data.items) {
      const product = await tx.product.findUnique({
        where: { id: item.productId },
      });

      if (!product) {
        throw new Error(`Product not found: ${item.productId}`);
      }

      if (product.currentStock < item.quantity) {
        throw new Error(
          `Insufficient stock for ${product.name}. Available: ${product.currentStock}`
        );
      }
    }

    // 2. Create the sale
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

    // 3. Reduce stock
    for (const item of data.items) {
      await tx.product.update({
        where: { id: item.productId },
        data: {
          currentStock: {
            decrement: item.quantity,
          },
        },
      });
    }

    // 4. If credit sale, increase customer due
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

export const deleteSale = async (id: string) => {
  const sale = await prisma.sale.findUnique({
    where: { id },
    include: { items: true },
  });

  if (!sale) {
    throw new Error("Sale not found");
  }

  // Note: In a real system we would reverse stock and dues here
  await prisma.sale.delete({ where: { id } });
  return { message: "Sale deleted successfully" };
};