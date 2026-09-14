import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const getDashboardStats = async () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Start of current month
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  // Today's sales
  const todaySales = await prisma.sale.aggregate({
    where: {
      saleDate: {
        gte: today,
        lt: tomorrow,
      },
    },
    _sum: {
      totalAmount: true,
    },
  });

  // Today's collection (customer payments)
  const todayCollection = await prisma.payment.aggregate({
    where: {
      type: "CUSTOMER_PAYMENT",
      paymentDate: {
        gte: today,
        lt: tomorrow,
      },
    },
    _sum: {
      amount: true,
    },
  });

  // Total customer dues
  const customerDues = await prisma.customer.aggregate({
    _sum: {
      currentDue: true,
    },
  });

  // Total supplier dues
  const supplierDues = await prisma.supplier.aggregate({
    _sum: {
      currentDue: true,
    },
  });

  // Stock value (selling price * current stock)
  const products = await prisma.product.findMany({
    select: {
      currentStock: true,
      sellingPrice: true,
      costPrice: true,
    },
  });

  let stockValue = 0;
  let stockCostValue = 0;
  products.forEach((p) => {
    stockValue += p.currentStock * p.sellingPrice;
    stockCostValue += p.currentStock * p.costPrice;
  });

  // Monthly expenses
  const monthlyExpenses = await prisma.expense.aggregate({
    where: {
      expenseDate: {
        gte: startOfMonth,
      },
    },
    _sum: {
      amount: true,
    },
  });

  // Low stock products
  const lowStockCount = await prisma.product.count({
    where: {
      currentStock: {
        lte: prisma.product.fields.minStockLevel, // This may need adjustment
      },
      isActive: true,
    },
  });

  // Better low stock query
  const allProducts = await prisma.product.findMany({
    where: { isActive: true },
    select: { currentStock: true, minStockLevel: true },
  });

  const lowStock = allProducts.filter(
    (p) => p.currentStock <= p.minStockLevel
  ).length;

  return {
    todaySales: todaySales._sum.totalAmount || 0,
    todayCollection: todayCollection._sum.amount || 0,
    customerDues: customerDues._sum.currentDue || 0,
    supplierDues: supplierDues._sum.currentDue || 0,
    stockValue: Math.round(stockValue),
    stockCostValue: Math.round(stockCostValue),
    monthlyExpenses: monthlyExpenses._sum.amount || 0,
    lowStockCount: lowStock,
    availableProducts: products.length,
  };
};