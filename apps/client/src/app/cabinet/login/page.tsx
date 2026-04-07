"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BrandLogoFull } from "@/components/brand-logo";
import { Eye, EyeOff, Loader2, ArrowLeft, CheckCircle2, Mail } from "lucide-react";

type View = "login" | "forgot" | "forgot-success";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [view, setView] = useState<View>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const urlError = searchParams.get("error");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError("Невірний email або пароль.");
      setLoading(false);
    } else {
      router.push("/cabinet");
      router.refresh();
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/cabinet`,
    });
    if (error) {
      setError("Не вдалося надіслати лист. Перевірте email.");
    } else {
      setView("forgot-success");
    }
    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        {/* Logo */}
        <div className="text-center">
          <Link href="/" aria-label="U:DO CRAFT" className="inline-block">
            <BrandLogoFull className="h-8 w-auto mx-auto text-primary" color="var(--color-primary, #1B18AC)" />
          </Link>
          <p className="text-muted-foreground text-sm mt-2">Особистий кабінет</p>
        </div>

        <div className="bg-white rounded-2xl border border-border p-6 space-y-4">
          {urlError === "invalid-token" && (
            <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
              Посилання недійсне або застаріло. Спробуйте ще раз.
            </div>
          )}

          {view === "login" && (
            <>
              <div>
                <h1 className="font-semibold text-lg">Вхід</h1>
                <p className="text-sm text-muted-foreground mt-0.5">Введіть дані для доступу до кабінету</p>
              </div>
              <form onSubmit={handleLogin} className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="hr@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Пароль</Label>
                    <button
                      type="button"
                      onClick={() => { setView("forgot"); setError(null); }}
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Забули пароль?
                    </button>
                  </div>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoComplete="current-password"
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      tabIndex={-1}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
                  {loading ? "Входимо..." : "Увійти"}
                </Button>
              </form>
            </>
          )}

          {view === "forgot" && (
            <>
              <button
                onClick={() => { setView("login"); setError(null); }}
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="size-3.5" /> Назад
              </button>
              <div>
                <h1 className="font-semibold text-lg">Відновлення паролю</h1>
                <p className="text-sm text-muted-foreground mt-0.5">Надішлемо посилання на ваш email</p>
              </div>
              <form onSubmit={handleForgot} className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="reset-email">Email</Label>
                  <Input
                    id="reset-email"
                    type="email"
                    placeholder="hr@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? <Loader2 className="size-4 animate-spin mr-2" /> : <Mail className="size-4 mr-2" />}
                  {loading ? "Надсилаємо..." : "Надіслати посилання"}
                </Button>
              </form>
            </>
          )}

          {view === "forgot-success" && (
            <div className="text-center space-y-4 py-2">
              <div className="inline-flex items-center justify-center size-12 rounded-full bg-emerald-100">
                <CheckCircle2 className="size-6 text-emerald-600" />
              </div>
              <div>
                <h2 className="font-semibold">Лист надіслано</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Перевірте <span className="font-medium text-foreground">{email}</span> та перейдіть за посиланням.
                </p>
              </div>
              <Button variant="outline" className="w-full" onClick={() => { setView("login"); setError(null); }}>
                Повернутись до входу
              </Button>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-muted-foreground">
          <Link href="/" className="hover:text-foreground transition-colors">← Повернутись на сайт</Link>
        </p>
      </div>
    </main>
  );
}

export default function CabinetLoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
