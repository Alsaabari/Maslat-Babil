import { getDb } from "../api/queries/connection";
import { users } from "./schema";
import { createHash } from "crypto";

function hashPassword(password: string): string {
  const salt = "maslat-babil-2026";
  return createHash("sha256").update(salt + password).digest("hex");
}

async function seed() {
  const db = getDb();
  console.log("Seeding database...");

  const existing = await db.select().from(users);
  if (existing.length === 0) {
    await db.insert(users).values({
      username: "admin",
      passwordHash: hashPassword("admin123"),
      displayName: "مدير النظام",
      role: "admin",
      active: true,
    });
    console.log("Created default admin user (admin / admin123)");
  }

  console.log("Done.");
  process.exit(0);
}

seed();
