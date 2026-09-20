import { PrismaClient, PaymentType, PaymentMethod } from "@prisma/client";

const prisma = new PrismaClient();

export const getAllPayments = async () => {
  return prisma.payment.findMany({
    include: {
      customer: {
        select: { id: true, name: true },
      },
      supplier: {
        select: { id: true, name: true },
      },
    },
    orderBy: { paymentDate: "desc" },
  });
};

export const getPaymentById = async (id: string) => {
  const payment = await prisma.payment.findUnique({
    where: { id },
    include: {
      customer: true,
      supplier: true,
    },
  });

  if (!payment) {
    throw new Error("Payment not found");
  }

  return payment;
};

export const createPayment = async (data: {
  type: PaymentType;
  amount: number;
  paymentMethod?: PaymentMethod;
  reference?: string;
  notes?: string;
  customerId?: string;
  supplierId?: string;
}) => {
  if (data.amount <= 0) {
    throw new Error("Amount must be greater than 0");
  }

  if (data.type === "CUSTOMER_PAYMENT" && !data.customerId) {
    throw new Error("customerId is required for customer payments");
  }

  if (data.type === "SUPPLIER_PAYMENT" && !data.supplierId) {
    throw new Error("supplierId is required for supplier payments");
  }

  const payment = await prisma.$transaction(async (tx) => {
    if (data.type === "CUSTOMER_PAYMENT" && data.customerId) {
      const customer = await tx.customer.findUnique({
        where: { id: data.customerId },
      });

      if (!customer) {
        throw new Error("Customer not found");
      }

      if (data.amount > customer.currentDue) {
        throw new Error(
          `Payment amount (${data.amount}) exceeds outstanding customer due (${customer.currentDue}). Overpayment is not allowed.`
        );
      }

      const newPayment = await tx.payment.create({
        data: {
          type: data.type,
          amount: data.amount,
          paymentMethod: data.paymentMethod || "CASH",
          reference: data.reference,
          notes: data.notes,
          customerId: data.customerId,
        },
        include: {
          customer: true,
          supplier: true,
        },
      });

      await tx.customer.update({
        where: { id: data.customerId },
        data: {
          currentDue: {
            decrement: data.amount,
          },
        },
      });

      return newPayment;
    }

    if (data.type === "SUPPLIER_PAYMENT" && data.supplierId) {
      const supplier = await tx.supplier.findUnique({
        where: { id: data.supplierId },
      });

      if (!supplier) {
        throw new Error("Supplier not found");
      }

      if (data.amount > supplier.currentDue) {
        throw new Error(
          `Payment amount (${data.amount}) exceeds outstanding supplier due (${supplier.currentDue}). Overpayment is not allowed.`
        );
      }

      const newPayment = await tx.payment.create({
        data: {
          type: data.type,
          amount: data.amount,
          paymentMethod: data.paymentMethod || "CASH",
          reference: data.reference,
          notes: data.notes,
          supplierId: data.supplierId,
        },
        include: {
          customer: true,
          supplier: true,
        },
      });

      await tx.supplier.update({
        where: { id: data.supplierId },
        data: {
          currentDue: {
            decrement: data.amount,
          },
        },
      });

      return newPayment;
    }

    throw new Error("Invalid payment type or missing party id");
  });

  return payment;
};

export const deletePayment = async (_id: string) => {
  throw new Error(
    "Destructive deletion of payments is not supported. Reversal will be introduced later."
  );
};
