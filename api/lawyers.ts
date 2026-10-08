import { z } from "zod";
import { eq, desc, asc } from "drizzle-orm";
import { createRouter, publicQuery } from "./middleware";
import { getDb } from "./queries/connection";
import {
  lawyers,
  lawyerTasks,
  lawsuits,
  executionFiles,
  sessions,
  customers,
  courts,
  executionDirectorates,
  procedures,
} from "@db/schema";
import { formatFileNumber } from "@contracts/types";

const dateStr = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

function isOverdue(t: { status: string; dueDate: Date | null }) {
  if (t.status === "منجزة" || !t.dueDate) return false;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return new Date(t.dueDate) < today;
}

async function enrichTasks(rows: (typeof lawyerTasks.$inferSelect)[]) {
  const db = getDb();
  const [lwrs, suits, execs, custs] = await Promise.all([
    db.select().from(lawyers),
    db.select().from(lawsuits),
    db.select().from(executionFiles),
    db.select().from(customers),
  ]);
  const procs = await db.select().from(procedures).where(eq(procedures.entityType, "task"));
  return rows.map((t) => {
    const suit = suits.find((s) => s.id === t.lawsuitId);
    const exec = execs.find((e) => e.id === t.executionFileId);
    const myProcs = procs.filter((p) => p.entityId === t.id);
    const last = myProcs.length
      ? [...myProcs].sort((a, b) => b.actionDate.getTime() - a.actionDate.getTime() || b.id - a.id)[0]
      : null;
    return {
      ...t,
      overdue: isOverdue(t),
      lawyerName: lwrs.find((l) => l.id === t.lawyerId)?.fullName ?? "غير محدد",
      lawyerPhone: lwrs.find((l) => l.id === t.lawyerId)?.phone ?? null,
      customerName: t.customerId ? custs.find((c) => c.id === t.customerId)?.fullName ?? null : null,
      lawsuitNumber: suit ? formatFileNumber(suit.caseYear, suit.caseType, suit.caseSeq) : null,
      executionNumber: exec ? formatFileNumber(exec.execYear, exec.execType, exec.execSeq) : null,
      lastProcedure: last ? { title: last.title, actionDate: last.actionDate } : null,
    };
  });
}

export const lawyersRouter = createRouter({
  list: publicQuery.query(async () => {
    const db = getDb();
    const rows = await db.select().from(lawyers).orderBy(asc(lawyers.fullName));
    const tasks = await db.select().from(lawyerTasks);
    const suits = await db.select({ lawyerId: lawsuits.lawyerId }).from(lawsuits);
    const execs = await db.select({ lawyerId: executionFiles.lawyerId }).from(executionFiles);
    return rows.map((l) => ({
      ...l,
      tasksCount: tasks.filter((t) => t.lawyerId === l.id).length,
      tasksActive: tasks.filter((t) => t.lawyerId === l.id && t.status !== "منجزة").length,
      tasksOverdue: tasks.filter((t) => t.lawyerId === l.id && isOverdue(t)).length,
      lawsuitsCount: suits.filter((s) => s.lawyerId === l.id).length,
      executionsCount: execs.filter((e) => e.lawyerId === l.id).length,
    }));
  }),

  /** ملف المحامي الكامل */
  profile: publicQuery.input(z.object({ id: z.number() })).query(async ({ input }) => {
    const db = getDb();
    const [l] = await db.select().from(lawyers).where(eq(lawyers.id, input.id));
    if (!l) throw new Error("المحامي غير موجود");
    const [suits, execs, sess, custs, crts, dirs] = await Promise.all([
      db.select().from(lawsuits),
      db.select().from(executionFiles),
      db.select().from(sessions),
      db.select().from(customers),
      db.select().from(courts),
      db.select().from(executionDirectorates),
    ]);
    const myTasks = await enrichTasks((await db.select().from(lawyerTasks)).filter((t) => t.lawyerId === input.id));
    return {
      lawyer: l,
      tasks: myTasks.sort((a, b) => (b.dueDate?.getTime() ?? 0) - (a.dueDate?.getTime() ?? 0)),
      lawsuits: suits
        .filter((s) => s.lawyerId === input.id)
        .map((s) => ({
          ...s,
          fileNumber: formatFileNumber(s.caseYear, s.caseType, s.caseSeq),
          customerName: custs.find((c) => c.id === s.customerId)?.fullName ?? "غير محدد",
          courtName: crts.find((c) => c.id === s.courtId)?.name ?? "غير محدد",
        })),
      executions: execs
        .filter((e) => e.lawyerId === input.id)
        .map((e) => ({
          ...e,
          fileNumber: formatFileNumber(e.execYear, e.execType, e.execSeq),
          customerName: custs.find((c) => c.id === e.customerId)?.fullName ?? "غير محدد",
          directorateName: dirs.find((d) => d.id === e.directorateId)?.name ?? "غير محدد",
        })),
      sessions: sess
        .filter((s) => s.lawyerId === input.id)
        .sort((a, b) => b.sessionDate.getTime() - a.sessionDate.getTime()),
      stats: {
        tasks: myTasks.length,
        tasksActive: myTasks.filter((t) => t.status !== "منجزة").length,
        tasksOverdue: myTasks.filter((t) => t.overdue).length,
        lawsuits: suits.filter((s) => s.lawyerId === input.id).length,
        executions: execs.filter((e) => e.lawyerId === input.id).length,
        sessions: sess.filter((s) => s.lawyerId === input.id).length,
      },
    };
  }),

  create: publicQuery
    .input(
      z.object({
        fullName: z.string().min(2),
        phone: z.string().optional(),
        specialty: z.string().optional(),
        notes: z.string().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      await getDb().insert(lawyers).values(input);
      return { ok: true };
    }),

  update: publicQuery
    .input(
      z.object({
        id: z.number(),
        fullName: z.string().min(2).optional(),
        phone: z.string().optional(),
        specialty: z.string().optional(),
        notes: z.string().optional(),
        active: z.boolean().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const { id, ...patch } = input;
      await getDb().update(lawyers).set(patch).where(eq(lawyers.id, id));
      return { ok: true };
    }),

  remove: publicQuery.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
    await getDb().delete(lawyers).where(eq(lawyers.id, input.id));
    return { ok: true };
  }),
});

export const tasksRouter = createRouter({
  list: publicQuery
    .input(
      z.object({
        lawyerId: z.number().optional(),
        filter: z.enum(["all", "active", "overdue", "done"]).default("all"),
      }),
    )
    .query(async ({ input }) => {
      const db = getDb();
      let rows = await db.select().from(lawyerTasks).orderBy(desc(lawyerTasks.id));
      if (input.lawyerId) rows = rows.filter((t) => t.lawyerId === input.lawyerId);
      let out = await enrichTasks(rows);
      if (input.filter === "active") out = out.filter((t) => t.status !== "منجزة");
      if (input.filter === "overdue") out = out.filter((t) => t.overdue);
      if (input.filter === "done") out = out.filter((t) => t.status === "منجزة");
      return out;
    }),

  create: publicQuery
    .input(
      z.object({
        lawyerId: z.number(),
        lawsuitId: z.number().optional(),
        executionFileId: z.number().optional(),
        customerId: z.number().optional(),
        taskType: z.string().default("عامة"),
        title: z.string().min(1),
        description: z.string().optional(),
        priority: z.string().default("متوسطة"),
        status: z.string().default("قيد الانتظار"),
        dueDate: dateStr.optional(),
        requiredAction: z.string().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      await getDb().insert(lawyerTasks).values({ ...input, dueDate: input.dueDate ? new Date(input.dueDate) : null });
      return { ok: true };
    }),

  update: publicQuery
    .input(
      z.object({
        id: z.number(),
        title: z.string().optional(),
        description: z.string().optional(),
        taskType: z.string().optional(),
        priority: z.string().optional(),
        status: z.string().optional(),
        dueDate: dateStr.nullish(),
        requiredAction: z.string().optional(),
        lawyerId: z.number().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const { id, dueDate, status, ...rest } = input;
      const patch: Record<string, unknown> = { ...rest };
      if (status !== undefined) {
        patch.status = status;
        patch.completedAt = status === "منجزة" ? new Date() : null;
      }
      if (dueDate !== undefined) patch.dueDate = dueDate ? new Date(dueDate) : null;
      await getDb().update(lawyerTasks).set(patch).where(eq(lawyerTasks.id, id));
      return { ok: true };
    }),

  remove: publicQuery.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
    await getDb().delete(lawyerTasks).where(eq(lawyerTasks.id, input.id));
    return { ok: true };
  }),
});

export const sessionsRouter = createRouter({
  list: publicQuery
    .input(z.object({ lawyerId: z.number().optional() }))
    .query(async ({ input }) => {
      const db = getDb();
      let rows = await db.select().from(sessions).orderBy(asc(sessions.sessionDate));
      if (input.lawyerId) rows = rows.filter((s) => s.lawyerId === input.lawyerId);
      const [suits, execs, lwrs, custs] = await Promise.all([
        db.select().from(lawsuits),
        db.select().from(executionFiles),
        db.select().from(lawyers),
        db.select().from(customers),
      ]);
      return rows.map((s) => {
        const suit = suits.find((x) => x.id === s.lawsuitId);
        const exec = execs.find((x) => x.id === s.executionFileId);
        const custId = suit?.customerId ?? exec?.customerId ?? null;
        return {
          ...s,
          lawyerName: s.lawyerId ? lwrs.find((l) => l.id === s.lawyerId)?.fullName ?? null : null,
          fileNumber: suit
            ? formatFileNumber(suit.caseYear, suit.caseType, suit.caseSeq)
            : exec
              ? formatFileNumber(exec.execYear, exec.execType, exec.execSeq)
              : null,
          fileKind: suit ? "دعوى قضائية" : exec ? "إضبارة تنفيذية" : null,
          customerName: custId ? custs.find((c) => c.id === custId)?.fullName ?? null : null,
        };
      });
    }),

  create: publicQuery
    .input(
      z.object({
        lawsuitId: z.number().optional(),
        executionFileId: z.number().optional(),
        lawyerId: z.number().optional(),
        sessionDate: z.string(), // ISO datetime
        location: z.string().optional(),
        status: z.string().default("قادمة"),
        notes: z.string().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      await getDb().insert(sessions).values({ ...input, sessionDate: new Date(input.sessionDate) });
      return { ok: true };
    }),

  update: publicQuery
    .input(
      z.object({
        id: z.number(),
        sessionDate: z.string().optional(),
        location: z.string().optional(),
        status: z.string().optional(),
        outcome: z.string().optional(),
        notes: z.string().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const { id, sessionDate, ...rest } = input;
      await getDb()
        .update(sessions)
        .set({ ...rest, ...(sessionDate ? { sessionDate: new Date(sessionDate) } : {}) })
        .where(eq(sessions.id, id));
      return { ok: true };
    }),

  remove: publicQuery.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
    await getDb().delete(sessions).where(eq(sessions.id, input.id));
    return { ok: true };
  }),

  /** التقويم: جلسات قادمة وسابقة + مهام متأخرة وغير منجزة */
  calendar: publicQuery.query(async () => {
    const db = getDb();
    const [sess, tasks, suits, execs, lwrs, custs] = await Promise.all([
      db.select().from(sessions).orderBy(asc(sessions.sessionDate)),
      db.select().from(lawyerTasks),
      db.select().from(lawsuits),
      db.select().from(executionFiles),
      db.select().from(lawyers),
      db.select().from(customers),
    ]);
    const fileNo = (lawsuitId: number | null, executionFileId: number | null) => {
      const suit = suits.find((x) => x.id === lawsuitId);
      if (suit) return formatFileNumber(suit.caseYear, suit.caseType, suit.caseSeq);
      const exec = execs.find((x) => x.id === executionFileId);
      if (exec) return formatFileNumber(exec.execYear, exec.execType, exec.execSeq);
      return null;
    };
    const items = [
      ...sess.map((s) => ({
        kind: "session" as const,
        id: s.id,
        date: s.sessionDate,
        title: `جلسة ${s.location ?? ""}`.trim(),
        status: s.status,
        fileNumber: fileNo(s.lawsuitId, s.executionFileId),
        lawyerName: s.lawyerId ? lwrs.find((l) => l.id === s.lawyerId)?.fullName ?? null : null,
      })),
      ...tasks
        .filter((t) => t.status !== "منجزة" && t.dueDate)
        .map((t) => ({
          kind: "task" as const,
          id: t.id,
          date: t.dueDate as Date,
          title: t.title,
          status: isOverdue(t) ? "متأخرة" : t.status,
          fileNumber: fileNo(t.lawsuitId ?? null, t.executionFileId ?? null),
          lawyerName: lwrs.find((l) => l.id === t.lawyerId)?.fullName ?? null,
        })),
    ];
    void custs;
    return items;
  }),
});
