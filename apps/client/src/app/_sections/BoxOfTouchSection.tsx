"use client";

import Link from "next/link";
import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { HighlightText } from "@/app/_components/HighlightText";

export function BoxOfTouchSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section className="bg-background py-24 sm:py-32 border-t border-border" aria-labelledby="box-heading">
      <div className="max-w-6xl mx-auto px-5 sm:px-10 lg:px-20">
        <div className="grid lg:grid-cols-[1fr_1fr] gap-16 lg:gap-24 items-start">

          {/* Left — editorial text, no cards */}
          <motion.div ref={ref}
            initial={{ opacity: 0, y: 24 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className="text-muted-foreground text-xs font-semibold uppercase tracking-[0.2em] mb-6">
              Box of Touch
            </p>
            <h2 id="box-heading" className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-[1.02] mb-8">
              Відчуй якість{" "}
              <HighlightText delay={0.5}>до того, як замовити</HighlightText>
            </h2>

            {/* Prose — not a list */}
            <div className="space-y-4 text-muted-foreground text-base leading-relaxed mb-10 max-w-md">
              <p>
                Більшість компаній замовляють тираж наосліп — і отримують не те, що очікували. Box of Touch вирішує це.
              </p>
              <p>
                Ми надсилаємо фізичний набір: зразки тканин різної щільності, всі доступні кольори, приклади нанесення — шовкодрук, вишивка, DTF. Тримаєш у руках те, що отримають твої клієнти.
              </p>
              <p>
                Безкоштовна доставка. Без зобов'язань.
              </p>
            </div>

            <Link href="#contact?ref=box"
              className="inline-flex items-center gap-2.5 bg-primary text-white font-semibold text-sm px-7 py-3.5 rounded-full hover:bg-primary/90 active:scale-[0.97] transition-all duration-200 shadow-md shadow-primary/20">
              Замовити Box of Touch <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
          </motion.div>

          {/* Right — dark panel, minimal */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.75, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
            className="bg-[#06060e] rounded-3xl p-10 lg:p-12"
          >
            <p className="text-white/40 text-xs font-semibold uppercase tracking-[0.2em] mb-8">
              Що всередині
            </p>

            {/* Simple list — no icons, no cards */}
            <ul className="space-y-5" aria-label="Вміст Box of Touch">
              {[
                { label: "Зразки виробів", desc: "Футболки, худі, лонгсліви — відчуй крій і посадку" },
                { label: "Зразки тканин", desc: "Різні склади та щільності — від 180 до 320 г/м²" },
                { label: "Кольорова палітра", desc: "Всі доступні кольори з реальними зразками" },
                { label: "Типи нанесення", desc: "Шовкодрук, вишивка, DTF — порівняй на дотик" },
              ].map((item, i) => (
                <motion.li key={item.label}
                  initial={{ opacity: 0, x: 12 }}
                  animate={isInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.5, delay: 0.25 + i * 0.08, ease: [0.22, 1, 0.36, 1] }}
                  className="flex items-start gap-4 border-b border-white/6 pb-5 last:border-0 last:pb-0"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" aria-hidden="true" />
                  <div>
                    <p className="text-white font-semibold text-sm mb-0.5">{item.label}</p>
                    <p className="text-white/50 text-xs leading-relaxed">{item.desc}</p>
                  </div>
                </motion.li>
              ))}
            </ul>

            {/* Social proof — inline, not a component */}
            <div className="mt-8 pt-6 border-t border-white/8 flex items-center gap-3">
              <div className="flex -space-x-2" aria-hidden="true">
                {["ОК", "МБ", "АМ", "ТГ"].map((a) => (
                  <div key={a} className="w-7 h-7 rounded-full bg-primary/20 border-2 border-[#06060e] flex items-center justify-center text-[9px] font-bold text-primary">{a}</div>
                ))}
              </div>
              <p className="text-white/40 text-xs">
                <span className="text-white/70 font-semibold">200+ команд</span> вже замовили
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
