import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, ChevronUp, Columns3, Search, RotateCcw, ArrowRight, ArrowLeft } from "lucide-react";

export interface ColumnDef<T> {
  key: string;
  header: string;
  render?: (row: T) => ReactNode;
  value?: (row: T) => string | number; // للفرز والبحث
  defaultVisible?: boolean;
  className?: string;
}

interface Props<T> {
  tableId: string;
  columns: ColumnDef<T>[];
  rows: T[];
  rowKey: (row: T) => string | number;
  searchable?: boolean;
  searchPlaceholder?: string;
  pageSize?: number;
  emptyText?: string;
  onRowClick?: (row: T) => void;
  toolbar?: ReactNode;
}

interface Persisted {
  order: string[];
  hidden: string[];
}

function loadPersisted(tableId: string, columns: ColumnDef<any>[]): Persisted {
  try {
    const raw = localStorage.getItem(`dt:${tableId}`);
    if (raw) {
      const p = JSON.parse(raw) as Persisted;
      const keys = columns.map((c) => c.key);
      const order = p.order.filter((k) => keys.includes(k));
      for (const k of keys) if (!order.includes(k)) order.push(k);
      return { order, hidden: p.hidden.filter((k) => keys.includes(k)) };
    }
  } catch { /* ignore */ }
  return {
    order: columns.map((c) => c.key),
    hidden: columns.filter((c) => c.defaultVisible === false).map((c) => c.key),
  };
}

export default function DataTable<T>({
  tableId,
  columns,
  rows,
  rowKey,
  searchable = true,
  searchPlaceholder = "بحث...",
  pageSize = 12,
  emptyText = "لا توجد بيانات",
  onRowClick,
  toolbar,
}: Props<T>) {
  const [persisted, setPersisted] = useState<Persisted>(() => loadPersisted(tableId, columns));
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<{ key: string; dir: "asc" | "desc" } | null>(null);
  const [page, setPage] = useState(0);
  const [dragKey, setDragKey] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem(`dt:${tableId}`, JSON.stringify(persisted));
  }, [tableId, persisted]);

  const colMap = useMemo(() => new Map(columns.map((c) => [c.key, c])), [columns]);
  const visibleCols = persisted.order
    .map((k) => colMap.get(k))
    .filter((c): c is ColumnDef<T> => !!c && !persisted.hidden.includes(c.key));

  const filtered = useMemo(() => {
    let out = rows;
    if (query.trim()) {
      const q = query.trim();
      out = out.filter((r) =>
        columns.some((c) => {
          const v = c.value ? c.value(r) : undefined;
          return v !== undefined && String(v).includes(q);
        }),
      );
    }
    if (sort) {
      const col = colMap.get(sort.key);
      if (col?.value) {
        out = [...out].sort((a, b) => {
          const va = col.value!(a);
          const vb = col.value!(b);
          const cmp =
            typeof va === "number" && typeof vb === "number"
              ? va - vb
              : String(va).localeCompare(String(vb), "ar");
          return sort.dir === "asc" ? cmp : -cmp;
        });
      }
    }
    return out;
  }, [rows, query, sort, columns, colMap]);

  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, pages - 1);
  const pageRows = filtered.slice(safePage * pageSize, (safePage + 1) * pageSize);

  const toggleSort = (key: string) => {
    setSort((s) => (s?.key === key ? (s.dir === "asc" ? { key, dir: "desc" } : null) : { key, dir: "asc" }));
  };

  const moveColumn = (key: string, dir: -1 | 1) => {
    setPersisted((p) => {
      const order = [...p.order];
      const i = order.indexOf(key);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= order.length) return p;
      [order[i], order[j]] = [order[j], order[i]];
      return { ...p, order };
    });
  };

  return (
    <div className="rounded-lg border border-border bg-card">
      {(searchable || toolbar) && (
        <div className="flex flex-wrap items-center gap-2 border-b border-border p-3">
          {searchable && (
            <div className="relative min-w-[220px] flex-1">
              <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setPage(0);
                }}
                placeholder={searchPlaceholder}
                className="ps-9 min-h-[44px]"
              />
            </div>
          )}
          {toolbar}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="min-h-[44px] gap-2">
                <Columns3 className="h-4 w-4" />
                الأعمدة
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              {persisted.order.map((key) => {
                const col = colMap.get(key);
                if (!col) return null;
                const visible = !persisted.hidden.includes(key);
                return (
                  <div key={key} className="flex items-center gap-1 px-2 py-1">
                    <Checkbox
                      checked={visible}
                      onCheckedChange={() =>
                        setPersisted((p) => ({
                          ...p,
                          hidden: visible ? [...p.hidden, key] : p.hidden.filter((k) => k !== key),
                        }))
                      }
                    />
                    <span className="flex-1 text-sm">{col.header}</span>
                    <button className="p-1.5 text-muted-foreground hover:text-foreground" onClick={() => moveColumn(key, 1)} title="تحريك للأمام">
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                    <button className="p-1.5 text-muted-foreground hover:text-foreground" onClick={() => moveColumn(key, -1)} title="تحريك للخلف">
                      <ArrowLeft className="h-3.5 w-3.5" />
                    </button>
                  </div>
                );
              })}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() =>
                  setPersisted({
                    order: columns.map((c) => c.key),
                    hidden: columns.filter((c) => c.defaultVisible === false).map((c) => c.key),
                  })
                }
              >
                <RotateCcw className="me-2 h-4 w-4" />
                إعادة ضبط الترتيب
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              {visibleCols.map((c) => (
                <TableHead
                  key={c.key}
                  draggable
                  onDragStart={() => setDragKey(c.key)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => {
                    if (!dragKey || dragKey === c.key) return;
                    setPersisted((p) => {
                      const order = p.order.filter((k) => k !== dragKey);
                      const i = order.indexOf(c.key);
                      order.splice(i, 0, dragKey);
                      return { ...p, order };
                    });
                    setDragKey(null);
                  }}
                  className={`whitespace-nowrap font-semibold text-foreground ${c.value ? "cursor-pointer select-none" : ""} ${c.className ?? ""}`}
                  onClick={() => c.value && toggleSort(c.key)}
                >
                  <span className="inline-flex items-center gap-1">
                    {c.header}
                    {sort?.key === c.key &&
                      (sort.dir === "asc" ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />)}
                  </span>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={visibleCols.length} className="py-10 text-center text-muted-foreground">
                  {emptyText}
                </TableCell>
              </TableRow>
            ) : (
              pageRows.map((row) => (
                <TableRow
                  key={rowKey(row)}
                  className={onRowClick ? "cursor-pointer hover:bg-muted/40" : ""}
                  onClick={() => onRowClick?.(row)}
                >
                  {visibleCols.map((c) => (
                    <TableCell key={c.key} className={`whitespace-nowrap ${c.className ?? ""}`}>
                      {c.render ? c.render(row) : c.value ? String(c.value(row) ?? "") : ""}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between border-t border-border px-3 py-2 text-xs text-muted-foreground">
        <span className="num">
          {filtered.length} سجل — صفحة {safePage + 1} من {pages}
        </span>
        <div className="flex gap-1">
          <Button variant="outline" size="sm" className="min-h-[36px]" disabled={safePage === 0} onClick={() => setPage(safePage - 1)}>
            السابق
          </Button>
          <Button variant="outline" size="sm" className="min-h-[36px]" disabled={safePage >= pages - 1} onClick={() => setPage(safePage + 1)}>
            التالي
          </Button>
        </div>
      </div>
    </div>
  );
}
