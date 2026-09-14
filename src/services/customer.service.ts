import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient() as PrismaClient & {
  customer: any;
};

export const getAllCustomers = async () => {
  return prisma.customer.findMany({
    orderBy: { name: "asc" },
  });
};

export const getCustomerById = async (id: string) => {
  const customer = await prisma.customer.findUnique({
    where: { id },
  });

  if (!customer) {
    throw new Error("Customer not found");
  }

  return customer;
};

export const createCustomer = async (data: {
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  creditLimit?: number;
}) => {
  return prisma.customer.create({
    data: {
      name: data.name,
      phone: data.phone,
      email: data.email,
      address: data.address,
      creditLimit: data.creditLimit || 0,
      currentDue: 0,
    },
  });
};

export const updateCustomer = async (id: string, data: any) => {
  const customer = await prisma.customer.findUnique({ where: { id } });

  if (!customer) {
    throw new Error("Customer not found");
  }

  return prisma.customer.update({
    where: { id },
    data,
  });
};

export const deleteCustomer = async (id: string) => {
  const customer = await prisma.customer.findUnique({ where: { id } });

  if (!customer) {
    throw new Error("Customer not found");
  }

  await prisma.customer.delete({ where: { id } });
  return { message: "Customer deleted successfully" };
};