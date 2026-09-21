import { beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import app from "../src/app";
import { prisma } from "./helpers/prisma";
import { loginAsTestAdmin } from "./helpers/auth";
import { resetDatabase, seedBaseFixtures, SeedResult } from "./helpers/seed";

let fixtures: SeedResult;
let token: string;
let userId: string;

beforeEach(async () => {
  await resetDatabase();
  fixtures = await seedBaseFixtures();
  const auth = await loginAsTestAdmin();
  token = auth.token;
  userId = auth.userId;
});

describe("Sales", () => {
  it("valid sale returns 201, decreases stock, sets createdById", async () => {
    const before = await prisma.product.findUnique({
      where: { id: fixtures.activeProductId },
    });

    const res = await request(app)
      .post("/api/sales")
      .set("Authorization", `Bearer ${token}`)
      .send({
        paymentMethod: "CASH",
        amountPaid: 850,
        items: [
          {
            productId: fixtures.activeProductId,
            quantity: 1,
            unitPrice: 850,
          },
        ],
      });

    expect(res.status).toBe(201);
    expect(res.body.createdById).toBe(userId);

    const after = await prisma.product.findUnique({
      where: { id: fixtures.activeProductId },
    });
    expect(after!.currentStock).toBe((before!.currentStock as number) - 1);
  });

  it("client cannot spoof createdById", async () => {
    const res = await request(app)
      .post("/api/sales")
      .set("Authorization", `Bearer ${token}`)
      .send({
        createdById: "fake-other-user-id",
        paymentMethod: "CASH",
        amountPaid: 850,
        items: [
          {
            productId: fixtures.activeProductId,
            quantity: 1,
            unitPrice: 850,
          },
        ],
      });

    expect(res.status).toBe(201);
    expect(res.body.createdById).toBe(userId);
    expect(res.body.createdById).not.toBe("fake-other-user-id");
  });

  it("quantity 0 returns 400 and creates no sale", async () => {
    const countBefore = await prisma.sale.count();
    const res = await request(app)
      .post("/api/sales")
      .set("Authorization", `Bearer ${token}`)
      .send({
        items: [
          {
            productId: fixtures.activeProductId,
            quantity: 0,
            unitPrice: 850,
          },
        ],
      });

    expect(res.status).toBe(400);
    expect(await prisma.sale.count()).toBe(countBefore);
  });

  it("negative quantity returns 400 and creates no sale", async () => {
    const countBefore = await prisma.sale.count();
    const stockBefore = (
      await prisma.product.findUnique({ where: { id: fixtures.activeProductId } })
    )!.currentStock;

    const res = await request(app)
      .post("/api/sales")
      .set("Authorization", `Bearer ${token}`)
      .send({
        items: [
          {
            productId: fixtures.activeProductId,
            quantity: -1,
            unitPrice: 850,
          },
        ],
      });

    expect(res.status).toBe(400);
    expect(await prisma.sale.count()).toBe(countBefore);
    const stockAfter = (
      await prisma.product.findUnique({ where: { id: fixtures.activeProductId } })
    )!.currentStock;
    expect(stockAfter).toBe(stockBefore);
  });

  it("unitPrice 0 returns 400 and creates no sale", async () => {
    const countBefore = await prisma.sale.count();
    const res = await request(app)
      .post("/api/sales")
      .set("Authorization", `Bearer ${token}`)
      .send({
        items: [
          {
            productId: fixtures.activeProductId,
            quantity: 1,
            unitPrice: 0,
          },
        ],
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/unitPrice/i);
    expect(await prisma.sale.count()).toBe(countBefore);
  });

  it("negative unitPrice returns 400 and creates no sale", async () => {
    const countBefore = await prisma.sale.count();
    const res = await request(app)
      .post("/api/sales")
      .set("Authorization", `Bearer ${token}`)
      .send({
        items: [
          {
            productId: fixtures.activeProductId,
            quantity: 1,
            unitPrice: -10,
          },
        ],
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/unitPrice/i);
    expect(await prisma.sale.count()).toBe(countBefore);
  });

  it("insufficient stock returns 400", async () => {
    const res = await request(app)
      .post("/api/sales")
      .set("Authorization", `Bearer ${token}`)
      .send({
        items: [
          {
            productId: fixtures.lowStockProductId,
            quantity: 10,
            unitPrice: 80,
          },
        ],
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/Insufficient stock/i);
  });

  it("inactive product returns 400", async () => {
    const res = await request(app)
      .post("/api/sales")
      .set("Authorization", `Bearer ${token}`)
      .send({
        items: [
          {
            productId: fixtures.inactiveProductId,
            quantity: 1,
            unitPrice: 150,
          },
        ],
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/inactive/i);
  });

  it("DELETE sale returns 400 and row remains", async () => {
    const create = await request(app)
      .post("/api/sales")
      .set("Authorization", `Bearer ${token}`)
      .send({
        paymentMethod: "CASH",
        amountPaid: 850,
        items: [
          {
            productId: fixtures.activeProductId,
            quantity: 1,
            unitPrice: 850,
          },
        ],
      });

    expect(create.status).toBe(201);
    const saleId = create.body.id as string;

    const del = await request(app)
      .delete(`/api/sales/${saleId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(del.status).toBe(400);
    const stillThere = await prisma.sale.findUnique({ where: { id: saleId } });
    expect(stillThere).not.toBeNull();
  });

  it("concurrent sales never sell more than available stock", async () => {
    const productId = fixtures.lowStockProductId;
    const initial = (
      await prisma.product.findUnique({ where: { id: productId } })
    )!.currentStock as number;

    const payload = {
      paymentMethod: "CASH",
      amountPaid: 80,
      items: [{ productId, quantity: initial, unitPrice: 80 }],
    };

    const [r1, r2] = await Promise.all([
      request(app)
        .post("/api/sales")
        .set("Authorization", `Bearer ${token}`)
        .send(payload),
      request(app)
        .post("/api/sales")
        .set("Authorization", `Bearer ${token}`)
        .send(payload),
    ]);

    const statuses = [r1.status, r2.status].sort();
    expect(statuses).toEqual([201, 400]);

    const successQty =
      (r1.status === 201 ? initial : 0) + (r2.status === 201 ? initial : 0);
    expect(successQty).toBeLessThanOrEqual(initial);

    const finalStock = (
      await prisma.product.findUnique({ where: { id: productId } })
    )!.currentStock as number;
    expect(finalStock).toBeGreaterThanOrEqual(0);
    expect(finalStock).toBe(initial - successQty);

    const saleCount = await prisma.sale.count();
    expect(saleCount).toBe(1);
  });
});
