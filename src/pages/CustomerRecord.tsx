import { useState } from "react";
import { useParams, useNavigate } from "react-router";
import { trpc } from "@/providers/trpc";
import { useAuth } from "@/lib/auth";
import { PageHeader, StatusBadge } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { fmtDate, fmtMoney, todayInputDate } from "@/lib/format";
import { Printer, ArrowRight, Plus, Trash2 } from "lucide-react";
import WhatsAppButton from "@/components/WhatsAppButton";
import { CustomerForm, DebtForm, PaymentForm } from "@/components/forms/CustomerForms";
import { toast } from "sonner";

function Field({ label, value, ltr }: { label: string; value: React.ReactNode; ltr?: boolean }) {
  return (
    <div className="rounded-md border border-border/70 bg-muted/30 px-3 py-2">
      <div className="text-[11px] text-muted-foreground">{label}</div>
      <div className={`mt-0.5 text-sm font-medium ${ltr ? "num text-start" : ""}`}>{value ?? <span className="text-muted-foreground">غير متوفر</span>}</div>
    </div>
  );
}

export default function CustomerRecord() {
  const { id } = useParams();
  const customerId = Number(id);
  const navigate = useNavigate();
  const { canEdit, canDelete } = useAuth();
  const q = trpc.customers.unifiedRecord.useQuery({ id: customerId });
  const utils = trpc.useUtils();
  const removePayment = trpc.finance.payments.remove.useMutation();
  const markPaid = trpc.finance.installments.markPaid.useMutation();

  const [editOpen, setEditOpen] = useState(false);
  const [debtOpen, setDebtOpen] = useState(false);
  const [payOpen, setPayOpen] = useState(false);

  if (q.isLoading) return <div className="py-20 text-center text-muted-foreground">جاري تحميل السجل الموحد...</div>;
  if (q.error || !q.data)
    return (
      <div className="py-20 text-center">
        <p className="text-destructive">تعذر تحميل السجل — {q.error?.message ?? "الزبون غير موجود"}</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate(-1)}>رجوع</Button>
      </div>
    );

  const r = q.data;
  const c = r.customer;

  return (
    <div className="print-page">
      <div className="no-print">
        <PageHeader
          title={`ملف السجل الموحد — ${c.fullName}`}
          subtitle="صورة كاملة ومترابطة: بيانات الزبون، الدين، التسديدات، الدعاوى، التنفيذ"
          actions={
            <>
              <Button variant="outline" onClick={() => navigate(-1)} className="min-h-[44px] gap-2">
                <ArrowRight className="h-4 w-4" /> رجوع
              </Button>
              <Button variant="outline" onClick={() => window.print()} className="min-h-[44px] gap-2">
                <Printer className="h-4 w-4" /> طباعة السجل الموحد
              </Button>
              {canEdit && (
                <Button onClick={() => setEditOpen(true)} className="min-h-[44px] bg-navy hover:bg-navy-light">تعديل البيانات</Button>
              )}
              <WhatsAppButton
                context={{ recipientType: "customer", recipientId: c.id, entityType: "customer", entityId: c.id }}
                disabledReason={c.phone1 ? undefined : "لا يوجد رقم هاتف للزبون"}
              />
            </>
          }
        />
      </div>

      {/* ترويسة الطباعة */}
      <div className="hidden print:block text-center mb-6">
        <h1 className="text-xl font-bold">مسلة بابل — ملف السجل الموحد</h1>
        <p className="text-sm mt-1">{c.fullName} — تاريخ الطباعة: {fmtDate(new Date())}</p>
      </div>

      {/* الإجماليات المالية — بطاقات مستقلة */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {[
          { label: "إجمالي أصل الدين", value: r.totals.principal, cls: "text-primary" },
          { label: "إجمالي الواصل", value: r.totals.wasil, cls: "text-[#1e9e6a]" },
          { label: "إجمالي المتبقي الأصلي", value: r.totals.remainingPrincipal, cls: "text-[#c98a12]" },
          { label: "إجمالي المبلغ المنفذ", value: r.totals.executed, cls: "text-primary" },
          { label: "إجمالي المبلغ المستلم", value: r.totals.received, cls: "text-[#1e9e6a]" },
          { label: "المتبقي في الأضابير التنفيذية", value: r.totals.remainingExecution, cls: "text-[#d64545]" },
        ].map((t) => (
          <div key={t.label} className="rounded-lg border border-border bg-card p-3">
            <div className="text-[11px] text-muted-foreground">{t.label}</div>
            <div className={`mt-1 text-lg font-bold num ${t.cls}`}>{fmtMoney(t.value)}</div>
            <div className="text-[10px] text-muted-foreground">دينار عراقي</div>
          </div>
        ))}
      </div>

      <Tabs defaultValue="info" className="mt-6">
        <TabsList className="no-print flex-wrap h-auto">
          <TabsTrigger value="info" className="min-h-[44px]">بيانات الزبون</TabsTrigger>
          <TabsTrigger value="debts" className="min-h-[44px]">الدين والتسديدات ({r.payments.length})</TabsTrigger>
          <TabsTrigger value="installments" className="min-h-[44px]">الأقساط ({r.installments.length})</TabsTrigger>
          <TabsTrigger value="lawsuits" className="min-h-[44px]">الدعاوى ({r.lawsuits.length})</TabsTrigger>
          <TabsTrigger value="executions" className="min-h-[44px]">التنفيذ ({r.executions.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="info">
          <Card>
            <CardHeader className="flex-row items-center justify-between no-print">
              <CardTitle className="text-base">بيانات الزبون</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
                <Field label="الاسم الرباعي" value={c.fullName} />
                <Field label="الهاتف الرئيسي" value={c.phone1} ltr />
                <Field label="الهاتف الثانوي" value={c.phone2} ltr />
                <Field label="الرقم الوطني" value={c.nationalId} ltr />
                <Field label="المحافظة" value={c.governorate} />
                <Field label="القضاء/الناحية" value={c.district} />
                <Field label="مركز الشرطة" value={c.policeStation} />
                <Field label="جهة العمل" value={c.employer} />
                <Field label="الوظيفة" value={c.jobTitle} />
                <Field label="العنوان" value={c.address} />
                <Field label="تاريخ آخر تسديد" value={r.lastPaymentDate ? fmtDate(r.lastPaymentDate) : "لم يتم التسديد"} ltr />
                <Field label="ملاحظات" value={c.notes} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="debts">
          <Card>
            <CardHeader className="no-print flex flex-wrap flex-row items-center justify-between gap-2">
              <CardTitle className="text-base">الديون والتسديدات</CardTitle>
              {canEdit && (
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => setDebtOpen(true)} className="min-h-[40px] gap-1"><Plus className="h-3.5 w-3.5" /> دين جديد</Button>
                  <Button size="sm" variant="outline" onClick={() => setPayOpen(true)} className="min-h-[40px] gap-1"><Plus className="h-3.5 w-3.5" /> تسديد</Button>
                </div>
              )}
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="mb-2 text-sm font-semibold">الديون</h3>
                {r.debts.length === 0 ? <p className="text-sm text-muted-foreground">لا توجد ديون مسجلة</p> : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead><tr className="border-b text-start text-muted-foreground">
                        <th className="p-2 text-start">المصدر</th><th className="p-2 text-start">المرجع</th><th className="p-2 text-start">التاريخ</th>
                        <th className="p-2 text-start">أصل الدين</th><th className="p-2 text-start">الواصل</th><th className="p-2 text-start">المتبقي</th>
                      </tr></thead>
                      <tbody>
                        {r.debts.map((d) => (
                          <tr key={d.id} className="border-b last:border-0">
                            <td className="p-2">{d.source}</td>
                            <td className="p-2 num">{d.reference ?? "—"}</td>
                            <td className="p-2 num">{fmtDate(d.issuedAt)}</td>
                            <td className="p-2 num">{fmtMoney(d.principal)}</td>
                            <td className="p-2 num text-[#1e9e6a]">{fmtMoney((d as any).wasil ?? 0)}</td>
                            <td className="p-2 num font-semibold">{fmtMoney(d.principal - ((d as any).wasil ?? 0))}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
              <div>
                <h3 className="mb-2 text-sm font-semibold">التسديدات</h3>
                {r.payments.length === 0 ? <p className="text-sm text-muted-foreground">لم يتم التسديد</p> : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead><tr className="border-b text-muted-foreground">
                        <th className="p-2 text-start">التاريخ</th><th className="p-2 text-start">النوع</th><th className="p-2 text-start">المبلغ</th><th className="p-2 text-start">الطريقة</th><th className="p-2 text-start no-print"></th>
                      </tr></thead>
                      <tbody>
                        {r.payments.map((p) => (
                          <tr key={p.id} className="border-b last:border-0">
                            <td className="p-2 num">{fmtDate(p.paidAt)}</td>
                            <td className="p-2">{p.kind === "wasil" ? "واصل" : "مستلم من التنفيذ"}</td>
                            <td className="p-2 num font-semibold text-[#1e9e6a]">{fmtMoney(p.amount)}</td>
                            <td className="p-2">{p.method ?? "—"}</td>
                            <td className="p-2 no-print">
                              {canDelete && (
                                <button className="text-destructive p-2" onClick={async () => {
                                  if (!confirm("حذف هذا التسديد؟")) return;
                                  await removePayment.mutateAsync({ id: p.id });
                                  await utils.customers.invalidate();
                                  toast.success("تم الحذف");
                                }}><Trash2 className="h-4 w-4" /></button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="installments">
          <Card>
            <CardContent className="pt-6">
              {r.installments.length === 0 ? <p className="text-sm text-muted-foreground">لا توجد أقساط مسجلة</p> : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b text-muted-foreground">
                      <th className="p-2 text-start">الفترة</th><th className="p-2 text-start">المبلغ</th><th className="p-2 text-start">تاريخ الاستحقاق</th><th className="p-2 text-start">الحالة</th><th className="p-2 text-start no-print"></th>
                    </tr></thead>
                    <tbody>
                      {r.installments.map((i) => (
                        <tr key={i.id} className="border-b last:border-0">
                          <td className="p-2">{i.periodLabel}</td>
                          <td className="p-2 num">{fmtMoney(i.amount)}</td>
                          <td className="p-2 num">{fmtDate(i.dueDate)}</td>
                          <td className="p-2"><StatusBadge value={i.status} /></td>
                          <td className="p-2 no-print">
                            {canEdit && i.status !== "مسدد" && (
                              <Button size="sm" variant="outline" className="min-h-[36px]" onClick={async () => {
                                await markPaid.mutateAsync({ id: i.id, paidAt: todayInputDate() });
                                await utils.customers.invalidate();
                                toast.success("تم تعليم القسط كمسدد");
                              }}>تسديد</Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="lawsuits">
          <Card>
            <CardContent className="pt-6 space-y-4">
              {r.lawsuits.length === 0 ? <p className="text-sm text-muted-foreground">لا توجد دعاوى</p> :
                r.lawsuits.map((l) => (
                  <div key={l.id} className="rounded-lg border border-border p-4 break-inside-avoid">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-bold num">{l.fileNumber}</span>
                        <StatusBadge value={l.status} />
                      </div>
                      <span className="text-sm text-muted-foreground">{l.subject ?? ""}</span>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-4">
                      <Field label="المحكمة" value={l.courtName} />
                      <Field label="القاضي المختص" value={l.judgeName} />
                      <Field label="المحامي" value={l.lawyerName} />
                      <Field label="تاريخ الإقامة" value={l.filedAt ? fmtDate(l.filedAt) : null} ltr />
                    </div>
                    <div className="mt-3">
                      <div className="text-xs font-semibold text-muted-foreground mb-1">
                        آخر إجراء: <span className="text-foreground">{l.lastProcedure ? `${l.lastProcedure.title} (${fmtDate(l.lastProcedure.actionDate)})` : "لا توجد إجراءات"}</span>
                      </div>
                      {l.procedures.length > 0 && (
                        <ul className="mt-2 space-y-1 border-r-2 border-[#af915f]/40 pr-3">
                          {l.procedures.map((p) => (
                            <li key={p.id} className="text-sm">
                              <span className="num text-muted-foreground">{fmtDate(p.actionDate)}</span> — {p.title}
                              {p.nextAction && <span className="text-[#c98a12]"> → المطلوب: {p.nextAction}</span>}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="executions">
          <Card>
            <CardContent className="pt-6 space-y-4">
              {r.executions.length === 0 ? <p className="text-sm text-muted-foreground">لا توجد أضابير تنفيذية</p> :
                r.executions.map((e) => (
                  <div key={e.id} className="rounded-lg border border-border p-4 break-inside-avoid">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-bold num">{e.fileNumber}</span>
                        <StatusBadge value={e.status} />
                        <span className="rounded bg-secondary px-2 py-0.5 text-xs">{e.subType}</span>
                      </div>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-4">
                      <Field label="مديرية التنفيذ" value={e.directorateName} />
                      <Field label="مديرية التنفيذ الخارجية" value={e.externalDirectorateName} />
                      <Field label="رقم الإضبارة الخارجية" value={e.externalFileNo} ltr />
                      <Field label="المحامي" value={e.lawyerName} />
                      <Field label="المبلغ المنفذ" value={fmtMoney(e.amountExecuted)} ltr />
                      <Field label="المبلغ المستلم" value={<span className="text-[#1e9e6a]">{fmtMoney(e.received)}</span>} ltr />
                      <Field label="المتبقي التنفيذي" value={<span className="text-[#d64545] font-bold">{fmtMoney(e.remaining)}</span>} ltr />
                      <Field label="تاريخ الفتح" value={e.openedAt ? fmtDate(e.openedAt) : null} ltr />
                    </div>
                    {e.procedures.length > 0 && (
                      <ul className="mt-3 space-y-1 border-r-2 border-[#af915f]/40 pr-3">
                        {e.procedures.map((p) => (
                          <li key={p.id} className="text-sm">
                            <span className="num text-muted-foreground">{fmtDate(p.actionDate)}</span> — {p.title}
                            {p.nextAction && <span className="text-[#c98a12]"> → المطلوب: {p.nextAction}</span>}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* عند الطباعة: إظهار كل الأقسام */}
      <div className="hidden print:block space-y-6 mt-6">
        <h2 className="font-bold border-b pb-1">ملاحظة: النسخة المطبوعة تشمل الأقسام المعروضة أعلاه</h2>
      </div>

      <CustomerForm open={editOpen} onClose={async (saved) => { setEditOpen(false); if (saved) await utils.customers.invalidate(); }} customer={c} />
      <DebtForm open={debtOpen} onClose={() => setDebtOpen(false)} customerId={customerId} />
      <PaymentForm open={payOpen} onClose={() => setPayOpen(false)} customerId={customerId} executions={r.executions.map((e) => ({ id: e.id, fileNumber: e.fileNumber }))} />
    </div>
  );
}
