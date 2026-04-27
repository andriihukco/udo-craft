"use client";

import { Suspense, useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { BrandLogoFull } from "@/components/brand-logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Eye, EyeOff, Loader2, ArrowLeft, CheckCircle2,
  User, Mail, Lock, Building2, Phone,
} from "lucide-react";
import { cn } from "@/lib/utils";

type View = "register" | "verify";

function OTPInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const inputs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = value.padEnd(6, "").split("").slice(0, 6);

  const handleChange = (i: number, v: string) => {
    const clean = v.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[i] = clean;
    onChange(next.join(""));
    if (clean && i < 5) inputs.current[i + 1]?.focus();
  };

  const handleKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !digits[i] && i > 0) inputs.current[i - 1]?.focus();
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    onChange(pasted);
    inputs.current[Math.min(pasted.length, 5)]?.focus();
  };

  return (
    <div className="flex gap-2 justify-center" onPaste={handlePaste}>
      {Array.from({ length: 6 }).map((_, i) => (
        <input key={i} ref={(el) => { inputs.current[i] = el; }}
          type="text" inputMode="numeric" maxLength={1}
          value={digits[i] || ""}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          className={cn(
            "w-11 h-14 text-center text-xl font-bold rounded-xl border-2 bg-card outline-none transition-all",
            "focus:border-primary focus:ring-2 focus:ring-primary/20",
            digits[i] ? "border-primary text-primary" : "border-border text-foreground"
          )}
        />
      ))}
    </div>
  );
}

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: "8+ символів", ok: password.length >= 8 },
    { label: "Велика літера", ok: /[A-Z]/.test(password) },
    { label: "Цифра", ok: /\d/.test(password) },
  ];
  const score = checks.filter((c) => c.ok).length;
  const colors = ["bg-destructive", "bg-orange-400", "bg-yellow-400", "bg-emerald-500"];
  const labels = ["Слабкий", "Слабкий", "Середній", "Надійний"];

  return (
    <div className="space-y-1.5">
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <div key={i} className={cn("h-1 flex-1 rounded-full transition-all duration-300", i < score ? colors[score] : "bg-border")} />
        ))}
      </div>
      <div className="flex items-center justify-between">
        <span className={cn("text-xs font-medium", score === 3 ? "text-emerald-600" : score === 2 ? "text-yellow-600" : "text-muted-foreground")}>
          {labels[score]}
        </span>
        <div className="flex gap-2">
          {checks.map((c) => (
            <span key={c.label} className={cn("text-xs", c.ok ? "text-emerald-600" : "text-muted-foreground")}>
              {c.ok ? "✓" : "·"} {c.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const returnTo = searchParams.get("returnTo") || "/cabinet";

  const [view, setView] = useState<View>("register");
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [sentOtp, setSentOtp] = useState("");
  const [otpInput, setOtpInput] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  const sendOtp = async (targetEmail: string, targetName: string): Promise<string> => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    await fetch("/api/auth/send-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: targetEmail, otp: code, name: targetName, type: "register" }),
    });
    return code;
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    if (password.length < 8) { setError("Пароль має містити щонайменше 8 символів."); setLoading(false); return; }
    try {
      // Check if email already exists before sending OTP
      const checkRes = await fetch("/api/auth/check-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (checkRes.ok) {
        const { exists } = await checkRes.json();
        if (exists) {
          setError("Цей email вже зареєстровано. Увійдіть або скористайтесь відновленням паролю.");
          setLoading(false);
          return;
        }
      }
      const code = await sendOtp(email, name);
      setSentOtp(code);
      setOtpInput("");
      setOtpError(null);
      setView("verify");
      setResendCooldown(60);
    } catch {
      setError("Не вдалося надіслати код. Спробуйте ще раз.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (otpInput.length !== 6) return;
    setVerifying(true);
    setOtpError(null);
    if (otpInput !== sentOtp) {
      setOtpError("Невірний код. Перевірте email та спробуйте ще раз.");
      setVerifying(false);
      return;
    }
    const { error: signUpError } = await supabase.auth.signUp({
      email, password,
      options: {
        data: { full_name: name, company, phone },
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/cabinet`,
      },
    });
    if (signUpError) {
      setOtpError(signUpError.message.includes("already registered")
        ? "Цей email вже зареєстровано. Спробуйте увійти."
        : "Помилка реєстрації. Спробуйте ще раз.");
      setVerifying(false);
      return;
    }
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    setVerifying(false);
    if (!signInError) {
      router.push(returnTo);
      router.refresh();
    } else {
      router.push("/cabinet/login?registered=1");
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setResendCooldown(60);
    setOtpError(null);
    const code = await sendOtp(email, name);
    setSentOtp(code);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#f0f0ff] via-background to-background flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm space-y-6">
        {/* Logo */}
        <div className="text-center">
          <Link href="/" aria-label="U:DO CRAFT" className="inline-block">
            <BrandLogoFull className="h-8 w-auto mx-auto" />
          </Link>
          <p className="text-muted-foreground text-sm mt-2">Реєстрація</p>
        </div>

        {/* Card */}
        <div className="bg-card rounded-2xl border border-border shadow-sm p-6 space-y-5">

          {view === "register" && (
            <>
              <div>
                <h1 className="font-bold text-xl">Створити акаунт</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Вже є акаунт?{" "}
                  <Link
                    href={`/cabinet/login${returnTo !== "/cabinet" ? `?returnTo=${encodeURIComponent(returnTo)}` : ""}`}
                    className="text-primary font-medium hover:underline"
                  >
                    Увійти
                  </Link>
                </p>
              </div>

              <form onSubmit={handleRegister} className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="name">Ваше ім&apos;я *</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input id="name" type="text" placeholder="Іван Петренко" value={name}
                      onChange={(e) => setName(e.target.value)} required autoComplete="name" className="pl-9" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="company">Компанія</Label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input id="company" type="text" placeholder="Назва компанії" value={company}
                      onChange={(e) => setCompany(e.target.value)} autoComplete="organization" className="pl-9" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="phone">Телефон</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input id="phone" type="tel" placeholder="+380 XX XXX XX XX" value={phone}
                      onChange={(e) => setPhone(e.target.value)} autoComplete="tel" className="pl-9" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="email">Email *</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input id="email" type="email" placeholder="hr@company.com" value={email}
                      onChange={(e) => setEmail(e.target.value)} required autoComplete="email" className="pl-9" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="password">Пароль *</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input id="password" type={showPassword ? "text" : "password"} placeholder="Мінімум 8 символів"
                      value={password} onChange={(e) => setPassword(e.target.value)}
                      required autoComplete="new-password" className="pl-9 pr-10" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} tabIndex={-1}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                  {password && <PasswordStrength password={password} />}
                </div>

                {error && <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>}

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="size-4 animate-spin mr-2" />}
                  {loading ? "Надсилаємо код..." : "Продовжити"}
                </Button>
              </form>
            </>
          )}

          {view === "verify" && (
            <>
              <button onClick={() => { setView("register"); setOtpInput(""); setOtpError(null); }}
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="size-3.5" /> Назад
              </button>

              <div className="text-center space-y-1">
                <div className="inline-flex items-center justify-center size-12 rounded-full bg-primary/10 mb-2">
                  <Mail className="size-6 text-primary" />
                </div>
                <h2 className="font-bold text-xl">Перевірте email</h2>
                <p className="text-sm text-muted-foreground">
                  Ми надіслали 6-значний код на{" "}
                  <span className="font-medium text-foreground">{email}</span>
                </p>
              </div>

              <div className="space-y-4">
                <OTPInput value={otpInput} onChange={(v) => { setOtpInput(v); setOtpError(null); }} />
                {otpError && (
                  <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm text-center">{otpError}</div>
                )}
                <Button className="w-full" onClick={handleVerify} disabled={otpInput.length !== 6 || verifying}>
                  {verifying ? <Loader2 className="size-4 animate-spin mr-2" /> : <CheckCircle2 className="size-4 mr-2" />}
                  {verifying ? "Перевіряємо..." : "Підтвердити"}
                </Button>
                <p className="text-center text-sm text-muted-foreground">
                  Не отримали код?{" "}
                  {resendCooldown > 0 ? (
                    <span>Повторно через {resendCooldown}с</span>
                  ) : (
                    <button onClick={handleResend} className="text-primary font-medium hover:underline">
                      Надіслати ще раз
                    </button>
                  )}
                </p>
              </div>
            </>
          )}
        </div>

        <p className="text-center text-xs text-muted-foreground">
          <Link href="/" className="hover:text-foreground transition-colors">← Повернутись на сайт</Link>
        </p>
      </div>
    </main>
  );
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  );
}
