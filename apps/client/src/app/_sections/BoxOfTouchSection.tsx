"use client";

import Link from "next/link";
import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { ArrowRight, Package, Shirt, Palette, Layers } from "lucide-react";

const WHAT_INSIDE = [
  { icon: Shirt, label: "Зразки виробів", desc: "Футболки, худі, лонгсліви — відчуй крій і посадку" },
  { icon: Layers, label: "Зразки тканин", desc: "Різні склади та щільності — від 180 до 320 г/м²" },
  { icon: Palette, label: "Кольорова палітра", desc: "Всі доступні кольори з реальними зразками" },
  { icon: Package, label: "Типи нанесення", desc: "Шовкодрук, вишивка, DTF — порівняй на дотик" },
];

export function BoxOfTouchSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section className="bg-background py-20 sm:py-28 border-t border-border" aria-labelledby="box-heading">
      <div className="max-w-6xl mx-auto px-5 sm:px-10 lg:px-20">
        <div className="grid lg:grid-cols-2 gap-14 lg:gap-20 items-center">

          {/* Left — content */}
          <motion.div ref={ref}
            initial={{ opacity: 0, x: -24 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Eyebrow */}
            <div className="inline-flex items-center gap-2 bg-primary/8 border border-primary/15 rounded-full px-3 py-1.5 mb-6">
              <Package className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
              <span className="text-primary text-xs font-semibold">Box of Touch</span>
            </div>

            <h2 id="box-heading" className="text-3xl sm:text-4xl font-black tracking-tight leading-[1.05] mb-5">
              Відчуй якість<br />до того, як замовити тираж
            </h2>
            <p className="text-muted-foreground text-base leading-relaxed mb-8 max-w-md">
              Замов фізичний набір зразків — тканини, кольори, типи нанесення. Тримай у руках те, що отримають твої клієнти.
            </p>

            <Link href="#contact?ref=box"
              className="inline-flex items-center gap-2.5 bg-primary text-white font-semibold text-sm px-7 py-3.5 rounded-full hover:bg-primary/90 active:scale-[0.97] transition-all duration-200 shadow-md shadow-primary/20">
              Замовити Box of Touch <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
            <p className="text-muted-foreground text-xs mt-3">Безкоштовна доставка · Без зобов'язань</p>
          </motion.div>

          {/* Right — what's inside */}
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.75, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Box visual */}
            <div className="bg-[#06060e] rounded-3xl p-8 mb-4">
              <p className="text-white/40 text-[10px] font-bold uppercase tracking-[0.2em] mb-6">Що всередині</p>
              <div className="grid grid-cols-2 gap-3">
                {WHAT_INSIDE.map((item, i) => {
                  const Icon = item.icon;
                  return (
                    <motion.div key={item.label}
                      initial={{ opacity: 0, y: 12 }}
                      animate={isInView ? { opacity: 1, y: 0 } : {}}
                      transition={{ duration: 0.5, delay: 0.2 + i * 0.08, ease: [0.22, 1, 0.36, 1] }}
                      className="bg-white/[0.05] border border-white/8 rounded-xl p-4"
                    >
                      <Icon className="w-4 h-4 text-primary mb-2.5" aria-hidden="true" />
                      <p className="text-white text-xs font-bold mb-1">{item.label}</p>
                      <p className="text-white/50 text-[11px] leading-relaxed">{item.desc}</p>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Social proof */}
            <div className="flex items-center gap-3 px-1">
              <div className="flex -space-x-2">
                {["ОК", "МБ", "АМ", "ТГ"].map((a) => (
                  <div key={a} className="w-7 h-7 rounded-full bg-primary/20 border-2 border-background flex items-center justify-center text-[9px] font-bold text-primary" aria-hidden="true">{a}</div>
                ))}
              </div>
              <p className="text-muted-foreground text-xs">
                <span className="text-foreground font-semibold">200+ команд</span> вже замовили Box of Touch
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
