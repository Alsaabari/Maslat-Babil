import { useState } from "react";
import { useNavigate } from "react-router";
import { trpc } from "@/providers/trpc";
import { useAuth } from "@/lib/auth";
import { PageHeader, StatusBadge } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, AlertTriangle } from "lucide-react";
import { LawyerForm, TaskForm } from "@/components/forms/LawyerForms";
import WhatsAppButton from "@/components/WhatsAppButton";
import { fmtDate } from "@/lib/format";

/** مساحة عمل المحامين: المحامون + المهام */
export default function Lawyers() {
  const q = trpc.lawyers.list.useQuery();
  const tasksQ = trpc.tasks.list.useQuery({ filter: "all" });
  const { canEdit } = useAuth();
  const navigate = useNavigate();
  const [formOpen, setFormOpen] = useState(false);
  const [taskOpen, setTaskOpen] = useState(false);

  const overdueTasks = (tasksQ.data ?? []).filter((t) => t.overdue);

  return (
    <div>
      <PageHeader
        title="مساحة عمل المحامين"
        subtitle="المحامون المسجلون ومهامهم — اختر محامياً لفتح ملفه الكامل"
        actions={
          canEdit && (
            <>
              <Button variant="outline" onClick={() => setTaskOpen(true)} className="min-h-[44px] gap-2">
                <Plus className="h-4 w-4" /> مهمة جديدة
              </Button>
              <Button onClick={() => setFormOpen(true)} className="min-h-[44px] gap-2 bg-navy hover:bg-navy-light">
                <Plus className="h-4 w-4" /> تسجيل محامٍ
              </Button>
            </>
          )
        }
      />

      <Tabs defaultValue="lawyers">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="lawyers" className="min-h-[44px]">المحامون المسجلون ({q.data?.length ?? 0})</TabsTrigger>
          <TabsTrigger value="tasks" className="min-h-[44px]">المهام ({(tasksQ.data ?? []).filter((t) => t.status !== "منجزة").length})</TabsTrigger>
          <TabsTrigger value="overdue" className="min-h-[44px] text-[#d64545]">
            المتأخرة ({overdueTasks.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="lawyers" className="mt-4">
          {q.data?.length === 0 && <p className="py-10 text-center text-muted-foreground">لا يوجد محامون مسجلون</p>}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {(q.data ?? []).map((l) => (
              <div
                key={l.id}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    navigate(`/lawyers/${l.id}`);
                  }
                }}
                onClick={() => navigate(`/lawyers/${l.id}`)}
                className="group cursor-pointer rounded-lg border border-border bg-card p-4 text-start transition-all hover:border-[#af915f] hover:shadow-sm"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-bold text-primary group-hover:text-[#8a7040]">{l.fullName}</div>
                    <div className="mt-0.5 text-xs text-muted-foreground">{l.specialty ?? "محامٍ عام"}</div>
                    <div className="mt-1 num text-xs text-muted-foreground">{l.phone ?? "لا يوجد هاتف"}</div>
                  </div>
                  <div onClick={(e) => e.stopPropagation()}>
                    <WhatsAppButton
                      context={{ recipientType: "lawyer", recipientId: l.id, defaultTemplate: "task_assignment" }}
                      disabledReason={l.phone ? undefined : "لا يوجد رقم هاتف للمحامي"}
                    />
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  <span className="rounded bg-secondary px-2 py-1">دعاوى: <b className="num">{l.lawsuitsCount}</b></span>
                  <span className="rounded bg-secondary px-2 py-1">أضابير: <b className="num">{l.executionsCount}</b></span>
                  <span className="rounded bg-secondary px-2 py-1">مهام: <b className="num">{l.tasksActive}</b></span>
                  {l.tasksOverdue > 0 && (
                    <span className="flex items-center gap-1 rounded bg-[#d64545]/10 px-2 py-1 text-[#d64545]">
                      <AlertTriangle className="h-3 w-3" /> متأخرة: <b className="num">{l.tasksOverdue}</b>
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="tasks" className="mt-4">
          <TaskCards tasks={(tasksQ.data ?? []).filter((t) => t.status !== "منجزة")} />
        </TabsContent>
        <TabsContent value="overdue" className="mt-4">
          <TaskCards tasks={overdueTasks} />
        </TabsContent>
      </Tabs>

      <LawyerForm open={formOpen} onClose={(s) => { setFormOpen(false); if (s) q.refetch(); }} />
      <TaskForm open={taskOpen} onClose={(s) => { setTaskOpen(false); if (s) tasksQ.refetch(); }} />
    </div>
  );
}

export function TaskCards({ tasks }: { tasks: any[] }) {
  const utils = trpc.useUtils();
  const update = trpc.tasks.update.useMutation();
  const { canEdit } = useAuth();
  if (!tasks.length) return <p className="py-10 text-center text-muted-foreground">لا توجد مهام</p>;
  return (
    <div className="space-y-2">
      {tasks.map((t) => (
        <div key={t.id} className={`rounded-lg border bg-card p-4 ${t.overdue ? "border-[#d64545]/50" : "border-border"}`}>
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold">{t.title}</span>
                <StatusBadge value={t.overdue ? "متأخرة" : t.status} />
                <span className="rounded bg-secondary px-2 py-0.5 text-[11px]">{t.taskType}</span>
                <span className={`rounded px-2 py-0.5 text-[11px] ${t.priority === "عالية" ? "bg-[#d64545]/10 text-[#d64545]" : "bg-secondary"}`}>{t.priority}</span>
              </div>
              <div className="mt-1.5 text-sm text-muted-foreground">
                المحامي: <b className="text-foreground">{t.lawyerName}</b>
                {t.customerName && <> — الزبون: <b className="text-foreground">{t.customerName}</b></>}
                {t.lawsuitNumber && <> — دعوى <span className="num">{t.lawsuitNumber}</span></>}
                {t.executionNumber && <> — إضبارة <span className="num">{t.executionNumber}</span></>}
              </div>
              {t.description && <p className="mt-1 text-sm text-muted-foreground">{t.description}</p>}
              <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
                <span>الاستحقاق: <span className="num">{t.dueDate ? fmtDate(t.dueDate) : "غير محدد"}</span></span>
                {t.lastProcedure && <span>آخر إجراء: {t.lastProcedure.title} <span className="num">({fmtDate(t.lastProcedure.actionDate)})</span></span>}
                {t.requiredAction && <span className="text-[#c98a12]">المطلوب: {t.requiredAction}</span>}
              </div>
            </div>
            <div className="flex items-center gap-1">
              {canEdit && t.status !== "منجزة" && (
                <Button size="sm" variant="outline" className="min-h-[40px]" onClick={async () => {
                  await update.mutateAsync({ id: t.id, status: "منجزة" });
                  await utils.tasks.invalidate();
                  await utils.lawyers.invalidate();
                }}>
                  إنجاز
                </Button>
              )}
              <WhatsAppButton
                context={{ recipientType: "lawyer", recipientId: t.lawyerId, entityType: "task", entityId: t.id, defaultTemplate: "task_assignment" }}
                disabledReason={t.lawyerPhone ? undefined : "لا يوجد رقم هاتف للمحامي"}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
