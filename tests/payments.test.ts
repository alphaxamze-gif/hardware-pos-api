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

describe("Payments", () => {
  it("valid payment equal to currentDue succeeds and sets due to 0", async () => {
    const res = await request(app)
      .post("/api/payments")
      .set("Authorization", `Bearer ${token}`)
      .send({
        type: "CUSTOMER_PAYMENT",
        customerId: fixtures.customerId,
        amount: 1000,
        paymentMethod: "CASH",
      });

    expect(res.status).toBe(201);

    const customer = await prisma.customer.findUnique({
      where: { id: fixtures.customerId },
    });
    expect(customer!.currentDue).toBe(0);
  });

  it("overpayment returns 400, creates no payment, leaves due unchanged", async () => {
    const countBefore = await prisma.payment.count();
    const dueBefore = (
      await prisma.customer.findUnique({ where: { id: fixtures.customerId } })
    )!.currentDue;

    const res = await request(app)
      .post("/api/payments")
      .set("Authorization", `Bearer ${token}`)
      .send({
        type: "CUSTOMER_PAYMENT",
        customerId: fixtures.customerId,
        amount: 1500,
        paymentMethod: "CASH",
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/exceeds outstanding/i);
    expect(await prisma.payment.count()).toBe(countBefore);

    const dueAfter = (
      await prisma.customer.findUnique({ where: { id: fixtures.customerId } })
    )!.currentDue;
    expect(dueAfter).toBe(dueBefore);
  });

  it("DELETE payment returns 400", async () => {
    const create = await request(app)
      .post("/api/payments")
      .set("Authorization", `Bearer ${token}`)
      .send({
        type: "CUSTOMER_PAYMENT",
        customerId: fixtures.customerId,
        amount: 100,
        paymentMethod: "CASH",
      });

    expect(create.status).toBe(201);
    const paymentId = create.body.id as string;

    const del = await request(app)
      .delete(`/api/payments/${paymentId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(del.status).toBe(400);
    const stillThere = await prisma.payment.findUnique({ where: { id: paymentId } });
    expect(stillThere).not.toBeNull();
  });
});
