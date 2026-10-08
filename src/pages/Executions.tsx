import { useState } from "react";
import { trpc } from "@/providers/trpc";
import { useAuth } from "@/lib/auth";
import DataTable, { type ColumnDef } from "@/components/DataTable";
import { PageHeader, StatusBadge } from "@/components/common";
import { Button } from "@/components/ui/button";
import { fmtDate, fmtMoney } from "@/lib/format";
import { Plus, FilePlus } from "lucide-react";
import { ExecutionForm, ProcedureForm } from "@/components/forms/LegalForms";
import WhatsAppButton from "@/components/WhatsAppButton";

type Row = any;

/** الأضابير التنفيذية — أصلي/خارجي/إنابة/فرعية */
export default function Executions() {
  const q = trpc.legal.executions.list.useQuery({});
  const { canEdit } = useAuth();
  const [formOpen, setFormOpen] = useState(false);
  const [procFor, setProcFor] = useState<number | null>(null);
  const lawyersQ = trpc.lawyers.list.useQuery();

  const lawyerIdByName = (name: string) => lawyersQ.data?.find((l) => l.fullName === name)?.id;

  const columns: ColumnDef<Row>[] = [
    { key: "fileNumber", header: "رقم الإضبارة", value: (r) => r.fileNumber, render: (r) => <span className="font-bold num">{r.fileNumber}</span> },
    { key: "subType", header: "النوع", value: (r) => r.subType, render: (r) => <StatusBadge value={r.subType} /> },
    { key: "customerName", header: "الزبون", value: (r) => r.customerName },
    { key: "directorateName", header: "مديرية التنفيذ", value: (r) => r.directorateName },
    {
      key: "externalDirectorateName",
      header: "مديرية التنفيذ الخارجية",
      value: (r) => r.externalDirectorateName ?? "—",
      render: (r) => r.externalDirectorateName ?? <span className="text-muted-foreground">—</span>,
    },
    {
      key: "externalFileNo",
      header: "رقم الإضبارة الخارجية",
      value: (r) => r.externalFileNo ?? "—",
      render: (r) => r.externalFileNo ? <span className="num">{r.externalFileNo}</span> : <span className="text-muted-foreground">—</span>,
    },
    { key: "amountExecuted", header: "المبلغ المنفذ", value: (r) => r.amountExecuted, render: (r) => <span className="num">{fmtMoney(r.amountExecuted)}</span> },
    { key: "received", header: "المستلم", value: (r) => r.received, render: (r) => <span className="num text-[#1e9e6a]">{fmtMoney(r.received)}</span> },
    { key: "remaining", header: "المتبقي التنفيذي", value: (r) => r.remaining, render: (r) => <span className="num font-semibold text-[#d64545]">{fmtMoney(r.remaining)}</span> },
    { key: "lawyerName", header: "المحامي", value: (r) => r.lawyerName },
    { key: "status", header: "الحالة", value: (r) => r.status, render: (r) => <StatusBadge value={r.status} /> },
    {
      key: "lastProcedure",
      header: "آخر إجراء",
      value: (r) => (r.lastProcedure ? r.lastProcedure.title : ""),
      render: (r) =>
        r.lastProcedure ? (
          <span className="text-sm">{r.lastProcedure.title} <span className="num text-muted-foreground">({fmtDate(r.lastProcedure.actionDate)})</span></span>
        ) : (
          <span className="text-muted-foreground">لا توجد إجراءات</span>
        ),
    },
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
                context={{ recipientType: "lawyer", recipientId: lid ?? 0, entityType: "execution", entityId: r.id, defaultTemplate: "execution_review" }}
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
        title="الأضابير التنفيذية"
        subtitle="التنفيذ الأصلي (ت) والخارجي/الإنابة/الفرعية (خ) — مثال: 2026/ت/00025"
        actions={
          canEdit && (
            <Button onClick={() => setFormOpen(true)} className="min-h-[44px] gap-2 bg-navy hover:bg-navy-light">
              <Plus className="h-4 w-4" /> تسجيل إضبارة
            </Button>
          )
        }
      />
      <DataTable
        tableId="executions"
        columns={columns}
        rows={q.data ?? []}
        rowKey={(r) => r.id}
        searchPlaceholder="بحث برقم الإضبارة، الزبون، المديرية، المحامي..."
        emptyText="لا توجد أضابير تنفيذية مسجلة"
      />
      <ExecutionForm open={formOpen} onClose={(s) => { setFormOpen(false); if (s) q.refetch(); }} />
      {procFor && (
        <ProcedureForm open entityType="execution" entityId={procFor} onClose={(s) => { setProcFor(null); if (s) q.refetch(); }} />
      )}
    </div>
  );
}
