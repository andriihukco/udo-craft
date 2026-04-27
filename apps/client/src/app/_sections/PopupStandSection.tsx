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
    <section className="bg-[#06060e] py-24 sm:py-32 overflow-hidden" aria-labelledby="popup-heading">
      <div className="max-w-6xl mx-auto px-5 sm:px-10 lg:px-20">

        {/* Header — asymmetric, text-heavy */}
        <motion.div ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="mb-16"
        >
          <p className="text-white/40 text-xs font-semibold uppercase tracking-[0.2em] mb-5">U:DO Popup</p>
          <div className="grid lg:grid-cols-[1fr_1fr] gap-8 lg:gap-16 items-end">
            <h2 id="popup-heading" className="text-white text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-[1.0]">
              Виїзний стенд —{" "}
              <HighlightText delay={0.5} color="rgba(59,130,246,0.25)">
                мерч прямо на заході
              </HighlightText>
            </h2>
            <p className="text-white/55 text-base leading-relaxed">
              Привозимо обладнання, гості обирають товар і дизайн, забирають готовий виріб за 5 хвилин. Ідеально для корпоративів, конференцій, фестивалів.
            </p>
          </div>
        </motion.div>

        {/* Full-bleed image + content */}
        <div className="grid lg:grid-cols-[1.2fr_1fr] gap-8 lg:gap-12 items-start">

          {/* Image carousel — large, cinematic */}
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={isInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          >
            <div
              className="relative overflow-hidden rounded-2xl aspect-[3/2] select-none"
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
                  <Image src={SLIDES[active].img} alt={SLIDES[active].title} fill className="object-cover" draggable={false} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                </motion.div>
              </AnimatePresence>

              {/* Minimal controls */}
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                <div className="flex gap-1.5">
                  {SLIDES.map((_, i) => (
                    <button key={i} onClick={() => goTo(i, i > active ? 1 : -1)} aria-label={`Слайд ${i + 1}`}
                      className="rounded-full transition-all duration-400"
                      style={{ width: i === active ? 24 : 6, height: 6, backgroundColor: i === active ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.3)" }} />
                  ))}
                </div>
                <div className="flex gap-1.5">
                  {[{ fn: prev, d: "M9 11L5 7l4-4", label: "Попереднє" }, { fn: next, d: "M5 3l4 4-4 4", label: "Наступне" }].map(({ fn, d, label }) => (
                    <button key={label} onClick={fn} aria-label={label}
                      className="w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white transition-colors">
                      <svg width="12" height="12" viewBox="0 0 14 14" fill="none"><path d={d} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right — prose + numbers, no icon grid */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.75, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col gap-8 pt-2"
          >
            {/* Slide titles as clickable list */}
            <div className="space-y-1">
              {SLIDES.map((slide, i) => (
                <button key={slide.title} onClick={() => goTo(i, i > active ? 1 : -1)}
                  className="w-full text-left flex items-start gap-4 py-3 border-b border-white/8 last:border-0 group"
                  aria-pressed={i === active}
                >
                  <motion.span
                    animate={{ color: i === active ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.2)" }}
                    className="text-xs font-black tabular-nums mt-0.5 w-4 shrink-0"
                  >
                    {String(i + 1).padStart(2, "0")}
                  </motion.span>
                  <div>
                    <motion.p
                      animate={{ color: i === active ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.45)" }}
                      className="font-semibold text-sm mb-0.5 transition-colors"
                    >
                      {slide.title}
                    </motion.p>
                    <p className="text-white/35 text-xs leading-relaxed">{slide.desc}</p>
                  </div>
                </button>
              ))}
            </div>

            {/* Key numbers — large, editorial */}
            <div className="grid grid-cols-3 gap-4 py-6 border-y border-white/8">
              {[["5 хв", "на виріб"], ["50k+", "гостей"], ["500+", "заходів"]].map(([v, l]) => (
                <div key={l}>
                  <p className="text-white text-2xl font-black leading-none mb-1">{v}</p>
                  <p className="text-white/40 text-xs">{l}</p>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-4">
              <Link href="/popup"
                className="inline-flex items-center gap-2 bg-white text-[#06060e] font-bold text-sm px-6 py-3 rounded-full hover:bg-white/90 active:scale-[0.97] transition-all duration-200">
                Дізнатись більше <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </Link>
              <Link href="#contact?ref=popup" className="text-white/45 hover:text-white/75 font-medium text-sm transition-colors duration-200">
                Обговорити →
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
