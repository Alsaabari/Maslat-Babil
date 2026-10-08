import { z } from "zod";
import { createHash } from "crypto";
import { eq } from "drizzle-orm";
import { createRouter, publicQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { users } from "@db/schema";

const SALT = "maslat-babil-2026";
function hashPassword(password: string): string {
  return createHash("sha256")
    .update(SALT + password)
    .digest("hex");
}

const publicUser = {
  id: users.id,
  username: users.username,
  displayName: users.displayName,
  role: users.role,
  active: users.active,
  createdAt: users.createdAt,
};

export const authRouter = createRouter({
  login: publicQuery
    .input(z.object({ username: z.string().min(1), password: z.string().min(1) }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const [u] = await db
        .select()
        .from(users)
        .where(eq(users.username, input.username.trim()));
      if (!u || !u.active || u.passwordHash !== hashPassword(input.password)) {
        throw new Error("اسم المستخدم أو كلمة المرور غير صحيحة");
      }
      return {
        id: u.id,
        username: u.username,
        displayName: u.displayName,
        role: u.role,
      };
    }),

  list: publicQuery.query(async () => {
    return getDb().select(publicUser).from(users);
  }),

  create: publicQuery
    .input(
      z.object({
        username: z.string().min(3),
        password: z.string().min(6),
        displayName: z.string().min(2),
        role: z.enum(["admin", "manager", "data_entry", "lawyer", "viewer"]),
      }),
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const [existing] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.username, input.username.trim()));
      if (existing) throw new Error("اسم المستخدم مستخدم مسبقاً");
      await db.insert(users).values({
        username: input.username.trim(),
        passwordHash: hashPassword(input.password),
        displayName: input.displayName,
        role: input.role,
        active: true,
      });
      return { ok: true };
    }),

  update: publicQuery
    .input(
      z.object({
        id: z.number(),
        displayName: z.string().min(2).optional(),
        role: z.enum(["admin", "manager", "data_entry", "lawyer", "viewer"]).optional(),
        active: z.boolean().optional(),
        password: z.string().min(6).optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const patch: Record<string, unknown> = {};
      if (input.displayName) patch.displayName = input.displayName;
      if (input.role) patch.role = input.role;
      if (typeof input.active === "boolean") patch.active = input.active;
      if (input.password) patch.passwordHash = hashPassword(input.password);
      await db.update(users).set(patch).where(eq(users.id, input.id));
      return { ok: true };
    }),

  remove: publicQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const [target] = await db.select().from(users).where(eq(users.id, input.id));
      if (!target) throw new Error("المستخدم غير موجود");
      if (target.username === "admin") throw new Error("لا يمكن حذف مدير النظام الرئيسي");
      await db.delete(users).where(eq(users.id, input.id));
      return { ok: true };
    }),
});
