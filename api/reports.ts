import { z } from "zod";
import { createRouter, publicQuery } from "./middleware";
import { getDb } from "./queries/connection";
import {
  customers,
  debts,
  payments,
  installments,
  lawsuits,
  executionFiles,
  lawyers,
  lawyerTasks,
  sessions,
  courts,
  judges,
  executionDirectorates,
  messages,
  procedures,
  users,
} from "@db/schema";
import { formatFileNumber } from "@contracts/types";

export const reportsRouter = createRouter({
  /** التقرير المالي الإجمالي */
  financial: publicQuery.query(async () => {
    const db = getDb();
    const [custs, dbts, pays, execs] = await Promise.all([
      db.select().from(customers),
      db.select().from(debts),
      db.select().from(payments),
      db.select().from(executionFiles),
    ]);
    const perCustomer = custs.map((c) => {
      const principal = dbts.filter((d) => d.customerId === c.id).reduce((s, d) => s + d.principal, 0);
      const wasil = pays.filter((p) => p.customerId === c.id && p.kind === "wasil").reduce((s, p) => s + p.amount, 0);
      const maslam = pays.filter((p) => p.customerId === c.id && p.kind === "maslam").reduce((s, p) => s + p.amount, 0);
      const executed = execs.filter((e) => e.customerId === c.id).reduce((s, e) => s + e.amountExecuted, 0);
      return {
        id: c.id,
        name: c.fullName,
        principal,
        wasil,
        remainingPrincipal: principal - wasil,
        executed,
        received: maslam,
        remainingExecution: executed - maslam,
      };
    }).filter((r) => r.principal > 0 || r.executed > 0);
    return {
      rows: perCustomer,
      totals: {
        principal: perCustomer.reduce((s, r) => s + r.principal, 0),
        wasil: perCustomer.reduce((s, r) => s + r.wasil, 0),
        remainingPrincipal: perCustomer.reduce((s, r) => s + r.remainingPrincipal, 0),
        executed: perCustomer.reduce((s, r) => s + r.executed, 0),
        received: perCustomer.reduce((s, r) => s + r.received, 0),
        remainingExecution: perCustomer.reduce((s, r) => s + r.remainingExecution, 0),
      },
    };
  }),

  /** الدعاوى حسب الحالة */
  lawsuitsByStatus: publicQuery.query(async () => {
    const db = getDb();
    const rows = await db.select().from(lawsuits);
    const crts = await db.select().from(courts);
    const custs = await db.select().from(customers);
    const byStatus = new Map<string, number>();
    for (const r of rows) byStatus.set(r.status, (byStatus.get(r.status) ?? 0) + 1);
    return {
      summary: [...byStatus.entries()].map(([status, count]) => ({ status, count })),
      rows: rows.map((l) => ({
        fileNumber: formatFileNumber(l.caseYear, l.caseType, l.caseSeq),
        customer: custs.find((c) => c.id === l.customerId)?.fullName ?? "غير محدد",
        court: crts.find((c) => c.id === l.courtId)?.name ?? "غير محدد",
        status: l.status,
        filedAt: l.filedAt,
      })),
    };
  }),

  /** الأقساط المتأخرة */
  overdueInstallments: publicQuery.query(async () => {
    const db = getDb();
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    const rows = (await db.select().from(installments)).filter(
      (i) => i.status !== "مسدد" && new Date(i.dueDate) <= today,
    );
    const custs = await db.select().from(customers);
    return rows.map((i) => ({
      ...i,
      customerName: custs.find((c) => c.id === i.customerId)?.fullName ?? "غير محدد",
    }));
  }),

  /** عبء عمل المحامين */
  lawyerWorkload: publicQuery.query(async () => {
    const db = getDb();
    const [lwrs, suits, execs, tasks, sess] = await Promise.all([
      db.select().from(lawyers),
      db.select().from(lawsuits),
      db.select().from(executionFiles),
      db.select().from(lawyerTasks),
      db.select().from(sessions),
    ]);
    return lwrs.map((l) => ({
      id: l.id,
      name: l.fullName,
      lawsuits: suits.filter((s) => s.lawyerId === l.id).length,
      executions: execs.filter((e) => e.lawyerId === l.id).length,
      tasksOpen: tasks.filter((t) => t.lawyerId === l.id && t.status !== "منجزة").length,
      tasksOverdue: tasks.filter((t) => {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        return t.lawyerId === l.id && t.status !== "منجزة" && t.dueDate && new Date(t.dueDate) < today;
      }).length,
      sessions: sess.filter((s) => s.lawyerId === l.id).length,
    }));
  }),
});

export const adminRouter = createRouter({
  /** تصدير نسخة احتياطية كاملة (JSON) */
  backupExport: publicQuery.query(async () => {
    const db = getDb();
    const dump = {
      meta: { app: "MASLAT BABIL ERP", version: 1, exportedAt: new Date().toISOString() },
      users: await db.select().from(users),
      courts: await db.select().from(courts),
      judges: await db.select().from(judges),
      executionDirectorates: await db.select().from(executionDirectorates),
      lawyers: await db.select().from(lawyers),
      customers: await db.select().from(customers),
      debts: await db.select().from(debts),
      payments: await db.select().from(payments),
      installments: await db.select().from(installments),
      lawsuits: await db.select().from(lawsuits),
      executionFiles: await db.select().from(executionFiles),
      procedures: await db.select().from(procedures),
      sessions: await db.select().from(sessions),
      lawyerTasks: await db.select().from(lawyerTasks),
      messages: await db.select().from(messages),
    };
    return dump;
  }),

  /** استيراد نسخة احتياطية — استبدال كامل بعد تأكيد صريح */
  backupImport: publicQuery
    .input(z.object({ confirm: z.literal("استيراد"), data: z.string() }))
    .mutation(async ({ input }) => {
      let parsed: any;
      try {
        parsed = JSON.parse(input.data);
      } catch {
        throw new Error("ملف النسخة الاحتياطية غير صالح (JSON)");
      }
      if (!parsed?.meta || parsed.meta.app !== "MASLAT BABIL ERP") {
        throw new Error("الملف ليس نسخة احتياطية صادرة عن نظام مسلة بابل");
      }
      const db = getDb();
      // حذف بترتيب عكسي للعلاقات ثم إدخال بترتيب صحيح
      await db.delete(messages);
      await db.delete(lawyerTasks);
      await db.delete(sessions);
      await db.delete(procedures);
      await db.delete(payments);
      await db.delete(installments);
      await db.delete(executionFiles);
      await db.delete(lawsuits);
      await db.delete(debts);
      await db.delete(customers);
      await db.delete(lawyers);
      await db.delete(executionDirectorates);
      await db.delete(judges);
      await db.delete(courts);

      const insertIf = async (table: any, rows: any[]) => {
        if (Array.isArray(rows) && rows.length) await db.insert(table).values(rows);
      };
      await insertIf(courts, parsed.courts);
      await insertIf(judges, parsed.judges);
      await insertIf(executionDirectorates, parsed.executionDirectorates);
      await insertIf(lawyers, parsed.lawyers);
      await insertIf(customers, parsed.customers);
      await insertIf(debts, parsed.debts);
      await insertIf(lawsuits, parsed.lawsuits);
      await insertIf(executionFiles, parsed.executionFiles);
      await insertIf(installments, parsed.installments);
      await insertIf(payments, parsed.payments);
      await insertIf(procedures, parsed.procedures);
      await insertIf(sessions, parsed.sessions);
      await insertIf(lawyerTasks, parsed.lawyerTasks);
      await insertIf(messages, parsed.messages);
      return { ok: true };
    }),

  /** فحص النظام: اتصال، جداول، سلامة العلاقات والبيانات المالية */
  systemCheck: publicQuery.query(async () => {
    const db = getDb();
    const started = Date.now();
    await db.select().from(users);
    const latencyMs = Date.now() - started;

    const tables: { name: string; count: number }[] = [];
    const specs: [string, any][] = [
      ["المستخدمون", users], ["المحاكم", courts], ["القضاة", judges],
      ["مديريات التنفيذ", executionDirectorates], ["المحامون", lawyers],
      ["الزبائن", customers], ["الديون", debts], ["التسديدات", payments],
      ["الأقساط", installments], ["الدعاوى", lawsuits],
      ["الأضابير التنفيذية", executionFiles], ["الإجراءات", procedures],
      ["الجلسات", sessions], ["المهام", lawyerTasks], ["المراسلات", messages],
    ];
    for (const [name, table] of specs) {
      const rows = await db.select().from(table);
      tables.push({ name, count: rows.length });
    }

    const issues: { severity: "خطأ" | "تنبيه"; message: string }[] = [];
    const allSuits = await db.select().from(lawsuits);
    const allExecs = await db.select().from(executionFiles);
    const allPays = await db.select().from(payments);
    const allCusts = await db.select().from(customers);
    const allTasks = await db.select().from(lawyerTasks);

    // سلامة العلاقات
    const custIds = new Set(allCusts.map((c) => c.id));
    for (const l of allSuits) if (!custIds.has(l.customerId)) issues.push({ severity: "خطأ", message: `دعوى ${formatFileNumber(l.caseYear, l.caseType, l.caseSeq)} تشير إلى زبون غير موجود` });
    for (const e of allExecs) if (!custIds.has(e.customerId)) issues.push({ severity: "خطأ", message: `إضبارة ${formatFileNumber(e.execYear, e.execType, e.execSeq)} تشير إلى زبون غير موجود` });

    // سلامة مالية: المستلم لا يتجاوز المنفذ
    for (const e of allExecs) {
      const received = allPays.filter((p) => p.executionFileId === e.id && p.kind === "maslam").reduce((s, p) => s + p.amount, 0);
      if (received > e.amountExecuted)
        issues.push({ severity: "تنبيه", message: `الإضبارة ${formatFileNumber(e.execYear, e.execType, e.execSeq)}: المبلغ المستلم (${received.toLocaleString("en-US")}) يتجاوز المبلغ المنفذ (${e.amountExecuted.toLocaleString("en-US")})` });
    }

    // أرقام قانونية مكررة
    const seen = new Set<string>();
    for (const l of allSuits) {
      const n = formatFileNumber(l.caseYear, l.caseType, l.caseSeq);
      if (seen.has(n)) issues.push({ severity: "خطأ", message: `رقم دعوى مكرر: ${n}` });
      seen.add(n);
    }
    seen.clear();
    for (const e of allExecs) {
      const n = formatFileNumber(e.execYear, e.execType, e.execSeq);
      if (seen.has(n)) issues.push({ severity: "خطأ", message: `رقم إضبارة مكرر: ${n}` });
      seen.add(n);
    }

    // مهام متأخرة
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const overdue = allTasks.filter((t) => t.status !== "منجزة" && t.dueDate && new Date(t.dueDate) < today);
    if (overdue.length) issues.push({ severity: "تنبيه", message: `توجد ${overdue.length} مهمة متأخرة غير منجزة` });

    return { connected: true, latencyMs, tables, issues };
  }),
});
