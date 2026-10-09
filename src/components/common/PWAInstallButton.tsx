import { useState, type FC } from "react";
import { Download, MonitorCheck, Smartphone } from "lucide-react";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import { Button } from "@/components/ui/button";

export const PWAInstallButton: FC<{ variant?: "button" | "menu" | "compact" }> = ({
  variant = "button",
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already installed as a standalone PWA on desktop or mobile
  if (isInstalled) {
    return (
      <div className="flex items-center gap-1.5 text-[11px] text-[#1e9e6a] font-medium px-2 py-1 bg-[#1e9e6a]/10 rounded border border-[#1e9e6a]/20">
        <MonitorCheck className="h-3.5 w-3.5" />
        <span>مثبّت على النظام</span>
      </div>
    );
  }

  // Chromium / Edge / Desktop flow
  if (isInstallable) {
    if (variant === "compact") {
      return (
        <Button
          onClick={install}
          variant="outline"
          size="sm"
          className="min-h-[36px] gap-2 border-[#af915f]/50 text-[#af915f] hover:bg-[#af915f]/10 hover:text-[#c4a46c]"
          title="تثبيت التطبيق على سطح المكتب"
        >
          <img src="/maslat-app-icon.png" alt="icon" className="h-4 w-4 rounded-sm object-contain" />
          <span className="text-xs font-semibold">تثبيت على سطح المكتب</span>
        </Button>
      );
    }

    return (
      <button
        onClick={install}
        className="flex w-full items-center gap-2.5 rounded-lg border border-[#af915f]/40 bg-gradient-to-r from-[#152c52] to-[#0f1f3a] p-2.5 text-xs text-white shadow-sm transition hover:border-[#af915f] hover:shadow"
      >
        <img
          src="/maslat-app-icon.png"
          alt="icon"
          className="h-8 w-8 rounded-[20%] border border-white/20 bg-white p-0.5 shadow-sm shrink-0"
        />
        <div className="text-start flex-1 min-w-0">
          <div className="font-bold text-[#fce1b6] leading-tight flex items-center gap-1">
            <span>تثبيت البرنامج</span>
            <Download className="h-3 w-3 text-[#fce1b6]" />
          </div>
          <div className="text-[10px] text-white/70 truncate">أيقونة سطح المكتب والتطبيق</div>
        </div>
      </button>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1 text-xs text-muted-foreground hover:bg-muted"
        >
          <Smartphone className="h-3.5 w-3.5 text-[#af915f]" />
          <span>تثبيت على الهاتف</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <div className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-2xl text-card-foreground">
              <div className="flex items-center gap-3 mb-4">
                <img
                  src="/maslat-app-icon.png"
                  alt="icon"
                  className="h-12 w-12 rounded-[22%] bg-white p-1 shadow border border-slate-200"
                />
                <div>
                  <h3 className="text-base font-bold text-foreground">تثبيت مسلة بابل</h3>
                  <p className="text-xs text-muted-foreground">على الشاشة الرئيسية لـ iPhone / iPad</p>
                </div>
              </div>
              <ol className="mt-3 space-y-2 text-xs text-muted-foreground list-decimal list-inside">
                <li>
                  اضغط على زر <strong className="text-foreground">المشاركة (Share)</strong> في شريط سفاري.
                </li>
                <li>
                  مرر للأسفل واختر <strong className="text-foreground">إضافة إلى الصفحة الرئيسية (Add to Home Screen)</strong>.
                </li>
                <li>سيظهر التطبيق بأيقونة مسلة بابل الرسمية على شاشتك.</li>
              </ol>
              <Button
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full bg-navy hover:bg-navy-light text-white"
              >
                إغلاق
              </Button>
            </div>
          </div>
        )}
      </>
    );
  }

  // Always show a fallback button that allows manual browser install or information
  return (
    <div className="flex items-center gap-2 rounded-lg border border-sidebar-border bg-sidebar-accent/30 p-2 text-xs">
      <img
        src="/maslat-app-icon.png"
        alt="icon"
        className="h-7 w-7 rounded-[20%] bg-white p-0.5 shrink-0"
      />
      <div className="text-start flex-1 min-w-0">
        <div className="font-semibold text-sidebar-foreground text-[11px] leading-tight">
          تطبيق مسلة بابل PWA
        </div>
        <div className="text-[10px] text-sidebar-foreground/60 truncate">
          متوافق مع التثبيت المكتبي
        </div>
      </div>
    </div>
  );
};

export default PWAInstallButton;
