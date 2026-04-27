"use client";

import Link from "next/link";
import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { ArrowRight, MessageSquare, Wand2, Download } from "lucide-react";

const DESIGN_STEPS = [
  {
    icon: MessageSquare,
    title: "Розкажи про бренд",
    desc: "Надішли нам логотип, фірмові кольори та опис стилю. Якщо нічого немає — розкажи про компанію словами.",
    detail: "Брифінг займає 10–15 хвилин. Можна заповнити онлайн або поговорити з дизайнером.",
  },
  {
    icon: Wand2,
    title: "Отримай концепцію",
    desc: "Дизайнер підготує 2–3 варіанти адаптації логотипу або фірмового стилю для нанесення на одяг.",
    detail: "Термін — 2 робочі дні. Включає адаптацію під шовкодрук, вишивку та DTF.",
  },
  {
    icon: Download,
    title: "Затверди і замовляй",
    desc: "Обери варіант, внеси правки (до 2 раундів включено), отримай фінальні файли та одразу запускай тираж.",
    detail: "Всі файли залишаються у тебе. Можна використовувати для будь-яких майбутніх замовлень.",
  },
];

const EXAMPLES = [
  { label: "Адаптація логотипу", price: "від 800 ₴" },
  { label: "Фірмовий стиль для мерчу", price: "від 2 400 ₴" },
  { label: "Повний брендинг", price: "від 6 000 ₴" },
];

export function DesignerSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section className="bg-background py-20 sm:py-28 border-t border-border" aria-labelledby="designer-heading">
      <div className="max-w-6xl mx-auto px-5 sm:px-10 lg:px-20">

        {/* Header */}
        <motion.div ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-end mb-14"
        >
          <div>
            <div className="inline-flex items-center gap-2 bg-primary/8 border border-primary/15 rounded-full px-3 py-1.5 mb-5">
              <Wand2 className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
              <span className="text-primary text-xs font-semibold">Дизайн-сервіс</span>
            </div>
            <h2 id="designer-heading" className="text-3xl sm:text-4xl font-black tracking-tight leading-[1.05]">
              Немає логотипу?<br />Ми допоможемо
            </h2>
          </div>
          <p className="text-muted-foreground text-base leading-relaxed">
            Наш дизайнер адаптує ваш логотип під нанесення або створить фірмовий стиль з нуля. Результат — за 2 дні.
          </p>
        </motion.div>

        {/* 3-step cards */}
        <div className="grid md:grid-cols-3 gap-4 mb-10">
          {DESIGN_STEPS.map((step, i) => {
            const Icon = step.icon;
            return (
              <motion.div key={step.title}
                initial={{ opacity: 0, y: 24 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.1 + i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                className="relative bg-card border border-border rounded-2xl p-7 flex flex-col gap-4 hover:border-foreground/15 hover:shadow-lg hover:shadow-black/5 transition-all duration-300"
              >
                {/* Connector line — desktop only */}
                {i < DESIGN_STEPS.length - 1 && (
                  <div className="hidden md:block absolute top-10 -right-2 w-4 h-px bg-border z-10" aria-hidden="true" />
                )}

                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-primary/8 border border-primary/15 flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-primary" aria-hidden="true" />
                  </div>
                  <span className="text-muted-foreground text-xs font-semibold">Крок {i + 1}</span>
                </div>

                <div>
                  <h3 className="font-bold text-foreground text-base mb-2">{step.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{step.desc}</p>
                </div>

                <p className="text-muted-foreground/60 text-xs leading-relaxed border-t border-border pt-3 mt-auto">
                  {step.detail}
                </p>
              </motion.div>
            );
          })}
        </div>

        {/* Pricing + CTA */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 bg-muted/50 border border-border rounded-2xl px-7 py-6"
        >
          <div>
            <p className="text-foreground font-bold text-sm mb-3">Орієнтовна вартість</p>
            <div className="flex flex-wrap gap-3">
              {EXAMPLES.map((e) => (
                <div key={e.label} className="flex items-center gap-2">
                  <span className="text-muted-foreground text-xs">{e.label}</span>
                  <span className="text-foreground text-xs font-bold">{e.price}</span>
                </div>
              ))}
            </div>
          </div>
          <Link href="#contact?ref=designer"
            className="inline-flex items-center gap-2 bg-primary text-white font-semibold text-sm px-6 py-3 rounded-full hover:bg-primary/90 active:scale-[0.97] transition-all duration-200 shrink-0">
            Обговорити проєкт <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
