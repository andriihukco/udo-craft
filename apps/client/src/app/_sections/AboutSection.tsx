"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { HighlightText } from "@/app/_components/HighlightText";

const FEATURES = [
  { title: "Онлайн-редактор",   desc: "Завантажуй логотип, розміщуй на виробі та одразу бачиш результат. Без зайвих листів і погоджень." },
  { title: "Від 10 одиниць",     desc: "Ідеально для стартапів і команд. Без переплат за малий тираж." },
  { title: "Прозора ціна",       desc: "Рахунок-фактура одразу. Ніяких прихованих доплат." },
  { title: "7–14 днів",          desc: "Від підтвердження до доставки. Дедлайн — не проблема." },
  { title: "Контроль якості",    desc: "Кожна партія перевіряється перед відправкою." },
  { title: "Особистий менеджер", desc: "На зв'язку від першого запиту до отримання замовлення." },
];

export function AboutSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section id="about" className="bg-background py-24 sm:py-32" aria-labelledby="about-heading">
      <div className="max-w-6xl mx-auto px-5 sm:px-10 lg:px-20">

        {/* Full-width editorial headline */}
        <motion.div ref={ref}
          initial={{ opacity: 0, y: 24 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
          className="mb-16"
        >
          <p className="text-muted-foreground text-xs font-semibold uppercase tracking-[0.2em] mb-6">Про нас</p>
          <h2 id="about-heading" className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[0.95] mb-8 max-w-3xl">
            Українська платформа{" "}
            <HighlightText delay={0.5}>корпоративного мерчу</HighlightText>
          </h2>
          <div className="grid lg:grid-cols-2 gap-6 max-w-3xl">
            <p className="text-muted-foreground text-base leading-relaxed">
              Від стартапів до великих корпорацій — ми допомагаємо командам створювати мерч, яким пишаються.
            </p>
            <p className="text-muted-foreground text-base leading-relaxed">
              Від 10 одиниць, без прихованих доплат, з доставкою по Україні. Власне виробництво, особистий менеджер, гарантія якості.
            </p>
          </div>
        </motion.div>

        <div className="border-t border-border mb-16" aria-hidden="true" />

        {/* Features — two-column list, no cards, no icons */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-10">
          {FEATURES.map((f, i) => (
            <motion.div key={f.title}
              initial={{ opacity: 0, y: 16 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.55, delay: 0.1 + i * 0.07, ease: [0.22, 1, 0.36, 1] }}
            >
              <h3 className="font-bold text-foreground text-base mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
