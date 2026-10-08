import { z } from "zod";
import { eq, desc, asc, lte, and, ne } from "drizzle-orm";
import { createRouter, publicQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { debts, payments, installments, customers, executionFiles } from "@db/schema";
import { formatFileNumber } from "@contracts/types";

const dateStr = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "صيغة التاريخ غير صحيحة");

export const financeRouter = createRouter({
  /* ── الديون ── */
  debts: createRouter({
    list: publicQuery
      .input(z.object({ customerId: z.number().optional() }))
      .query(async ({ input }) => {
        const db = getDb();
        const rows = input.customerId
          ? await db.select().from(debts).where(eq(debts.customerId, input.customerId))
          : await db.select().from(debts).orderBy(desc(debts.id));
        const pays = await db.select().from(payments);
        return rows.map((d) => ({
          ...d,
          wasil: pays.filter((p) => p.debtId === d.id && p.kind === "wasil").reduce((s, p) => s + p.amount, 0),
        }));
      }),
    create: publicQuery
      .input(
        z.object({
          customerId: z.number(),
          principal: z.number().int().nonnegative(),
          source: z.string().default("فاتورة"),
          reference: z.string().optional(),
          issuedAt: dateStr.optional(),
          notes: z.string().optional(),
        }),
      )
      .mutation(async ({ input }) => {
        await getDb().insert(debts).values({
          ...input,
          issuedAt: input.issuedAt ? new Date(input.issuedAt) : null,
        });
        return { ok: true };
      }),
    update: publicQuery
      .input(
        z.object({
          id: z.number(),
          principal: z.number().int().nonnegative().optional(),
          source: z.string().optional(),
          reference: z.string().optional(),
          issuedAt: dateStr.nullish(),
          notes: z.string().optional(),
        }),
      )
      .mutation(async ({ input }) => {
        const { id, issuedAt, ...rest } = input;
        await getDb()
          .update(debts)
          .set({ ...rest, ...(issuedAt !== undefined ? { issuedAt: issuedAt ? new Date(issuedAt) : null } : {}) })
          .where(eq(debts.id, id));
        return { ok: true };
      }),
    remove: publicQuery.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      await getDb().delete(debts).where(eq(debts.id, input.id));
      return { ok: true };
    }),
  }),

  /* ── التسديدات ── */
  payments: createRouter({
    list: publicQuery
      .input(z.object({ customerId: z.number().optional() }))
      .query(async ({ input }) => {
        const db = getDb();
        const rows = input.customerId
          ? await db.select().from(payments).where(eq(payments.customerId, input.customerId)).orderBy(desc(payments.paidAt))
          : await db.select().from(payments).orderBy(desc(payments.paidAt));
        const custs = await db.select({ id: customers.id, fullName: customers.fullName }).from(customers);
        return rows.map((p) => ({ ...p, customerName: custs.find((c) => c.id === p.customerId)?.fullName ?? "غير محدد" }));
      }),
    create: publicQuery
      .input(
        z.object({
          customerId: z.number(),
          debtId: z.number().optional(),
          executionFileId: z.number().optional(),
          kind: z.enum(["wasil", "maslam"]),
          amount: z.number().int().positive(),
          paidAt: dateStr,
          method: z.string().optional(),
          notes: z.string().optional(),
        }),
      )
      .mutation(async ({ input }) => {
        await getDb().insert(payments).values({ ...input, paidAt: new Date(input.paidAt) });
        return { ok: true };
      }),
    remove: publicQuery.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      await getDb().delete(payments).where(eq(payments.id, input.id));
      return { ok: true };
    }),
  }),

  /* ── الأقساط ── */
  installments: createRouter({
    list: publicQuery
      .input(z.object({ customerId: z.number().optional() }))
      .query(async ({ input }) => {
        const db = getDb();
        const rows = input.customerId
          ? await db.select().from(installments).where(eq(installments.customerId, input.customerId)).orderBy(asc(installments.dueDate))
          : await db.select().from(installments).orderBy(asc(installments.dueDate));
        return rows;
      }),
    create: publicQuery
      .input(
        z.object({
          customerId: z.number(),
          debtId: z.number().optional(),
          periodLabel: z.string().min(1),
          amount: z.number().int().positive(),
          dueDate: dateStr,
        }),
      )
      .mutation(async ({ input }) => {
        await getDb().insert(installments).values({ ...input, dueDate: new Date(input.dueDate) });
        return { ok: true };
      }),
    markPaid: publicQuery
      .input(z.object({ id: z.number(), paidAt: dateStr }))
      .mutation(async ({ input }) => {
        await getDb()
          .update(installments)
          .set({ status: "مسدد", paidAt: new Date(input.paidAt) })
          .where(eq(installments.id, input.id));
        return { ok: true };
      }),
    remove: publicQuery.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      await getDb().delete(installments).where(eq(installments.id, input.id));
      return { ok: true };
    }),

    /** الأقساط المتراكمة المستحقة حتى تاريخ اليوم — لرسالة التذكير الودّي */
    overdueSummary: publicQuery
      .input(z.object({ customerId: z.number() }))
      .query(async ({ input }) => {
        const db = getDb();
        const now = new Date();
        const rows = await db
          .select()
          .from(installments)
          .where(
            and(
              eq(installments.customerId, input.customerId),
              ne(installments.status, "مسدد"),
              lte(installments.dueDate, new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)),
            ),
          )
          .orderBy(asc(installments.dueDate));
        const [c] = await db.select().from(customers).where(eq(customers.id, input.customerId));
        return {
          customer: c ?? null,
          count: rows.length,
          total: rows.reduce((s, r) => s + r.amount, 0),
          periods: rows.map((r) => r.periodLabel),
          items: rows,
        };
      }),
  }),
});

/* ── الإجراءات (مشتركة بين الدعاوى والأضابير والمهام) ── */
export const proceduresRouter = createRouter({
  list: publicQuery
    .input(z.object({ entityType: z.string(), entityId: z.number() }))
    .query(async ({ input }) => {
      const { procedures } = await import("@db/schema");
      const rows = await getDb().select().from(procedures);
      return rows
        .filter((p) => p.entityType === input.entityType && p.entityId === input.entityId)
        .sort((a, b) => b.actionDate.getTime() - a.actionDate.getTime() || b.id - a.id);
    }),
  create: publicQuery
    .input(
      z.object({
        entityType: z.enum(["lawsuit", "execution", "task"]),
        entityId: z.number(),
        procedureNo: z.string().optional(),
        title: z.string().min(1),
        actionDate: dateStr,
        nextAction: z.string().optional(),
        notes: z.string().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const { procedures } = await import("@db/schema");
      await getDb().insert(procedures).values({ ...input, actionDate: new Date(input.actionDate) });
      return { ok: true };
    }),
  remove: publicQuery.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
    const { procedures } = await import("@db/schema");
    await getDb().delete(procedures).where(eq(procedures.id, input.id));
    return { ok: true };
  }),
});

/* آخر إجراء لأي كيان — مشتق من التاريخ الحقيقي والتسلسل */
export async function lastProcedureFor(entityType: string, entityId: number) {
  const { procedures } = await import("@db/schema");
  const rows = (await getDb().select().from(procedures)).filter(
    (p) => p.entityType === entityType && p.entityId === entityId,
  );
  if (!rows.length) return null;
  return rows.sort((a, b) => b.actionDate.getTime() - a.actionDate.getTime() || b.id - a.id)[0];
}

export { formatFileNumber };
export const _execFiles = executionFiles;
