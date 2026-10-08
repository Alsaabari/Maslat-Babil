import { z } from "zod";
import { eq, desc } from "drizzle-orm";
import { createRouter, publicQuery } from "./middleware";
import { getDb } from "./queries/connection";
import {
  messages,
  lawyers,
  customers,
  lawsuits,
  executionFiles,
  lawyerTasks,
  sessions,
  courts,
  executionDirectorates,
  procedures,
} from "@db/schema";
import { MESSAGE_TEMPLATES, formatFileNumber } from "@contracts/types";

function fmtDate(d: Date | null | undefined): string {
  if (!d) return "غير محدد";
  const dd = new Date(d);
  return `${String(dd.getDate()).padStart(2, "0")}-${String(dd.getMonth() + 1).padStart(2, "0")}-${dd.getFullYear()}`;
}

function fill(template: string, vars: Record<string, string | number | null | undefined>): string {
  return template.replace(/\{(\w+)\}/g, (_, k) => {
    const v = vars[k];
    return v === null || v === undefined || v === "" ? "غير محدد" : String(v);
  });
}

async function lastProcedure(entityType: string, entityId: number) {
  const rows = (await getDb().select().from(procedures)).filter(
    (p) => p.entityType === entityType && p.entityId === entityId,
  );
  if (!rows.length) return null;
  return rows.sort((a, b) => b.actionDate.getTime() - a.actionDate.getTime() || b.id - a.id)[0];
}

export const messagingRouter = createRouter({
  templates: publicQuery.query(() => MESSAGE_TEMPLATES),

  /** بناء رسالة من بيانات السجل الفعلية حسب القالب */
  build: publicQuery
    .input(
      z.object({
        templateKey: z.string(),
        recipientType: z.enum(["lawyer", "customer"]),
        recipientId: z.number(),
        entityType: z.enum(["lawsuit", "execution", "task", "customer", "installment"]).optional(),
        entityId: z.number().optional(),
        date: z.string().optional(), // تاريخ الموعد إن وُجد
      }),
    )
    .query(async ({ input }) => {
      const db = getDb();
      const template = MESSAGE_TEMPLATES.find((t) => t.key === input.templateKey);
      if (!template) throw new Error("القالب غير موجود");

      const vars: Record<string, string | number | null> = {};
      let recipientName = "";
      let phone: string | null = null;
      let customerName: string | null = null;
      let fileNumber: string | null = null;
      let fileType: string | null = null;
      let location: string | null = null;

      if (input.recipientType === "lawyer") {
        const [l] = await db.select().from(lawyers).where(eq(lawyers.id, input.recipientId));
        if (!l) throw new Error("المحامي غير موجود");
        recipientName = l.fullName;
        phone = l.phone;
        vars.lawyer = l.fullName;
      } else {
        const [c] = await db.select().from(customers).where(eq(customers.id, input.recipientId));
        if (!c) throw new Error("الزبون غير موجود");
        recipientName = c.fullName;
        phone = c.phone1;
        customerName = c.fullName;
      }

      if (input.entityType === "lawsuit" && input.entityId) {
        const [s] = await db.select().from(lawsuits).where(eq(lawsuits.id, input.entityId));
        if (s) {
          const [cust] = await db.select().from(customers).where(eq(customers.id, s.customerId));
          const court = s.courtId
            ? (await db.select().from(courts).where(eq(courts.id, s.courtId)))[0]
            : null;
          fileNumber = formatFileNumber(s.caseYear, s.caseType, s.caseSeq);
          fileType = "دعوى قضائية";
          customerName = cust?.fullName ?? customerName;
          vars.court = court?.name ?? "المحكمة المختصة";
          location = court?.name ?? "المحكمة المختصة";
          const lp = await lastProcedure("lawsuit", s.id);
          vars.lastAction = lp?.title ?? "لا توجد إجراءات مسجلة";
          vars.lastActionDate = lp ? fmtDate(lp.actionDate) : "غير محدد";
          vars.requiredAction = lp?.nextAction ? lp.nextAction : "";
          // أقرب جلسة قادمة
          const upcoming = (await db.select().from(sessions))
            .filter((x) => x.lawsuitId === s.id && x.status === "قادمة" && x.sessionDate >= new Date())
            .sort((a, b) => a.sessionDate.getTime() - b.sessionDate.getTime())[0];
          vars.date = input.date ?? (upcoming ? fmtDate(upcoming.sessionDate) : "غير محدد");
        }
      }

      if (input.entityType === "execution" && input.entityId) {
        const [e] = await db.select().from(executionFiles).where(eq(executionFiles.id, input.entityId));
        if (e) {
          const [cust] = await db.select().from(customers).where(eq(customers.id, e.customerId));
          const dir = e.directorateId
            ? (await db.select().from(executionDirectorates).where(eq(executionDirectorates.id, e.directorateId)))[0]
            : null;
          fileNumber = formatFileNumber(e.execYear, e.execType, e.execSeq);
          fileType = "إضبارة تنفيذية";
          customerName = cust?.fullName ?? customerName;
          vars.directorate = dir?.name ?? "مديرية التنفيذ";
          location = `مديرية التنفيذ (${dir?.name ?? "غير محدد"})`;
          const lp = await lastProcedure("execution", e.id);
          vars.lastAction = lp?.title ?? "لا توجد إجراءات مسجلة";
          vars.lastActionDate = lp ? fmtDate(lp.actionDate) : "غير محدد";
          vars.requiredAction = lp?.nextAction ? lp.nextAction : "";
          const upcoming = (await db.select().from(sessions))
            .filter((x) => x.executionFileId === e.id && x.status === "قادمة" && x.sessionDate >= new Date())
            .sort((a, b) => a.sessionDate.getTime() - b.sessionDate.getTime())[0];
          vars.date = input.date ?? (upcoming ? fmtDate(upcoming.sessionDate) : "غير محدد");
        }
      }

      if (input.entityType === "task" && input.entityId) {
        const [t] = await db.select().from(lawyerTasks).where(eq(lawyerTasks.id, input.entityId));
        if (t) {
          vars.taskTitle = t.title;
          vars.requiredAction = t.requiredAction ? t.requiredAction : (vars.requiredAction ?? "");
          vars.dueDate = t.dueDate ? fmtDate(t.dueDate) : "غير محدد";
          vars.priority = t.priority;
          if (t.lawsuitId) {
            const [s] = await db.select().from(lawsuits).where(eq(lawsuits.id, t.lawsuitId));
            if (s) {
              fileNumber = formatFileNumber(s.caseYear, s.caseType, s.caseSeq);
              fileType = "دعوى قضائية";
            }
          }
          if (t.executionFileId) {
            const [e] = await db.select().from(executionFiles).where(eq(executionFiles.id, t.executionFileId));
            if (e) {
              fileNumber = formatFileNumber(e.execYear, e.execType, e.execSeq);
              fileType = "إضبارة تنفيذية";
            }
          }
          if (t.customerId) {
            const [c] = await db.select().from(customers).where(eq(customers.id, t.customerId));
            if (c) customerName = c.fullName;
          }
          const lp = await lastProcedure("task", t.id);
          vars.lastAction = lp?.title ?? vars.lastAction ?? "لا توجد إجراءات مسجلة";
          vars.lastActionDate = lp ? fmtDate(lp.actionDate) : (vars.lastActionDate ?? "غير محدد");
        }
      }

      if (input.entityType === "installment" && input.entityId) {
        // entityId = customerId — حساب الأقساط المتراكمة المستحقة فعلياً
        const { installments } = await import("@db/schema");
        const now = new Date();
        const due = (await db.select().from(installments))
          .filter(
            (i) =>
              i.customerId === input.entityId &&
              i.status !== "مسدد" &&
              new Date(i.dueDate) <= new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59),
          )
          .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
        vars.amount = due.reduce((s, i) => s + i.amount, 0).toLocaleString("en-US");
        vars.installmentsCount = due.length;
        vars.periods = due.map((i) => `• ${i.periodLabel}: ${i.amount.toLocaleString("en-US")} دينار`).join("\n");
        vars.date = fmtDate(now);
        vars.dueDate = due.length ? fmtDate(due[due.length - 1].dueDate) : "غير محدد";
      }

      vars.customer = customerName;
      vars.fileNo = fileNumber;
      vars.fileType = fileType;
      vars.location = location ?? vars.court ?? vars.directorate ?? "غير محدد";
      vars.date = vars.date ?? (input.date ?? fmtDate(new Date()));

      return {
        recipientName,
        phone,
        fileNumber,
        body: fill(template.body, vars),
        templateLabel: template.label,
      };
    }),

  log: publicQuery
    .input(
      z.object({
        recipientType: z.enum(["lawyer", "customer"]),
        recipientName: z.string(),
        phone: z.string().optional(),
        templateKey: z.string().optional(),
        entityType: z.string().optional(),
        entityId: z.number().optional(),
        fileNumber: z.string().optional(),
        body: z.string().min(1),
        status: z.string().default("مفتوحة"),
      }),
    )
    .mutation(async ({ input }) => {
      await getDb().insert(messages).values(input);
      return { ok: true };
    }),

  list: publicQuery.query(async () => {
    return getDb().select().from(messages).orderBy(desc(messages.id));
  }),
});
