import { useState } from "react";
import { trpc } from "@/providers/trpc";
import { PageHeader } from "@/components/common";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import DataTable from "@/components/DataTable";
import { fmtDate, fmtMoney } from "@/lib/format";
import { Printer } from "lucide-react";

type ReportKey = "financial" | "lawsuits" | "installments" | "workload";

const REPORTS: { key: ReportKey; title: string; desc: string }[] = [
  { key: "financial", title: "التقرير المالي الإجمالي", desc: "أصل الدين، الواصل، المتبقي، المنفذ، المستلم — لكل زبون مع الإجماليات" },
  { key: "lawsuits", title: "الدعاوى حسب الحالة", desc: "توزيع الدعاوى على الحالات مع قائمة تفصيلية" },
  { key: "installments", title: "الأقساط المتأخرة", desc: "الأقساط المستحقة غير المسددة حتى تاريخ اليوم" },
  { key: "workload", title: "عبء عمل المحامين", desc: "الدعاوى والأضابير والمهام والجلسات لكل محامٍ" },
];

export default function Reports() {
  const [active, setActive] = useState<ReportKey>("financial");
  const financial = trpc.reports.financial.useQuery(undefined, { enabled: active === "financial" });
  const lawsuits = trpc.reports.lawsuitsByStatus.useQuery(undefined, { enabled: active === "lawsuits" });
  const installments = trpc.reports.overdueInstallments.useQuery(undefined, { enabled: active === "installments" });
  const workload = trpc.reports.lawyerWorkload.useQuery(undefined, { enabled: active === "workload" });

  return (
    <div>
      <PageHeader
        title="التقارير والطباعة"
        subtitle="تقارير من البيانات الفعلية — قابلة للطباعة"
        actions={
          <Button variant="outline" onClick={() => window.print()} className="min-h-[44px] gap-2">
            <Printer className="h-4 w-4" /> طباعة التقرير
          </Button>
        }
      />

      {/* ترويسة الطباعة الرسمية مع الشعار */}
      <div className="hidden print:flex items-center justify-between border-b border-border pb-4 mb-6">
        <img src="/maslat-logo.png" alt="شعار مسلة بابل" className="h-14 object-contain" />
        <div className="text-center">
          <h1 className="text-xl font-bold">مسلة بابل — {REPORTS.find((r) => r.key === active)?.title}</h1>
          <p className="text-xs text-muted-foreground">MASLATT BABIL LEGAL &amp; FINANCIAL ERP 2026</p>
        </div>
        <div className="text-xs text-end">
          <div>تاريخ الطباعة: {fmtDate(new Date())}</div>
          <div className="font-semibold">{REPORTS.find((r) => r.key === active)?.title}</div>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4 no-print">
        {REPORTS.map((r) => (
          <button
            key={r.key}
            onClick={() => setActive(r.key)}
            className={`rounded-lg border p-3 text-start text-sm transition-all ${active === r.key ? "border-[#af915f] bg-[#af915f]/5" : "border-border bg-card hover:border-[#af915f]/50"}`}
          >
            <div className="font-semibold">{r.title}</div>
            <div className="mt-1 text-xs text-muted-foreground">{r.desc}</div>
          </button>
        ))}
      </div>

      {active === "financial" && financial.data && (
        <Card>
          <CardHeader><CardTitle className="text-base">التقرير المالي الإجمالي (دينار عراقي)</CardTitle></CardHeader>
          <CardContent>
            <DataTable
              tableId="report-financial"
              columns={[
                { key: "name", header: "الزبون", value: (r: any) => r.name },
                { key: "principal", header: "أصل الدين", value: (r: any) => r.principal, render: (r: any) => <span className="num">{fmtMoney(r.principal)}</span> },
                { key: "wasil", header: "الواصل", value: (r: any) => r.wasil, render: (r: any) => <span className="num text-[#1e9e6a]">{fmtMoney(r.wasil)}</span> },
                { key: "remainingPrincipal", header: "المتبقي الأصلي", value: (r: any) => r.remainingPrincipal, render: (r: any) => <span className="num text-[#c98a12]">{fmtMoney(r.remainingPrincipal)}</span> },
                { key: "executed", header: "المنفذ", value: (r: any) => r.executed, render: (r: any) => <span className="num">{fmtMoney(r.executed)}</span> },
                { key: "received", header: "المستلم", value: (r: any) => r.received, render: (r: any) => <span className="num text-[#1e9e6a]">{fmtMoney(r.received)}</span> },
                { key: "remainingExecution", header: "المتبقي التنفيذي", value: (r: any) => r.remainingExecution, render: (r: any) => <span className="num text-[#d64545]">{fmtMoney(r.remainingExecution)}</span> },
              ]}
              rows={financial.data.rows}
              rowKey={(r) => r.id}
              searchable={false}
              emptyText="لا توجد بيانات مالية"
            />
            <div className="mt-4 grid grid-cols-2 gap-2 rounded-lg bg-muted p-3 text-sm md:grid-cols-3">
              <div>أصل الدين: <b className="num">{fmtMoney(financial.data.totals.principal)}</b></div>
              <div>الواصل: <b className="num text-[#1e9e6a]">{fmtMoney(financial.data.totals.wasil)}</b></div>
              <div>المتبقي الأصلي: <b className="num text-[#c98a12]">{fmtMoney(financial.data.totals.remainingPrincipal)}</b></div>
              <div>المنفذ: <b className="num">{fmtMoney(financial.data.totals.executed)}</b></div>
              <div>المستلم: <b className="num text-[#1e9e6a]">{fmtMoney(financial.data.totals.received)}</b></div>
              <div>المتبقي التنفيذي: <b className="num text-[#d64545]">{fmtMoney(financial.data.totals.remainingExecution)}</b></div>
            </div>
          </CardContent>
        </Card>
      )}

      {active === "lawsuits" && lawsuits.data && (
        <Card>
          <CardHeader><CardTitle className="text-base">الدعاوى حسب الحالة</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {lawsuits.data.summary.map((s) => (
                <span key={s.status} className="rounded-full border border-border px-3 py-1.5 text-sm">
                  {s.status}: <b className="num">{s.count}</b>
                </span>
              ))}
              {lawsuits.data.summary.length === 0 && <p className="text-sm text-muted-foreground">لا توجد دعاوى</p>}
            </div>
            <DataTable
              tableId="report-lawsuits"
              columns={[
                { key: "fileNumber", header: "رقم الدعوى", value: (r: any) => r.fileNumber, render: (r: any) => <span className="num font-bold">{r.fileNumber}</span> },
                { key: "customer", header: "الزبون", value: (r: any) => r.customer },
                { key: "court", header: "المحكمة", value: (r: any) => r.court },
                { key: "status", header: "الحالة", value: (r: any) => r.status },
                { key: "filedAt", header: "تاريخ الإقامة", value: (r: any) => (r.filedAt ? fmtDate(r.filedAt) : ""), render: (r: any) => <span className="num">{r.filedAt ? fmtDate(r.filedAt) : "—"}</span> },
              ]}
              rows={lawsuits.data.rows}
              rowKey={(r) => r.fileNumber}
              emptyText="لا توجد دعاوى"
            />
          </CardContent>
        </Card>
      )}

      {active === "installments" && installments.data && (
        <Card>
          <CardHeader><CardTitle className="text-base">الأقساط المتأخرة ({installments.data.length})</CardTitle></CardHeader>
          <CardContent>
            <DataTable
              tableId="report-installments"
              columns={[
                { key: "customerName", header: "الزبون", value: (r: any) => r.customerName },
                { key: "periodLabel", header: "الفترة", value: (r: any) => r.periodLabel },
                { key: "amount", header: "المبلغ", value: (r: any) => r.amount, render: (r: any) => <span className="num text-[#d64545]">{fmtMoney(r.amount)}</span> },
                { key: "dueDate", header: "تاريخ الاستحقاق", value: (r: any) => fmtDate(r.dueDate), render: (r: any) => <span className="num">{fmtDate(r.dueDate)}</span> },
                { key: "status", header: "الحالة", value: (r: any) => r.status },
              ]}
              rows={installments.data}
              rowKey={(r) => r.id}
              emptyText="لا توجد أقساط متأخرة"
            />
          </CardContent>
        </Card>
      )}

      {active === "workload" && workload.data && (
        <Card>
          <CardHeader><CardTitle className="text-base">عبء عمل المحامين</CardTitle></CardHeader>
          <CardContent>
            <DataTable
              tableId="report-workload"
              columns={[
                { key: "name", header: "المحامي", value: (r: any) => r.name },
                { key: "lawsuits", header: "الدعاوى", value: (r: any) => r.lawsuits, render: (r: any) => <span className="num">{r.lawsuits}</span> },
                { key: "executions", header: "الأضابير", value: (r: any) => r.executions, render: (r: any) => <span className="num">{r.executions}</span> },
                { key: "tasksOpen", header: "مهام مفتوحة", value: (r: any) => r.tasksOpen, render: (r: any) => <span className="num">{r.tasksOpen}</span> },
                { key: "tasksOverdue", header: "مهام متأخرة", value: (r: any) => r.tasksOverdue, render: (r: any) => <span className="num text-[#d64545]">{r.tasksOverdue}</span> },
                { key: "sessions", header: "الجلسات", value: (r: any) => r.sessions, render: (r: any) => <span className="num">{r.sessions}</span> },
              ]}
              rows={workload.data}
              rowKey={(r) => r.id}
              emptyText="لا يوجد محامون"
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
