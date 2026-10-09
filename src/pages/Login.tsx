import { useState } from "react";
import { trpc } from "@/providers/trpc";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Lock, User } from "lucide-react";
import { useNavigate } from "react-router";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const login = trpc.auth.login.useMutation();
  const { login: setSession } = useAuth();
  const navigate = useNavigate();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const u = await login.mutateAsync({ username, password });
      setSession(u as any);
      navigate("/");
    } catch (err: any) {
      const msg: string = err?.message ?? "";
      if (msg.includes("fetch") || msg.includes("network"))
        setError("تعذر الاتصال بالخادم — تحقق من الشبكة");
      else setError("اسم المستخدم أو كلمة المرور غير صحيحة");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-navy p-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-24 w-24 items-center justify-center rounded-[24%] bg-white p-3 shadow-2xl border-2 border-[#af915f]/40">
            <img
              src="/maslat-app-icon.png"
              alt="أيقونة مسلة بابل"
              className="h-full w-full object-contain"
            />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#fce1b6] flex items-center justify-center gap-2">
            <span>مسلة بابل</span>
            <span className="text-xs font-bold text-[#facc15] bg-[#af915f]/25 px-2 py-0.5 rounded border border-[#af915f]/40">
              2026
            </span>
          </h1>
          <p className="mt-1 text-xs font-semibold tracking-widest text-[#fce1b6]/80 uppercase">
            MASLATT BABIL ERP PROFESSIONAL
          </p>
          <p className="mt-0.5 text-[11px] text-[#fce1b6]/60">
            نظام الإدارة القانونية والمالية الشامل
          </p>
        </div>
        <Card className="border-0 shadow-xl">
          <CardContent className="p-6">
            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-1.5">
                <Label>اسم المستخدم</Label>
                <div className="relative">
                  <User className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="ps-9 min-h-[44px]"
                    autoComplete="username"
                    required
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>كلمة المرور</Label>
                <div className="relative">
                  <Lock className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="ps-9 min-h-[44px]"
                    autoComplete="current-password"
                    required
                  />
                </div>
              </div>
              {error && (
                <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>
              )}
              <Button type="submit" className="w-full min-h-[44px] bg-navy hover:bg-navy-light" disabled={login.isPending}>
                {login.isPending ? "جاري التحقق..." : "تسجيل الدخول"}
              </Button>
            </form>
          </CardContent>
        </Card>
        <p className="mt-4 text-center text-[11px] text-[#fce1b6]/40">
          MASLAT BABIL ERP PROFESSIONAL 2026
        </p>
      </div>
    </div>
  );
}
