import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { env } from "../lib/env";
import * as schema from "@db/schema";
import * as relations from "@db/relations";

const fullSchema = { ...schema, ...relations };

let instance: ReturnType<typeof drizzle<typeof fullSchema>>;

function createConnectionPool(rawUrl: string) {
  try {
    const parsed = new URL(rawUrl);
    if (parsed.searchParams.has("ssl-mode")) {
      parsed.searchParams.delete("ssl-mode");
      return mysql.createPool({
        uri: parsed.toString(),
        ssl: { rejectUnauthorized: false },
      });
    }
  } catch {
    // fallback
  }
  return rawUrl;
}

export function getDb() {
  if (!instance) {
    const client = createConnectionPool(env.databaseUrl);
    instance = drizzle(client as any, {
      mode: "planetscale",
      schema: fullSchema,
    });
  }
  return instance;
}
