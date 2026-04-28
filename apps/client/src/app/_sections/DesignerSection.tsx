"use client";

import Link from "next/link";
import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { ArrowRight, MessageCircle, Sparkles, CheckCircle2 } from "lucide-react";
import { HighlightText } from "@/app/_components/HighlightText";

const STEPS = [
  {
    Icon: MessageCircle,
    title: "Розкажи про бренд",
    body: "Надішли логотип, фірмові кольори та опис стилю. Якщо нічого немає — просто розкажи про компанію. Брифінг займає 10–15 хвилин онлайн або по телефону.",
  },
  {
    Icon: Sparkles,
    title: "Отримай концепцію",
    body: "Дизайнер підготує 2–3 варіанти адаптації для нанесення на одяг. Термін — 2 робочі дні. Включає адаптацію під шовкодрук, вишивку та DTF.",
  },
  {
    Icon: CheckCircle2,
    title: "Затверди і замовляй",
    body: "Обери варіант, внеси правки (до 2 раундів включено), отримай фінальні файли. Всі файли залишаються у тебе — для будь-яких майбутніх замовлень.",
  },
];

export function DesignerSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section
      className="bg-background py-24 sm:py-32 border-t border-border"
      aria-labelledby="designer-heading"
    >
      <div className="max-w-6xl mx-auto px-5 sm:px-10 lg:px-20">

        {/* Header */}
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-end mb-16"
        >
          <div>
            <p className="text-muted-foreground text-xs font-semibold uppercase tracking-[0.2em] mb-5">
              Дизайн-сервіс
            </p>
            <h2
              id="designer-heading"
              className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-[1.02]"
            >
              Немає логотипу?{" "}
              <HighlightText delay={0.5}>Ми допоможемо</HighlightText>
            </h2>
          </div>
          <p className="text-muted-foreground text-base leading-relaxed">
            Наш дизайнер адаптує ваш логотип під нанесення або створить фірмовий стиль з нуля. Результат — за 2 дні.
          </p>
        </motion.div>

        {/* 3 steps — icon + title + prose, no cards, no dividers */}
        <div className="grid md:grid-cols-3 gap-10 md:gap-12 mb-14">
          {STEPS.map(({ Icon, title, body }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.1 + i * 0.12, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col gap-4"
            >
              {/* Icon in a clean circle */}
              <div className="w-11 h-11 rounded-2xl bg-primary/8 border border-primary/15 flex items-center justify-center">
                <Icon className="w-5 h-5 text-primary" aria-hidden="true" />
              </div>
              <div>
                <h3 className="font-bold text-foreground text-lg mb-2">{title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{body}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Pricing + CTA — inline */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pt-10 border-t border-border"
        >
          <div className="flex flex-wrap gap-x-8 gap-y-1.5">
            <p className="text-muted-foreground text-sm font-semibold w-full sm:w-auto">
              Орієнтовна вартість:
            </p>
            {[
              ["Адаптація логотипу", "від 800 ₴"],
              ["Фірмовий стиль", "від 2 400 ₴"],
              ["Повний брендинг", "від 6 000 ₴"],
            ].map(([label, price]) => (
              <span key={label} className="text-sm text-muted-foreground">
                {label} —{" "}
                <span className="text-foreground font-semibold">{price}</span>
              </span>
            ))}
          </div>
          <Link
            href="#contact?ref=designer"
            className="inline-flex items-center gap-2 bg-primary text-white font-semibold text-sm px-6 py-3 rounded-full hover:bg-primary/90 active:scale-[0.97] transition-all duration-200 shrink-0"
          >
            Обговорити проєкт <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
