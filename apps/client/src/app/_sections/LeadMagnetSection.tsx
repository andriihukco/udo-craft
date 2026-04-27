"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { ArrowRight, Sparkles, Gift } from "lucide-react";

export function LeadMagnetSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    // Simulate submission — in production, POST to /api/leads or email service
    await new Promise((r) => setTimeout(r, 800));
    setSubmitted(true);
    setLoading(false);
  };

  return (
    <section
      ref={ref}
      className="bg-primary py-16 sm:py-20 overflow-hidden relative"
      aria-labelledby="lead-magnet-heading"
    >
      {/* Subtle radial glow */}
      <div
        className="absolute inset-0 opacity-30 pointer-events-none"
        style={{ backgroundImage: "radial-gradient(ellipse at 70% 50%, rgba(255,255,255,0.15) 0%, transparent 60%)" }}
        aria-hidden="true"
      />

      <div className="max-w-6xl mx-auto px-5 sm:px-10 lg:px-20 relative">
        <div className="grid lg:grid-cols-[1fr_auto] gap-10 items-center">

          {/* Left */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="flex items-center gap-2 mb-4">
              <Gift className="w-4 h-4 text-white/60" aria-hidden="true" />
              <span className="text-white/60 text-xs font-semibold uppercase tracking-[0.18em]">
                Безкоштовно
              </span>
            </div>
            <h2 id="lead-magnet-heading" className="text-white text-3xl sm:text-4xl font-black tracking-tight leading-tight mb-3">
              Отримай безкоштовний мокап свого мерчу
            </h2>
            <p className="text-white/55 text-sm leading-relaxed max-w-md">
              Завантаж логотип — ми накладемо його на реальний виріб і надішлемо мокап на пошту. Без реєстрації, без зобов'язань.
            </p>
          </motion.div>

          {/* Right — CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="shrink-0"
          >
            {submitted ? (
              <div className="flex items-center gap-3 bg-white/15 border border-white/20 rounded-2xl px-6 py-4">
                <Sparkles className="w-5 h-5 text-white" aria-hidden="true" />
                <div>
                  <p className="text-white font-bold text-sm">Дякуємо!</p>
                  <p className="text-white/60 text-xs mt-0.5">Мокап надійде на пошту протягом 24 год</p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2" aria-label="Форма отримання мокапу">
                <div>
                  <label htmlFor="lead-email" className="sr-only">Ваш email</label>
                  <input
                    id="lead-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full sm:w-64 px-4 py-3 rounded-full bg-white/10 border border-white/20 text-white placeholder:text-white/35 text-sm focus:outline-none focus:border-white/50 focus:bg-white/15 transition-all duration-200"
                    aria-required="true"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center justify-center gap-2 bg-white text-primary font-bold text-sm px-6 py-3 rounded-full hover:bg-white/90 active:scale-[0.97] transition-all duration-200 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-primary whitespace-nowrap"
                  aria-label={loading ? "Надсилання..." : "Отримати мокап"}
                >
                  {loading ? (
                    <span className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" aria-hidden="true" />
                  ) : (
                    <>Отримати мокап <ArrowRight className="w-4 h-4" aria-hidden="true" /></>
                  )}
                </button>
              </form>
            )}
            <p className="text-white/30 text-[10px] mt-2 text-center sm:text-left">
              Або одразу{" "}
              <Link href="/order" className="underline underline-offset-2 hover:text-white/60 transition-colors">
                спробуй редактор
              </Link>
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
