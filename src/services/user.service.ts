import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

const userSelect = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  role: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} as const;

export const getAllUsers = async () => {
  return prisma.user.findMany({
    select: userSelect,
    orderBy: { createdAt: "desc" },
  });
};

export const getUserById = async (id: string) => {
  const user = await prisma.user.findUnique({
    where: { id },
    select: userSelect,
  });

  if (!user) {
    throw new Error("User not found");
  }

  return user;
};

export const createUser = async (data: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: Role;
}) => {
  const email = data.email.trim().toLowerCase();

  if (!email || !data.password || !data.firstName?.trim() || !data.lastName?.trim()) {
    throw new Error("Required fields missing");
  }

  if (data.password.length < 6) {
    throw new Error("Password must be at least 6 characters");
  }

  const role = data.role || Role.CASHIER;
  if (!Object.values(Role).includes(role)) {
    throw new Error("Invalid role");
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new Error("Email already exists");
  }

  const hashedPassword = await bcrypt.hash(data.password, 10);

  return prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      firstName: data.firstName.trim(),
      lastName: data.lastName.trim(),
      role,
    },
    select: userSelect,
  });
};

export const updateUser = async (
  id: string,
  data: {
    firstName?: string;
    lastName?: string;
    role?: Role;
    isActive?: boolean;
    password?: string;
  }
) => {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    throw new Error("User not found");
  }

  // Whitelist only
  const payload: {
    firstName?: string;
    lastName?: string;
    role?: Role;
    isActive?: boolean;
    password?: string;
  } = {};

  if (data.firstName !== undefined) {
    payload.firstName = data.firstName.trim();
  }
  if (data.lastName !== undefined) {
    payload.lastName = data.lastName.trim();
  }
  if (data.role !== undefined) {
    if (!Object.values(Role).includes(data.role)) {
      throw new Error("Invalid role");
    }
    payload.role = data.role;
  }
  if (data.isActive !== undefined) {
    payload.isActive = Boolean(data.isActive);
  }
  if (data.password !== undefined && data.password !== "") {
    if (data.password.length < 6) {
      throw new Error("Password must be at least 6 characters");
    }
    payload.password = await bcrypt.hash(data.password, 10);
  }

  // Never deactivate or demote the last active ADMIN
  const wouldRemoveAdminAccess =
    user.role === Role.ADMIN &&
    user.isActive &&
    (payload.isActive === false ||
      (payload.role !== undefined && payload.role !== Role.ADMIN));

  if (wouldRemoveAdminAccess) {
    const activeAdmins = await prisma.user.count({
      where: { role: Role.ADMIN, isActive: true },
    });
    if (activeAdmins <= 1) {
      throw new Error("Cannot remove or demote the last active ADMIN");
    }
  }

  return prisma.user.update({
    where: { id },
    data: payload,
    select: userSelect,
  });
};

/** Soft-delete: deactivate. Hard delete only if never needed for audit. */
export const deactivateUser = async (id: string) => {
  return updateUser(id, { isActive: false });
};

export const deleteUser = async (id: string) => {
  // Prefer deactivation for production safety
  return deactivateUser(id);
};