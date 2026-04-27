"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { StaggerGrid, cardVariant } from "@/app/_components/FadeUp";

const FEATURES = [
  { icon: "🎨", title: "Онлайн-редактор",   desc: "Завантажуй логотип, розміщуй на виробі та одразу бачиш результат. Без зайвих листів і погоджень." },
  { icon: "📦", title: "Від 10 одиниць",     desc: "Не потрібно замовляти сотні. Починай з малого тиражу — ідеально для стартапів і команд." },
  { icon: "💳", title: "Прозора ціна",       desc: "Рахунок-фактура одразу після замовлення. Ніяких прихованих доплат — тільки чесна ціна." },
  { icon: "⚡", title: "Швидке виробництво", desc: "7–14 робочих днів від підтвердження до доставки. Дедлайн — це не проблема." },
  { icon: "🔒", title: "Контроль якості",    desc: "Кожна партія проходить перевірку перед відправкою. Ми відповідаємо за результат." },
  { icon: "💬", title: "Особистий менеджер", desc: "Ваш менеджер на зв'язку від першого запиту до отримання замовлення." },
];

export function AboutSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section id="about" className="bg-background py-24 sm:py-32">
      <div className="max-w-6xl mx-auto px-5 sm:px-8 lg:px-16">

        {/* Split editorial layout */}
        <div className="grid lg:grid-cols-[1fr_1fr] gap-16 lg:gap-24 items-start mb-20">
          {/* Left — pull quote */}
          <motion.div
            ref={ref}
            initial={{ opacity: 0, x: -24 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary block mb-6">05</span>
            {/* Large pull quote */}
            <blockquote className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-[1.05] mb-8">
              Ми робимо мерч,{" "}
              <span className="text-muted-foreground/40">який носять</span>
            </blockquote>
            <p className="text-muted-foreground text-base leading-relaxed mb-4 max-w-md">
              U:DO Craft — українська платформа корпоративного мерчу. Ми поєднуємо онлайн-редактор,
              власне виробництво та особистий сервіс, щоб ваш бренд виглядав бездоганно.
            </p>
            <p className="text-muted-foreground text-base leading-relaxed max-w-md">
              Від стартапів до великих корпорацій — ми допомагаємо командам створювати мерч, яким
              пишаються. Від 10 одиниць, без прихованих доплат, з доставкою по Україні.
            </p>
          </motion.div>

          {/* Right — stats grid */}
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="grid grid-cols-2 gap-px bg-border rounded-2xl overflow-hidden">
              {[
                { value: "500+", label: "задоволених клієнтів" },
                { value: "10k+", label: "виробів щороку" },
                { value: "7–14", label: "днів виробництво" },
                { value: "100%", label: "контроль якості" },
              ].map((s) => (
                <div key={s.label} className="bg-background px-6 py-8 sm:py-10">
                  <p className="text-3xl sm:text-4xl font-black text-foreground mb-1.5 tracking-tight">{s.value}</p>
                  <p className="text-xs text-muted-foreground leading-snug">{s.label}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Feature grid */}
        <StaggerGrid className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((f) => (
            <motion.div
              key={f.title}
              variants={cardVariant}
              whileHover={{ y: -4 }}
              transition={{ duration: 0.2 }}
              className="group p-7 rounded-2xl border border-border hover:border-foreground/15 hover:shadow-lg hover:shadow-black/5 transition-all duration-300 bg-card"
            >
              <span className="text-2xl mb-5 block" aria-hidden="true">{f.icon}</span>
              <h3 className="font-bold text-foreground text-base mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </StaggerGrid>
      </div>
    </section>
  );
}
