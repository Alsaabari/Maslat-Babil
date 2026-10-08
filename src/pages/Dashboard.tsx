import { useNavigate } from "react-router";
import { trpc } from "@/providers/trpc";
import { PageHeader, StatCard } from "@/components/common";
import {
  Users,
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
  BookOpenText,
  Banknote,
  AlertTriangle,
} from "lucide-react";
import { fmtMoney } from "@/lib/format";

const SHORTCUTS = [
  { to: "/customers", label: "الزبائن (المدينون)", icon: Users },
  { to: "/debtors", label: "سجل الديون والزبائن", icon: BookOpenText },
  { to: "/lawsuits", label: "الدعاوى", icon: Scale },
  { to: "/executions", label: "الأضابير التنفيذية", icon: FolderLock },
  { to: "/lawyers", label: "المحامون", icon: Briefcase },
  { to: "/tasks", label: "مهام المحامين", icon: ListTodo },
  { to: "/sessions", label: "الجلسات", icon: CalendarClock },
  { to: "/calendar", label: "التقويم", icon: CalendarDays },
  { to: "/messages", label: "المراسلات", icon: MessagesSquare },
  { to: "/reports", label: "التقارير", icon: FileBarChart2 },
  { to: "/backup", label: "النسخ الاحتياطي", icon: DatabaseBackup },
  { to: "/system-check", label: "فحص النظام", icon: ShieldCheck },
];

export default function Dashboard() {
  const stats = trpc.customers.dashboardStats.useQuery();
  const navigate = useNavigate();
  const s = stats.data;

  return (
    <div>
      <PageHeader title="لوحة القيادة" subtitle="مركز التحكم الرئيسي — مؤشرات حقيقية من قاعدة البيانات" />

      {stats.error && (
        <div className="mb-4 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          تعذر جلب المؤشرات: خطأ في الاتصال بقاعدة البيانات
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-6">
        <StatCard label="الزبائن" value={s?.customers ?? "—"} icon={<Users size={16} />} onClick={() => navigate("/debtors")} />
        <StatCard label="الزبائن المدينون" value={s?.debtors ?? "—"} icon={<AlertTriangle size={16} />} onClick={() => navigate("/customers")} tone="warning" />
        <StatCard label="الدعاوى" value={s?.lawsuits ?? "—"} icon={<Scale size={16} />} onClick={() => navigate("/lawsuits")} />
        <StatCard label="الأضابير التنفيذية" value={s?.executions ?? "—"} icon={<FolderLock size={16} />} onClick={() => navigate("/executions")} />
        <StatCard label="المحامون" value={s?.lawyers ?? "—"} icon={<Briefcase size={16} />} onClick={() => navigate("/lawyers")} />
        <StatCard label="المهام المفتوحة" value={s?.tasksOpen ?? "—"} icon={<ListTodo size={16} />} onClick={() => navigate("/tasks")} />
        <StatCard label="المهام المتأخرة" value={s?.tasksOverdue ?? "—"} icon={<AlertTriangle size={16} />} onClick={() => navigate("/tasks?filter=overdue")} tone="danger" />
        <StatCard label="الجلسات القادمة" value={s?.sessionsUpcoming ?? "—"} icon={<CalendarClock size={16} />} onClick={() => navigate("/calendar")} />
        <StatCard label="إجمالي أصل الدين" value={s ? fmtMoney(s.totalPrincipal) : "—"} sub="دينار عراقي" tone="gold" />
        <StatCard label="إجمالي الواصل" value={s ? fmtMoney(s.totalWasil) : "—"} sub="دينار عراقي" tone="success" />
        <StatCard label="إجمالي المتبقي الأصلي" value={s ? fmtMoney(s.totalRemaining) : "—"} sub="دينار عراقي" tone="warning" />
        <StatCard label="إجمالي المتبقي التنفيذي" value={s ? fmtMoney(s.totalRemainingExecution) : "—"} sub="دينار عراقي" tone="danger" icon={<Banknote size={16} />} />
      </div>

      <h2 className="mb-3 mt-8 text-sm font-semibold text-muted-foreground">الوصول السريع</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
        {SHORTCUTS.map((sc) => (
          <button
            key={sc.to}
            onClick={() => navigate(sc.to)}
            className="flex min-h-[72px] flex-col items-center justify-center gap-2 rounded-lg border border-border bg-card p-3 text-sm font-medium transition-all hover:border-[#af915f] hover:shadow-sm"
          >
            <sc.icon className="h-5 w-5 text-[#af915f]" />
            {sc.label}
          </button>
        ))}
      </div>
    </div>
  );
}
