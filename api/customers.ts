import { z } from "zod";
import { eq, like, or, desc, asc, inArray } from "drizzle-orm";
import { createRouter, publicQuery } from "./middleware";
import { getDb } from "./queries/connection";
import {
  customers,
  debts,
  payments,
  installments,
  lawsuits,
  executionFiles,
  courts,
  judges,
  lawyers,
  executionDirectorates,
  procedures,
} from "@db/schema";
import { formatFileNumber } from "@contracts/types";

/* ── مساعدات مشتركة ── */

function lastOf<T extends { actionDate: Date | null; id: number }>(rows: T[]) {
  const valid = rows.filter((r) => r.actionDate);
  if (!valid.length) return null;
  return valid.sort((a, b) => {
    const d = (b.actionDate as Date).getTime() - (a.actionDate as Date).getTime();
    return d !== 0 ? d : b.id - a.id;
  })[0];
}

async function financialsFor(customerIds: number[]) {
  const db = getDb();
  if (!customerIds.length)
    return new Map<number, { principal: number; wasil: number; maslam: number; executed: number; lastPayment: Date | null }>();
  const dbt = await db.select().from(debts).where(inArray(debts.customerId, customerIds));
  const pays = await db.select().from(payments).where(inArray(payments.customerId, customerIds));
  const execs = await db
    .select()
    .from(executionFiles)
    .where(inArray(executionFiles.customerId, customerIds));
  const map = new Map<number, { principal: number; wasil: number; maslam: number; executed: number; lastPayment: Date | null }>();
  for (const id of customerIds) map.set(id, { principal: 0, wasil: 0, maslam: 0, executed: 0, lastPayment: null });
  for (const d of dbt) map.get(d.customerId)!.principal += d.principal;
  for (const p of pays) {
    const f = map.get(p.customerId)!;
    if (p.kind === "wasil") f.wasil += p.amount;
    else f.maslam += p.amount;
    if (!f.lastPayment || (p.paidAt && p.paidAt > f.lastPayment)) f.lastPayment = p.paidAt;
  }
  for (const e of execs) map.get(e.customerId)!.executed += e.amountExecuted;
  return map;
}

const customerInput = z.object({
  fullName: z.string().min(2),
  phone1: z.string().optional(),
  phone2: z.string().optional(),
  nationalId: z.string().optional(),
  governorate: z.string().optional(),
  district: z.string().optional(),
  policeStation: z.string().optional(),
  employer: z.string().optional(),
  jobTitle: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
});

export const customersRouter = createRouter({
  list: publicQuery
    .input(
      z.object({
        view: z.enum(["all", "withLegal", "withoutLegal"]).default("all"),
        search: z.string().optional(),
      }),
    )
    .query(async ({ input }) => {
      const db = getDb();
      let rows = await db.select().from(customers).orderBy(desc(customers.id));
      if (input.search?.trim()) {
        const s = `%${input.search.trim()}%`;
        rows = await db
          .select()
          .from(customers)
          .where(
            or(
              like(customers.fullName, s),
              like(customers.phone1, s),
              like(customers.phone2, s),
              like(customers.district, s),
              like(customers.employer, s),
            ),
          )
          .orderBy(desc(customers.id));
      }
      const ids = rows.map((r) => r.id);
      const suits = ids.length
        ? await db
            .select({ customerId: lawsuits.customerId, caseYear: lawsuits.caseYear, caseType: lawsuits.caseType, caseSeq: lawsuits.caseSeq, status: lawsuits.status })
            .from(lawsuits)
            .where(inArray(lawsuits.customerId, ids))
        : [];
      const execs = ids.length
        ? await db
            .select({ customerId: executionFiles.customerId, execYear: executionFiles.execYear, execType: executionFiles.execType, execSeq: executionFiles.execSeq, status: executionFiles.status })
            .from(executionFiles)
            .where(inArray(executionFiles.customerId, ids))
        : [];
      const fin = await financialsFor(ids);

      let out = rows.map((c) => {
        const f = fin.get(c.id)!;
        const mySuits = suits.filter((s) => s.customerId === c.id);
        const myExecs = execs.filter((e) => e.customerId === c.id);
        const hasLawsuit = mySuits.length > 0;
        const hasExecution = myExecs.length > 0;
        return {
          ...c,
          principal: f.principal,
          wasil: f.wasil,
          remainingPrincipal: f.principal - f.wasil,
          executed: f.executed,
          received: f.maslam,
          remainingExecution: f.executed - f.maslam,
          lastPaymentDate: f.lastPayment,
          caseNumbers: mySuits.map((s) => formatFileNumber(s.caseYear, s.caseType, s.caseSeq)),
          execNumbers: myExecs.map((e) => formatFileNumber(e.execYear, e.execType, e.execSeq)),
          legalStatus: hasLawsuit && hasExecution ? "دعوى + إضبارة" : hasLawsuit ? "دعوى" : hasExecution ? "إضبارة تنفيذية" : "بدون إجراء قانوني",
          hasLegal: hasLawsuit || hasExecution,
        };
      });
      if (input.view === "withLegal") out = out.filter((c) => c.hasLegal);
      if (input.view === "withoutLegal") out = out.filter((c) => !c.hasLegal && c.principal > 0);
      return out;
    }),

  get: publicQuery.input(z.object({ id: z.number() })).query(async ({ input }) => {
    const db = getDb();
    const [c] = await db.select().from(customers).where(eq(customers.id, input.id));
    if (!c) throw new Error("الزبون غير موجود");
    return c;
  }),

  create: publicQuery.input(customerInput).mutation(async ({ input }) => {
    await getDb().insert(customers).values(input);
    return { ok: true };
  }),

  update: publicQuery
    .input(customerInput.partial().extend({ id: z.number() }))
    .mutation(async ({ input }) => {
      const { id, ...patch } = input;
      await getDb().update(customers).set(patch).where(eq(customers.id, id));
      return { ok: true };
    }),

  remove: publicQuery.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
    const db = getDb();
    const [s] = await db.select({ id: lawsuits.id }).from(lawsuits).where(eq(lawsuits.customerId, input.id));
    const [e] = await db.select({ id: executionFiles.id }).from(executionFiles).where(eq(executionFiles.customerId, input.id));
    if (s || e) throw new Error("لا يمكن حذف زبون لديه دعاوى أو أضابير تنفيذية — احذف الملفات المرتبطة أولاً");
    await db.delete(installments).where(eq(installments.customerId, input.id));
    await db.delete(payments).where(eq(payments.customerId, input.id));
    await db.delete(debts).where(eq(debts.customerId, input.id));
    await db.delete(customers).where(eq(customers.id, input.id));
    return { ok: true };
  }),

  /** السجل الموحد: صورة كاملة ومترابطة عن الزبون */
  unifiedRecord: publicQuery.input(z.object({ id: z.number() })).query(async ({ input }) => {
    const db = getDb();
    const [c] = await db.select().from(customers).where(eq(customers.id, input.id));
    if (!c) throw new Error("الزبون غير موجود");

    const myDebts = await db.select().from(debts).where(eq(debts.customerId, input.id));
    const myPayments = await db.select().from(payments).where(eq(payments.customerId, input.id)).orderBy(desc(payments.paidAt));
    const myInstallments = await db.select().from(installments).where(eq(installments.customerId, input.id)).orderBy(asc(installments.dueDate));
    const myLawsuits = await db.select().from(lawsuits).where(eq(lawsuits.customerId, input.id));
    const myExecs = await db.select().from(executionFiles).where(eq(executionFiles.customerId, input.id));

    const suitIds = myLawsuits.map((l) => l.id);
    const execIds = myExecs.map((e) => e.id);
    const procsSuits = suitIds.length
      ? await db.select().from(procedures).where(eq(procedures.entityType, "lawsuit")).then((r) => r.filter((p) => suitIds.includes(p.entityId)))
      : [];
    const procsExecs = execIds.length
      ? await db.select().from(procedures).where(eq(procedures.entityType, "execution")).then((r) => r.filter((p) => execIds.includes(p.entityId)))
      : [];

    const allCourts = await db.select().from(courts);
    const allJudges = await db.select().from(judges);
    const allLawyers = await db.select().from(lawyers);
    const allDirs = await db.select().from(executionDirectorates);
    const courtName = (id: number | null) => allCourts.find((x) => x.id === id)?.name ?? null;
    const judgeName = (id: number | null) => allJudges.find((x) => x.id === id)?.name ?? null;
    const lawyerName = (id: number | null) => allLawyers.find((x) => x.id === id)?.fullName ?? null;
    const dirName = (id: number | null) => allDirs.find((x) => x.id === id)?.name ?? null;

    /* الإجماليات المالية — كل مجموع من استعلام مستقل لمنع تكرار JOIN */
    const totalPrincipal = myDebts.reduce((s, d) => s + d.principal, 0);
    const totalWasil = myPayments.filter((p) => p.kind === "wasil").reduce((s, p) => s + p.amount, 0);
    const totalMaslam = myPayments.filter((p) => p.kind === "maslam").reduce((s, p) => s + p.amount, 0);
    const totalExecuted = myExecs.reduce((s, e) => s + e.amountExecuted, 0);
    const lastPayment = myPayments.length
      ? myPayments.reduce((a, b) => (a.paidAt > b.paidAt ? a : b)).paidAt
      : null;

    return {
      customer: c,
      debts: myDebts.map((d) => ({
        ...d,
        wasil: myPayments.filter((p) => p.debtId === d.id && p.kind === "wasil").reduce((s, p) => s + p.amount, 0),
      })),
      payments: myPayments,
      installments: myInstallments,
      lawsuits: myLawsuits.map((l) => {
        const procs = procsSuits.filter((p) => p.entityId === l.id);
        const last = lastOf(procs);
        return {
          ...l,
          fileNumber: formatFileNumber(l.caseYear, l.caseType, l.caseSeq),
          courtName: courtName(l.courtId),
          judgeName: judgeName(l.judgeId),
          lawyerName: lawyerName(l.lawyerId),
          procedures: procs.sort((a, b) => b.actionDate.getTime() - a.actionDate.getTime()),
          lastProcedure: last,
        };
      }),
      executions: myExecs.map((e) => {
        const procs = procsExecs.filter((p) => p.entityId === e.id);
        const last = lastOf(procs);
        const received = myPayments.filter((p) => p.executionFileId === e.id && p.kind === "maslam").reduce((s, p) => s + p.amount, 0);
        return {
          ...e,
          fileNumber: formatFileNumber(e.execYear, e.execType, e.execSeq),
          directorateName: dirName(e.directorateId),
          externalDirectorateName: dirName(e.externalDirectorateId),
          lawyerName: lawyerName(e.lawyerId),
          received,
          remaining: e.amountExecuted - received,
          procedures: procs.sort((a, b) => b.actionDate.getTime() - a.actionDate.getTime()),
          lastProcedure: last,
        };
      }),
      totals: {
        principal: totalPrincipal,
        wasil: totalWasil,
        remainingPrincipal: totalPrincipal - totalWasil,
        executed: totalExecuted,
        received: totalMaslam,
        remainingExecution: totalExecuted - totalMaslam,
      },
      lastPaymentDate: lastPayment,
    };
  }),

  /** مؤشرات لوحة القيادة — أرقام حقيقية من قاعدة البيانات */
  dashboardStats: publicQuery.query(async () => {
    const db = getDb();
    const allCustomers = await db.select({ id: customers.id }).from(customers);
    const allSuits = await db.select().from(lawsuits);
    const allExecs = await db.select().from(executionFiles);
    const allTasks = await import("@db/schema").then((m) => db.select().from(m.lawyerTasks));
    const allSessions = await db.select().from((await import("@db/schema")).sessions);
    const allLawyers = await db.select({ id: lawyers.id }).from(lawyers);
    const allDebts = await db.select().from(debts);
    const allPayments = await db.select().from(payments);

    const ids = new Set(allSuits.map((l) => l.customerId).concat(allExecs.map((e) => e.customerId)));
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const overdueTasks = allTasks.filter((t) => t.status !== "منجزة" && t.dueDate && new Date(t.dueDate) < today);
    const upcomingSessions = allSessions.filter((s) => s.status === "قادمة" && new Date(s.sessionDate) >= today);

    const totalPrincipal = allDebts.reduce((s, d) => s + d.principal, 0);
    const totalWasil = allPayments.filter((p) => p.kind === "wasil").reduce((s, p) => s + p.amount, 0);
    const totalExecuted = allExecs.reduce((s, e) => s + e.amountExecuted, 0);
    const totalReceived = allPayments.filter((p) => p.kind === "maslam").reduce((s, p) => s + p.amount, 0);

    return {
      customers: allCustomers.length,
      debtors: ids.size,
      lawsuits: allSuits.length,
      executions: allExecs.length,
      lawyers: allLawyers.length,
      tasksOpen: allTasks.filter((t) => t.status !== "منجزة").length,
      tasksOverdue: overdueTasks.length,
      sessionsUpcoming: upcomingSessions.length,
      totalPrincipal,
      totalWasil,
      totalRemaining: totalPrincipal - totalWasil,
      totalExecuted,
      totalReceived,
      totalRemainingExecution: totalExecuted - totalReceived,
    };
  }),
});
