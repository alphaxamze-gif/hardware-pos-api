import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const SUPPLIER_ALLOWED_UPDATE_FIELDS = [
  "name",
  "phone",
  "email",
  "address",
  "isActive",
] as const;

const SUPPLIER_PROTECTED_FIELDS = ["currentDue", "id", "createdAt", "updatedAt"] as const;

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

export const updateSupplier = async (id: string, data: Record<string, unknown>) => {
  const supplier = await prisma.supplier.findUnique({ where: { id } });

  if (!supplier) {
    throw new Error("Supplier not found");
  }

  const incomingKeys = Object.keys(data);
  const protectedPresent = incomingKeys.filter((key) =>
    (SUPPLIER_PROTECTED_FIELDS as readonly string[]).includes(key)
  );

  if (protectedPresent.length > 0) {
    throw new Error(
      `Cannot update protected field(s): ${protectedPresent.join(", ")}. currentDue is system-owned and changed only by purchases and payments.`
    );
  }

  const updateData: Record<string, unknown> = {};
  for (const key of SUPPLIER_ALLOWED_UPDATE_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      updateData[key] = data[key];
    }
  }

  if (Object.keys(updateData).length === 0) {
    throw new Error(
      "No valid fields to update. Allowed: name, phone, email, address, isActive"
    );
  }

  return prisma.supplier.update({
    where: { id },
    data: updateData,
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
