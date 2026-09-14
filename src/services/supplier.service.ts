import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const getAllSuppliers = async () => {
  return prisma.supplier.findMany({
    orderBy: { name: "asc" },
  });
};

export const getSupplierById = async (id: string) => {
  const supplier = await prisma.supplier.findUnique({
    where: { id },
  });

  if (!supplier) {
    throw new Error("Supplier not found");
  }

  return supplier;
};

export const createSupplier = async (data: {
  name: string;
  phone?: string;
  email?: string;
  address?: string;
}) => {
  return prisma.supplier.create({
    data: {
      name: data.name,
      phone: data.phone,
      email: data.email,
      address: data.address,
      currentDue: 0,
    },
  });
};

export const updateSupplier = async (id: string, data: any) => {
  const supplier = await prisma.supplier.findUnique({ where: { id } });

  if (!supplier) {
    throw new Error("Supplier not found");
  }

  return prisma.supplier.update({
    where: { id },
    data,
  });
};

export const deleteSupplier = async (id: string) => {
  const supplier = await prisma.supplier.findUnique({ where: { id } });

  if (!supplier) {
    throw new Error("Supplier not found");
  }

  await prisma.supplier.delete({ where: { id } });
  return { message: "Supplier deleted successfully" };
};