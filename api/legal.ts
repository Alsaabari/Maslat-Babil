import { z } from "zod";
import { eq, desc } from "drizzle-orm";
import { createRouter, publicQuery } from "./middleware";
import { getDb } from "./queries/connection";
import {
  lawsuits,
  executionFiles,
  customers,
  courts,
  judges,
  lawyers,
  executionDirectorates,
  payments,
  procedures,
} from "@db/schema";
import { formatFileNumber } from "@contracts/types";

const dateStr = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

function lastOf<T extends { actionDate: Date; id: number }>(rows: T[]): T | null {
  if (!rows.length) return null;
  return [...rows].sort((a, b) => b.actionDate.getTime() - a.actionDate.getTime() || b.id - a.id)[0];
}

async function refs() {
  const db = getDb();
  const [custs, crts, jdgs, lwrs, dirs] = await Promise.all([
    db.select().from(customers),
    db.select().from(courts),
    db.select().from(judges),
    db.select().from(lawyers),
    db.select().from(executionDirectorates),
  ]);
  return {
    custName: (id: number) => custs.find((c) => c.id === id)?.fullName ?? "غير محدد",
    courtName: (id: number | null) => (id ? crts.find((c) => c.id === id)?.name ?? "غير محدد" : "غير محدد"),
    judgeName: (id: number | null) => (id ? jdgs.find((j) => j.id === id)?.name ?? "غير محدد" : "غير محدد"),
    lawyerName: (id: number | null) => (id ? lwrs.find((l) => l.id === id)?.fullName ?? "غير محدد" : "غير محدد"),
    dirName: (id: number | null) => (id ? dirs.find((d) => d.id === id)?.name ?? "غير محدد" : "غير محدد"),
  };
}

const lawsuitInput = z.object({
  customerId: z.number(),
  debtId: z.number().optional(),
  lawyerId: z.number().optional(),
  courtId: z.number().optional(),
  judgeId: z.number().optional(),
  caseYear: z.number().int().min(1900).max(2200),
  caseType: z.enum(["ب", "ج", "ح", "أ", "ش"]),
  caseSeq: z.number().int().positive(),
  status: z.string().default("منظورة"),
  subject: z.string().optional(),
  filedAt: dateStr.optional(),
  notes: z.string().optional(),
});

export const legalRouter = createRouter({
  lawsuits: createRouter({
    list: publicQuery
      .input(z.object({ search: z.string().optional(), lawyerId: z.number().optional(), customerId: z.number().optional() }))
      .query(async ({ input }) => {
        const db = getDb();
        let rows = await db.select().from(lawsuits).orderBy(desc(lawsuits.id));
        if (input.lawyerId) rows = rows.filter((r) => r.lawyerId === input.lawyerId);
        if (input.customerId) rows = rows.filter((r) => r.customerId === input.customerId);
        const r = await refs();
        const procs = await db.select().from(procedures).where(eq(procedures.entityType, "lawsuit"));
        let out = rows.map((l) => {
          const lp = lastOf(procs.filter((p) => p.entityId === l.id));
          return {
            ...l,
            fileNumber: formatFileNumber(l.caseYear, l.caseType, l.caseSeq),
            customerName: r.custName(l.customerId),
            courtName: r.courtName(l.courtId),
            judgeName: r.judgeName(l.judgeId),
            lawyerName: r.lawyerName(l.lawyerId),
            lastProcedure: lp ? { title: lp.title, actionDate: lp.actionDate, nextAction: lp.nextAction } : null,
          };
        });
        if (input.search?.trim()) {
          const s = input.search.trim();
          out = out.filter(
            (l) =>
              l.fileNumber.includes(s) ||
              l.customerName.includes(s) ||
              l.courtName.includes(s) ||
              l.judgeName.includes(s) ||
              l.lawyerName.includes(s) ||
              l.status.includes(s),
          );
        }
        return out;
      }),

    create: publicQuery.input(lawsuitInput).mutation(async ({ input }) => {
      const db = getDb();
      const same = await db.select().from(lawsuits);
      if (
        same.some(
          (l) => l.caseYear === input.caseYear && l.caseType === input.caseType && l.caseSeq === input.caseSeq,
        )
      ) {
        throw new Error(`رقم الدعوى ${formatFileNumber(input.caseYear, input.caseType, input.caseSeq)} مسجل مسبقاً`);
      }
      await db.insert(lawsuits).values({ ...input, filedAt: input.filedAt ? new Date(input.filedAt) : null });
      return { ok: true };
    }),

    update: publicQuery
      .input(lawsuitInput.partial().extend({ id: z.number() }))
      .mutation(async ({ input }) => {
        const { id, filedAt, ...rest } = input;
        await getDb()
          .update(lawsuits)
          .set({ ...rest, ...(filedAt !== undefined ? { filedAt: filedAt ? new Date(filedAt) : null } : {}) })
          .where(eq(lawsuits.id, id));
        return { ok: true };
      }),

    remove: publicQuery.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      await getDb().delete(lawsuits).where(eq(lawsuits.id, input.id));
      return { ok: true };
    }),
  }),

  executions: createRouter({
    list: publicQuery
      .input(z.object({ search: z.string().optional(), lawyerId: z.number().optional(), customerId: z.number().optional() }))
      .query(async ({ input }) => {
        const db = getDb();
        let rows = await db.select().from(executionFiles).orderBy(desc(executionFiles.id));
        if (input.lawyerId) rows = rows.filter((r) => r.lawyerId === input.lawyerId);
        if (input.customerId) rows = rows.filter((r) => r.customerId === input.customerId);
        const r = await refs();
        const procs = await db.select().from(procedures).where(eq(procedures.entityType, "execution"));
        const pays = await db.select().from(payments);
        let out = rows.map((e) => {
          const lp = lastOf(procs.filter((p) => p.entityId === e.id));
          const received = pays
            .filter((p) => p.executionFileId === e.id && p.kind === "maslam")
            .reduce((s, p) => s + p.amount, 0);
          return {
            ...e,
            fileNumber: formatFileNumber(e.execYear, e.execType, e.execSeq),
            customerName: r.custName(e.customerId),
            directorateName: r.dirName(e.directorateId),
            externalDirectorateName: e.externalDirectorateId ? r.dirName(e.externalDirectorateId) : null,
            lawyerName: r.lawyerName(e.lawyerId),
            received,
            remaining: e.amountExecuted - received,
            lastProcedure: lp ? { title: lp.title, actionDate: lp.actionDate, nextAction: lp.nextAction } : null,
          };
        });
        if (input.search?.trim()) {
          const s = input.search.trim();
          out = out.filter(
            (e) =>
              e.fileNumber.includes(s) ||
              e.customerName.includes(s) ||
              e.directorateName.includes(s) ||
              (e.externalDirectorateName ?? "").includes(s) ||
              (e.externalFileNo ?? "").includes(s) ||
              e.lawyerName.includes(s) ||
              e.status.includes(s),
          );
        }
        return out;
      }),

    create: publicQuery
      .input(
        z.object({
          customerId: z.number(),
          lawsuitId: z.number().optional(),
          lawyerId: z.number().optional(),
          directorateId: z.number().optional(),
          externalDirectorateId: z.number().optional(),
          externalFileNo: z.string().optional(),
          execYear: z.number().int().min(1900).max(2200),
          execType: z.enum(["ت", "خ"]),
          execSeq: z.number().int().positive(),
          subType: z.string().default("أصلي"),
          amountExecuted: z.number().int().nonnegative(),
          status: z.string().default("قيد التنفيذ"),
          openedAt: dateStr.optional(),
          notes: z.string().optional(),
        }),
      )
      .mutation(async ({ input }) => {
        const db = getDb();
        const same = await db.select().from(executionFiles);
        if (
          same.some(
            (e) => e.execYear === input.execYear && e.execType === input.execType && e.execSeq === input.execSeq,
          )
        ) {
          throw new Error(`رقم الإضبارة ${formatFileNumber(input.execYear, input.execType, input.execSeq)} مسجل مسبقاً`);
        }
        await db.insert(executionFiles).values({ ...input, openedAt: input.openedAt ? new Date(input.openedAt) : null });
        return { ok: true };
      }),

    update: publicQuery
      .input(
        z.object({
          id: z.number(),
          lawyerId: z.number().nullish(),
          directorateId: z.number().nullish(),
          externalDirectorateId: z.number().nullish(),
          externalFileNo: z.string().optional(),
          subType: z.string().optional(),
          amountExecuted: z.number().int().nonnegative().optional(),
          status: z.string().optional(),
          openedAt: dateStr.nullish(),
          notes: z.string().optional(),
        }),
      )
      .mutation(async ({ input }) => {
        const { id, openedAt, ...rest } = input;
        const patch: Record<string, unknown> = { ...rest };
        if (openedAt !== undefined) patch.openedAt = openedAt ? new Date(openedAt) : null;
        await getDb().update(executionFiles).set(patch).where(eq(executionFiles.id, id));
        return { ok: true };
      }),

    remove: publicQuery.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      await getDb().delete(executionFiles).where(eq(executionFiles.id, input.id));
      return { ok: true };
    }),
  }),
});
