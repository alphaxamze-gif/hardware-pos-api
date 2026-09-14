import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const getCustomerDues = async () => {
  return prisma.customer.findMany({
    where: {
      currentDue: {
        gt: 0,
      },
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      phone: true,
      email: true,
      currentDue: true,
      creditLimit: true,
    },
    orderBy: {
      currentDue: "desc",
    },
  });
};

export const getSupplierDues = async () => {
  return prisma.supplier.findMany({
    where: {
      currentDue: {
        gt: 0,
      },
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      phone: true,
      email: true,
      currentDue: true,
    },
    orderBy: {
      currentDue: "desc",
    },
  });
};

export const getAllDues = async () => {
  const [customerDues, supplierDues] = await Promise.all([
    getCustomerDues(),
    getSupplierDues(),
  ]);

  const totalCustomerDue = customerDues.reduce(
    (sum, c) => sum + c.currentDue,
    0
  );
  const totalSupplierDue = supplierDues.reduce(
    (sum, s) => sum + s.currentDue,
    0
  );

  return {
    customers: customerDues,
    suppliers: supplierDues,
    summary: {
      totalCustomerDue,
      totalSupplierDue,
      netPosition: totalCustomerDue - totalSupplierDue,
    },
  };
};