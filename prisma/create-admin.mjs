// Creates (or promotes) an administrator account. There is intentionally no
// public admin sign-up; run this on the server with the credentials in the
// environment so no password is ever written into the code:
//
//   ADMIN_EMAIL=you@example.com ADMIN_PASSWORD='a-long-password' ADMIN_NAME='Owner' node prisma/create-admin.mjs
import "dotenv/config";
import pg from "pg";
import { randomBytes } from "node:crypto";
import { hashPassword } from "../lib/password.ts";

const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD;
const name = process.env.ADMIN_NAME?.trim() || "Admin";

if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  throw new Error("Set ADMIN_EMAIL to a valid email address.");
}
if (!password || password.length < 12) {
  throw new Error("Set ADMIN_PASSWORD to at least 12 characters.");
}

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();
try {
  const passwordHash = await hashPassword(password);
  const { rows } = await client.query(
    `INSERT INTO "User" (id, name, email, "passwordHash", role, "updatedAt")
     VALUES ($1, $2, $3, $4, 'ADMIN', now())
     ON CONFLICT (email) DO UPDATE SET "passwordHash" = EXCLUDED."passwordHash", role = 'ADMIN', "updatedAt" = now()
     RETURNING id`,
    ["c" + randomBytes(12).toString("hex"), name, email, passwordHash],
  );
  console.log(`Admin ready: ${email} (id ${rows[0].id})`);
} finally {
  await client.end();
}
