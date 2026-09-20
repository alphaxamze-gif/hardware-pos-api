import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient() as PrismaClient & {
  customer: any;
};

const CUSTOMER_ALLOWED_UPDATE_FIELDS = [
  "name",
  "phone",
  "email",
  "address",
  "creditLimit",
  "isActive",
] as const;

const CUSTOMER_PROTECTED_FIELDS = ["currentDue", "id", "createdAt", "updatedAt"] as const;

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

export const updateCustomer = async (id: string, data: Record<string, unknown>) => {
  const customer = await prisma.customer.findUnique({ where: { id } });

  if (!customer) {
    throw new Error("Customer not found");
  }

  const incomingKeys = Object.keys(data);
  const protectedPresent = incomingKeys.filter((key) =>
    (CUSTOMER_PROTECTED_FIELDS as readonly string[]).includes(key)
  );

  if (protectedPresent.length > 0) {
    throw new Error(
      `Cannot update protected field(s): ${protectedPresent.join(", ")}. currentDue is system-owned and changed only by sales and payments.`
    );
  }

  const updateData: Record<string, unknown> = {};
  for (const key of CUSTOMER_ALLOWED_UPDATE_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      updateData[key] = data[key];
    }
  }

  if (Object.keys(updateData).length === 0) {
    throw new Error(
      "No valid fields to update. Allowed: name, phone, email, address, creditLimit, isActive"
    );
  }

  return prisma.customer.update({
    where: { id },
    data: updateData,
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
