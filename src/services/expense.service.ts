import { PrismaClient, PaymentMethod } from "@prisma/client";

const prisma = new PrismaClient();

export const getAllExpenses = async () => {
  return prisma.expense.findMany({
    orderBy: { expenseDate: "desc" },
  });
};

export const getExpenseById = async (id: string) => {
  const expense = await prisma.expense.findUnique({
    where: { id },
  });

  if (!expense) {
    throw new Error("Expense not found");
  }

  return expense;
};

export const createExpense = async (data: {
  title: string;
  category?: string;
  amount: number;
  paymentMethod?: PaymentMethod;
  reference?: string;
  notes?: string;
  expenseDate?: string;
}) => {
  if (data.amount <= 0) {
    throw new Error("Amount must be greater than 0");
  }

  return prisma.expense.create({
    data: {
      title: data.title,
      category: data.category,
      amount: data.amount,
      paymentMethod: data.paymentMethod || "CASH",
      reference: data.reference,
      notes: data.notes,
      expenseDate: data.expenseDate ? new Date(data.expenseDate) : new Date(),
    },
  });
};

export const updateExpense = async (id: string, data: any) => {
  const expense = await prisma.expense.findUnique({ where: { id } });

  if (!expense) {
    throw new Error("Expense not found");
  }

  return prisma.expense.update({
    where: { id },
    data,
  });
};

export const deleteExpense = async (id: string) => {
  const expense = await prisma.expense.findUnique({ where: { id } });

  if (!expense) {
    throw new Error("Expense not found");
  }

  await prisma.expense.delete({ where: { id } });
  return { message: "Expense deleted successfully" };
};