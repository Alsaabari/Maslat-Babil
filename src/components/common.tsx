import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-xl font-bold text-primary md:text-2xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function StatCard({
  label,
  value,
  sub,
  icon,
  onClick,
  tone = "default",
}: {
  label: string;
  value: ReactNode;
  sub?: string;
  icon?: ReactNode;
  onClick?: () => void;
  tone?: "default" | "gold" | "danger" | "success" | "warning";
}) {
  const tones = {
    default: "text-primary",
    gold: "text-[#af915f]",
    danger: "text-[#d64545]",
    success: "text-[#1e9e6a]",
    warning: "text-[#c98a12]",
  };
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className={cn(
        "group w-full rounded-lg border border-border bg-card p-4 text-start transition-all",
        onClick && "hover:border-[#af915f] hover:shadow-sm cursor-pointer",
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{label}</span>
        {icon && <span className="text-[#af915f]">{icon}</span>}
      </div>
      <div className={cn("mt-2 text-2xl font-bold num", tones[tone])}>{value}</div>
      {sub && <div className="mt-1 text-[11px] text-muted-foreground">{sub}</div>}
      {onClick && (
        <div className="mt-1 text-[10px] text-muted-foreground/60 group-hover:text-[#af915f]">
          اضغط لعرض التفاصيل
        </div>
      )}
    </button>
  );
}

export function StatusBadge({ value }: { value: string }) {
  const color =
    value === "منجزة" || value === "انعقدت" || value === "منجزة" || value === "مسدد"
      ? "bg-[#1e9e6a]/10 text-[#1e9e6a]"
      : value === "متأخرة" || value === "مغلقة"
        ? "bg-[#d64545]/10 text-[#d64545]"
        : value === "مؤجلة" || value === "معلقة" || value === "محجوزة للحكم"
          ? "bg-[#c98a12]/10 text-[#c98a12]"
          : "bg-[#162638]/8 text-[#162638]";
  return (
    <span className={cn("inline-block rounded-full px-2.5 py-0.5 text-xs font-medium", color)}>
      {value}
    </span>
  );
}
