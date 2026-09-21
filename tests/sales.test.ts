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
});
