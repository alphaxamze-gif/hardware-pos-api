import { beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import app from "../src/app";
import { prisma } from "./helpers/prisma";
import { resetDatabase } from "./helpers/seed";

beforeEach(async () => {
  await resetDatabase();
});

describe("Public registration role lockdown", () => {
  it("omitted role creates CASHIER", async () => {
    const res = await request(app).post("/api/auth/register").send({
      email: "cashier1@test.local",
      password: "Pass1234!",
      firstName: "Cash",
      lastName: "One",
    });

    expect(res.status).toBe(201);
    expect(res.body.user.role).toBe("CASHIER");

    const user = await prisma.user.findUnique({
      where: { email: "cashier1@test.local" },
    });
    expect(user!.role).toBe("CASHIER");
  });

  it("role ADMIN is ignored and user is CASHIER", async () => {
    const res = await request(app).post("/api/auth/register").send({
      email: "admin-try@test.local",
      password: "Pass1234!",
      firstName: "Admin",
      lastName: "Try",
      role: "ADMIN",
    });

    expect(res.status).toBe(201);
    expect(res.body.user.role).toBe("CASHIER");

    const user = await prisma.user.findUnique({
      where: { email: "admin-try@test.local" },
    });
    expect(user!.role).toBe("CASHIER");
  });

  it("role MANAGER is ignored and user is CASHIER", async () => {
    const res = await request(app).post("/api/auth/register").send({
      email: "manager-try@test.local",
      password: "Pass1234!",
      firstName: "Mgr",
      lastName: "Try",
      role: "MANAGER",
    });

    expect(res.status).toBe(201);
    expect(res.body.user.role).toBe("CASHIER");

    const user = await prisma.user.findUnique({
      where: { email: "manager-try@test.local" },
    });
    expect(user!.role).toBe("CASHIER");
  });
});
