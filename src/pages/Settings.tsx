import { useState } from "react";
import { trpc } from "@/providers/trpc";
import { useAuth } from "@/lib/auth";
import { PageHeader } from "@/components/common";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";

function LookupManager({ title, list, create, remove, invalidateKey }: {
  title: string;
  list: any[] | undefined;
  create: any;
  remove: any;
  invalidateKey: () => Promise<void>;
}) {
  const [name, setName] = useState("");
  return (
    <Card>
      <CardHeader><CardTitle className="text-base">{title}</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-2">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={`إضافة ${title}...`} className="min-h-[44px]" />
          <Button
            className="min-h-[44px] gap-1 bg-navy hover:bg-navy-light"
            onClick={async () => {
              if (!name.trim()) return;
              await create.mutateAsync({ name });
              setName("");
              await invalidateKey();
              toast.success("تمت الإضافة");
            }}
          >
            <Plus className="h-4 w-4" /> إضافة
          </Button>
        </div>
        <div className="space-y-1">
          {(list ?? []).map((x: any) => (
            <div key={x.id} className="flex items-center justify-between rounded border border-border px-3 py-2 text-sm">
              <span>{x.name}</span>
              <button
                className="p-2 text-destructive"
                onClick={async () => {
                  if (!confirm(`حذف «${x.name}»؟`)) return;
                  try {
                    await remove.mutateAsync({ id: x.id });
                    await invalidateKey();
                  } catch {
                    toast.error("لا يمكن الحذف — مرتبط بسجلات موجودة");
                  }
                }}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          {(list ?? []).length === 0 && <p className="text-sm text-muted-foreground">لا توجد عناصر</p>}
        </div>
      </CardContent>
    </Card>
  );
}

/** الإعدادات: إدارة المحاكم والقضاة ومديريات التنفيذ */
export default function Settings() {
  const { canEdit } = useAuth();
  const utils = trpc.useUtils();
  const courts = trpc.lookups.courts.list.useQuery();
  const judges = trpc.lookups.judges.list.useQuery();
  const dirs = trpc.lookups.directorates.list.useQuery();
  const createCourt = trpc.lookups.courts.create.useMutation();
  const removeCourt = trpc.lookups.courts.remove.useMutation();
  const createJudge = trpc.lookups.judges.create.useMutation();
  const removeJudge = trpc.lookups.judges.remove.useMutation();
  const createDir = trpc.lookups.directorates.create.useMutation();
  const removeDir = trpc.lookups.directorates.remove.useMutation();

  if (!canEdit) return <div className="py-10 text-center text-muted-foreground">الإعدادات متاحة للمستخدمين ذوي صلاحية التعديل</div>;

  return (
    <div>
      <PageHeader title="الإعدادات" subtitle="القوائم المرجعية: المحاكم، القضاة، مديريات التنفيذ" />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <LookupManager title="المحاكم" list={courts.data} create={createCourt} remove={removeCourt} invalidateKey={() => utils.lookups.invalidate()} />
        <LookupManager title="القضاة" list={judges.data} create={createJudge} remove={removeJudge} invalidateKey={() => utils.lookups.invalidate()} />
        <LookupManager title="مديريات التنفيذ" list={dirs.data} create={createDir} remove={removeDir} invalidateKey={() => utils.lookups.invalidate()} />
      </div>
    </div>
  );
}
