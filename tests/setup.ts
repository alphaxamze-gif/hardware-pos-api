import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.test") });

const databaseUrl = process.env.DATABASE_URL || "";

if (!databaseUrl) {
  throw new Error(
    "FATAL: DATABASE_URL is not set. Copy .env.test.example to .env.test and configure hardware_pos_test."
  );
}

if (!databaseUrl.includes("hardware_pos_test")) {
  throw new Error(
    "FATAL: Tests must use the hardware_pos_test database only. " +
      "Current DATABASE_URL does not contain 'hardware_pos_test'. Refusing to run."
  );
}

if (!process.env.JWT_SECRET) {
  throw new Error("FATAL: JWT_SECRET must be set in .env.test");
}
