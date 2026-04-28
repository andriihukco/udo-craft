"use client";

import Link from "next/link";
import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { ArrowRight, X, Check } from "lucide-react";
import { HighlightText } from "@/app/_components/HighlightText";

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
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">

          {/* Left */}
          <motion.div ref={ref}
            initial={{ opacity: 0, x: -24 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground mb-5">Проблема</p>
            <h2 id="problem-heading" className="text-3xl sm:text-4xl font-black tracking-tight leading-[1.05] mb-8">
              Ринок перенасичений дешевим мерчем,{" "}
              <HighlightText delay={0.4} color="rgba(239,68,68,0.12)">який ніхто не носить</HighlightText>
            </h2>
            <ul className="space-y-3" aria-label="Типові проблеми">
              {PROBLEMS.map((p, i) => (
                <motion.li key={i}
                  initial={{ opacity: 0, x: -12 }}
                  animate={isInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.5, delay: 0.1 + i * 0.08, ease: [0.22, 1, 0.36, 1] }}
                  className="flex items-center gap-3 text-sm text-muted-foreground"
                >
                  <span className="w-5 h-5 rounded-full bg-red-50 border border-red-200 flex items-center justify-center shrink-0" aria-hidden="true">
                    <X className="w-3 h-3 text-red-500" />
                  </span>
                  {p}
                </motion.li>
              ))}
            </ul>
          </motion.div>

          {/* Right */}
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.75, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="bg-[oklch(0.10 0.03 264)] rounded-3xl p-8 sm:p-10"
          >
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-primary mb-5">Рішення U:DO</p>
            <h3 className="text-white text-2xl sm:text-3xl font-black tracking-tight leading-tight mb-8">
              Мерч, який стає частиною бренду
            </h3>
            <ul className="space-y-3 mb-10" aria-label="Переваги U:DO">
              {SOLUTIONS.map((s, i) => (
                <motion.li key={i}
                  initial={{ opacity: 0, x: 12 }}
                  animate={isInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.5, delay: 0.2 + i * 0.08, ease: [0.22, 1, 0.36, 1] }}
                  className="flex items-center gap-3 text-sm text-white/90"
                >
                  <span className="w-5 h-5 rounded-full bg-blue-500/25 border border-blue-400/50 flex items-center justify-center shrink-0" aria-hidden="true">
                    <Check className="w-3 h-3 text-blue-300" />
                  </span>
                  {s}
                </motion.li>
              ))}
            </ul>
            <Link href="#collections"
              className="inline-flex items-center gap-2 bg-primary text-white font-semibold text-sm px-6 py-3 rounded-full hover:bg-primary/90 active:scale-[0.97] transition-all duration-200">
              Переглянути каталог <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
