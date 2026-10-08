import { useState } from "react";
import { trpc } from "@/providers/trpc";
import { useAuth } from "@/lib/auth";
import DataTable, { type ColumnDef } from "@/components/DataTable";
import { PageHeader, StatusBadge } from "@/components/common";
import { Button } from "@/components/ui/button";
import { fmtDate } from "@/lib/format";
import { Plus, FilePlus } from "lucide-react";
import { LawsuitForm, ProcedureForm } from "@/components/forms/LegalForms";
import WhatsAppButton from "@/components/WhatsAppButton";
import { toast } from "sonner";

type Row = any;

/** الدعاوى القضائية */
export default function Lawsuits() {
  const q = trpc.legal.lawsuits.list.useQuery({});
  const { canEdit } = useAuth();
  const [formOpen, setFormOpen] = useState(false);
  const [procFor, setProcFor] = useState<number | null>(null);
  const lawyersQ = trpc.lawyers.list.useQuery();

  const lawyerIdByName = (name: string) => lawyersQ.data?.find((l) => l.fullName === name)?.id;

  const columns: ColumnDef<Row>[] = [
    { key: "fileNumber", header: "رقم الدعوى", value: (r) => r.fileNumber, render: (r) => <span className="font-bold num">{r.fileNumber}</span> },
    { key: "customerName", header: "الزبون", value: (r) => r.customerName },
    { key: "courtName", header: "المحكمة المختصة", value: (r) => r.courtName },
    { key: "judgeName", header: "القاضي المختص", value: (r) => r.judgeName },
    { key: "lawyerName", header: "المحامي", value: (r) => r.lawyerName },
    { key: "status", header: "الحالة", value: (r) => r.status, render: (r) => <StatusBadge value={r.status} /> },
    {
      key: "lastProcedure",
      header: "آخر إجراء",
      value: (r) => (r.lastProcedure ? r.lastProcedure.title : "لا توجد إجراءات"),
      render: (r) =>
        r.lastProcedure ? (
          <span className="text-sm">{r.lastProcedure.title} <span className="num text-muted-foreground">({fmtDate(r.lastProcedure.actionDate)})</span></span>
        ) : (
          <span className="text-muted-foreground">لا توجد إجراءات</span>
        ),
    },
    { key: "filedAt", header: "تاريخ الإقامة", value: (r) => (r.filedAt ? fmtDate(r.filedAt) : ""), render: (r) => <span className="num">{r.filedAt ? fmtDate(r.filedAt) : "غير متوفر"}</span> },
    {
      key: "actions",
      header: "",
      render: (r) => (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          {canEdit && (
            <Button variant="ghost" size="icon" title="تسجيل إجراء" className="min-h-[36px] min-w-[36px]" onClick={() => setProcFor(r.id)}>
              <FilePlus className="h-4 w-4 text-[#af915f]" />
            </Button>
          )}
          {(() => {
            const lid = lawyerIdByName(r.lawyerName);
            return (
              <WhatsAppButton
                context={{ recipientType: "lawyer", recipientId: lid ?? 0, entityType: "lawsuit", entityId: r.id, defaultTemplate: "court_session_notice" }}
                disabledReason={!lid ? "لا يوجد محامٍ مسؤول" : undefined}
              />
            );
          })()}
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="الدعاوى القضائية"
        subtitle="التنسيق الرسمي للرقم: السنة/النوع/التسلسل — مثال: 2026/ب/00015"
        actions={
          canEdit && (
            <Button onClick={() => setFormOpen(true)} className="min-h-[44px] gap-2 bg-navy hover:bg-navy-light">
              <Plus className="h-4 w-4" /> تسجيل دعوى
            </Button>
          )
        }
      />
      <DataTable
        tableId="lawsuits"
        columns={columns}
        rows={q.data ?? []}
        rowKey={(r) => r.id}
        searchPlaceholder="بحث برقم الدعوى، الزبون، المحكمة، القاضي، المحامي، الحالة..."
        emptyText="لا توجد دعاوى مسجلة"
      />
      <LawsuitForm open={formOpen} onClose={(s) => { setFormOpen(false); if (s) q.refetch(); }} />
      {procFor && (
        <ProcedureForm open entityType="lawsuit" entityId={procFor} onClose={(s) => { setProcFor(null); if (s) { q.refetch(); toast.success("تم"); } }} />
      )}
    </div>
  );
}
