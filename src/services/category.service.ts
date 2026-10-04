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

/**
 * Soft-delete: categories linked to products cannot be hard-deleted (FK RESTRICT).
 * Always deactivate so product history stays valid.
 */
export const deleteCategory = async (id: string) => {
  const category = await prisma.category.findUnique({
    where: { id },
    include: {
      _count: { select: { products: true } },
    },
  });

  if (!category) {
    throw new Error("Category not found");
  }

  if (category.isActive === false) {
    return {
      message: "Category is already inactive",
      category,
    };
  }

  const deactivated = await prisma.category.update({
    where: { id },
    data: { isActive: false },
  });

  return {
    message:
      category._count.products > 0
        ? `Category deactivated. ${category._count.products} product(s) still reference it; history is preserved.`
        : "Category deactivated.",
    category: deactivated,
  };
};
