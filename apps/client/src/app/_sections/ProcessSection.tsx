"use client";

import Link from "next/link";
import { useRef, useState, useEffect } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { HighlightText } from "@/app/_components/HighlightText";

const STEPS = [
  {
    number: "1",
    title: "Обери товар",
    body: "Переглядай каталог з реальними цінами. Худі, футболки, аксесуари — ціна оновлюється одразу при зміні кількості та типу нанесення. Жодних дзвінків, щоб дізнатись вартість.",
    cta: "Відкрити каталог",
    href: "#collections",
    time: "~5 хв",
  },
  {
    number: "2",
    title: "Кастомуй онлайн",
    body: "Завантаж логотип, постав на виріб, обери зону нанесення. Редактор показує точну вартість кожної зони в реальному часі. Бачиш результат — без листів і погоджень.",
    cta: "Спробувати редактор",
    href: "/order",
    time: "~10 хв",
  },
  {
    number: "3",
    title: "Отримай рахунок",
    body: "Заповни форму — менеджер зв'яжеться протягом 2 годин. Фіксована ціна без прихованих доплат. Рахунок-фактура одразу після підтвердження деталей.",
    cta: "Написати нам",
    href: "#contact",
    time: "~2 год",
  },
  {
    number: "4",
    title: "Отримай мерч",
    body: "Виробництво 7–14 робочих днів. Доставка Новою Поштою по всій Україні. Кожна партія перевіряється перед відправкою — якщо щось не так, переробляємо безкоштовно.",
    cta: "Читати FAQ",
    href: "#faq",
    time: "7–14 днів",
  },
];

// Desktop: horizontal timeline, one step at a time, slow and deliberate
function DesktopTimeline({ isInView }: { isInView: boolean }) {
  const [active, setActive] = useState(0);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    if (isInView && !started) setStarted(true);
  }, [isInView, started]);

  // Slow auto-advance: 3.5s per step
  useEffect(() => {
    if (!started) return;
    if (active >= STEPS.length - 1) return;
    const t = setTimeout(() => setActive((s) => s + 1), 3500);
    return () => clearTimeout(t);
  }, [active, started]);

  const progress = active / (STEPS.length - 1);

  return (
    <div className="hidden lg:block">
      {/* Progress track */}
      <div className="relative mb-16" role="tablist" aria-label="Кроки процесу">
        {/* Background track */}
        <div className="absolute top-5 left-0 right-0 h-[2px] bg-border" aria-hidden="true" />
        {/* Filled track */}
        <motion.div
          className="absolute top-5 left-0 h-[2px] bg-primary origin-left"
          animate={{ width: `${progress * 100}%` }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          aria-hidden="true"
        />

        {/* Step nodes */}
        <div className="relative flex justify-between">
          {STEPS.map((step, i) => {
            const isPast = i < active;
            const isCurrent = i === active;
            return (
              <button
                key={step.number}
                role="tab"
                aria-selected={isCurrent}
                aria-label={`Крок ${step.number}: ${step.title}`}
                onClick={() => setActive(i)}
                className="flex flex-col items-center gap-3 group"
              >
                {/* Node */}
                <motion.div
                  animate={{
                    backgroundColor: isPast || isCurrent ? "var(--color-primary)" : "var(--color-background)",
                    borderColor: isPast || isCurrent ? "var(--color-primary)" : "var(--color-border)",
                    scale: isCurrent ? 1.2 : 1,
                  }}
                  transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  className="w-10 h-10 rounded-full border-2 flex items-center justify-center relative z-10 bg-background"
                >
                  <motion.span
                    animate={{ color: isPast || isCurrent ? "white" : "var(--color-muted-foreground)" }}
                    className="text-xs font-black tabular-nums"
                  >
                    {step.number}
                  </motion.span>
                </motion.div>

                {/* Label */}
                <motion.span
                  animate={{
                    color: isCurrent ? "var(--color-foreground)" : "var(--color-muted-foreground)",
                    fontWeight: isCurrent ? 700 : 500,
                  }}
                  className="text-xs text-center max-w-[80px] leading-tight"
                >
                  {step.title}
                </motion.span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active step — large, editorial, lots of space */}
      <div style={{ minHeight: 220 }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="grid grid-cols-[1fr_auto] gap-12 items-start"
            role="tabpanel"
            aria-label={`Крок ${STEPS[active].number}: ${STEPS[active].title}`}
          >
            <div>
              {/* Large step number — decorative */}
              <span className="text-[80px] font-black text-border leading-none select-none block mb-4" aria-hidden="true">
                {STEPS[active].number}
              </span>
              <h3 className="text-2xl font-black text-foreground tracking-tight mb-4">
                {STEPS[active].title}
              </h3>
              <p className="text-muted-foreground text-base leading-relaxed max-w-xl">
                {STEPS[active].body}
              </p>
            </div>

            <div className="flex flex-col items-end gap-4 pt-2 shrink-0">
              <div className="text-right">
                <p className="text-2xl font-black text-foreground">{STEPS[active].time}</p>
                <p className="text-xs text-muted-foreground mt-0.5">час</p>
              </div>
              <Link
                href={STEPS[active].href}
                className="inline-flex items-center gap-2 bg-primary text-white font-semibold text-sm px-6 py-3 rounded-full hover:bg-primary/90 active:scale-[0.97] transition-all duration-200 whitespace-nowrap"
              >
                {STEPS[active].cta} <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </Link>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

// Mobile: vertical, stacked, no cards — just text with left border
function MobileTimeline() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <div ref={ref} className="lg:hidden">
      {STEPS.map((step, i) => (
        <motion.div
          key={step.number}
          initial={{ opacity: 0, x: -16 }}
          animate={isInView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.6, delay: i * 0.15, ease: [0.22, 1, 0.36, 1] }}
          className="flex gap-6 pb-12 last:pb-0"
        >
          {/* Left: number + line */}
          <div className="flex flex-col items-center gap-0 shrink-0">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
              <span className="text-white text-xs font-black">{step.number}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className="w-px flex-1 bg-border mt-3" aria-hidden="true" />
            )}
          </div>

          {/* Right: content — no card, just text */}
          <div className="pt-1 pb-4">
            <div className="flex items-center gap-3 mb-3">
              <h3 className="font-bold text-foreground text-lg">{step.title}</h3>
              <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{step.time}</span>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed mb-4">{step.body}</p>
            <Link href={step.href}
              className="inline-flex items-center gap-1.5 text-primary text-sm font-semibold hover:gap-2.5 transition-all duration-200">
              {step.cta} <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </Link>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

export function ProcessSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="how" className="bg-background py-24 sm:py-32" aria-labelledby="process-heading">
      <div className="max-w-4xl mx-auto px-5 sm:px-10 lg:px-8">
        <motion.div ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="mb-16"
        >
          <h2 id="process-heading" className="text-3xl sm:text-4xl font-black tracking-tight mb-4">
            Від ідеї до мерчу —{" "}
            <HighlightText delay={0.5}>за 4 кроки</HighlightText>
          </h2>
          <p className="text-muted-foreground text-base leading-relaxed max-w-lg">
            Весь процес займає менше 15 хвилин вашого часу. Ціни видно одразу — без дзвінків і переговорів.
          </p>
        </motion.div>

        <DesktopTimeline isInView={isInView} />
        <MobileTimeline />
      </div>
    </section>
  );
}
