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
  Landmark,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { ROLES } from "@contracts/types";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import { fmtDate } from "@/lib/format";

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
    <div className="flex items-center gap-3 px-5 py-5 border-b border-sidebar-border">
      <div className="flex h-10 w-10 items-center justify-center rounded-md border border-[#af915f]/60 bg-[#af915f]/10">
        <Landmark className="h-5 w-5 text-[#af915f]" />
      </div>
      <div>
        <div className="text-base font-bold text-[#fce1b6] leading-tight">مسلة بابل</div>
        <div className="text-[10px] tracking-wide text-sidebar-foreground/60">
          الإدارة القانونية والمالية 2026
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
        <div className="mt-auto border-t border-sidebar-border px-5 py-4 text-[11px] text-sidebar-foreground/50">
          MASLAT BABIL ERP PROFESSIONAL
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
            <SheetContent side="right" className="w-72 bg-sidebar p-0 text-sidebar-foreground">
              <Brand />
              <NavItems onNavigate={() => setOpen(false)} />
            </SheetContent>
          </Sheet>

          <div className="lg:hidden flex items-center gap-2 font-bold text-primary">
            <Landmark className="h-5 w-5 text-[#af915f]" />
            مسلة بابل
          </div>

          <div className="ms-auto flex items-center gap-3">
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
