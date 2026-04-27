"use client";

import Link from "next/link";
import { useRef, useState, useEffect } from "react";
import { motion, useInView, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { ArrowRight, MousePointer2, Palette, FileText, Package } from "lucide-react";

const STEPS = [
  {
    icon: MousePointer2,
    title: "Обери товар",
    desc: "Переглядай каталог, фільтруй за категоріями. Худі, футболки, аксесуари — все з реальними цінами.",
    detail: "Ціни оновлюються в реальному часі залежно від кількості та типу нанесення.",
    cta: "До каталогу",
    href: "#collections",
    time: "5 хв",
  },
  {
    icon: Palette,
    title: "Кастомуй онлайн",
    desc: "Завантаж логотип, обери зону нанесення, розмір та колір. Бачиш результат одразу — без листів і погоджень.",
    detail: "Редактор показує точну вартість нанесення для кожної зони та типу друку.",
    cta: "Спробувати",
    href: "/order",
    time: "10 хв",
  },
  {
    icon: FileText,
    title: "Отримай рахунок",
    desc: "Заповни форму. Менеджер зв'яжеться протягом 2 годин, погодить деталі та надішле рахунок-фактуру.",
    detail: "Фіксована ціна без прихованих доплат. Рахунок-фактура одразу після підтвердження.",
    cta: "Замовити",
    href: "#contact",
    time: "2 год",
  },
  {
    icon: Package,
    title: "Отримай мерч",
    desc: "Виробництво 7–14 днів. Доставка Новою Поштою по всій Україні. Кожна партія перевіряється.",
    detail: "Якщо виріб не відповідає погодженому макету — переробляємо безкоштовно.",
    cta: "Деталі",
    href: "#faq",
    time: "7–14 днів",
  },
];

// Desktop: horizontal timeline with scroll-driven active step
function DesktopTimeline() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeStep, setActiveStep] = useState(0);
  const isInView = useInView(containerRef, { once: false, margin: "-20%" });

  // Auto-advance steps when section is in view
  useEffect(() => {
    if (!isInView) return;
    const interval = setInterval(() => {
      setActiveStep((s) => (s < STEPS.length - 1 ? s + 1 : s));
    }, 1800);
    return () => clearInterval(interval);
  }, [isInView]);

  // Reset when out of view
  useEffect(() => {
    if (!isInView) setActiveStep(0);
  }, [isInView]);

  return (
    <div ref={containerRef} className="hidden lg:block">
      {/* Step indicators */}
      <div className="relative flex items-start gap-0 mb-0">
        {/* Progress line */}
        <div className="absolute top-5 left-5 right-5 h-px bg-border" aria-hidden="true" />
        <motion.div
          className="absolute top-5 left-5 h-px bg-primary origin-left"
          style={{ right: "auto" }}
          animate={{ width: `${(activeStep / (STEPS.length - 1)) * (100 - (10 / STEPS.length))}%` }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          aria-hidden="true"
        />

        {STEPS.map((step, i) => {
          const Icon = step.icon;
          const isActive = i <= activeStep;
          const isCurrent = i === activeStep;
          return (
            <button
              key={step.title}
              onClick={() => setActiveStep(i)}
              className="flex-1 flex flex-col items-center gap-3 pt-0 relative group"
              aria-label={`Крок ${i + 1}: ${step.title}`}
              aria-current={isCurrent ? "step" : undefined}
            >
              {/* Circle */}
              <motion.div
                animate={{
                  backgroundColor: isActive ? "var(--color-primary)" : "var(--color-background)",
                  borderColor: isActive ? "var(--color-primary)" : "var(--color-border)",
                  scale: isCurrent ? 1.15 : 1,
                }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="w-10 h-10 rounded-full border-2 flex items-center justify-center relative z-10 bg-background"
              >
                <Icon
                  className="w-4 h-4 transition-colors duration-300"
                  style={{ color: isActive ? "white" : "var(--color-muted-foreground)" }}
                  aria-hidden="true"
                />
              </motion.div>

              {/* Step label */}
              <motion.span
                animate={{ color: isActive ? "var(--color-foreground)" : "var(--color-muted-foreground)" }}
                transition={{ duration: 0.3 }}
                className="text-xs font-semibold text-center px-2"
              >
                {step.title}
              </motion.span>
            </button>
          );
        })}
      </div>

      {/* Active step detail card */}
      <div className="mt-8 relative overflow-hidden" style={{ minHeight: 180 }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeStep}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="grid grid-cols-[1fr_auto] gap-8 items-start p-8 rounded-2xl bg-card border border-border"
          >
            <div>
              <div className="flex items-center gap-3 mb-3">
                {(() => { const Icon = STEPS[activeStep].icon; return <Icon className="w-5 h-5 text-primary" aria-hidden="true" />; })()}
                <h3 className="font-bold text-foreground text-lg">{STEPS[activeStep].title}</h3>
                <span className="ml-auto text-xs text-muted-foreground font-medium bg-muted px-2.5 py-1 rounded-full">
                  {STEPS[activeStep].time}
                </span>
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed mb-2">{STEPS[activeStep].desc}</p>
              <p className="text-muted-foreground/70 text-xs leading-relaxed">{STEPS[activeStep].detail}</p>
            </div>
            <Link
              href={STEPS[activeStep].href}
              className="inline-flex items-center gap-2 bg-primary text-white font-semibold text-sm px-5 py-2.5 rounded-full hover:bg-primary/90 active:scale-[0.97] transition-all duration-200 whitespace-nowrap shrink-0 mt-1"
            >
              {STEPS[activeStep].cta} <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
          </motion.div>
        </AnimatePresence>

        {/* Step dots */}
        <div className="flex justify-center gap-1.5 mt-4" role="tablist" aria-label="Кроки процесу">
          {STEPS.map((_, i) => (
            <button
              key={i}
              role="tab"
              aria-selected={i === activeStep}
              aria-label={`Крок ${i + 1}`}
              onClick={() => setActiveStep(i)}
              className="rounded-full transition-all duration-300"
              style={{
                width: i === activeStep ? 20 : 6,
                height: 6,
                backgroundColor: i === activeStep ? "var(--color-primary)" : "var(--color-border)",
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// Mobile: vertical timeline
function MobileTimeline() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <div ref={ref} className="lg:hidden relative pl-8">
      {/* Vertical line */}
      <div className="absolute left-3.5 top-0 bottom-0 w-px bg-border" aria-hidden="true" />

      <div className="space-y-0">
        {STEPS.map((step, i) => {
          const Icon = step.icon;
          return (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, x: -16 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.55, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] }}
              className="relative pb-8 last:pb-0"
            >
              {/* Circle on line */}
              <div className="absolute -left-8 top-0 w-7 h-7 rounded-full bg-background border-2 border-primary flex items-center justify-center z-10">
                <Icon className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
              </div>

              <div className="bg-card border border-border rounded-2xl p-5">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-foreground text-base">{step.title}</h3>
                  <span className="text-[10px] text-muted-foreground font-medium bg-muted px-2 py-0.5 rounded-full">{step.time}</span>
                </div>
                <p className="text-muted-foreground text-sm leading-relaxed mb-3">{step.desc}</p>
                <Link href={step.href}
                  className="inline-flex items-center gap-1.5 text-primary text-sm font-semibold hover:gap-2.5 transition-all duration-200">
                  {step.cta} <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                </Link>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

export function ProcessSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section id="how" className="bg-background py-20 sm:py-28" aria-labelledby="process-heading">
      <div className="max-w-5xl mx-auto px-5 sm:px-10 lg:px-16">
        <motion.div ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="mb-14"
        >
          <h2 id="process-heading" className="text-3xl sm:text-4xl font-black tracking-tight mb-3">
            Від ідеї до мерчу — за 4 кроки
          </h2>
          <p className="text-muted-foreground text-base max-w-lg leading-relaxed">
            Весь процес займає менше 15 хвилин вашого часу. Ціни видно одразу — без дзвінків і переговорів.
          </p>
        </motion.div>

        <DesktopTimeline />
        <MobileTimeline />
      </div>
    </section>
  );
}
