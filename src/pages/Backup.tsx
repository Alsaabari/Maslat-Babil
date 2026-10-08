import { useRef, useState } from "react";
import { trpc } from "@/providers/trpc";
import { useAuth } from "@/lib/auth";
import { PageHeader } from "@/components/common";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DatabaseBackup, Upload, Download } from "lucide-react";
import { toast } from "sonner";

/** النسخ الاحتياطي: تصدير JSON كامل + استيراد الجدول الموحد (يظهر هنا فقط) */
export default function Backup() {
  const { canDelete } = useAuth();
  const exportQ = trpc.admin.backupExport.useQuery(undefined, { enabled: false });
  const importM = trpc.admin.backupImport.useMutation();
  const fileRef = useRef<HTMLInputElement>(null);
  const [confirming, setConfirming] = useState<string | null>(null);

  const doExport = async () => {
    try {
      const res = await exportQ.refetch();
      if (!res.data) throw new Error("no data");
      const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const d = new Date();
      a.href = url;
      a.download = `maslat-babil-backup-${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("تم تصدير النسخة الاحتياطية");
    } catch (e: any) {
      toast.error(e.message ?? "فشل التصدير");
    }
  };

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setConfirming(String(reader.result));
    reader.readAsText(file);
    e.target.value = "";
  };

  const doImport = async () => {
    if (!confirming) return;
    try {
      await importM.mutateAsync({ confirm: "استيراد", data: confirming });
      toast.success("تم استيراد الجدول الموحد بنجاح");
      setConfirming(null);
      window.location.reload();
    } catch (e: any) {
      toast.error(e.message ?? "فشل الاستيراد");
    }
  };

  return (
    <div>
      <PageHeader title="النسخ الاحتياطي" subtitle="تصدير واستيراد كامل بيانات النظام" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Download className="h-4 w-4 text-[#af915f]" /> تصدير نسخة احتياطية
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              تصدير كامل البيانات (الزبائن، الديون، التسديدات، الدعاوى، الأضابير، الإجراءات، الجلسات، المهام، المراسلات) بصيغة JSON.
            </p>
            <Button onClick={doExport} disabled={exportQ.isFetching} className="min-h-[44px] gap-2 bg-navy hover:bg-navy-light">
              <DatabaseBackup className="h-4 w-4" /> تصدير الآن
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Upload className="h-4 w-4 text-[#af915f]" /> استيراد الجدول الموحد
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              استيراد نسخة احتياطية سابقة — <b className="text-[#d64545]">يستبدل البيانات الحالية بالكامل</b>. هذه العملية متاحة للمدير فقط.
            </p>
            {canDelete ? (
              <>
                <input ref={fileRef} type="file" accept="application/json" className="hidden" onChange={onFile} />
                <Button variant="outline" onClick={() => fileRef.current?.click()} className="min-h-[44px] gap-2">
                  <Upload className="h-4 w-4" /> اختيار ملف النسخة
                </Button>
                {confirming && (
                  <div className="rounded-md border border-[#d64545]/40 bg-[#d64545]/5 p-3">
                    <p className="text-sm font-semibold text-[#d64545]">تأكيد الاستيراد</p>
                    <p className="mt-1 text-xs text-muted-foreground">سيتم استبدال جميع البيانات الحالية بمحتوى الملف المختار. هل أنت متأكد؟</p>
                    <div className="mt-3 flex gap-2">
                      <Button variant="outline" onClick={() => setConfirming(null)} className="min-h-[44px]">إلغاء</Button>
                      <Button onClick={doImport} disabled={importM.isPending} className="min-h-[44px] bg-[#d64545] hover:bg-[#b93a3a] text-white">
                        تأكيد الاستيراد
                      </Button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <p className="rounded-md bg-muted p-3 text-sm text-muted-foreground">الاستيراد متاح لصلاحية مدير النظام أو مدير المكتب فقط.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
