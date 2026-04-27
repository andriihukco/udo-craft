"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { StaggerGrid, cardVariant } from "@/app/_components/FadeUp";

const FEATURES = [
  { icon: "🎨", title: "Онлайн-редактор",   desc: "Завантажуй логотип, розміщуй на виробі та одразу бачиш результат." },
  { icon: "📦", title: "Від 10 одиниць",     desc: "Ідеально для стартапів і команд. Без переплат за малий тираж." },
  { icon: "💳", title: "Прозора ціна",       desc: "Рахунок-фактура одразу. Ніяких прихованих доплат." },
  { icon: "⚡", title: "7–14 днів",          desc: "Від підтвердження до доставки. Дедлайн — не проблема." },
  { icon: "🔒", title: "Контроль якості",    desc: "Кожна партія перевіряється перед відправкою." },
  { icon: "💬", title: "Особистий менеджер", desc: "На зв'язку від першого запиту до отримання замовлення." },
];

export function AboutSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section id="about" className="bg-background py-24 sm:py-32" aria-labelledby="about-heading">
      <div className="max-w-6xl mx-auto px-5 sm:px-10 lg:px-20">

        {/* Headline — full width, editorial */}
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 24 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
          className="mb-16"
        >
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-primary mb-5">Про нас</p>
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-end">
            <h2 id="about-heading" className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[0.95]">
              Українська платформа корпоративного мерчу
            </h2>
            <p className="text-muted-foreground text-base leading-relaxed">
              Від стартапів до великих корпорацій — ми допомагаємо командам створювати мерч, яким пишаються. Від 10 одиниць, без прихованих доплат, з доставкою по Україні.
            </p>
          </div>
        </motion.div>

        {/* Horizontal rule */}
        <div className="border-t border-border mb-16" aria-hidden="true" />

        {/* Feature grid — 3 col, minimal */}
        <StaggerGrid className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-10">
          {FEATURES.map((f) => (
            <motion.div key={f.title} variants={cardVariant} className="flex flex-col gap-3">
              <span className="text-2xl" aria-hidden="true">{f.icon}</span>
              <h3 className="font-bold text-foreground text-base">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </StaggerGrid>
      </div>
    </section>
  );
}
