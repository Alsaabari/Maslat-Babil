import { useState } from "react";
import { useParams, useNavigate } from "react-router";
import { trpc } from "@/providers/trpc";
import { useAuth } from "@/lib/auth";
import { PageHeader, StatCard, StatusBadge } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fmtDateTime, fmtMoney } from "@/lib/format";
import { ArrowRight, Pencil, Plus } from "lucide-react";
import { LawyerForm, TaskForm } from "@/components/forms/LawyerForms";
import { TaskCards } from "@/pages/Lawyers";
import WhatsAppButton from "@/components/WhatsAppButton";

type Section = "lawsuits" | "executions" | "sessions" | "tasks" | null;

/** ملف المحامي — إحصائيات قابلة للنقر تفتح البيانات الفعلية */
export default function LawyerProfile() {
  const { id } = useParams();
  const lawyerId = Number(id);
  const navigate = useNavigate();
  const { canEdit } = useAuth();
  const q = trpc.lawyers.profile.useQuery({ id: lawyerId });
  const [editOpen, setEditOpen] = useState(false);
  const [taskOpen, setTaskOpen] = useState(false);
  const [section, setSection] = useState<Section>(null);

  if (q.isLoading) return <div className="py-20 text-center text-muted-foreground">جاري تحميل ملف المحامي...</div>;
  if (q.error || !q.data) return <div className="py-20 text-center text-destructive">المحامي غير موجود</div>;

  const p = q.data;
  const l = p.lawyer;

  const toggle = (s: Section) => setSection((cur) => (cur === s ? null : s));

  return (
    <div>
      <PageHeader
        title={`ملف المحامي — ${l.fullName}`}
        subtitle={l.specialty ?? "محامٍ"}
        actions={
          <>
            <Button variant="outline" onClick={() => navigate("/lawyers")} className="min-h-[44px] gap-2">
              <ArrowRight className="h-4 w-4" /> رجوع
            </Button>
            {canEdit && (
              <>
                <Button variant="outline" onClick={() => setEditOpen(true)} className="min-h-[44px] gap-2">
                  <Pencil className="h-4 w-4" /> تعديل
                </Button>
                <Button onClick={() => setTaskOpen(true)} className="min-h-[44px] gap-2 bg-navy hover:bg-navy-light">
                  <Plus className="h-4 w-4" /> مهمة جديدة
                </Button>
              </>
            )}
            <WhatsAppButton
              context={{ recipientType: "lawyer", recipientId: l.id, defaultTemplate: "task_assignment" }}
              disabledReason={l.phone ? undefined : "لا يوجد رقم هاتف للمحامي"}
            />
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <StatCard label="الدعاوى" value={p.stats.lawsuits} onClick={() => toggle("lawsuits")} />
        <StatCard label="الأضابير التنفيذية" value={p.stats.executions} onClick={() => toggle("executions")} />
        <StatCard label="الجلسات" value={p.stats.sessions} onClick={() => toggle("sessions")} />
        <StatCard label="المهام" value={p.stats.tasks} onClick={() => toggle("tasks")} />
        <StatCard label="قيد التنفيذ" value={p.stats.tasksActive} onClick={() => toggle("tasks")} tone="warning" />
        <StatCard label="المتأخرة" value={p.stats.tasksOverdue} onClick={() => toggle("tasks")} tone="danger" />
      </div>

      {/* البيانات الفعلية تظهر عند النقر على الإحصائية */}
      {section === "lawsuits" && (
        <Card className="mt-4">
          <CardHeader><CardTitle className="text-base">الدعاوى المكلف بها ({p.lawsuits.length})</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {p.lawsuits.length === 0 && <p className="text-sm text-muted-foreground">لا توجد دعاوى</p>}
            {p.lawsuits.map((s) => (
              <div key={s.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border p-3">
                <div>
                  <span className="font-bold num">{s.fileNumber}</span>
                  <span className="ms-3">{s.customerName}</span>
                  <span className="ms-3 text-sm text-muted-foreground">{s.courtName}</span>
                </div>
                <StatusBadge value={s.status} />
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {section === "executions" && (
        <Card className="mt-4">
          <CardHeader><CardTitle className="text-base">الأضابير التنفيذية المكلف بها ({p.executions.length})</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {p.executions.length === 0 && <p className="text-sm text-muted-foreground">لا توجد أضابير</p>}
            {p.executions.map((e) => (
              <div key={e.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border p-3">
                <div>
                  <span className="font-bold num">{e.fileNumber}</span>
                  <span className="ms-3">{e.customerName}</span>
                  <span className="ms-3 text-sm text-muted-foreground">{e.directorateName}</span>
                  <span className="ms-3 text-sm num">المتبقي: {fmtMoney(e.amountExecuted)}</span>
                </div>
                <StatusBadge value={e.status} />
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {section === "sessions" && (
        <Card className="mt-4">
          <CardHeader><CardTitle className="text-base">الجلسات ({p.sessions.length})</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {p.sessions.length === 0 && <p className="text-sm text-muted-foreground">لا توجد جلسات</p>}
            {p.sessions.map((s) => (
              <div key={s.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border p-3">
                <span className="num">{fmtDateTime(s.sessionDate)}</span>
                <span className="text-sm text-muted-foreground">{s.location ?? "غير محدد"}</span>
                <StatusBadge value={s.status} />
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {section === "tasks" && (
        <div className="mt-4">
          <h3 className="mb-2 text-sm font-semibold">مهام المحامي ({p.tasks.length})</h3>
          <TaskCards tasks={p.tasks} />
        </div>
      )}

      <Card className="mt-6">
        <CardHeader><CardTitle className="text-base">بيانات المحامي</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <div className="rounded-md border border-border/70 bg-muted/30 px-3 py-2">
            <div className="text-[11px] text-muted-foreground">الاسم</div>
            <div className="mt-0.5 text-sm font-medium">{l.fullName}</div>
          </div>
          <div className="rounded-md border border-border/70 bg-muted/30 px-3 py-2">
            <div className="text-[11px] text-muted-foreground">الهاتف</div>
            <div className="mt-0.5 text-sm font-medium num">{l.phone ?? "غير متوفر"}</div>
          </div>
          <div className="rounded-md border border-border/70 bg-muted/30 px-3 py-2">
            <div className="text-[11px] text-muted-foreground">التخصص</div>
            <div className="mt-0.5 text-sm font-medium">{l.specialty ?? "غير محدد"}</div>
          </div>
          <div className="rounded-md border border-border/70 bg-muted/30 px-3 py-2">
            <div className="text-[11px] text-muted-foreground">الحالة</div>
            <div className="mt-0.5 text-sm font-medium">{l.active ? "نشط" : "غير نشط"}</div>
          </div>
        </CardContent>
      </Card>

      <LawyerForm open={editOpen} onClose={(s) => { setEditOpen(false); if (s) q.refetch(); }} lawyer={l} />
      <TaskForm open={taskOpen} lawyerId={l.id} onClose={(s) => { setTaskOpen(false); if (s) q.refetch(); }} />
    </div>
  );
}
