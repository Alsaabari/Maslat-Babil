import { useMemo, useState } from "react";
import { trpc } from "@/providers/trpc";
import { PageHeader, StatusBadge } from "@/components/common";
import { fmtDate } from "@/lib/format";
import { CalendarClock, ListTodo, AlertTriangle } from "lucide-react";

/** التقويم: جلسات قادمة وسابقة + مهام متأخرة وغير منجزة */
export default function CalendarPage() {
  const q = trpc.sessions.calendar.useQuery();
  const [monthOffset, setMonthOffset] = useState(0);

  const base = useMemo(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth() + monthOffset, 1);
  }, [monthOffset]);

  const year = base.getFullYear();
  const month = base.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  // الأسبوع يبدأ السبت في العراق
  const firstDay = (new Date(year, month, 1).getDay() + 1) % 7; // Sat=0
  const monthNames = ["كانون الثاني","شباط","آذار","نيسان","أيار","حزيران","تموز","آب","أيلول","تشرين الأول","تشرين الثاني","كانون الأول"];

  const items = q.data ?? [];
  const itemsByDay = useMemo(() => {
    const map = new Map<string, typeof items>();
    for (const it of items) {
      const d = new Date(it.date);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      map.set(key, [...(map.get(key) ?? []), it]);
    }
    return map;
  }, [items]);

  const now = new Date();
  const todayKey = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;

  const overdueItems = items.filter((i) => i.kind === "task" && i.status === "متأخرة");
  const pastSessions = items.filter((i) => i.kind === "session" && new Date(i.date) < now);

  return (
    <div>
      <PageHeader title="التقويم" subtitle="الجلسات القادمة والسابقة + المهام غير المنجزة — المهمة المتأخرة لا تختفي" />

      <div className="mb-4 flex items-center justify-between">
        <button onClick={() => setMonthOffset(monthOffset - 1)} className="min-h-[44px] rounded-md border border-border bg-card px-4 hover:bg-muted">الشهر السابق</button>
        <h2 className="text-lg font-bold">{monthNames[month]} <span className="num">{year}</span></h2>
        <button onClick={() => setMonthOffset(monthOffset + 1)} className="min-h-[44px] rounded-md border border-border bg-card px-4 hover:bg-muted">الشهر التالي</button>
      </div>

      <div className="grid grid-cols-7 gap-px overflow-hidden rounded-lg border border-border bg-border">
        {["السبت","الأحد","الاثنين","الثلاثاء","الأربعاء","الخميس","الجمعة"].map((d) => (
          <div key={d} className="bg-navy px-1 py-2 text-center text-xs font-semibold text-[#fce1b6]">{d}</div>
        ))}
        {Array.from({ length: firstDay }).map((_, i) => (
          <div key={`e${i}`} className="min-h-[90px] bg-muted/40" />
        ))}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const key = `${year}-${month}-${day}`;
          const dayItems = itemsByDay.get(key) ?? [];
          const isToday = key === todayKey;
          return (
            <div key={day} className={`min-h-[90px] bg-card p-1.5 ${isToday ? "ring-2 ring-inset ring-[#af915f]" : ""}`}>
              <div className={`text-xs font-bold num ${isToday ? "text-[#af915f]" : "text-muted-foreground"}`}>{day}</div>
              <div className="mt-1 space-y-1">
                {dayItems.map((it) => (
                  <div
                    key={`${it.kind}-${it.id}`}
                    title={`${it.title}${it.fileNumber ? ` — ${it.fileNumber}` : ""}${it.lawyerName ? ` — ${it.lawyerName}` : ""}`}
                    className={`flex items-center gap-1 truncate rounded px-1.5 py-1 text-[10px] ${
                      it.kind === "session"
                        ? it.status === "قادمة"
                          ? "bg-[#162638]/8 text-[#162638]"
                          : "bg-muted text-muted-foreground"
                        : it.status === "متأخرة"
                          ? "bg-[#d64545]/10 text-[#d64545] font-semibold"
                          : "bg-[#c98a12]/10 text-[#c98a12]"
                    }`}
                  >
                    {it.kind === "session" ? <CalendarClock className="h-3 w-3 shrink-0" /> : <ListTodo className="h-3 w-3 shrink-0" />}
                    <span className="truncate">{it.title}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-[#d64545]/30 bg-card p-4">
          <h3 className="flex items-center gap-2 text-sm font-bold text-[#d64545]">
            <AlertTriangle className="h-4 w-4" /> مهام متأخرة غير منجزة ({overdueItems.length})
          </h3>
          <div className="mt-2 space-y-1.5">
            {overdueItems.length === 0 && <p className="text-sm text-muted-foreground">لا توجد مهام متأخرة</p>}
            {overdueItems.map((t) => (
              <div key={t.id} className="flex items-center justify-between rounded border border-border px-3 py-2 text-sm">
                <span>{t.title}</span>
                <span className="num text-xs text-muted-foreground">{fmtDate(t.date)}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="flex items-center gap-2 text-sm font-bold text-muted-foreground">
            <CalendarClock className="h-4 w-4" /> جلسات سابقة ({pastSessions.length})
          </h3>
          <div className="mt-2 space-y-1.5">
            {pastSessions.length === 0 && <p className="text-sm text-muted-foreground">لا توجد جلسات سابقة</p>}
            {pastSessions.slice(0, 10).map((s) => (
              <div key={s.id} className="flex items-center justify-between rounded border border-border px-3 py-2 text-sm">
                <span>{s.title} {s.fileNumber && <span className="num text-xs">({s.fileNumber})</span>}</span>
                <StatusBadge value={s.status} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
