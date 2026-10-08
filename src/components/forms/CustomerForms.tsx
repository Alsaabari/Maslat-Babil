import { useEffect, useState } from "react";
import { trpc } from "@/providers/trpc";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { todayInputDate } from "@/lib/format";

/** نموذج إضافة/تعديل زبون */
export function CustomerForm({
  open,
  onClose,
  customer,
}: {
  open: boolean;
  onClose: (saved: boolean) => void;
  customer?: any | null;
}) {
  const [f, setF] = useState<any>({});
  const create = trpc.customers.create.useMutation();
  const update = trpc.customers.update.useMutation();
  const utils = trpc.useUtils();

  useEffect(() => {
    if (open) setF(customer ?? {});
  }, [open, customer]);

  const set = (k: string, v: string) => setF((p: any) => ({ ...p, [k]: v }));

  const save = async () => {
    if (!f.fullName?.trim()) {
      toast.error("الاسم الرباعي مطلوب");
      return;
    }
    try {
      const payload = {
        fullName: f.fullName,
        phone1: f.phone1 || undefined,
        phone2: f.phone2 || undefined,
        nationalId: f.nationalId || undefined,
        governorate: f.governorate || undefined,
        district: f.district || undefined,
        policeStation: f.policeStation || undefined,
        employer: f.employer || undefined,
        jobTitle: f.jobTitle || undefined,
        address: f.address || undefined,
        notes: f.notes || undefined,
      };
      if (customer?.id) await update.mutateAsync({ id: customer.id, ...payload });
      else await create.mutateAsync(payload);
      await utils.customers.invalidate();
      toast.success("تم الحفظ بنجاح");
      onClose(true);
    } catch (e: any) {
      toast.error(e.message ?? "فشل الحفظ");
    }
  };

  const field = (label: string, key: string, props: any = {}) => (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input value={f[key] ?? ""} onChange={(e) => set(key, e.target.value)} className="min-h-[44px]" {...props} />
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose(false)}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{customer ? "تعديل بيانات الزبون" : "إضافة زبون جديد"}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {field("الاسم الرباعي *", "fullName")}
          {field("الهاتف الرئيسي", "phone1", { dir: "ltr", className: "num text-start min-h-[44px]" })}
          {field("الهاتف الثانوي", "phone2", { dir: "ltr", className: "num text-start min-h-[44px]" })}
          {field("الرقم الوطني", "nationalId")}
          {field("المحافظة", "governorate")}
          {field("القضاء/الناحية", "district")}
          {field("مركز الشرطة", "policeStation")}
          {field("جهة العمل", "employer")}
          {field("الوظيفة", "jobTitle")}
        </div>
        <div className="space-y-1.5 mt-4">
          <Label>العنوان</Label>
          <Textarea value={f.address ?? ""} onChange={(e) => set("address", e.target.value)} rows={2} />
        </div>
        <div className="space-y-1.5 mt-2">
          <Label>ملاحظات</Label>
          <Textarea value={f.notes ?? ""} onChange={(e) => set("notes", e.target.value)} rows={2} />
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={() => onClose(false)} className="min-h-[44px]">إلغاء</Button>
          <Button onClick={save} disabled={create.isPending || update.isPending} className="min-h-[44px] bg-navy hover:bg-navy-light">
            حفظ
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/** نموذج تسجيل دين */
export function DebtForm({
  open,
  onClose,
  customerId,
}: {
  open: boolean;
  onClose: (saved: boolean) => void;
  customerId: number;
}) {
  const [f, setF] = useState<any>({ source: "فاتورة" });
  const create = trpc.finance.debts.create.useMutation();
  const utils = trpc.useUtils();

  useEffect(() => {
    if (open) setF({ source: "فاتورة", issuedAt: todayInputDate() });
  }, [open]);

  const save = async () => {
    if (!f.principal || Number(f.principal) <= 0) {
      toast.error("أدخل أصل الدين بشكل صحيح");
      return;
    }
    try {
      await create.mutateAsync({
        customerId,
        principal: Number(f.principal),
        source: f.source,
        reference: f.reference || undefined,
        issuedAt: f.issuedAt || undefined,
        notes: f.notes || undefined,
      });
      await utils.customers.invalidate();
      await utils.finance.invalidate();
      toast.success("تم تسجيل الدين");
      onClose(true);
    } catch (e: any) {
      toast.error(e.message ?? "فشل الحفظ");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose(false)}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>تسجيل دين جديد</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>أصل الدين (دينار عراقي) *</Label>
            <Input type="number" min="0" value={f.principal ?? ""} onChange={(e) => setF({ ...f, principal: e.target.value })} className="num text-start min-h-[44px]" dir="ltr" />
          </div>
          <div className="space-y-1.5">
            <Label>مصدر الدين</Label>
            <div className="flex gap-2">
              {["فاتورة", "سند", "أخرى"].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setF({ ...f, source: s })}
                  className={`min-h-[44px] flex-1 rounded-md border px-3 text-sm ${f.source === s ? "border-[#af915f] bg-[#af915f]/10 font-semibold" : "border-border"}`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>رقم الفاتورة/السند</Label>
            <Input value={f.reference ?? ""} onChange={(e) => setF({ ...f, reference: e.target.value })} className="min-h-[44px]" />
          </div>
          <div className="space-y-1.5">
            <Label>تاريخ الدين</Label>
            <Input type="date" value={f.issuedAt ?? ""} onChange={(e) => setF({ ...f, issuedAt: e.target.value })} className="min-h-[44px]" />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onClose(false)} className="min-h-[44px]">إلغاء</Button>
            <Button onClick={save} disabled={create.isPending} className="min-h-[44px] bg-navy hover:bg-navy-light">حفظ</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/** نموذج تسديد */
export function PaymentForm({
  open,
  onClose,
  customerId,
  executions,
}: {
  open: boolean;
  onClose: (saved: boolean) => void;
  customerId: number;
  executions: { id: number; fileNumber: string }[];
}) {
  const [f, setF] = useState<any>({ kind: "wasil" });
  const create = trpc.finance.payments.create.useMutation();
  const utils = trpc.useUtils();

  useEffect(() => {
    if (open) setF({ kind: "wasil", paidAt: todayInputDate() });
  }, [open]);

  const save = async () => {
    if (!f.amount || Number(f.amount) <= 0) {
      toast.error("أدخل مبلغ التسديد بشكل صحيح");
      return;
    }
    if (f.kind === "maslam" && !f.executionFileId) {
      toast.error("المبلغ المستلم يجب ربطه بإضبارة تنفيذية");
      return;
    }
    try {
      await create.mutateAsync({
        customerId,
        kind: f.kind,
        amount: Number(f.amount),
        paidAt: f.paidAt,
        executionFileId: f.executionFileId ? Number(f.executionFileId) : undefined,
        method: f.method || undefined,
        notes: f.notes || undefined,
      });
      await utils.customers.invalidate();
      await utils.finance.invalidate();
      toast.success("تم تسجيل التسديد");
      onClose(true);
    } catch (e: any) {
      toast.error(e.message ?? "فشل الحفظ");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose(false)}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>تسجيل تسديد</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>نوع التسديد *</Label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setF({ ...f, kind: "wasil", executionFileId: undefined })}
                className={`min-h-[44px] flex-1 rounded-md border px-3 text-sm ${f.kind === "wasil" ? "border-[#af915f] bg-[#af915f]/10 font-semibold" : "border-border"}`}
              >
                واصل (قبل الدعوى)
              </button>
              <button
                type="button"
                onClick={() => setF({ ...f, kind: "maslam" })}
                className={`min-h-[44px] flex-1 rounded-md border px-3 text-sm ${f.kind === "maslam" ? "border-[#af915f] bg-[#af915f]/10 font-semibold" : "border-border"}`}
              >
                مستلم (من التنفيذ)
              </button>
            </div>
          </div>
          {f.kind === "maslam" && (
            <div className="space-y-1.5">
              <Label>الإضبارة التنفيذية *</Label>
              <select
                value={f.executionFileId ?? ""}
                onChange={(e) => setF({ ...f, executionFileId: e.target.value })}
                className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">اختر الإضبارة...</option>
                {executions.map((x) => (
                  <option key={x.id} value={x.id}>{x.fileNumber}</option>
                ))}
              </select>
            </div>
          )}
          <div className="space-y-1.5">
            <Label>المبلغ (دينار عراقي) *</Label>
            <Input type="number" min="0" value={f.amount ?? ""} onChange={(e) => setF({ ...f, amount: e.target.value })} className="num text-start min-h-[44px]" dir="ltr" />
          </div>
          <div className="space-y-1.5">
            <Label>تاريخ التسديد *</Label>
            <Input type="date" value={f.paidAt ?? ""} onChange={(e) => setF({ ...f, paidAt: e.target.value })} className="min-h-[44px]" />
          </div>
          <div className="space-y-1.5">
            <Label>طريقة التسديد</Label>
            <Input value={f.method ?? ""} onChange={(e) => setF({ ...f, method: e.target.value })} placeholder="نقدي / تحويل / عبر التنفيذ" className="min-h-[44px]" />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onClose(false)} className="min-h-[44px]">إلغاء</Button>
            <Button onClick={save} disabled={create.isPending} className="min-h-[44px] bg-navy hover:bg-navy-light">حفظ</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
