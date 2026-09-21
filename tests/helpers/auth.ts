import request from "supertest";
import app from "../../src/app";
import { TEST_EMAIL, TEST_PASSWORD } from "./seed";

export async function loginAsTestAdmin(): Promise<{ token: string; userId: string }> {
  const res = await request(app).post("/api/auth/login").send({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
  });

  if (res.status !== 200 || !res.body.token) {
    throw new Error(`Login failed in test helper: ${res.status} ${JSON.stringify(res.body)}`);
  }

  return {
    token: res.body.token as string,
    userId: res.body.user.id as string,
  };
}
