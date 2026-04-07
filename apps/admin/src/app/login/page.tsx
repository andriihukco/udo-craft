"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, Eye, EyeOff, Loader2, LogIn, Mail } from "lucide-react";
import { AuthShell } from "@/components/auth-shell";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type View = "login" | "forgot" | "forgot-success";

export default function LoginPage() {
  const [view, setView] = useState<View>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const switchView = (next: View) => { setView(next); setError(null); };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    let supabase;

    try {
      supabase = createClient();
    } catch {
      setError("Не вдалося ініціалізувати вхід. Перевірте налаштування середовища.");
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      if (error.message.includes("Invalid login credentials")) {
        setError("Невірний email або пароль.");
      } else if (error.message.includes("Email not confirmed")) {
        setError("Email ще не підтверджено. Перевірте поштову скриньку.");
      } else {
        setError("Щось пішло не так. Спробуйте пізніше.");
      }
      setLoading(false);
    } else {
      router.push("/");
      router.refresh();
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    let supabase;

    try {
      supabase = createClient();
    } catch {
      setError("Не вдалося ініціалізувати відновлення. Перевірте налаштування середовища.");
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    });
    if (error) {
      setError("Не вдалося надіслати лист. Перевірте email.");
    } else {
      setView("forgot-success");
    }
    setLoading(false);
  };

  return (
    <AuthShell
      title={
        view === "login" ? "Вхід до панелі"
        : view === "forgot" ? "Відновлення паролю"
        : "Лист уже в дорозі"
      }
      description={
        view === "login" ? "Введіть дані для доступу до адміністративної панелі."
        : view === "forgot" ? "Вкажіть email і ми надішлемо посилання для скидання паролю."
        : "Інструкції для відновлення відправлені на вказану адресу."
      }
    >
      <Card>
        <CardContent className="pt-6 space-y-4">
          {view === "login" && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="admin@u-do-craft.store" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Пароль</Label>
                  <button type="button" onClick={() => switchView("forgot")} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                    Забули пароль?
                  </button>
                </div>
                <div className="relative">
                  <Input id="password" type={showPassword ? "text" : "password"} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" className="pr-10" />
                  <button type="button" onClick={(e) => { e.preventDefault(); setShowPassword(!showPassword); }} tabIndex={-1} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? <Loader2 className="size-4 animate-spin" /> : <LogIn className="size-4" />}
                {loading ? "Входимо..." : "Увійти"}
              </Button>
            </form>
          )}

          {view === "forgot" && (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <button onClick={() => switchView("login")} type="button" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="size-3.5" /> Назад до входу
              </button>
              <div className="space-y-2">
                <Label htmlFor="reset-email">Email</Label>
                <Input id="reset-email" type="email" placeholder="admin@u-do-craft.store" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? <Loader2 className="size-4 animate-spin" /> : <Mail className="size-4" />}
                {loading ? "Надсилаємо..." : "Надіслати посилання"}
              </Button>
            </form>
          )}

          {view === "forgot-success" && (
            <div className="space-y-4 text-center">
              <div className="flex justify-center">
                <div className="rounded-full bg-emerald-100 p-4">
                  <CheckCircle2 className="size-8 text-emerald-600" />
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Ми надіслали інструкції на <span className="font-medium text-foreground">{email}</span>.
              </p>
              <Button variant="outline" className="w-full" onClick={() => switchView("login")}>
                Повернутись до входу
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </AuthShell>
  );
}
