import { useEffect, useMemo, useState } from "react";
import { trpc } from "@/providers/trpc";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

export interface CommContext {
  recipientType: "lawyer" | "customer";
  recipientId: number;
  entityType?: "lawsuit" | "execution" | "task" | "customer" | "installment";
  entityId?: number;
  defaultTemplate?: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  context: CommContext | null;
}

/** مركز التواصل والتراسل — بناء الرسالة من بيانات السجل الفعلية */
export default function CommunicationCenter({ open, onClose, context }: Props) {
  const templates = trpc.messaging.templates.useQuery();
  const [templateKey, setTemplateKey] = useState<string>("");
  const [phone, setPhone] = useState("");
  const [body, setBody] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [fileNumber, setFileNumber] = useState<string | null>(null);
  const logMutation = trpc.messaging.log.useMutation();

  const available = useMemo(
    () => (templates.data ?? []).filter((t) => !context || t.audience === context.recipientType),
    [templates.data, context],
  );

  useEffect(() => {
    if (open && context) {
      const def =
        context.defaultTemplate && available.some((t) => t.key === context.defaultTemplate)
          ? context.defaultTemplate
          : available[0]?.key ?? "";
      setTemplateKey(def);
    }
  }, [open, context, available]);

  const buildQuery = trpc.messaging.build.useQuery(
    {
      templateKey,
      recipientType: context?.recipientType ?? "customer",
      recipientId: context?.recipientId ?? 0,
      entityType: context?.entityType,
      entityId: context?.entityId,
    },
    { enabled: open && !!context && !!templateKey },
  );

  useEffect(() => {
    if (buildQuery.data) {
      setBody(buildQuery.data.body);
      setPhone(buildQuery.data.phone ?? "");
      setRecipientName(buildQuery.data.recipientName);
      setFileNumber(buildQuery.data.fileNumber);
    }
  }, [buildQuery.data]);

  if (!context) return null;

  const openWhatsApp = async () => {
    if (!phone.trim()) {
      toast.error("لا يوجد رقم هاتف للمستلم — أدخل الرقم يدوياً");
      return;
    }
    const normalized = phone.replace(/[^\d+]/g, "").replace(/^\+/, "");
    const url = `https://wa.me/${normalized}?text=${encodeURIComponent(body)}`;
    window.open(url, "_blank", "noopener,noreferrer");
    try {
      await logMutation.mutateAsync({
        recipientType: context.recipientType,
        recipientName,
        phone,
        templateKey,
        entityType: context.entityType,
        entityId: context.entityId,
        fileNumber: fileNumber ?? undefined,
        body,
        status: "مفتوحة",
      });
      toast.success("تم فتح WhatsApp وتسجيل المراسلة في سجل المراسلات");
    } catch {
      toast.warning("تم فتح WhatsApp لكن تعذر تسجيل المراسلة");
    }
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>مركز التواصل والتراسل</DialogTitle>
          <DialogDescription>
            تُبنى الرسالة تلقائياً من بيانات السجل الفعلية — راجعها وعدّلها قبل الإرسال.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>جهة الاتصال</Label>
            <Input value={recipientName} readOnly className="bg-muted" />
          </div>
          <div className="space-y-1.5">
            <Label>نوع المستلم</Label>
            <Input value={context.recipientType === "lawyer" ? "محامٍ" : "زبون"} readOnly className="bg-muted" />
          </div>
          <div className="space-y-1.5">
            <Label>رقم الهاتف (مع رمز الدولة)</Label>
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="9647XXXXXXXX"
              className="num text-start"
              dir="ltr"
            />
          </div>
          <div className="space-y-1.5">
            <Label>رقم الملف</Label>
            <Input value={fileNumber ?? "غير محدد"} readOnly className="bg-muted num" />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>قالب الرسالة</Label>
          <Select value={templateKey} onValueChange={setTemplateKey}>
            <SelectTrigger className="min-h-[44px]">
              <SelectValue placeholder="اختر القالب" />
            </SelectTrigger>
            <SelectContent>
              {available.map((t) => (
                <SelectItem key={t.key} value={t.key}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label>معاينة الرسالة (قابلة للتعديل)</Label>
          {buildQuery.isFetching && <div className="text-xs text-muted-foreground">جاري بناء الرسالة من البيانات...</div>}
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={12}
            className="leading-relaxed whitespace-pre-wrap"
          />
        </div>

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={onClose} className="min-h-[44px]">
            إلغاء
          </Button>
          <Button
            onClick={openWhatsApp}
            className="min-h-[44px] gap-2 bg-[#1e9e6a] hover:bg-[#17855a] text-white"
            disabled={!body.trim()}
          >
            <WhatsAppIcon className="h-4 w-4" />
            فتح WhatsApp وإرسال
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}
