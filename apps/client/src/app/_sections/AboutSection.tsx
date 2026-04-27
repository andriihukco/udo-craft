"use client";

import { motion } from "framer-motion";
import { FadeUp, StaggerGrid, cardVariant } from "@/app/_components/FadeUp";

const FEATURES = [
  { icon: "🎨", title: "Онлайн-редактор",   desc: "Завантажуй логотип, розміщуй на виробі та одразу бачиш результат. Без зайвих листів і погоджень." },
  { icon: "📦", title: "Від 10 одиниць",     desc: "Не потрібно замовляти сотні. Починай з малого тиражу — ідеально для стартапів і команд." },
  { icon: "💳", title: "Прозора ціна",       desc: "Рахунок-фактура одразу після замовлення. Ніяких прихованих доплат — тільки чесна ціна." },
  { icon: "⚡", title: "Швидке виробництво", desc: "7–14 робочих днів від підтвердження до доставки. Дедлайн — це не проблема." },
  { icon: "🔒", title: "Контроль якості",    desc: "Кожна партія проходить перевірку перед відправкою. Ми відповідаємо за результат." },
  { icon: "💬", title: "Особистий менеджер", desc: "Ваш менеджер на зв'язку від першого запиту до отримання замовлення." },
];

const STATS = [
  { value: "500+", label: "задоволених клієнтів" },
  { value: "10k+", label: "виробів щороку" },
  { value: "7–14", label: "днів виробництво" },
  { value: "100%", label: "контроль якості" },
];

export function AboutSection() {
  return (
    <section id="about" className="bg-background py-24 sm:py-32">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Editorial intro */}
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-start mb-20">
          <FadeUp>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] mb-5 text-primary">
              Про нас
            </p>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.02] mb-8">
              Ми робимо мерч, який носять
            </h2>
            <p className="text-muted-foreground text-base leading-relaxed mb-4">
              U:DO Craft — українська платформа корпоративного мерчу. Ми поєднуємо онлайн-редактор,
              власне виробництво та особистий сервіс, щоб ваш бренд виглядав бездоганно.
            </p>
            <p className="text-muted-foreground text-base leading-relaxed">
              Від стартапів до великих корпорацій — ми допомагаємо командам створювати мерч, яким
              пишаються. Від 10 одиниць, без прихованих доплат, з доставкою по Україні.
            </p>
          </FadeUp>

          <FadeUp delay={0.12}>
            <div className="grid grid-cols-2 gap-px bg-border rounded-3xl overflow-hidden">
              {STATS.map((s) => (
                <div key={s.label} className="bg-background px-6 py-10 text-center">
                  <p className="text-3xl sm:text-4xl font-black text-primary mb-2">{s.value}</p>
                  <p className="text-xs text-muted-foreground leading-snug">{s.label}</p>
                </div>
              ))}
            </div>
          </FadeUp>
        </div>

        {/* Feature grid */}
        <StaggerGrid className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((f) => (
            <motion.div
              key={f.title}
              variants={cardVariant}
              whileHover={{ y: -6 }}
              transition={{ duration: 0.2 }}
              className="bg-card rounded-3xl p-8 border border-border hover:shadow-2xl hover:shadow-black/5 hover:border-border/60 transition-all duration-300"
            >
              <span className="text-3xl mb-6 block" aria-hidden="true">
                {f.icon}
              </span>
              <h3 className="font-bold text-foreground text-lg mb-3">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </StaggerGrid>
      </div>
    </section>
  );
}
