import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const getAllCategories = async () => {
  return prisma.category.findMany({
    orderBy: { name: "asc" },
  });
};

export const getCategoryById = async (id: string) => {
  const category = await prisma.category.findUnique({
    where: { id },
  });

  if (!category) {
    throw new Error("Category not found");
  }

  return category;
};

export const createCategory = async (data: {
  name: string;
  description?: string;
}) => {
  const existing = await prisma.category.findUnique({
    where: { name: data.name },
  });

  if (existing) {
    throw new Error("Category name already exists");
  }

  return prisma.category.create({
    data: {
      name: data.name,
      description: data.description,
    },
  });
};

export const updateCategory = async (
  id: string,
  data: {
    name?: string;
    description?: string;
    isActive?: boolean;
  }
) => {
  const category = await prisma.category.findUnique({ where: { id } });

  if (!category) {
    throw new Error("Category not found");
  }

  return prisma.category.update({
    where: { id },
    data,
  });
};

export const deleteCategory = async (id: string) => {
  const category = await prisma.category.findUnique({ where: { id } });

  if (!category) {
    throw new Error("Category not found");
  }

  await prisma.category.delete({ where: { id } });
  return { message: "Category deleted successfully" };
};