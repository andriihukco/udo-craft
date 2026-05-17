"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { ArrowRight, RotateCcw, Check } from "lucide-react";
import Link from "next/link";

const PLANS = [
  {
    title: "Onboarding Box",
    desc: "Ідеально для IT та корпоративного сектору. Новий співробітник — ми автоматично відправляємо йому welcome-пак.",
    features: ["Персоналізація імені", "Пряма доставка додому", "Зберігання на нашому складі"],
  },
  {
    title: "HoReCa & Retail",
    desc: "Щомісячне оновлення уніформи для команд. Чисті, нові футболки та фартухи без необхідності тримати запас.",
    features: ["Заміна зношеного мерчу", "Гнучке управління розмірами", "Швидка доставка на точки"],
  },
];

export function SubscriptionSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section className="bg-[#0a0d1a] py-24 sm:py-32 overflow-hidden" aria-labelledby="subscription-heading">
      <div className="max-w-7xl mx-auto px-5 sm:px-10 lg:px-20">
        <div className="grid lg:grid-cols-[1fr_1.5fr] gap-16 lg:gap-24 items-center">
          
          {/* Left: Text & CTA */}
          <motion.div
            ref={ref}
            initial={{ opacity: 0, x: -30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 mb-8">
              <RotateCcw className="w-4 h-4 text-primary" />
              <span className="text-xs font-bold uppercase tracking-widest text-white">Нова послуга</span>
            </div>
            
            <h2 id="subscription-heading" className="text-white text-4xl sm:text-5xl font-black tracking-tight leading-[1.05] mb-6">
              Мерч за підпискою.<br />
              <span className="text-white/40">Ми беремо всю логістику на себе.</span>
            </h2>
            
            <p className="text-white/60 text-base sm:text-lg leading-relaxed mb-10 max-w-lg">
              Забудьте про коробки в офісі та ручну відправку поштою. Зберігаємо, пакуємо та відправляємо ваш мерч тоді, коли це потрібно.
            </p>

            <Link href="#contact" className="inline-flex items-center gap-2 bg-primary text-white hover:bg-primary/90 hover:scale-105 active:scale-[0.97] font-semibold px-8 py-4 rounded-full transition-all duration-200 shadow-lg shadow-primary/20">
              Обговорити підписку <ArrowRight className="w-5 h-5" />
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col gap-4"
          >
            {PLANS.map((plan) => {
              return (
                <div 
                  key={plan.title} 
                  className={`bg-white/5 border border-white/10 rounded-3xl p-8 flex flex-col hover:bg-white/10 transition-colors duration-300`}
                >
                  <div className="flex-1">
                    <h3 className="text-white text-xl font-bold mb-3">{plan.title}</h3>
                    <p className="text-white/50 text-sm leading-relaxed mb-6">
                      {plan.desc}
                    </p>
                    
                    <ul className="space-y-3">
                      {plan.features.map(f => (
                        <li key={f} className="flex items-center gap-3 text-white/80 text-sm font-medium">
                          <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                            <Check className="w-3 h-3 text-primary" />
                          </div>
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })}
          </motion.div>

        </div>
      </div>
    </section>
  );
}
