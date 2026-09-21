import { beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import app from "../src/app";
import { prisma } from "./helpers/prisma";
import { loginAsTestAdmin } from "./helpers/auth";
import { resetDatabase, seedBaseFixtures, SeedResult } from "./helpers/seed";

let fixtures: SeedResult;
let token: string;

beforeEach(async () => {
  await resetDatabase();
  fixtures = await seedBaseFixtures();
  const auth = await loginAsTestAdmin();
  token = auth.token;
});

describe("Purchases unitCost validation", () => {
  it("unitCost 0 returns 400 and creates no purchase", async () => {
    const countBefore = await prisma.purchase.count();
    const res = await request(app)
      .post("/api/purchases")
      .set("Authorization", `Bearer ${token}`)
      .send({
        supplierId: fixtures.supplierId,
        items: [
          {
            productId: fixtures.activeProductId,
            quantity: 1,
            unitCost: 0,
          },
        ],
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/unitCost/i);
    expect(await prisma.purchase.count()).toBe(countBefore);
  });

  it("negative unitCost returns 400 and creates no purchase", async () => {
    const countBefore = await prisma.purchase.count();
    const res = await request(app)
      .post("/api/purchases")
      .set("Authorization", `Bearer ${token}`)
      .send({
        supplierId: fixtures.supplierId,
        items: [
          {
            productId: fixtures.activeProductId,
            quantity: 1,
            unitCost: -5,
          },
        ],
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/unitCost/i);
    expect(await prisma.purchase.count()).toBe(countBefore);
  });

  it("valid positive unitCost creates purchase and increases stock", async () => {
    const stockBefore = (
      await prisma.product.findUnique({ where: { id: fixtures.activeProductId } })
    )!.currentStock as number;

    const res = await request(app)
      .post("/api/purchases")
      .set("Authorization", `Bearer ${token}`)
      .send({
        supplierId: fixtures.supplierId,
        amountPaid: 700,
        items: [
          {
            productId: fixtures.activeProductId,
            quantity: 2,
            unitCost: 700,
          },
        ],
      });

    expect(res.status).toBe(201);
    const stockAfter = (
      await prisma.product.findUnique({ where: { id: fixtures.activeProductId } })
    )!.currentStock as number;
    expect(stockAfter).toBe(stockBefore + 2);
  });
});
