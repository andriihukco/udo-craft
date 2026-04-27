"use client";

import { motion } from "framer-motion";
import { FadeUp, StaggerGrid, cardVariant } from "@/app/_components/FadeUp";

const TESTIMONIALS = [
  {
    name: "Олена Коваль",
    role: "HR Director, TechCorp",
    avatar: "ОК",
    text: "Замовляли корпоративні худі для команди 80 осіб. Якість перевершила очікування — люди носять їх не лише на роботі. Менеджер був на зв'язку на кожному етапі.",
    rating: 5,
  },
  {
    name: "Максим Бондаренко",
    role: "Co-founder, StartupUA",
    avatar: "МБ",
    text: "Спочатку замовили Box of Touch — це вирішило всі сумніви щодо якості. Потім зробили тираж 200 футболок для конференції. Все вчасно і без нервів.",
    rating: 5,
  },
  {
    name: "Аліна Мороз",
    role: "Brand Manager, RetailGroup",
    avatar: "АМ",
    text: "Зверталися за допомогою дизайнера — адаптували логотип під вишивку. Результат виглядає дуже преміально. Клієнти постійно питають, де ми це замовляли.",
    rating: 5,
  },
];

export function TestimonialsSection() {
  return (
    <section id="testimonials" className="bg-background py-24 sm:py-32">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <FadeUp className="mb-16">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] mb-4 text-primary">
            Відгуки
          </p>
          <h2 className="text-4xl sm:text-5xl font-black tracking-tight">Що кажуть клієнти</h2>
        </FadeUp>

        <StaggerGrid className="grid md:grid-cols-3 gap-5">
          {TESTIMONIALS.map((t) => (
            <motion.div
              key={t.name}
              variants={cardVariant}
              whileHover={{ y: -6 }}
              transition={{ duration: 0.2 }}
              className="bg-card rounded-3xl p-8 border border-border flex flex-col gap-6 hover:shadow-2xl hover:shadow-black/5 hover:border-border/60 transition-all duration-300"
            >
              {/* Stars */}
              <div className="flex gap-1" aria-label={`Оцінка: ${t.rating} з 5`}>
                {[...Array(t.rating)].map((_, i) => (
                  <svg
                    key={i}
                    className="w-4 h-4 text-yellow-400 fill-current"
                    viewBox="0 0 20 20"
                    aria-hidden="true"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>

              <p className="text-foreground text-base leading-relaxed flex-1">
                &ldquo;{t.text}&rdquo;
              </p>

              <div className="flex items-center gap-4 pt-4 border-t border-border">
                <div
                  className="w-11 h-11 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-white shrink-0"
                  aria-hidden="true"
                >
                  {t.avatar}
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{t.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{t.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </StaggerGrid>
      </div>
    </section>
  );
}
