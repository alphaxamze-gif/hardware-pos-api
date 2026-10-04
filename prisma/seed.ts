/**
 * Demo seed for Hardware PRO (local + Neon).
 * Run: npm run seed
 */
import dotenv from "dotenv";
dotenv.config();

import { PrismaClient, Unit } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is missing — check .env");
  }

  const email = process.env.SEED_ADMIN_EMAIL || "admin@hardware.com";
  const password = process.env.SEED_ADMIN_PASSWORD || "Admin@123";

  const hashed = await bcrypt.hash(password, 10);

  const admin = await prisma.user.upsert({
    where: { email },
    update: {
      password: hashed,
      firstName: "Admin",
      lastName: "User",
      role: "ADMIN",
      isActive: true,
    },
    create: {
      email,
      password: hashed,
      firstName: "Admin",
      lastName: "User",
      role: "ADMIN",
      isActive: true,
    },
  });

  console.log(`Admin ready: ${admin.email}`);

  const categories = [
    { name: "Cement & binders", description: "Cement, lime, and bonding materials" },
    { name: "Steel & iron", description: "Bars, mesh, sheets, structural steel" },
    { name: "Plumbing", description: "Pipes, fittings, tanks, water systems" },
    { name: "Electrical", description: "Cables, switches, sockets, lighting" },
    { name: "Paint & finishes", description: "Paints, primers, thinners, coatings" },
    { name: "Tools & hardware", description: "Hand tools, fasteners, site hardware" },
  ];

  const catIds: Record<string, string> = {};

  for (const c of categories) {
    const row = await prisma.category.upsert({
      where: { name: c.name },
      update: { description: c.description, isActive: true },
      create: { ...c, isActive: true },
    });
    catIds[c.name] = row.id;
  }

  console.log(`Categories: ${Object.keys(catIds).length}`);

  const products: {
    name: string;
    sku: string;
    category: string;
    unit: Unit;
    costPrice: number;
    sellingPrice: number;
    currentStock: number;
    minStockLevel: number;
    description: string;
    imageUrl: string;
  }[] = [
    {
      name: "Bamburi Cement 50kg",
      sku: "BAM-CEM-50KG",
      category: "Cement & binders",
      unit: "BAG",
      costPrice: 750,
      sellingPrice: 850,
      currentStock: 100,
      minStockLevel: 20,
      description: "Portland cement 50kg bag",
      imageUrl: "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=400",
    },
    {
      name: "Y12 Reinforcement bar 12m",
      sku: "STL-Y12-12",
      category: "Steel & iron",
      unit: "PIECE",
      costPrice: 1800,
      sellingPrice: 2200,
      currentStock: 40,
      minStockLevel: 10,
      description: "12mm high-tensile bar, 12m",
      imageUrl: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400",
    },
    {
      name: "PVC pipe 1\" class B 6m",
      sku: "PLB-PVC1-6",
      category: "Plumbing",
      unit: "PIECE",
      costPrice: 350,
      sellingPrice: 450,
      currentStock: 60,
      minStockLevel: 15,
      description: "Pressure PVC 25mm × 6m",
      imageUrl: "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=400",
    },
    {
      name: "Twin core 2.5mm cable 100m",
      sku: "ELC-TC25-100",
      category: "Electrical",
      unit: "BOX",
      costPrice: 4500,
      sellingPrice: 5500,
      currentStock: 15,
      minStockLevel: 5,
      description: "Copper twin-core, 100m roll",
      imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400",
    },
    {
      name: "Crown emulsion white 20L",
      sku: "PNT-CEW-20",
      category: "Paint & finishes",
      unit: "PIECE",
      costPrice: 3200,
      sellingPrice: 3800,
      currentStock: 25,
      minStockLevel: 8,
      description: "Interior emulsion 20 litres",
      imageUrl: "https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=400",
    },
    {
      name: "Claw hammer 16oz",
      sku: "TOL-HAM-16",
      category: "Tools & hardware",
      unit: "PIECE",
      costPrice: 450,
      sellingPrice: 650,
      currentStock: 30,
      minStockLevel: 12,
      description: "Steel claw hammer",
      imageUrl: "https://images.unsplash.com/photo-1586864387967-d02ef85d93e8?w=400",
    },
  ];

  for (const p of products) {
    const categoryId = catIds[p.category];
    if (!categoryId) continue;

    const existing = await prisma.product.findFirst({
      where: { sku: p.sku },
    });

    if (existing) {
      await prisma.product.update({
        where: { id: existing.id },
        data: {
          name: p.name,
          description: p.description,
          categoryId,
          costPrice: p.costPrice,
          sellingPrice: p.sellingPrice,
          currentStock: p.currentStock,
          minStockLevel: p.minStockLevel,
          unit: p.unit,
          imageUrl: p.imageUrl,
          isActive: true,
        },
      });
    } else {
      await prisma.product.create({
        data: {
          name: p.name,
          sku: p.sku,
          description: p.description,
          categoryId,
          costPrice: p.costPrice,
          sellingPrice: p.sellingPrice,
          currentStock: p.currentStock,
          minStockLevel: p.minStockLevel,
          unit: p.unit,
          imageUrl: p.imageUrl,
          isActive: true,
        },
      });
    }
  }

  console.log(`Products seeded: ${products.length}`);

  const customer = await prisma.customer.findFirst({
    where: { name: "Olivia Kamau" },
  });

  if (!customer) {
    await prisma.customer.create({
      data: {
        name: "Olivia Kamau",
        phone: "0712345678",
        email: "olivia@example.com",
        address: "Industrial Area, Nairobi",
        creditLimit: 50000,
        currentDue: 0,
        isActive: true,
      },
    });
    console.log("Demo customer: Olivia Kamau");
  }

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
