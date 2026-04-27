"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Shield, Award, Clock, Truck, HeartHandshake, BadgeCheck } from "lucide-react";

const TRUST_ITEMS = [
  { icon: Shield, title: "Гарантія якості", desc: "Якщо виріб не відповідає погодженому макету — переробляємо безкоштовно" },
  { icon: Award, title: "Власне виробництво", desc: "Контролюємо кожен етап — від матеріалу до нанесення" },
  { icon: Clock, title: "Дедлайн — не проблема", desc: "7–14 робочих днів. Є прискорений режим для термінових замовлень" },
  { icon: Truck, title: "Доставка по Україні", desc: "Нова Пошта, Укрпошта або самовивіз у Львові" },
  { icon: HeartHandshake, title: "Особистий менеджер", desc: "Один контакт від першого запиту до отримання замовлення" },
  { icon: BadgeCheck, title: "Прозора ціна", desc: "Рахунок-фактура одразу. Ніяких прихованих доплат після підтвердження" },
];

const CERTIFICATIONS = [
  { label: "ISO 9001", desc: "Управління якістю" },
  { label: "ДСТУ", desc: "Відповідність стандартам" },
  { label: "5 років", desc: "На ринку" },
  { label: "500+", desc: "Задоволених клієнтів" },
];

export function TrustSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section className="bg-[#06060e] py-20 sm:py-28" aria-labelledby="trust-heading">
      <div className="max-w-6xl mx-auto px-5 sm:px-10 lg:px-20">

        <motion.div ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="mb-14"
        >
          <h2 id="trust-heading" className="text-white text-3xl sm:text-4xl font-black tracking-tight mb-4">
            Чому нам довіряють
          </h2>
          <p className="text-white/60 text-base max-w-lg leading-relaxed">
            Не просто слова — конкретні гарантії та стандарти, які ми дотримуємось щодня.
          </p>
        </motion.div>

        {/* Trust grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
          {TRUST_ITEMS.map((item, i) => {
            const Icon = item.icon;
            return (
              <motion.div key={item.title}
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.55, delay: i * 0.07, ease: [0.22, 1, 0.36, 1] }}
                className="flex gap-4 p-6 rounded-2xl bg-white/[0.04] border border-white/8 hover:bg-white/[0.06] hover:border-white/12 transition-all duration-300"
              >
                <div className="w-9 h-9 rounded-xl bg-primary/15 border border-primary/25 flex items-center justify-center shrink-0 mt-0.5">
                  <Icon className="w-4.5 h-4.5 text-primary" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-sm mb-1">{item.title}</h3>
                  {/* white/65 on #06060e = 8.5:1 passes AAA */}
                  <p className="text-white/65 text-xs leading-relaxed">{item.desc}</p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Certification strip */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-white/8 rounded-2xl overflow-hidden"
          aria-label="Сертифікати та досягнення"
        >
          {CERTIFICATIONS.map((c) => (
            <div key={c.label} className="bg-[#06060e] px-6 py-5 text-center">
              <p className="text-white text-2xl font-black mb-1">{c.label}</p>
              <p className="text-white/50 text-xs">{c.desc}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
