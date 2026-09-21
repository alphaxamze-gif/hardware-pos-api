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

describe("Products", () => {
  it("rejects negative currentStock on create", async () => {
    const res = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Bad Stock",
        categoryId: fixtures.categoryId,
        sellingPrice: 100,
        currentStock: -5,
      });

    expect(res.status).toBe(400);
  });

  it("rejects negative sellingPrice on create", async () => {
    const res = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Bad Price",
        categoryId: fixtures.categoryId,
        sellingPrice: -1,
        currentStock: 0,
      });

    expect(res.status).toBe(400);
  });

  it("rejects negative costPrice on create", async () => {
    const res = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Bad Cost",
        categoryId: fixtures.categoryId,
        sellingPrice: 10,
        costPrice: -1,
      });

    expect(res.status).toBe(400);
  });

  it("rejects negative minStockLevel on create", async () => {
    const res = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Bad Min",
        categoryId: fixtures.categoryId,
        sellingPrice: 10,
        minStockLevel: -1,
      });

    expect(res.status).toBe(400);
  });

  it("PUT currentStock returns 400 and leaves stock unchanged", async () => {
    const before = await prisma.product.findUnique({
      where: { id: fixtures.activeProductId },
    });

    const res = await request(app)
      .put(`/api/products/${fixtures.activeProductId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ currentStock: 9999 });

    expect(res.status).toBe(400);

    const after = await prisma.product.findUnique({
      where: { id: fixtures.activeProductId },
    });
    expect(after!.currentStock).toBe(before!.currentStock);
  });
});
