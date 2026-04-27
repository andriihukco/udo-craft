"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { FadeUp, StaggerGrid, cardVariant } from "@/app/_components/FadeUp";

const STEPS = [
  {
    step: "01",
    title: "Обери товари",
    desc: "Переглядай каталог, фільтруй за категоріями. Обирай базу для свого мерчу — худі, футболки, аксесуари.",
    cta: "До каталогу",
    href: "#collections",
  },
  {
    step: "02",
    title: "Кастомуй одяг",
    desc: "Завантаж логотип, обери зону нанесення, розмір та колір. Переглянь попередній вигляд у реальному часі.",
    cta: "Спробувати",
    href: "/order",
  },
  {
    step: "03",
    title: "Отримай пропозицію",
    desc: "Заповни форму замовлення. Менеджер зв'яжеться з тобою для узгодження деталей та надішле рахунок.",
    cta: "Замовити",
    href: "#contact",
  },
];

export function HowItWorksSection() {
  return (
    <section id="how" className="py-20 sm:py-28 bg-primary overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <FadeUp className="mb-16">
          <p className="text-white/40 text-[11px] font-bold uppercase tracking-[0.18em] mb-3">
            Процес
          </p>
          <h2 className="text-white text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight">
            Кастомуй під свої цілі
          </h2>
        </FadeUp>

        <StaggerGrid className="grid md:grid-cols-3 gap-4">
          {STEPS.map((item) => (
            <motion.div
              key={item.step}
              variants={cardVariant}
              whileHover={{ scale: 1.02, y: -4 }}
              transition={{ duration: 0.2 }}
              className="bg-white/[0.07] hover:bg-white/[0.11] border border-white/10 rounded-2xl p-8 flex flex-col gap-6 group"
            >
              <span className="text-white/20 text-6xl font-black leading-none select-none tabular-nums">
                {item.step}
              </span>
              <div className="flex-1">
                <h3 className="text-white font-bold text-xl mb-3">{item.title}</h3>
                <p className="text-white/60 text-sm leading-relaxed">{item.desc}</p>
              </div>
              <Link
                href={item.href}
                className="inline-flex items-center gap-1.5 text-white/70 group-hover:text-white font-semibold text-sm transition-all duration-200 hover:gap-2.5"
              >
                {item.cta} <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>
          ))}
        </StaggerGrid>
      </div>
    </section>
  );
}
