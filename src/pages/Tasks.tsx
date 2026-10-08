import { useState } from "react";
import { useSearchParams } from "react-router";
import { trpc } from "@/providers/trpc";
import { useAuth } from "@/lib/auth";
import DataTable, { type ColumnDef } from "@/components/DataTable";
import { PageHeader, StatusBadge } from "@/components/common";
import { Button } from "@/components/ui/button";
import { fmtDate } from "@/lib/format";
import { Plus, CheckCircle2 } from "lucide-react";
import { TaskForm } from "@/components/forms/LawyerForms";
import WhatsAppButton from "@/components/WhatsAppButton";
import { toast } from "sonner";

type Row = any;

/** مهام المحامين — كل مهمة بنوعها وأولويتها ومرتبطاتها وآخر إجراء */
export default function Tasks() {
  const [params] = useSearchParams();
  const initialFilter = params.get("filter") === "overdue" ? "overdue" : "all";
  const [filter, setFilter] = useState<"all" | "active" | "overdue" | "done">(initialFilter as any);
  const q = trpc.tasks.list.useQuery({ filter });
  const { canEdit } = useAuth();
  const [formOpen, setFormOpen] = useState(false);
  const update = trpc.tasks.update.useMutation();
  const utils = trpc.useUtils();

  const columns: ColumnDef<Row>[] = [
    { key: "title", header: "المهمة", value: (r) => r.title, render: (r) => <span className="font-semibold">{r.title}</span> },
    { key: "taskType", header: "النوع", value: (r) => r.taskType },
    { key: "lawyerName", header: "المحامي", value: (r) => r.lawyerName },
    { key: "customerName", header: "الزبون", value: (r) => r.customerName ?? "—", render: (r) => r.customerName ?? <span className="text-muted-foreground">—</span> },
    {
      key: "file", header: "الملف المرتبط",
      value: (r) => r.lawsuitNumber ?? r.executionNumber ?? "",
      render: (r) => r.lawsuitNumber ? <span className="num">دعوى {r.lawsuitNumber}</span> : r.executionNumber ? <span className="num">إضبارة {r.executionNumber}</span> : <span className="text-muted-foreground">—</span>,
    },
    { key: "priority", header: "الأولوية", value: (r) => r.priority, render: (r) => <span className={r.priority === "عالية" ? "text-[#d64545] font-semibold" : ""}>{r.priority}</span> },
    { key: "status", header: "الحالة", value: (r) => (r.overdue ? "متأخرة" : r.status), render: (r) => <StatusBadge value={r.overdue ? "متأخرة" : r.status} /> },
    { key: "dueDate", header: "تاريخ الاستحقاق", value: (r) => (r.dueDate ? fmtDate(r.dueDate) : ""), render: (r) => <span className="num">{r.dueDate ? fmtDate(r.dueDate) : "غير محدد"}</span> },
    {
      key: "lastProcedure", header: "آخر إجراء",
      value: (r) => r.lastProcedure?.title ?? "",
      render: (r) => r.lastProcedure ? <span className="text-sm">{r.lastProcedure.title} <span className="num text-muted-foreground">({fmtDate(r.lastProcedure.actionDate)})</span></span> : <span className="text-muted-foreground">—</span>,
    },
    { key: "requiredAction", header: "الإجراء المطلوب", value: (r) => r.requiredAction ?? "", render: (r) => r.requiredAction ?? <span className="text-muted-foreground">—</span> },
    {
      key: "actions",
      header: "",
      render: (r) => (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          {canEdit && r.status !== "منجزة" && (
            <Button variant="ghost" size="icon" title="إنجاز المهمة" className="min-h-[36px] min-w-[36px]" onClick={async () => {
              await update.mutateAsync({ id: r.id, status: "منجزة" });
              await utils.tasks.invalidate();
              toast.success("تم إنجاز المهمة");
            }}>
              <CheckCircle2 className="h-4 w-4 text-[#1e9e6a]" />
            </Button>
          )}
          <WhatsAppButton
            context={{ recipientType: "lawyer", recipientId: r.lawyerId, entityType: "task", entityId: r.id, defaultTemplate: "task_assignment" }}
            disabledReason={r.lawyerPhone ? undefined : "لا يوجد رقم هاتف للمحامي"}
          />
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="مهام المحامين"
        subtitle="المهمة المتأخرة لا تختفي بانتهاء تاريخها — تظهر كـ«متأخرة» حتى تُنجَز"
        actions={
          canEdit && (
            <Button onClick={() => setFormOpen(true)} className="min-h-[44px] gap-2 bg-navy hover:bg-navy-light">
              <Plus className="h-4 w-4" /> مهمة جديدة
            </Button>
          )
        }
      />
      <div className="mb-3 flex flex-wrap gap-2">
        {[
          { k: "all", label: "الكل" },
          { k: "active", label: "قيد التنفيذ" },
          { k: "overdue", label: "المتأخرة" },
          { k: "done", label: "المنجزة" },
        ].map((f) => (
          <Button
            key={f.k}
            variant={filter === f.k ? "default" : "outline"}
            size="sm"
            className={`min-h-[40px] ${filter === f.k ? "bg-navy hover:bg-navy-light" : ""}`}
            onClick={() => setFilter(f.k as any)}
          >
            {f.label}
          </Button>
        ))}
      </div>
      <DataTable
        tableId="lawyer-tasks"
        columns={columns}
        rows={q.data ?? []}
        rowKey={(r) => r.id}
        searchPlaceholder="بحث بالمهمة، المحامي، الزبون، رقم الملف..."
        emptyText="لا توجد مهام"
      />
      <TaskForm open={formOpen} onClose={(s) => { setFormOpen(false); if (s) q.refetch(); }} />
    </div>
  );
}
