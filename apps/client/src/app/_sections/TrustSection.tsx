"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { HighlightText } from "@/app/_components/HighlightText";

const GUARANTEES = [
  {
    title: "Гарантія якості",
    body: "Якщо виріб не відповідає погодженому макету — переробляємо безкоштовно. Без суперечок, без бюрократії.",
  },
  {
    title: "Власне виробництво",
    body: "Контролюємо кожен етап — від вибору матеріалу до нанесення. Жодних посередників, жодних сюрпризів.",
  },
  {
    title: "Фіксована ціна",
    body: "Рахунок-фактура одразу після підтвердження. Ціна не змінюється після старту виробництва.",
  },
  {
    title: "Особистий менеджер",
    body: "Один контакт від першого запиту до отримання замовлення. Відповідаємо протягом 2 годин у робочий час.",
  },
];

const NUMBERS = [
  { value: "500+", label: "задоволених клієнтів" },
  { value: "5 років", label: "на ринку" },
  { value: "10k+", label: "виробів щороку" },
  { value: "4.9 / 5", label: "середня оцінка" },
];

export function TrustSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section className="bg-[oklch(0.10 0.03 264)] py-24 sm:py-32" aria-labelledby="trust-heading">
      <div className="max-w-6xl mx-auto px-5 sm:px-10 lg:px-20">

        <motion.div ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="mb-16"
        >
          <h2 id="trust-heading" className="text-white text-3xl sm:text-4xl font-black tracking-tight mb-4">
            Чому нам{" "}
            <HighlightText delay={0.4} color="rgba(255,255,255,0.12)">довіряють</HighlightText>
          </h2>
          <p className="text-white/55 text-base max-w-lg leading-relaxed">
            Не просто слова — конкретні гарантії, які ми дотримуємось щодня.
          </p>
        </motion.div>

        {/* Guarantees — two column, no cards, just text */}
        <div className="grid sm:grid-cols-2 gap-x-16 gap-y-10 mb-16">
          {GUARANTEES.map((g, i) => (
            <motion.div key={g.title}
              initial={{ opacity: 0, y: 16 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.55, delay: i * 0.09, ease: [0.22, 1, 0.36, 1] }}
              className="border-t border-white/10 pt-6"
            >
              <h3 className="text-white font-bold text-base mb-2">{g.title}</h3>
              <p className="text-white/55 text-sm leading-relaxed">{g.body}</p>
            </motion.div>
          ))}
        </div>

        {/* Numbers — large, editorial */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-8 pt-10 border-t border-white/10"
          aria-label="Ключові показники"
        >
          {NUMBERS.map((n) => (
            <div key={n.label}>
              <p className="text-white text-3xl font-black tracking-tight mb-1">{n.value}</p>
              <p className="text-white/40 text-xs leading-snug">{n.label}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
