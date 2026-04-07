"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Eye, EyeOff, KeyRound, Loader2 } from "lucide-react";
import { AuthShell } from "@/components/auth-shell";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 8) { setError("Пароль має містити щонайменше 8 символів."); return; }
    if (password !== confirmPassword) { setError("Паролі не збігаються."); return; }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setError("Не вдалося оновити пароль. Посилання могло застаріти.");
      setLoading(false);
      return;
    }
    setSuccess(true);
    setTimeout(() => router.push("/"), 2000);
  };

  if (success) {
    return (
      <AuthShell title="Пароль оновлено" description="Зміни збережено. Зараз повернемо вас до панелі.">
        <Card>
          <CardContent className="pt-6 flex flex-col items-center gap-4 text-center">
            <div className="rounded-full bg-emerald-100 p-4">
              <CheckCircle2 className="size-8 text-emerald-600" />
            </div>
            <p className="text-sm text-muted-foreground">Перенаправляємо до панелі...</p>
          </CardContent>
        </Card>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Новий пароль" description="Придумайте надійний пароль. Мінімум 8 символів.">
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleReset} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">Новий пароль</Label>
              <div className="relative">
                <Input id="new-password" type={showPassword ? "text" : "password"} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="new-password" className="pr-10" />
                <button type="button" onClick={(e) => { e.preventDefault(); setShowPassword(!showPassword); }} tabIndex={-1} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Підтвердьте пароль</Label>
              <Input id="confirm-password" type={showPassword ? "text" : "password"} placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required autoComplete="new-password" />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? <Loader2 className="size-4 animate-spin" /> : <KeyRound className="size-4" />}
              {loading ? "Зберігаємо..." : "Зберегти пароль"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </AuthShell>
  );
}
