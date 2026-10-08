import { useState } from "react";
import { trpc } from "@/providers/trpc";
import { useAuth } from "@/lib/auth";
import { PageHeader, StatusBadge } from "@/components/common";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import DataTable, { type ColumnDef } from "@/components/DataTable";
import { ROLES } from "@contracts/types";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";

type Row = any;

/** إدارة المستخدمين والصلاحيات */
export default function UsersPage() {
  const q = trpc.auth.list.useQuery();
  const { canDelete, user } = useAuth();
  const create = trpc.auth.create.useMutation();
  const update = trpc.auth.update.useMutation();
  const remove = trpc.auth.remove.useMutation();
  const utils = trpc.useUtils();
  const [showForm, setShowForm] = useState(false);
  const [f, setF] = useState<any>({ role: "viewer" });

  const columns: ColumnDef<Row>[] = [
    { key: "displayName", header: "الاسم", value: (r) => r.displayName },
    { key: "username", header: "اسم المستخدم", value: (r) => r.username, render: (r) => <span className="num">{r.username}</span> },
    {
      key: "role", header: "الدور", value: (r) => ROLES.find((x) => x.code === r.role)?.label ?? r.role,
      render: (r) => (
        <select
          value={r.role}
          disabled={!canDelete || r.username === "admin"}
          onChange={async (e) => {
            await update.mutateAsync({ id: r.id, role: e.target.value as any });
            await utils.auth.invalidate();
            toast.success("تم تحديث الدور");
          }}
          className="h-9 rounded-md border border-input bg-background px-2 text-sm"
        >
          {ROLES.map((x) => <option key={x.code} value={x.code}>{x.label}</option>)}
        </select>
      ),
    },
    { key: "active", header: "الحالة", value: (r) => (r.active ? "نشط" : "معطل"), render: (r) => <StatusBadge value={r.active ? "نشط" : "معطل"} /> },
    {
      key: "actions",
      header: "",
      render: (r) => (
        <div className="flex gap-1">
          {canDelete && r.username !== "admin" && (
            <>
              <Button variant="outline" size="sm" className="min-h-[36px]" onClick={async () => {
                await update.mutateAsync({ id: r.id, active: !r.active });
                await utils.auth.invalidate();
              }}>
                {r.active ? "تعطيل" : "تفعيل"}
              </Button>
              <Button variant="ghost" size="icon" className="min-h-[36px] min-w-[36px]" onClick={async () => {
                if (!confirm(`حذف المستخدم ${r.displayName}؟`)) return;
                try {
                  await remove.mutateAsync({ id: r.id });
                  await utils.auth.invalidate();
                  toast.success("تم الحذف");
                } catch (e: any) {
                  toast.error(e.message);
                }
              }}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </>
          )}
        </div>
      ),
    },
  ];

  const addUser = async () => {
    if (!f.username || !f.password || !f.displayName) return toast.error("أكمل الحقول المطلوبة");
    try {
      await create.mutateAsync({ username: f.username, password: f.password, displayName: f.displayName, role: f.role });
      await utils.auth.invalidate();
      toast.success("تم إنشاء المستخدم");
      setShowForm(false);
      setF({ role: "viewer" });
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <div>
      <PageHeader
        title="المستخدمون والصلاحيات"
        subtitle={`المستخدم الحالي: ${user?.displayName} — ${ROLES.find((r) => r.code === user?.role)?.label}`}
        actions={
          canDelete && (
            <Button onClick={() => setShowForm(!showForm)} className="min-h-[44px] gap-2 bg-navy hover:bg-navy-light">
              <Plus className="h-4 w-4" /> مستخدم جديد
            </Button>
          )
        }
      />

      {showForm && (
        <Card className="mb-4">
          <CardContent className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-4">
            <div className="space-y-1.5">
              <Label>الاسم</Label>
              <Input value={f.displayName ?? ""} onChange={(e) => setF({ ...f, displayName: e.target.value })} className="min-h-[44px]" />
            </div>
            <div className="space-y-1.5">
              <Label>اسم المستخدم</Label>
              <Input value={f.username ?? ""} onChange={(e) => setF({ ...f, username: e.target.value })} className="min-h-[44px]" dir="ltr" />
            </div>
            <div className="space-y-1.5">
              <Label>كلمة المرور</Label>
              <Input type="password" value={f.password ?? ""} onChange={(e) => setF({ ...f, password: e.target.value })} className="min-h-[44px]" dir="ltr" />
            </div>
            <div className="space-y-1.5">
              <Label>الدور</Label>
              <select value={f.role} onChange={(e) => setF({ ...f, role: e.target.value })} className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm">
                {ROLES.map((r) => <option key={r.code} value={r.code}>{r.label}</option>)}
              </select>
            </div>
            <div className="sm:col-span-4 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowForm(false)} className="min-h-[44px]">إلغاء</Button>
              <Button onClick={addUser} disabled={create.isPending} className="min-h-[44px] bg-navy hover:bg-navy-light">إنشاء</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <DataTable tableId="users" columns={columns} rows={q.data ?? []} rowKey={(r) => r.id} searchable={false} />

      <Card className="mt-4">
        <CardHeader><CardTitle className="text-base">مصفوفة الصلاحيات</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-muted-foreground">
                <th className="p-2 text-start">الدور</th>
                <th className="p-2 text-start">الوحدات</th>
                <th className="p-2 text-start">تعديل</th>
                <th className="p-2 text-start">حذف</th>
              </tr>
            </thead>
            <tbody>
              {[
                { role: "admin", label: "مدير النظام", desc: "كل الوحدات", edit: true, del: true },
                { role: "manager", label: "مدير مكتب", desc: "كل الوحدات عدا إدارة المستخدمين", edit: true, del: true },
                { role: "data_entry", label: "موظف إدخال", desc: "العمليات اليومية بدون حذف أو تقارير إدارية", edit: true, del: false },
                { role: "lawyer", label: "محامٍ", desc: "المحامون والمهام والجلسات والتقويم والمراسلات", edit: true, del: false },
                { role: "viewer", label: "مشاهدة فقط", desc: "عرض كل الوحدات بدون تعديل", edit: false, del: false },
              ].map((r) => (
                <tr key={r.role} className="border-b last:border-0">
                  <td className="p-2 font-semibold">{r.label}</td>
                  <td className="p-2 text-muted-foreground">{r.desc}</td>
                  <td className="p-2">{r.edit ? "نعم" : "لا"}</td>
                  <td className="p-2">{r.del ? "نعم" : "لا"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
