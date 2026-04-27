"use client";

import { useRef, useState } from "react";
import { motion, useInView } from "framer-motion";

const TESTIMONIALS = [
  { name: "Олена Коваль", role: "HR Director, TechCorp", avatar: "ОК", text: "Замовляли корпоративні худі для команди 80 осіб. Якість перевершила очікування — люди носять їх не лише на роботі. Менеджер був на зв'язку на кожному етапі.", rating: 5 },
  { name: "Максим Бондаренко", role: "Co-founder, StartupUA", avatar: "МБ", text: "Спочатку замовили Box of Touch — це вирішило всі сумніви щодо якості. Потім зробили тираж 200 футболок для конференції. Все вчасно і без нервів.", rating: 5 },
  { name: "Аліна Мороз", role: "Brand Manager, RetailGroup", avatar: "АМ", text: "Зверталися за допомогою дизайнера — адаптували логотип під вишивку. Результат виглядає дуже преміально. Клієнти постійно питають, де ми це замовляли.", rating: 5 },
];

export function TestimonialsSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section id="testimonials" className="bg-background py-24 sm:py-32 overflow-hidden">
      <div className="max-w-6xl mx-auto px-5 sm:px-8 lg:px-16">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 24 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="mb-14"
        >
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary block mb-3">06</span>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight">Що кажуть клієнти</h2>
        </motion.div>

        {/* Horizontal scroll on mobile, grid on desktop */}
        <div className="grid md:grid-cols-3 gap-5">
          {TESTIMONIALS.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 28 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.65, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -4 }}
              className="flex flex-col gap-5 p-7 rounded-2xl border border-border hover:border-foreground/15 hover:shadow-lg hover:shadow-black/5 transition-all duration-300 bg-card"
            >
              {/* Stars */}
              <div className="flex gap-0.5" aria-label={`Оцінка: ${t.rating} з 5`}>
                {[...Array(t.rating)].map((_, j) => (
                  <svg key={j} className="w-3.5 h-3.5 text-yellow-400 fill-current" viewBox="0 0 20 20" aria-hidden="true">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>

              <p className="text-foreground text-sm leading-relaxed flex-1">&ldquo;{t.text}&rdquo;</p>

              <div className="flex items-center gap-3 pt-4 border-t border-border">
                <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-[10px] font-bold text-white shrink-0" aria-hidden="true">
                  {t.avatar}
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground leading-tight">{t.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{t.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
