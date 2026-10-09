import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router";
import {
  LayoutDashboard,
  Users,
  BookOpenText,
  Scale,
  FolderLock,
  Briefcase,
  ListTodo,
  CalendarClock,
  CalendarDays,
  MessagesSquare,
  FileBarChart2,
  DatabaseBackup,
  ShieldCheck,
  UserCog,
  Settings as SettingsIcon,
  LogOut,
  Menu,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { ROLES } from "@contracts/types";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import { fmtDate } from "@/lib/format";

import { PWAInstallButton } from "@/components/common/PWAInstallButton";

const NAV = [
  { to: "/", label: "لوحة القيادة", icon: LayoutDashboard, module: "dashboard", end: true },
  { to: "/customers", label: "الزبائن (المدينون)", icon: Users, module: "customers" },
  { to: "/debtors", label: "سجل الديون والزبائن", icon: BookOpenText, module: "debtors" },
  { to: "/lawsuits", label: "الدعاوى القضائية", icon: Scale, module: "lawsuits" },
  { to: "/executions", label: "الأضابير التنفيذية", icon: FolderLock, module: "executions" },
  { to: "/lawyers", label: "المحامون", icon: Briefcase, module: "lawyers" },
  { to: "/tasks", label: "مهام المحامين", icon: ListTodo, module: "tasks" },
  { to: "/sessions", label: "الجلسات", icon: CalendarClock, module: "sessions" },
  { to: "/calendar", label: "التقويم", icon: CalendarDays, module: "calendar" },
  { to: "/messages", label: "المراسلات", icon: MessagesSquare, module: "messages" },
  { to: "/reports", label: "التقارير والطباعة", icon: FileBarChart2, module: "reports" },
  { to: "/backup", label: "النسخ الاحتياطي", icon: DatabaseBackup, module: "backup" },
  { to: "/system-check", label: "فحص النظام", icon: ShieldCheck, module: "system" },
  { to: "/users", label: "المستخدمون والصلاحيات", icon: UserCog, module: "users" },
  { to: "/settings", label: "الإعدادات", icon: SettingsIcon, module: "settings" },
];

function NavItems({ onNavigate }: { onNavigate?: () => void }) {
  const { canAccess } = useAuth();
  return (
    <nav className="flex flex-col gap-0.5 px-3 py-4">
      {NAV.filter((n) => canAccess(n.module)).map((n) => (
        <NavLink
          key={n.to}
          to={n.to}
          end={n.end}
          onClick={onNavigate}
          className={({ isActive }) =>
            `flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors min-h-[44px] ${
              isActive
                ? "bg-sidebar-accent text-[#fce1b6] font-semibold border-r-2 border-[#af915f]"
                : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
            }`
          }
        >
          <n.icon className="h-4.5 w-4.5 shrink-0 text-[#af915f]" size={18} />
          <span>{n.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}

function Brand() {
  return (
    <div className="flex items-center gap-3 px-4 py-4 border-b border-sidebar-border bg-sidebar/50">
      <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-[22%] bg-white p-1.5 shadow-md border border-[#af915f]/40">
        <img
          src="/maslat-app-icon.png"
          alt="أيقونة مسلة بابل"
          className="h-full w-full object-contain"
        />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-base font-bold text-[#fce1b6] leading-tight flex items-center gap-1.5">
          <span>مسلة بابل</span>
          <span className="text-[10px] font-semibold text-[#facc15] bg-[#af915f]/25 px-1.5 py-0.5 rounded border border-[#af915f]/30">
            2026
          </span>
        </div>
        <div className="text-[10px] tracking-wider text-[#e2e8f0]/70 truncate uppercase font-medium">
          MASLATT BABIL ERP
        </div>
      </div>
    </div>
  );
}

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const roleLabel = ROLES.find((r) => r.code === user?.role)?.label ?? user?.role;

  return (
    <div className="flex min-h-screen bg-background">
      {/* الشريط الجانبي — سطح المكتب */}
      <aside className="hidden lg:flex w-64 shrink-0 flex-col bg-sidebar text-sidebar-foreground sticky top-0 h-screen overflow-y-auto">
        <Brand />
        <NavItems />
        <div className="mt-auto p-3 border-t border-sidebar-border space-y-2">
          <PWAInstallButton />
          <div className="px-2 text-[10px] text-sidebar-foreground/50 text-center">
            MASLATT BABIL ERP PROFESSIONAL
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* الترويسة */}
        <header className="no-print sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-border bg-card/95 px-4 backdrop-blur">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden min-h-[44px] min-w-[44px]">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72 bg-sidebar p-0 text-sidebar-foreground flex flex-col h-full">
              <Brand />
              <div className="flex-1 overflow-y-auto">
                <NavItems onNavigate={() => setOpen(false)} />
              </div>
              <div className="p-3 border-t border-sidebar-border mt-auto">
                <PWAInstallButton />
              </div>
            </SheetContent>
          </Sheet>

          <div className="lg:hidden flex items-center gap-2 font-bold text-primary">
            <img
              src="/maslat-app-icon.png"
              alt="logo"
              className="h-7 w-7 rounded-[22%] bg-white p-0.5 shadow-sm border border-slate-200 object-contain"
            />
            <span className="text-sm font-bold">مسلة بابل</span>
          </div>

          <div className="ms-auto flex items-center gap-3">
            <div className="hidden sm:block">
              <PWAInstallButton variant="compact" />
            </div>
            <span className="hidden sm:block text-xs text-muted-foreground num">{fmtDate(new Date())}</span>
            <div className="h-6 w-px bg-border" />
            <div className="text-sm">
              <span className="font-semibold">{user?.displayName}</span>
              <span className="ms-2 rounded bg-secondary px-2 py-0.5 text-[11px] text-secondary-foreground">{roleLabel}</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="min-h-[44px] min-w-[44px]"
              title="تسجيل الخروج"
              onClick={() => {
                logout();
                navigate("/login");
              }}
            >
              <LogOut className="h-4.5 w-4.5" />
            </Button>
          </div>
        </header>

        <main className="min-w-0 flex-1 p-4 md:p-6">
          <Outlet />
        </main>
      </div>
      <Toaster position="bottom-center" richColors dir="rtl" />
    </div>
  );
}
