import bcrypt from "bcrypt";
import { prisma } from "./prisma";

export const TEST_PASSWORD = "TestPass123!";
export const TEST_EMAIL = "test-admin@hardware-pos.test";

export type SeedResult = {
  userId: string;
  tokenEmail: string;
  categoryId: string;
  activeProductId: string;
  inactiveProductId: string;
  lowStockProductId: string;
  customerId: string;
  supplierId: string;
};

export async function resetDatabase() {
  await prisma.$executeRawUnsafe(`
    TRUNCATE TABLE
      "SaleItem",
      "Sale",
      "Payment",
      "PurchaseItem",
      "Purchase",
      "Expense",
      "Product",
      "Category",
      "Customer",
      "Supplier",
      "User"
    RESTART IDENTITY CASCADE
  `);
}

export async function seedBaseFixtures(): Promise<SeedResult> {
  const passwordHash = await bcrypt.hash(TEST_PASSWORD, 10);

  const user = await prisma.user.create({
    data: {
      email: TEST_EMAIL,
      password: passwordHash,
      firstName: "Test",
      lastName: "Admin",
      role: "ADMIN",
      isActive: true,
    },
  });

  const category = await prisma.category.create({
    data: {
      name: "Test Cement",
      description: "Fixture category",
      isActive: true,
    },
  });

  const activeProduct = await prisma.product.create({
    data: {
      name: "Active Bag Cement",
      sku: "TEST-ACTIVE-CEM",
      categoryId: category.id,
      costPrice: 700,
      sellingPrice: 850,
      currentStock: 100,
      minStockLevel: 10,
      unit: "BAG",
      isActive: true,
    },
  });

  const inactiveProduct = await prisma.product.create({
    data: {
      name: "Inactive Product",
      sku: "TEST-INACTIVE",
      categoryId: category.id,
      costPrice: 100,
      sellingPrice: 150,
      currentStock: 50,
      minStockLevel: 5,
      unit: "PIECE",
      isActive: false,
    },
  });

  const lowStockProduct = await prisma.product.create({
    data: {
      name: "Low Stock Item",
      sku: "TEST-LOW",
      categoryId: category.id,
      costPrice: 50,
      sellingPrice: 80,
      currentStock: 2,
      minStockLevel: 1,
      unit: "PIECE",
      isActive: true,
    },
  });

  const customer = await prisma.customer.create({
    data: {
      name: "Test Customer",
      phone: "0700000000",
      creditLimit: 100000,
      currentDue: 1000,
      isActive: true,
    },
  });

  const supplier = await prisma.supplier.create({
    data: {
      name: "Test Supplier",
      phone: "0711111111",
      currentDue: 500,
      isActive: true,
    },
  });

  return {
    userId: user.id,
    tokenEmail: user.email,
    categoryId: category.id,
    activeProductId: activeProduct.id,
    inactiveProductId: inactiveProduct.id,
    lowStockProductId: lowStockProduct.id,
    customerId: customer.id,
    supplierId: supplier.id,
  };
}
