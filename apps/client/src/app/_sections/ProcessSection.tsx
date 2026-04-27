"use client";

import Link from "next/link";
import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { ArrowRight } from "lucide-react";

const STEPS = [
  {
    title: "Обери товари",
    desc: "Переглядай каталог, фільтруй за категоріями. Обирай базу для свого мерчу — худі, футболки, аксесуари.",
    cta: "До каталогу",
    href: "#collections",
    time: "5 хв",
  },
  {
    title: "Кастомуй онлайн",
    desc: "Завантаж логотип, обери зону нанесення, розмір та колір. Переглянь попередній вигляд у реальному часі.",
    cta: "Спробувати",
    href: "/order",
    time: "10 хв",
  },
  {
    title: "Отримай рахунок",
    desc: "Заповни форму. Менеджер зв'яжеться протягом 2 годин, погодить деталі та надішле рахунок-фактуру.",
    cta: "Замовити",
    href: "#contact",
    time: "2 год",
  },
  {
    title: "Отримай мерч",
    desc: "Виробництво 7–14 днів. Доставка Новою Поштою по всій Україні. Кожна партія перевіряється перед відправкою.",
    cta: "Деталі",
    href: "#faq",
    time: "7–14 днів",
  },
];

export function ProcessSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section id="how" className="bg-[#06060e] py-20 sm:py-28" aria-labelledby="process-heading">
      <div className="max-w-6xl mx-auto px-5 sm:px-10 lg:px-20">

        <motion.div ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-16"
        >
          <div>
            <h2 id="process-heading" className="text-white text-3xl sm:text-4xl font-black tracking-tight">
              Від ідеї до мерчу — за 4 кроки
            </h2>
          </div>
          <p className="text-white/50 text-sm max-w-xs leading-relaxed">
            Весь процес займає менше 15 хвилин вашого часу.
          </p>
        </motion.div>

        {/* Steps — alternating layout */}
        <div className="space-y-4">
          {STEPS.map((step, i) => (
            <motion.div key={step.title}
              initial={{ opacity: 0, x: i % 2 === 0 ? -24 : 24 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.65, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col sm:flex-row items-start sm:items-center gap-6 p-7 rounded-2xl bg-white/[0.04] border border-white/8 hover:bg-white/[0.06] hover:border-white/12 transition-all duration-300 group"
            >
              {/* Step number */}
              <div className="flex items-center gap-4 shrink-0">
                <span className="text-5xl font-black text-white/10 tabular-nums leading-none w-12 text-right select-none" aria-hidden="true">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="w-px h-10 bg-white/10 hidden sm:block" aria-hidden="true" />
              </div>

              {/* Content */}
              <div className="flex-1">
                <h3 className="text-white font-bold text-lg mb-1.5">{step.title}</h3>
                <p className="text-white/60 text-sm leading-relaxed">{step.desc}</p>
              </div>

              {/* Time badge + CTA */}
              <div className="flex items-center gap-4 shrink-0">
                <div className="text-right hidden sm:block">
                  <p className="text-white text-sm font-black">{step.time}</p>
                  <p className="text-white/35 text-[10px]">час</p>
                </div>
                <Link href={step.href}
                  className="inline-flex items-center gap-1.5 text-primary text-sm font-semibold hover:gap-2.5 transition-all duration-200 whitespace-nowrap">
                  {step.cta} <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
