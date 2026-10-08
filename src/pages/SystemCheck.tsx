import { trpc } from "@/providers/trpc";
import { PageHeader } from "@/components/common";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, XCircle, AlertTriangle, Loader2 } from "lucide-react";

/** فحص النظام: اتصال قاعدة البيانات، الجداول، سلامة العلاقات والبيانات المالية */
export default function SystemCheck() {
  const q = trpc.admin.systemCheck.useQuery(undefined, { refetchInterval: 30000 });

  return (
    <div>
      <PageHeader title="فحص النظام" subtitle="فحص حي لقاعدة البيانات وسلامة البيانات — يتحدث كل 30 ثانية" />

      {q.isLoading && (
        <div className="flex items-center gap-2 py-10 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> جاري فحص النظام...
        </div>
      )}
      {q.error && (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 p-4 text-destructive">
          فشل الاتصال بقاعدة البيانات أو الخادم — تحقق من التشغيل
        </div>
      )}

      {q.data && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <Card>
              <CardContent className="flex items-center gap-3 p-4">
                <CheckCircle2 className="h-6 w-6 text-[#1e9e6a]" />
                <div>
                  <div className="text-sm font-semibold">الاتصال بقاعدة البيانات</div>
                  <div className="text-xs text-muted-foreground">متصل — الاستجابة <span className="num">{q.data.latencyMs}ms</span></div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-3 p-4">
                <CheckCircle2 className="h-6 w-6 text-[#1e9e6a]" />
                <div>
                  <div className="text-sm font-semibold">الجداول</div>
                  <div className="text-xs text-muted-foreground"><span className="num">{q.data.tables.length}</span> جدولاً سليماً</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-3 p-4">
                {q.data.issues.length === 0 ? (
                  <CheckCircle2 className="h-6 w-6 text-[#1e9e6a]" />
                ) : (
                  <AlertTriangle className="h-6 w-6 text-[#c98a12]" />
                )}
                <div>
                  <div className="text-sm font-semibold">سلامة البيانات</div>
                  <div className="text-xs text-muted-foreground">
                    {q.data.issues.length === 0 ? "لا توجد مشاكل" : `${q.data.issues.length} ملاحظة`}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {q.data.issues.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-base">الملاحظات</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {q.data.issues.map((i, idx) => (
                  <div key={idx} className={`flex items-start gap-2 rounded-md border p-3 text-sm ${i.severity === "خطأ" ? "border-[#d64545]/40 bg-[#d64545]/5" : "border-[#c98a12]/40 bg-[#c98a12]/5"}`}>
                    {i.severity === "خطأ" ? <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#d64545]" /> : <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[#c98a12]" />}
                    <div>
                      <b>{i.severity}:</b> {i.message}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader><CardTitle className="text-base">الجداول وسجلاتها</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-5">
                {q.data.tables.map((t) => (
                  <div key={t.name} className="rounded-md border border-border px-3 py-2">
                    <div className="text-xs text-muted-foreground">{t.name}</div>
                    <div className="num text-lg font-bold">{t.count}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
