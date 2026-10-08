import { useState } from "react";
import { useNavigate } from "react-router";
import { trpc } from "@/providers/trpc";
import { useAuth } from "@/lib/auth";
import DataTable, { type ColumnDef } from "@/components/DataTable";
import { PageHeader } from "@/components/common";
import { Button } from "@/components/ui/button";
import { fmtDate, fmtMoney } from "@/lib/format";
import { Plus } from "lucide-react";
import { CustomerForm } from "@/components/forms/CustomerForms";
import WhatsAppButton from "@/components/WhatsAppButton";

type Row = any;

const columns: ColumnDef<Row>[] = [
  { key: "fullName", header: "الاسم الرباعي", value: (r) => r.fullName },
  { key: "phone1", header: "الهاتف", value: (r) => r.phone1 ?? "غير متوفر", render: (r) => <span className="num">{r.phone1 ?? "غير متوفر"}</span> },
  { key: "district", header: "القضاء/الناحية", value: (r) => r.district ?? "غير متوفر" },
  { key: "principal", header: "أصل الدين", value: (r) => r.principal, render: (r) => <span className="num">{fmtMoney(r.principal)}</span> },
  { key: "wasil", header: "الواصل", value: (r) => r.wasil, render: (r) => <span className="num text-[#1e9e6a]">{fmtMoney(r.wasil)}</span> },
  { key: "remainingPrincipal", header: "المتبقي الأصلي", value: (r) => r.remainingPrincipal, render: (r) => <span className="num font-semibold text-[#c98a12]">{fmtMoney(r.remainingPrincipal)}</span> },
  { key: "lastPaymentDate", header: "آخر تسديد", value: (r) => (r.lastPaymentDate ? fmtDate(r.lastPaymentDate) : "لم يتم التسديد"), render: (r) => <span className="num">{r.lastPaymentDate ? fmtDate(r.lastPaymentDate) : "لم يتم التسديد"}</span> },
  {
    key: "wa",
    header: "",
    render: (r) => (
      <WhatsAppButton
        context={{ recipientType: "customer", recipientId: r.id, entityType: "installment", entityId: r.id, defaultTemplate: "installment_reminder" }}
        disabledReason={r.phone1 ? undefined : "لا يوجد رقم هاتف للزبون"}
      />
    ),
  },
];

/** سجل الديون والزبائن — لديهم ديون ولم يُتَّخذ بحقهم إجراء قانوني بعد */
export default function DebtorsRegistry() {
  const q = trpc.customers.list.useQuery({ view: "withoutLegal" });
  const { canEdit } = useAuth();
  const navigate = useNavigate();
  const [formOpen, setFormOpen] = useState(false);

  return (
    <div>
      <PageHeader
        title="سجل الديون والزبائن"
        subtitle="الزبائن الذين لديهم ديون أو التزامات ولم يُتَّخذ بحقهم إجراء قانوني بعد"
        actions={
          canEdit && (
            <Button onClick={() => setFormOpen(true)} className="min-h-[44px] gap-2 bg-navy hover:bg-navy-light">
              <Plus className="h-4 w-4" /> إضافة زبون
            </Button>
          )
        }
      />
      <DataTable
        tableId="debtors-registry"
        columns={columns}
        rows={q.data ?? []}
        rowKey={(r) => r.id}
        searchPlaceholder="بحث بالاسم، الهاتف، القضاء..."
        emptyText="لا يوجد زبائن بديون غير قانونية حالياً"
        onRowClick={(r) => navigate(`/customers/${r.id}`)}
      />
      <CustomerForm open={formOpen} onClose={() => setFormOpen(false)} />
    </div>
  );
}
