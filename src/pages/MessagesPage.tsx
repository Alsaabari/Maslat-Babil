import { trpc } from "@/providers/trpc";
import DataTable, { type ColumnDef } from "@/components/DataTable";
import { PageHeader } from "@/components/common";
import { fmtDate } from "@/lib/format";

type Row = any;

const columns: ColumnDef<Row>[] = [
  { key: "createdAt", header: "التاريخ", value: (r) => fmtDate(r.createdAt), render: (r) => <span className="num">{fmtDate(r.createdAt)}</span> },
  { key: "recipientName", header: "المستلم", value: (r) => r.recipientName },
  { key: "recipientType", header: "النوع", value: (r) => (r.recipientType === "lawyer" ? "محامٍ" : "زبون"), render: (r) => r.recipientType === "lawyer" ? "محامٍ" : "زبون" },
  { key: "phone", header: "الهاتف", value: (r) => r.phone ?? "", render: (r) => <span className="num">{r.phone ?? "—"}</span> },
  { key: "fileNumber", header: "رقم الملف", value: (r) => r.fileNumber ?? "", render: (r) => r.fileNumber ? <span className="num font-bold">{r.fileNumber}</span> : <span className="text-muted-foreground">—</span> },
  { key: "body", header: "الرسالة", value: (r) => r.body, render: (r) => <span className="line-clamp-2 max-w-md whitespace-pre-wrap text-xs">{r.body}</span> },
  { key: "status", header: "الحالة", value: (r) => r.status },
];

/** سجل المراسلات */
export default function MessagesPage() {
  const q = trpc.messaging.list.useQuery();
  return (
    <div>
      <PageHeader title="المراسلات" subtitle="سجل المراسلات الصادرة عبر مركز التواصل — تُفتح المراسلات الجديدة من أيقونة WhatsApp في الشاشات" />
      <DataTable
        tableId="messages"
        columns={columns}
        rows={q.data ?? []}
        rowKey={(r) => r.id}
        searchPlaceholder="بحث بالمستلم، الهاتف، رقم الملف..."
        emptyText="لا توجد مراسلات مسجلة"
      />
    </div>
  );
}
