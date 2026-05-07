"use client";

import Link from "next/link";
import Image from "next/image";
import { useRef, useState, useCallback } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { HighlightText } from "@/app/_components/HighlightText";

const SLIDES = [
  {
    title: "Обери пакет",
    desc: "Стікер-паки або пакети принтів — підбери під формат заходу",
    img: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=900&q=85",
  },
  {
    title: "Обери товар",
    desc: "Футболки, худі, аксесуари — гості обирають на місці",
    img: "https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=900&q=85",
  },
  {
    title: "Ми приїжджаємо",
    desc: "Привозимо обладнання та наносимо принти прямо на заході",
    img: "https://images.unsplash.com/photo-1562157873-818bc0726f68?w=900&q=85",
  },
];

export function PopupStandSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  const [active, setActive] = useState(0);
  const [direction, setDirection] = useState(1);
  const dragStartX = useRef(0);
  const isDragging = useRef(false);
  const [dragX, setDragX] = useState(0);
  const n = SLIDES.length;

  const goTo = useCallback((idx: number, dir: number) => {
    setDirection(dir);
    setActive(((idx % n) + n) % n);
  }, [n]);
  const next = useCallback(() => goTo(active + 1, 1), [active, goTo]);
  const prev = useCallback(() => goTo(active - 1, -1), [active, goTo]);

  const variants = {
    enter: (d: number) => ({ x: d > 0 ? "100%" : "-100%", opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => ({ x: d > 0 ? "-30%" : "30%", opacity: 0 }),
  };

  return (
    <section className="bg-background py-24 sm:py-32 overflow-hidden" aria-labelledby="popup-heading">
      <div className="max-w-6xl mx-auto px-5 sm:px-10 lg:px-20">

        {/* Header */}
        <motion.div ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="mb-16"
        >
          <p className="text-muted-foreground text-xs font-semibold uppercase tracking-[0.2em] mb-5">U:DO Popup</p>
          <h2 id="popup-heading" className="text-foreground text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-[1.0] max-w-2xl">
            Виїзний стенд —{" "}
            <HighlightText delay={0.5}>
              мерч прямо на заході
            </HighlightText>
          </h2>
        </motion.div>

        {/* Layout: left = 3 step items, right = image */}
        <div className="grid lg:grid-cols-[1fr_1.4fr] gap-10 lg:gap-16 items-start">

          {/* Left — 3 items, clean, no extra elements */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.75, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col gap-0"
          >
            {SLIDES.map((slide, i) => (
              <button
                key={slide.title}
                onClick={() => goTo(i, i > active ? 1 : -1)}
                className="text-left py-7 border-b border-border last:border-0 group"
                aria-pressed={i === active}
              >
                <motion.p
                  animate={{
                    color: i === active ? "var(--color-foreground)" : "var(--color-muted-foreground)",
                  }}
                  transition={{ duration: 0.3 }}
                  className="font-bold text-lg mb-1.5 leading-tight"
                >
                  {slide.title}
                </motion.p>
                <motion.p
                  animate={{
                    color: i === active ? "var(--color-muted-foreground)" : "oklch(0.7 0 0)",
                  }}
                  transition={{ duration: 0.3 }}
                  className="text-sm leading-relaxed"
                >
                  {slide.desc}
                </motion.p>
              </button>
            ))}

            {/* CTAs — below the 3 items */}
            <div className="flex items-center gap-4 pt-8">
              <Link href="/popup"
                className="inline-flex items-center gap-2 bg-primary text-white font-bold text-sm px-6 py-3 rounded-full hover:bg-primary/90 active:scale-[0.97] transition-all duration-200">
                Дізнатись більше <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </Link>
              <Link href="#contact?ref=popup" className="text-muted-foreground hover:text-foreground font-medium text-sm transition-colors duration-200">
                Обговорити →
              </Link>
            </div>
          </motion.div>

          {/* Right — image only, no extra elements */}
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={isInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.8, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          >
            <div
              className="relative overflow-hidden rounded-2xl aspect-[3/4] select-none"
              onPointerDown={(e) => { dragStartX.current = e.clientX; isDragging.current = true; setDragX(0); }}
              onPointerMove={(e) => { if (!isDragging.current) return; setDragX(e.clientX - dragStartX.current); }}
              onPointerUp={() => { if (Math.abs(dragX) > 40) dragX < 0 ? next() : prev(); setDragX(0); isDragging.current = false; }}
              onPointerLeave={() => { setDragX(0); isDragging.current = false; }}
              style={{ cursor: "grab" }}
              role="region"
              aria-label="Фотографії Popup-стенду"
            >
              <AnimatePresence initial={false} custom={direction} mode="popLayout">
                <motion.div key={active} custom={direction} variants={variants}
                  initial="enter" animate="center" exit="exit"
                  transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
                  style={{ x: dragX }}
                  className="absolute inset-0"
                >
                  <Image
                    src={SLIDES[active].img}
                    alt={SLIDES[active].title}
                    fill
                    className="object-cover"
                    draggable={false}
                  />
                </motion.div>
              </AnimatePresence>

              {/* Minimal dot indicators only */}
              <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5">
                {SLIDES.map((_, i) => (
                  <button key={i} onClick={() => goTo(i, i > active ? 1 : -1)} aria-label={`Слайд ${i + 1}`}
                    className="rounded-full transition-all duration-300"
                    style={{
                      width: i === active ? 20 : 6,
                      height: 6,
                      backgroundColor: i === active ? "var(--color-primary)" : "var(--color-border)",
                    }}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
