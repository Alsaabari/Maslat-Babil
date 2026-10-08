import { useState } from "react";
import { useNavigate } from "react-router";
import { trpc } from "@/providers/trpc";
import { useAuth } from "@/lib/auth";
import DataTable, { type ColumnDef } from "@/components/DataTable";
import { PageHeader, StatusBadge } from "@/components/common";
import { Button } from "@/components/ui/button";
import { fmtDate, fmtMoney } from "@/lib/format";
import { Plus, FileText } from "lucide-react";
import { CustomerForm } from "@/components/forms/CustomerForms";

type Row = any;

const columns: ColumnDef<Row>[] = [
  { key: "fullName", header: "الاسم الرباعي", value: (r) => r.fullName },
  { key: "phone1", header: "الهاتف الرئيسي", value: (r) => r.phone1 ?? "غير متوفر", render: (r) => <span className="num">{r.phone1 ?? "غير متوفر"}</span> },
  { key: "phone2", header: "الهاتف الثانوي", value: (r) => r.phone2 ?? "", render: (r) => <span className="num">{r.phone2 ?? "غير متوفر"}</span>, defaultVisible: false },
  { key: "district", header: "القضاء/الناحية", value: (r) => r.district ?? "غير متوفر" },
  { key: "policeStation", header: "مركز الشرطة", value: (r) => r.policeStation ?? "غير متوفر", defaultVisible: false },
  { key: "employer", header: "جهة العمل", value: (r) => r.employer ?? "غير متوفر", defaultVisible: false },
  { key: "jobTitle", header: "الوظيفة", value: (r) => r.jobTitle ?? "غير متوفر", defaultVisible: false },
  { key: "principal", header: "أصل الدين", value: (r) => r.principal, render: (r) => <span className="num">{fmtMoney(r.principal)}</span> },
  { key: "wasil", header: "الواصل", value: (r) => r.wasil, render: (r) => <span className="num text-[#1e9e6a]">{fmtMoney(r.wasil)}</span> },
  { key: "remainingPrincipal", header: "المتبقي الأصلي", value: (r) => r.remainingPrincipal, render: (r) => <span className="num font-semibold text-[#c98a12]">{fmtMoney(r.remainingPrincipal)}</span> },
  { key: "executed", header: "المبلغ المنفذ", value: (r) => r.executed, render: (r) => <span className="num">{fmtMoney(r.executed)}</span>, defaultVisible: false },
  { key: "received", header: "المبلغ المستلم", value: (r) => r.received, render: (r) => <span className="num">{fmtMoney(r.received)}</span>, defaultVisible: false },
  { key: "remainingExecution", header: "المتبقي في الإضبارة", value: (r) => r.remainingExecution, render: (r) => <span className="num text-[#d64545]">{fmtMoney(r.remainingExecution)}</span> },
  { key: "lastPaymentDate", header: "تاريخ آخر تسديد", value: (r) => (r.lastPaymentDate ? fmtDate(r.lastPaymentDate) : "لم يتم التسديد"), render: (r) => <span className="num">{r.lastPaymentDate ? fmtDate(r.lastPaymentDate) : "لم يتم التسديد"}</span> },
  { key: "caseNumbers", header: "رقم الدعوى", value: (r) => r.caseNumbers.join(" "), render: (r) => r.caseNumbers.length ? <span className="num">{r.caseNumbers.join("، ")}</span> : <span className="text-muted-foreground">—</span> },
  { key: "execNumbers", header: "رقم الإضبارة", value: (r) => r.execNumbers.join(" "), render: (r) => r.execNumbers.length ? <span className="num">{r.execNumbers.join("، ")}</span> : <span className="text-muted-foreground">—</span> },
  { key: "legalStatus", header: "الحالة", value: (r) => r.legalStatus, render: (r) => <StatusBadge value={r.legalStatus} /> },
];

/** الزبائن (المدينون) — من اتُّخذت بحقهم إجراءات قانونية */
export default function Customers() {
  const q = trpc.customers.list.useQuery({ view: "withLegal" });
  const { canEdit } = useAuth();
  const navigate = useNavigate();
  const [formOpen, setFormOpen] = useState(false);

  return (
    <div>
      <PageHeader
        title="الزبائن (المدينون)"
        subtitle="الزبائن الذين اتُّخذت بحقهم إجراءات قانونية: دعوى، إضبارة تنفيذية، أو كلاهما"
        actions={
          canEdit && (
            <Button onClick={() => setFormOpen(true)} className="min-h-[44px] gap-2 bg-navy hover:bg-navy-light">
              <Plus className="h-4 w-4" /> إضافة زبون
            </Button>
          )
        }
      />
      {q.error && (
        <div className="mb-4 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          تعذر جلب البيانات — تحقق من اتصال قاعدة البيانات
        </div>
      )}
      <DataTable
        tableId="customers-legal"
        columns={columns}
        rows={q.data ?? []}
        rowKey={(r) => r.id}
        searchPlaceholder="بحث بالاسم، الهاتف، رقم الدعوى أو الإضبارة..."
        emptyText="لا يوجد زبائن عليهم إجراءات قانونية حالياً"
        onRowClick={(r) => navigate(`/customers/${r.id}`)}
        toolbar={
          <Button variant="outline" className="min-h-[44px] gap-2" onClick={() => navigate("/debtors")}>
            <FileText className="h-4 w-4" /> سجل الديون والزبائن
          </Button>
        }
      />
      <CustomerForm open={formOpen} onClose={() => setFormOpen(false)} />
    </div>
  );
}
