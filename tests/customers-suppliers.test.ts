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

describe("Customer and Supplier protected fields", () => {
  it("cannot manually change customer currentDue", async () => {
    const before = await prisma.customer.findUnique({
      where: { id: fixtures.customerId },
    });

    const res = await request(app)
      .put(`/api/customers/${fixtures.customerId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ currentDue: 0 });

    expect(res.status).toBe(400);

    const after = await prisma.customer.findUnique({
      where: { id: fixtures.customerId },
    });
    expect(after!.currentDue).toBe(before!.currentDue);
  });

  it("can update legitimate customer fields", async () => {
    const res = await request(app)
      .put(`/api/customers/${fixtures.customerId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Updated Customer Name", phone: "0799999999" });

    expect(res.status).toBe(200);
    expect(res.body.name).toBe("Updated Customer Name");
    expect(res.body.phone).toBe("0799999999");
  });

  it("cannot manually change supplier currentDue", async () => {
    const before = await prisma.supplier.findUnique({
      where: { id: fixtures.supplierId },
    });

    const res = await request(app)
      .put(`/api/suppliers/${fixtures.supplierId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ currentDue: 0 });

    expect(res.status).toBe(400);

    const after = await prisma.supplier.findUnique({
      where: { id: fixtures.supplierId },
    });
    expect(after!.currentDue).toBe(before!.currentDue);
  });

  it("can update legitimate supplier fields", async () => {
    const res = await request(app)
      .put(`/api/suppliers/${fixtures.supplierId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Updated Supplier", address: "Nairobi" });

    expect(res.status).toBe(200);
    expect(res.body.name).toBe("Updated Supplier");
    expect(res.body.address).toBe("Nairobi");
  });
});
