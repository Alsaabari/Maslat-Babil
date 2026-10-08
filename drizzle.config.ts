import "dotenv/config";
import { defineConfig } from "drizzle-kit";

let connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is required to run drizzle commands");
}

try {
  const u = new URL(connectionString);
  if (u.searchParams.has("ssl-mode")) {
    u.searchParams.delete("ssl-mode");
    connectionString = u.toString();
  }
} catch {
  // fallback
}

export default defineConfig({
  schema: "./db/schema.ts",
  out: "./db/migrations",
  dialect: "mysql",
  dbCredentials: {
    url: connectionString,
  },
});
