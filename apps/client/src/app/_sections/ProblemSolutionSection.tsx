"use client";

import Link from "next/link";
import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { ArrowRight, X, Check } from "lucide-react";

const PROBLEMS = [
  "Мінімальний тираж 500+ одиниць",
  "Тижні на погодження макетів",
  "Якість не відповідає очікуванням",
  "Прихована вартість після замовлення",
];

const SOLUTIONS = [
  "Від 10 одиниць без доплат",
  "Онлайн-редактор — результат одразу",
  "Зразки перед тиражем (Box of Touch)",
  "Фіксована ціна в рахунку-фактурі",
];

export function ProblemSolutionSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section className="bg-background py-20 sm:py-28" aria-labelledby="problem-heading">
      <div className="max-w-6xl mx-auto px-5 sm:px-10 lg:px-20">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">

          {/* Left — problem */}
          <motion.div
            ref={ref}
            initial={{ opacity: 0, x: -24 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground/40 mb-5">
              Проблема
            </p>
            <h2 id="problem-heading" className="text-3xl sm:text-4xl font-black tracking-tight leading-[1.05] mb-8">
              Ринок перенасичений дешевим мерчем, який ніхто не носить
            </h2>
            <ul className="space-y-3 mb-8" aria-label="Типові проблеми">
              {PROBLEMS.map((p, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: -12 }}
                  animate={isInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.5, delay: 0.1 + i * 0.08, ease: [0.22, 1, 0.36, 1] }}
                  className="flex items-center gap-3 text-sm text-muted-foreground"
                >
                  <span className="w-5 h-5 rounded-full bg-red-50 border border-red-100 flex items-center justify-center shrink-0" aria-hidden="true">
                    <X className="w-3 h-3 text-red-400" />
                  </span>
                  {p}
                </motion.li>
              ))}
            </ul>
          </motion.div>

          {/* Right — solution */}
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.75, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="bg-[#04040a] rounded-3xl p-8 sm:p-10"
          >
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-primary mb-5">
              Рішення U:DO
            </p>
            <h3 className="text-white text-2xl sm:text-3xl font-black tracking-tight leading-tight mb-8">
              Мерч, який стає частиною бренду
            </h3>
            <ul className="space-y-3 mb-10" aria-label="Переваги U:DO">
              {SOLUTIONS.map((s, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: 12 }}
                  animate={isInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.5, delay: 0.2 + i * 0.08, ease: [0.22, 1, 0.36, 1] }}
                  className="flex items-center gap-3 text-sm text-white/70"
                >
                  <span className="w-5 h-5 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0" aria-hidden="true">
                    <Check className="w-3 h-3 text-primary" />
                  </span>
                  {s}
                </motion.li>
              ))}
            </ul>
            <Link
              href="#collections"
              className="inline-flex items-center gap-2 bg-primary text-white font-semibold text-sm px-6 py-3 rounded-full hover:bg-primary/90 active:scale-[0.97] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-[#04040a]"
            >
              Переглянути каталог <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
