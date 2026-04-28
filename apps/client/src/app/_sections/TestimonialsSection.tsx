"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";

const TESTIMONIALS = [
  {
    name: "Олена Коваль",
    role: "HR Director",
    company: "TechCorp",
    avatar: "ОК",
    text: "Замовляли корпоративні худі для команди 80 осіб. Якість перевершила очікування — люди носять їх не лише на роботі.",
    metric: "80 осіб",
    metricLabel: "у команді",
    rating: 5,
    size: "large",
  },
  {
    name: "Максим Бондаренко",
    role: "Co-founder",
    company: "StartupUA",
    avatar: "МБ",
    text: "Спочатку замовили Box of Touch — це вирішило всі сумніви щодо якості. Потім зробили тираж 200 футболок для конференції. Все вчасно.",
    metric: "200 шт",
    metricLabel: "за 12 днів",
    rating: 5,
    size: "small",
  },
  {
    name: "Аліна Мороз",
    role: "Brand Manager",
    company: "RetailGroup",
    avatar: "АМ",
    text: "Адаптували логотип під вишивку. Результат виглядає дуже преміально. Клієнти постійно питають, де ми це замовляли.",
    metric: "3×",
    metricLabel: "повторних замовлень",
    rating: 5,
    size: "small",
  },
];

function Stars({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`Оцінка ${count} з 5`}>
      {[...Array(count)].map((_, i) => (
        <svg key={i} className="w-3.5 h-3.5 text-yellow-400 fill-current" viewBox="0 0 20 20" aria-hidden="true">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

export function TestimonialsSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section
      id="testimonials"
      className="bg-[oklch(0.10 0.03 264)] py-24 sm:py-32"
      aria-labelledby="testimonials-heading"
    >
      <div className="max-w-6xl mx-auto px-5 sm:px-10 lg:px-20">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-14"
        >
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-primary mb-3">Відгуки</p>
            <h2 id="testimonials-heading" className="text-white text-3xl sm:text-4xl font-black tracking-tight">
              Результати, а не обіцянки
            </h2>
          </div>
          <p className="text-white/30 text-sm max-w-xs">
            Реальні команди. Реальні цифри.
          </p>
        </motion.div>

        {/* Masonry-style layout */}
        <div className="grid md:grid-cols-3 gap-4">
          {/* Large card — spans 2 rows visually via padding */}
          {TESTIMONIALS.map((t, i) => (
            <motion.article
              key={t.name}
              initial={{ opacity: 0, y: 28 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.65, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
              className={`flex flex-col gap-5 rounded-2xl border border-white/8 bg-white/[0.03] p-7 hover:bg-white/[0.05] hover:border-white/12 transition-all duration-300 ${
                t.size === "large" ? "md:row-span-1 pb-10" : ""
              }`}
            >
              <Stars count={t.rating} />

              {/* Metric highlight */}
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black text-white tracking-tight">{t.metric}</span>
                <span className="text-white/30 text-xs font-medium">{t.metricLabel}</span>
              </div>

              <p className="text-white/55 text-sm leading-relaxed flex-1">&ldquo;{t.text}&rdquo;</p>

              <div className="flex items-center gap-3 pt-4 border-t border-white/8">
                <div
                  className="w-9 h-9 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-[10px] font-bold text-primary shrink-0"
                  aria-hidden="true"
                >
                  {t.avatar}
                </div>
                <div>
                  <p className="text-white/80 text-sm font-semibold leading-tight">{t.name}</p>
                  <p className="text-white/30 text-xs mt-0.5">{t.role}, {t.company}</p>
                </div>
              </div>
            </motion.article>
          ))}
        </div>

        {/* Aggregate rating */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="flex items-center gap-4 mt-10 pt-8 border-t border-white/8"
        >
          <div className="flex gap-0.5" aria-hidden="true">
            {[...Array(5)].map((_, i) => (
              <svg key={i} className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
          </div>
          <p className="text-white/30 text-sm">
            <span className="text-white/60 font-semibold">4.9 / 5</span> — середня оцінка від 500+ клієнтів
          </p>
        </motion.div>
      </div>
    </section>
  );
}
