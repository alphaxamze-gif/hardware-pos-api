import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import app from "../src/app";
import { resetDatabase, seedBaseFixtures } from "./helpers/seed";
import { loginAsTestAdmin } from "./helpers/auth";
import { prisma } from "./helpers/prisma";

beforeAll(async () => {
  // Ensure connection works
  await prisma.$queryRaw`SELECT 1`;
});

beforeEach(async () => {
  await resetDatabase();
  await seedBaseFixtures();
});

describe("Authentication", () => {
  it("protected endpoint without token returns 401", async () => {
    const res = await request(app).get("/api/me");
    expect(res.status).toBe(401);
  });

  it("invalid token returns 401", async () => {
    const res = await request(app)
      .get("/api/me")
      .set("Authorization", "Bearer invalid.token.here");
    expect(res.status).toBe(401);
  });

  it("valid token returns success", async () => {
    const { token, userId } = await loginAsTestAdmin();
    const res = await request(app)
      .get("/api/me")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.user.userId).toBe(userId);
  });
});
