"use client";

import Link from "next/link";
import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { ArrowRight } from "lucide-react";

const STEPS = [
  { step: "01", title: "Обери товари", desc: "Переглядай каталог, фільтруй за категоріями. Обирай базу для свого мерчу — худі, футболки, аксесуари.", cta: "До каталогу", href: "#collections" },
  { step: "02", title: "Кастомуй одяг", desc: "Завантаж логотип, обери зону нанесення, розмір та колір. Переглянь попередній вигляд у реальному часі.", cta: "Спробувати", href: "/order" },
  { step: "03", title: "Отримай пропозицію", desc: "Заповни форму замовлення. Менеджер зв'яжеться з тобою для узгодження деталей та надішле рахунок.", cta: "Замовити", href: "#contact" },
];

export function HowItWorksSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="how" className="bg-[#050508] py-20 sm:py-28 overflow-hidden">
      <div className="max-w-6xl mx-auto px-5 sm:px-8 lg:px-16">
        {/* Header */}
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 24 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="mb-16"
        >
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary block mb-3">04</span>
          <h2 className="text-white text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight">
            Кастомуй під свої цілі
          </h2>
        </motion.div>

        {/* Steps — horizontal timeline on desktop */}
        <div className="relative">
          {/* Connecting line — desktop only */}
          <div className="hidden md:block absolute top-8 left-0 right-0 h-px bg-white/8" />

          <div className="grid md:grid-cols-3 gap-8 md:gap-6">
            {STEPS.map((item, i) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 32 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.65, delay: 0.15 + i * 0.12, ease: [0.22, 1, 0.36, 1] }}
                className="relative flex flex-col gap-5"
              >
                {/* Step number — sits on the line */}
                <div className="flex items-center gap-4 md:block">
                  <div className="relative z-10 w-16 h-16 rounded-full bg-[#050508] border border-white/10 flex items-center justify-center shrink-0">
                    <span className="text-white/30 text-sm font-black tabular-nums">{item.step}</span>
                  </div>
                </div>

                <div className="flex flex-col gap-3 md:pt-4">
                  <h3 className="text-white font-bold text-xl tracking-tight">{item.title}</h3>
                  <p className="text-white/40 text-sm leading-relaxed">{item.desc}</p>
                  <Link
                    href={item.href}
                    className="inline-flex items-center gap-1.5 text-primary text-sm font-semibold hover:gap-2.5 transition-all duration-200 mt-1 w-fit"
                  >
                    {item.cta} <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
