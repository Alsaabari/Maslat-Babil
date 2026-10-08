import { useState } from "react";
import { trpc } from "@/providers/trpc";
import { useAuth } from "@/lib/auth";
import DataTable, { type ColumnDef } from "@/components/DataTable";
import { PageHeader, StatusBadge } from "@/components/common";
import { Button } from "@/components/ui/button";
import { fmtDateTime } from "@/lib/format";
import { Plus } from "lucide-react";
import { SessionForm } from "@/components/forms/LawyerForms";

type Row = any;

const columns: ColumnDef<Row>[] = [
  { key: "sessionDate", header: "الموعد", value: (r) => fmtDateTime(r.sessionDate), render: (r) => <span className="num font-semibold">{fmtDateTime(r.sessionDate)}</span> },
  { key: "fileKind", header: "نوع الملف", value: (r) => r.fileKind ?? "", render: (r) => r.fileKind ?? <span className="text-muted-foreground">—</span> },
  { key: "fileNumber", header: "رقم الملف", value: (r) => r.fileNumber ?? "", render: (r) => r.fileNumber ? <span className="num font-bold">{r.fileNumber}</span> : <span className="text-muted-foreground">—</span> },
  { key: "customerName", header: "الزبون", value: (r) => r.customerName ?? "", render: (r) => r.customerName ?? <span className="text-muted-foreground">—</span> },
  { key: "location", header: "الجهة / مكان المراجعة", value: (r) => r.location ?? "", render: (r) => r.location ?? <span className="text-muted-foreground">غير محدد</span> },
  { key: "lawyerName", header: "المحامي", value: (r) => r.lawyerName ?? "", render: (r) => r.lawyerName ?? <span className="text-muted-foreground">—</span> },
  { key: "status", header: "الحالة", value: (r) => r.status, render: (r) => <StatusBadge value={r.status} /> },
  { key: "outcome", header: "النتيجة", value: (r) => r.outcome ?? "", render: (r) => r.outcome ?? <span className="text-muted-foreground">—</span> },
];

export default function SessionsPage() {
  const q = trpc.sessions.list.useQuery({});
  const { canEdit } = useAuth();
  const [formOpen, setFormOpen] = useState(false);
  const update = trpc.sessions.update.useMutation();
  const utils = trpc.useUtils();

  return (
    <div>
      <PageHeader
        title="الجلسات القضائية"
        subtitle="الدعاوى: المحكمة المختصة — الأضابير: مديرية التنفيذ"
        actions={
          canEdit && (
            <Button onClick={() => setFormOpen(true)} className="min-h-[44px] gap-2 bg-navy hover:bg-navy-light">
              <Plus className="h-4 w-4" /> تسجيل جلسة
            </Button>
          )
        }
      />
      <DataTable
        tableId="sessions"
        columns={[
          ...columns,
          ...(canEdit
            ? [{
                key: "actions",
                header: "",
                render: (r: Row) =>
                  r.status === "قادمة" ? (
                    <Button variant="outline" size="sm" className="min-h-[36px]" onClick={async () => {
                      await update.mutateAsync({ id: r.id, status: "انعقدت" });
                      await utils.sessions.invalidate();
                    }}>
                      انعقدت
                    </Button>
                  ) : null,
              } as ColumnDef<Row>]
            : []),
        ]}
        rows={q.data ?? []}
        rowKey={(r) => r.id}
        searchPlaceholder="بحث برقم الملف، الزبون، المحكمة، المحامي..."
        emptyText="لا توجد جلسات مسجلة"
      />
      <SessionForm open={formOpen} onClose={(s) => { setFormOpen(false); if (s) q.refetch(); }} />
    </div>
  );
}
