import { useEffect, useState } from "react";
import { trpc } from "@/providers/trpc";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { CASE_TYPES, EXEC_SUBTYPES } from "@contracts/types";
import { todayInputDate } from "@/lib/format";

function SelectNative({ label, value, onChange, options, placeholder }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm"
      >
        <option value="">{placeholder ?? "اختر..."}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}

/** نموذج دعوى قضائية */
export function LawsuitForm({ open, onClose, customerId }: {
  open: boolean;
  onClose: (saved: boolean) => void;
  customerId?: number;
}) {
  const [f, setF] = useState<any>({ caseType: "ب", status: "منظورة" });
  const customers = trpc.customers.list.useQuery({ view: "all" });
  const lawyers = trpc.lawyers.list.useQuery();
  const courts = trpc.lookups.courts.list.useQuery();
  const judges = trpc.lookups.judges.list.useQuery();
  const create = trpc.legal.lawsuits.create.useMutation();
  const utils = trpc.useUtils();

  useEffect(() => {
    if (open)
      setF({
        caseType: "ب",
        status: "منظورة",
        customerId: customerId ?? "",
        caseYear: new Date().getFullYear(),
        filedAt: todayInputDate(),
      });
  }, [open, customerId]);

  const save = async () => {
    if (!f.customerId) return toast.error("اختر الزبون");
    if (!f.caseSeq || Number(f.caseSeq) <= 0) return toast.error("أدخل تسلسل الدعوى");
    try {
      await create.mutateAsync({
        customerId: Number(f.customerId),
        lawyerId: f.lawyerId ? Number(f.lawyerId) : undefined,
        courtId: f.courtId ? Number(f.courtId) : undefined,
        judgeId: f.judgeId ? Number(f.judgeId) : undefined,
        caseYear: Number(f.caseYear),
        caseType: f.caseType,
        caseSeq: Number(f.caseSeq),
        status: f.status,
        subject: f.subject || undefined,
        filedAt: f.filedAt || undefined,
        notes: f.notes || undefined,
      });
      await utils.legal.invalidate();
      await utils.customers.invalidate();
      toast.success("تم تسجيل الدعوى");
      onClose(true);
    } catch (e: any) {
      toast.error(e.message ?? "فشل الحفظ");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose(false)}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>تسجيل دعوى قضائية</DialogTitle></DialogHeader>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <SelectNative
            label="الزبون *"
            value={String(f.customerId ?? "")}
            onChange={(v) => setF({ ...f, customerId: v })}
            options={(customers.data ?? []).map((c) => ({ value: String(c.id), label: c.fullName }))}
          />
          <SelectNative
            label="المحامي المسؤول"
            value={String(f.lawyerId ?? "")}
            onChange={(v) => setF({ ...f, lawyerId: v })}
            options={(lawyers.data ?? []).map((l) => ({ value: String(l.id), label: l.fullName }))}
          />
          <SelectNative
            label="المحكمة المختصة"
            value={String(f.courtId ?? "")}
            onChange={(v) => setF({ ...f, courtId: v })}
            options={(courts.data ?? []).map((c) => ({ value: String(c.id), label: c.name }))}
          />
          <SelectNative
            label="القاضي المختص"
            value={String(f.judgeId ?? "")}
            onChange={(v) => setF({ ...f, judgeId: v })}
            options={(judges.data ?? []).map((j) => ({ value: String(j.id), label: j.name }))}
          />
          <div className="space-y-1.5">
            <Label>السنة *</Label>
            <Input type="number" value={f.caseYear ?? ""} onChange={(e) => setF({ ...f, caseYear: e.target.value })} className="num text-start min-h-[44px]" dir="ltr" />
          </div>
          <SelectNative
            label="نوع الدعوى *"
            value={f.caseType}
            onChange={(v) => setF({ ...f, caseType: v })}
            options={CASE_TYPES.map((t) => ({ value: t.code, label: `${t.code} — ${t.label}` }))}
          />
          <div className="space-y-1.5">
            <Label>التسلسل *</Label>
            <Input type="number" min="1" value={f.caseSeq ?? ""} onChange={(e) => setF({ ...f, caseSeq: e.target.value })} className="num text-start min-h-[44px]" dir="ltr" />
          </div>
          <div className="space-y-1.5">
            <Label>تاريخ الإقامة</Label>
            <Input type="date" value={f.filedAt ?? ""} onChange={(e) => setF({ ...f, filedAt: e.target.value })} className="min-h-[44px]" />
          </div>
        </div>
        {f.caseSeq && (
          <div className="mt-3 rounded-md bg-muted px-3 py-2 text-sm">
            رقم الدعوى: <span className="font-bold num">{f.caseYear}/{f.caseType}/{String(f.caseSeq).padStart(5, "0")}</span>
          </div>
        )}
        <div className="mt-4 space-y-1.5">
          <Label>موضوع الدعوى</Label>
          <Input value={f.subject ?? ""} onChange={(e) => setF({ ...f, subject: e.target.value })} className="min-h-[44px]" />
        </div>
        <div className="mt-2 space-y-1.5">
          <Label>ملاحظات</Label>
          <Textarea value={f.notes ?? ""} onChange={(e) => setF({ ...f, notes: e.target.value })} rows={2} />
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={() => onClose(false)} className="min-h-[44px]">إلغاء</Button>
          <Button onClick={save} disabled={create.isPending} className="min-h-[44px] bg-navy hover:bg-navy-light">حفظ الدعوى</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/** نموذج إضبارة تنفيذية */
export function ExecutionForm({ open, onClose, customerId }: {
  open: boolean;
  onClose: (saved: boolean) => void;
  customerId?: number;
}) {
  const [f, setF] = useState<any>({ execType: "ت", subType: "أصلي", status: "قيد التنفيذ" });
  const customers = trpc.customers.list.useQuery({ view: "all" });
  const lawyers = trpc.lawyers.list.useQuery();
  const dirs = trpc.lookups.directorates.list.useQuery();
  const create = trpc.legal.executions.create.useMutation();
  const utils = trpc.useUtils();

  useEffect(() => {
    if (open)
      setF({
        execType: "ت",
        subType: "أصلي",
        status: "قيد التنفيذ",
        customerId: customerId ?? "",
        execYear: new Date().getFullYear(),
        openedAt: todayInputDate(),
      });
  }, [open, customerId]);

  const isExternal = f.subType !== "أصلي";

  const save = async () => {
    if (!f.customerId) return toast.error("اختر الزبون");
    if (!f.execSeq || Number(f.execSeq) <= 0) return toast.error("أدخل تسلسل الإضبارة");
    if (!f.amountExecuted || Number(f.amountExecuted) < 0) return toast.error("أدخل المبلغ المنفذ");
    if (isExternal && !f.externalDirectorateId) return toast.error("اختر مديرية التنفيذ الخارجية");
    try {
      await create.mutateAsync({
        customerId: Number(f.customerId),
        lawyerId: f.lawyerId ? Number(f.lawyerId) : undefined,
        directorateId: f.directorateId ? Number(f.directorateId) : undefined,
        externalDirectorateId: f.externalDirectorateId ? Number(f.externalDirectorateId) : undefined,
        externalFileNo: f.externalFileNo || undefined,
        execYear: Number(f.execYear),
        execType: isExternal ? "خ" : f.execType,
        execSeq: Number(f.execSeq),
        subType: f.subType,
        amountExecuted: Number(f.amountExecuted),
        status: f.status,
        openedAt: f.openedAt || undefined,
        notes: f.notes || undefined,
      });
      await utils.legal.invalidate();
      await utils.customers.invalidate();
      toast.success("تم تسجيل الإضبارة التنفيذية");
      onClose(true);
    } catch (e: any) {
      toast.error(e.message ?? "فشل الحفظ");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose(false)}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>تسجيل إضبارة تنفيذية</DialogTitle></DialogHeader>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <SelectNative
            label="الزبون *"
            value={String(f.customerId ?? "")}
            onChange={(v) => setF({ ...f, customerId: v })}
            options={(customers.data ?? []).map((c) => ({ value: String(c.id), label: c.fullName }))}
          />
          <SelectNative
            label="المحامي المسؤول"
            value={String(f.lawyerId ?? "")}
            onChange={(v) => setF({ ...f, lawyerId: v })}
            options={(lawyers.data ?? []).map((l) => ({ value: String(l.id), label: l.fullName }))}
          />
          <SelectNative
            label="نوع الإضبارة *"
            value={f.subType}
            onChange={(v) => setF({ ...f, subType: v })}
            options={EXEC_SUBTYPES.map((s) => ({ value: s, label: s }))}
          />
          <SelectNative
            label="مديرية التنفيذ"
            value={String(f.directorateId ?? "")}
            onChange={(v) => setF({ ...f, directorateId: v })}
            options={(dirs.data ?? []).map((d) => ({ value: String(d.id), label: d.name }))}
          />
          {isExternal && (
            <>
              <SelectNative
                label="مديرية التنفيذ الخارجية *"
                value={String(f.externalDirectorateId ?? "")}
                onChange={(v) => setF({ ...f, externalDirectorateId: v })}
                options={(dirs.data ?? []).map((d) => ({ value: String(d.id), label: d.name }))}
              />
              <div className="space-y-1.5">
                <Label>رقم الإضبارة الخارجية</Label>
                <Input value={f.externalFileNo ?? ""} onChange={(e) => setF({ ...f, externalFileNo: e.target.value })} className="num text-start min-h-[44px]" dir="ltr" />
              </div>
            </>
          )}
          <div className="space-y-1.5">
            <Label>السنة *</Label>
            <Input type="number" value={f.execYear ?? ""} onChange={(e) => setF({ ...f, execYear: e.target.value })} className="num text-start min-h-[44px]" dir="ltr" />
          </div>
          <div className="space-y-1.5">
            <Label>التسلسل *</Label>
            <Input type="number" min="1" value={f.execSeq ?? ""} onChange={(e) => setF({ ...f, execSeq: e.target.value })} className="num text-start min-h-[44px]" dir="ltr" />
          </div>
          <div className="space-y-1.5">
            <Label>المبلغ المنفذ (دينار عراقي) *</Label>
            <Input type="number" min="0" value={f.amountExecuted ?? ""} onChange={(e) => setF({ ...f, amountExecuted: e.target.value })} className="num text-start min-h-[44px]" dir="ltr" />
          </div>
          <div className="space-y-1.5">
            <Label>تاريخ الفتح</Label>
            <Input type="date" value={f.openedAt ?? ""} onChange={(e) => setF({ ...f, openedAt: e.target.value })} className="min-h-[44px]" />
          </div>
        </div>
        {f.execSeq && (
          <div className="mt-3 rounded-md bg-muted px-3 py-2 text-sm">
            رقم الإضبارة: <span className="font-bold num">{f.execYear}/{isExternal ? "خ" : f.execType}/{String(f.execSeq).padStart(5, "0")}</span>
            <span className="ms-3 text-muted-foreground">({f.subType})</span>
          </div>
        )}
        <div className="mt-2 space-y-1.5">
          <Label>ملاحظات</Label>
          <Textarea value={f.notes ?? ""} onChange={(e) => setF({ ...f, notes: e.target.value })} rows={2} />
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={() => onClose(false)} className="min-h-[44px]">إلغاء</Button>
          <Button onClick={save} disabled={create.isPending} className="min-h-[44px] bg-navy hover:bg-navy-light">حفظ الإضبارة</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/** نموذج إجراء قانوني */
export function ProcedureForm({ open, onClose, entityType, entityId }: {
  open: boolean;
  onClose: (saved: boolean) => void;
  entityType: "lawsuit" | "execution" | "task";
  entityId: number;
}) {
  const [f, setF] = useState<any>({});
  const create = trpc.procedures.create.useMutation();
  const utils = trpc.useUtils();

  useEffect(() => {
    if (open) setF({ actionDate: todayInputDate() });
  }, [open]);

  const save = async () => {
    if (!f.title?.trim()) return toast.error("أدخل عنوان الإجراء");
    try {
      await create.mutateAsync({
        entityType,
        entityId,
        title: f.title,
        procedureNo: f.procedureNo || undefined,
        actionDate: f.actionDate,
        nextAction: f.nextAction || undefined,
        notes: f.notes || undefined,
      });
      await utils.invalidate();
      toast.success("تم تسجيل الإجراء");
      onClose(true);
    } catch (e: any) {
      toast.error(e.message ?? "فشل الحفظ");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose(false)}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>تسجيل إجراء</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>عنوان الإجراء *</Label>
            <Input value={f.title ?? ""} onChange={(e) => setF({ ...f, title: e.target.value })} className="min-h-[44px]" />
          </div>
          <div className="space-y-1.5">
            <Label>رقم الإجراء</Label>
            <Input value={f.procedureNo ?? ""} onChange={(e) => setF({ ...f, procedureNo: e.target.value })} className="num text-start min-h-[44px]" dir="ltr" />
          </div>
          <div className="space-y-1.5">
            <Label>تاريخ الإجراء *</Label>
            <Input type="date" value={f.actionDate ?? ""} onChange={(e) => setF({ ...f, actionDate: e.target.value })} className="min-h-[44px]" />
          </div>
          <div className="space-y-1.5">
            <Label>الإجراء المطلوب التالي</Label>
            <Input value={f.nextAction ?? ""} onChange={(e) => setF({ ...f, nextAction: e.target.value })} className="min-h-[44px]" />
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
