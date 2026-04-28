"use client";

import Link from "next/link";
import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { HighlightText } from "@/app/_components/HighlightText";

const CONTENTS = [
  { label: "Зразки виробів", desc: "Футболки, худі, лонгсліви — відчуй крій і посадку" },
  { label: "Зразки тканин", desc: "Різні склади та щільності — від 180 до 320 г/м²" },
  { label: "Кольорова палітра", desc: "Всі доступні кольори з реальними зразками" },
  { label: "Типи нанесення", desc: "Шовкодрук, вишивка, DTF — порівняй на дотик" },
];

export function BoxOfTouchSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section
      className="bg-background border-t border-border overflow-hidden"
      aria-labelledby="box-heading"
    >
      <div className="max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-2 min-h-[520px]">

          {/* Left — content, full height */}
          <motion.div
            ref={ref}
            initial={{ opacity: 0, x: -24 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col justify-center px-8 sm:px-12 lg:px-16 py-16 lg:py-20"
          >
            <p className="text-muted-foreground text-xs font-semibold uppercase tracking-[0.2em] mb-6">
              Box of Touch
            </p>
            <h2
              id="box-heading"
              className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-[1.02] mb-6"
            >
              Відчуй якість{" "}
              <HighlightText delay={0.5}>до того, як замовити</HighlightText>
            </h2>

            <p className="text-muted-foreground text-base leading-relaxed mb-8 max-w-md">
              Більшість компаній замовляють тираж наосліп — і отримують не те, що очікували. Box of Touch вирішує це: фізичний набір зразків тканин, кольорів та типів нанесення.
            </p>

            {/* Contents list */}
            <ul className="space-y-3 mb-10" aria-label="Вміст Box of Touch">
              {CONTENTS.map((item, i) => (
                <motion.li
                  key={item.label}
                  initial={{ opacity: 0, x: -12 }}
                  animate={isInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.5, delay: 0.3 + i * 0.07, ease: [0.22, 1, 0.36, 1] }}
                  className="flex items-start gap-3"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" aria-hidden="true" />
                  <div>
                    <span className="text-foreground text-sm font-semibold">{item.label}</span>
                    <span className="text-muted-foreground text-sm"> — {item.desc}</span>
                  </div>
                </motion.li>
              ))}
            </ul>

            <div className="flex items-center gap-4">
              <Link
                href="#contact?ref=box"
                className="inline-flex items-center gap-2.5 bg-primary text-white font-semibold text-sm px-7 py-3.5 rounded-full hover:bg-primary/90 active:scale-[0.97] transition-all duration-200 shadow-md shadow-primary/20"
              >
                Замовити Box of Touch <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </Link>
            </div>
            <p className="text-muted-foreground text-xs mt-3">Безкоштовна доставка · Без зобов'язань</p>
          </motion.div>

          {/* Right — full-height video */}
          <motion.div
            initial={{ opacity: 0, scale: 1.02 }}
            animate={isInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.9, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="relative min-h-[360px] lg:min-h-0 overflow-hidden"
          >
            <video
              className="absolute inset-0 w-full h-full object-cover"
              src="/bot-video.mp4"
              autoPlay
              loop
              muted
              playsInline
              preload="auto"
              aria-hidden="true"
            />
            {/* Subtle left fade to blend with content */}
            <div
              className="absolute inset-0 bg-gradient-to-r from-background via-transparent to-transparent lg:block hidden"
              aria-hidden="true"
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
