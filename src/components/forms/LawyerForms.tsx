import { useEffect, useState } from "react";
import { trpc } from "@/providers/trpc";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { TASK_PRIORITIES, TASK_TYPES } from "@contracts/types";
import { todayInputDate } from "@/lib/format";

export function LawyerForm({ open, onClose, lawyer }: {
  open: boolean;
  onClose: (saved: boolean) => void;
  lawyer?: any | null;
}) {
  const [f, setF] = useState<any>({});
  const create = trpc.lawyers.create.useMutation();
  const update = trpc.lawyers.update.useMutation();
  const utils = trpc.useUtils();

  useEffect(() => {
    if (open) setF(lawyer ?? {});
  }, [open, lawyer]);

  const save = async () => {
    if (!f.fullName?.trim()) return toast.error("اسم المحامي مطلوب");
    try {
      if (lawyer?.id)
        await update.mutateAsync({ id: lawyer.id, fullName: f.fullName, phone: f.phone || undefined, specialty: f.specialty || undefined, notes: f.notes || undefined, active: f.active ?? true });
      else
        await create.mutateAsync({ fullName: f.fullName, phone: f.phone || undefined, specialty: f.specialty || undefined, notes: f.notes || undefined });
      await utils.lawyers.invalidate();
      toast.success("تم الحفظ");
      onClose(true);
    } catch (e: any) {
      toast.error(e.message ?? "فشل الحفظ");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose(false)}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>{lawyer ? "تعديل بيانات المحامي" : "تسجيل محامٍ جديد"}</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>اسم المحامي *</Label>
            <Input value={f.fullName ?? ""} onChange={(e) => setF({ ...f, fullName: e.target.value })} className="min-h-[44px]" />
          </div>
          <div className="space-y-1.5">
            <Label>الهاتف (مع رمز الدولة)</Label>
            <Input value={f.phone ?? ""} onChange={(e) => setF({ ...f, phone: e.target.value })} placeholder="9647XXXXXXXX" className="num text-start min-h-[44px]" dir="ltr" />
          </div>
          <div className="space-y-1.5">
            <Label>التخصص</Label>
            <Input value={f.specialty ?? ""} onChange={(e) => setF({ ...f, specialty: e.target.value })} className="min-h-[44px]" />
          </div>
          <div className="space-y-1.5">
            <Label>ملاحظات</Label>
            <Textarea value={f.notes ?? ""} onChange={(e) => setF({ ...f, notes: e.target.value })} rows={2} />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onClose(false)} className="min-h-[44px]">إلغاء</Button>
            <Button onClick={save} disabled={create.isPending || update.isPending} className="min-h-[44px] bg-navy hover:bg-navy-light">حفظ</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function TaskForm({ open, onClose, lawyerId }: {
  open: boolean;
  onClose: (saved: boolean) => void;
  lawyerId?: number;
}) {
  const [f, setF] = useState<any>({ priority: "متوسطة", status: "قيد الانتظار", taskType: "عامة" });
  const lawyers = trpc.lawyers.list.useQuery();
  const customers = trpc.customers.list.useQuery({ view: "all" });
  const lawsuits = trpc.legal.lawsuits.list.useQuery({});
  const execs = trpc.legal.executions.list.useQuery({});
  const create = trpc.tasks.create.useMutation();
  const utils = trpc.useUtils();

  useEffect(() => {
    if (open) setF({ priority: "متوسطة", status: "قيد الانتظار", taskType: "عامة", lawyerId: lawyerId ?? "", dueDate: todayInputDate() });
  }, [open, lawyerId]);

  const sel = (label: string, key: string, options: { value: string; label: string }[], placeholder = "اختر...") => (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <select value={String(f[key] ?? "")} onChange={(e) => setF({ ...f, [key]: e.target.value })} className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm">
        <option value="">{placeholder}</option>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );

  const save = async () => {
    if (!f.lawyerId) return toast.error("اختر المحامي");
    if (!f.title?.trim()) return toast.error("عنوان المهمة مطلوب");
    try {
      await create.mutateAsync({
        lawyerId: Number(f.lawyerId),
        lawsuitId: f.lawsuitId ? Number(f.lawsuitId) : undefined,
        executionFileId: f.executionFileId ? Number(f.executionFileId) : undefined,
        customerId: f.customerId ? Number(f.customerId) : undefined,
        taskType: f.taskType,
        title: f.title,
        description: f.description || undefined,
        priority: f.priority,
        status: f.status,
        dueDate: f.dueDate || undefined,
        requiredAction: f.requiredAction || undefined,
      });
      await utils.tasks.invalidate();
      await utils.lawyers.invalidate();
      toast.success("تم إنشاء المهمة");
      onClose(true);
    } catch (e: any) {
      toast.error(e.message ?? "فشل الحفظ");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose(false)}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>مهمة جديدة لمحامٍ</DialogTitle></DialogHeader>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {sel("المحامي *", "lawyerId", (lawyers.data ?? []).map((l) => ({ value: String(l.id), label: l.fullName })))}
          {sel("نوع المهمة", "taskType", TASK_TYPES.map((t) => ({ value: t, label: t })))}
          <div className="space-y-1.5 sm:col-span-2">
            <Label>عنوان المهمة *</Label>
            <Input value={f.title ?? ""} onChange={(e) => setF({ ...f, title: e.target.value })} className="min-h-[44px]" />
          </div>
          {sel("الأولوية", "priority", TASK_PRIORITIES.map((p) => ({ value: p, label: p })))}
          <div className="space-y-1.5">
            <Label>تاريخ الاستحقاق</Label>
            <Input type="date" value={f.dueDate ?? ""} onChange={(e) => setF({ ...f, dueDate: e.target.value })} className="min-h-[44px]" />
          </div>
          {sel("الدعوى المرتبطة", "lawsuitId", (lawsuits.data ?? []).map((l) => ({ value: String(l.id), label: `${l.fileNumber} — ${l.customerName}` })), "بدون")}
          {sel("الإضبارة المرتبطة", "executionFileId", (execs.data ?? []).map((e) => ({ value: String(e.id), label: `${e.fileNumber} — ${e.customerName}` })), "بدون")}
          {sel("الزبون المرتبط", "customerId", (customers.data ?? []).map((c) => ({ value: String(c.id), label: c.fullName })), "بدون")}
          <div className="space-y-1.5">
            <Label>الإجراء المطلوب</Label>
            <Input value={f.requiredAction ?? ""} onChange={(e) => setF({ ...f, requiredAction: e.target.value })} className="min-h-[44px]" />
          </div>
        </div>
        <div className="mt-4 space-y-1.5">
          <Label>وصف المهمة</Label>
          <Textarea value={f.description ?? ""} onChange={(e) => setF({ ...f, description: e.target.value })} rows={3} />
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={() => onClose(false)} className="min-h-[44px]">إلغاء</Button>
          <Button onClick={save} disabled={create.isPending} className="min-h-[44px] bg-navy hover:bg-navy-light">إنشاء المهمة</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function SessionForm({ open, onClose }: { open: boolean; onClose: (saved: boolean) => void }) {
  const [f, setF] = useState<any>({ fileKind: "lawsuit" });
  const lawsuits = trpc.legal.lawsuits.list.useQuery({});
  const execs = trpc.legal.executions.list.useQuery({});
  const lawyers = trpc.lawyers.list.useQuery();
  const create = trpc.sessions.create.useMutation();
  const utils = trpc.useUtils();

  useEffect(() => {
    if (open) setF({ fileKind: "lawsuit" });
  }, [open]);

  const save = async () => {
    if (!f.sessionDate) return toast.error("أدخل تاريخ ووقت الجلسة");
    if (f.fileKind === "lawsuit" && !f.lawsuitId) return toast.error("اختر الدعوى");
    if (f.fileKind === "execution" && !f.executionFileId) return toast.error("اختر الإضبارة");
    try {
      await create.mutateAsync({
        lawsuitId: f.fileKind === "lawsuit" ? Number(f.lawsuitId) : undefined,
        executionFileId: f.fileKind === "execution" ? Number(f.executionFileId) : undefined,
        lawyerId: f.lawyerId ? Number(f.lawyerId) : undefined,
        sessionDate: new Date(f.sessionDate).toISOString(),
        location: f.location || undefined,
        notes: f.notes || undefined,
      });
      await utils.sessions.invalidate();
      toast.success("تم تسجيل الجلسة");
      onClose(true);
    } catch (e: any) {
      toast.error(e.message ?? "فشل الحفظ");
    }
  };

  const sel = (label: string, key: string, options: { value: string; label: string }[], placeholder = "اختر...") => (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <select value={String(f[key] ?? "")} onChange={(e) => setF({ ...f, [key]: e.target.value })} className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm">
        <option value="">{placeholder}</option>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose(false)}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>تسجيل جلسة / موعد مراجعة</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>نوع الملف *</Label>
            <div className="flex gap-2">
              <button type="button" onClick={() => setF({ ...f, fileKind: "lawsuit", executionFileId: undefined })}
                className={`min-h-[44px] flex-1 rounded-md border px-3 text-sm ${f.fileKind === "lawsuit" ? "border-[#af915f] bg-[#af915f]/10 font-semibold" : "border-border"}`}>
                دعوى — المحكمة المختصة
              </button>
              <button type="button" onClick={() => setF({ ...f, fileKind: "execution", lawsuitId: undefined })}
                className={`min-h-[44px] flex-1 rounded-md border px-3 text-sm ${f.fileKind === "execution" ? "border-[#af915f] bg-[#af915f]/10 font-semibold" : "border-border"}`}>
                إضبارة — مديرية التنفيذ
              </button>
            </div>
          </div>
          {f.fileKind === "lawsuit"
            ? sel("الدعوى *", "lawsuitId", (lawsuits.data ?? []).map((l) => ({ value: String(l.id), label: `${l.fileNumber} — ${l.customerName} — ${l.courtName}` })))
            : sel("الإضبارة *", "executionFileId", (execs.data ?? []).map((e) => ({ value: String(e.id), label: `${e.fileNumber} — ${e.customerName} — ${e.directorateName}` })))}
          {sel("المحامي", "lawyerId", (lawyers.data ?? []).map((l) => ({ value: String(l.id), label: l.fullName })), "بدون")}
          <div className="space-y-1.5">
            <Label>تاريخ ووقت الجلسة *</Label>
            <Input type="datetime-local" value={f.sessionDate ?? ""} onChange={(e) => setF({ ...f, sessionDate: e.target.value })} className="min-h-[44px]" />
          </div>
          <div className="space-y-1.5">
            <Label>مكان الجلسة</Label>
            <Input value={f.location ?? ""} onChange={(e) => setF({ ...f, location: e.target.value })}
              placeholder={f.fileKind === "lawsuit" ? "اسم المحكمة المختصة" : "اسم مديرية التنفيذ"} className="min-h-[44px]" />
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
