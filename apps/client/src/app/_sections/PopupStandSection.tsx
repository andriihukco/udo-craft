"use client";

import Link from "next/link";
import Image from "next/image";
import { useRef, useState, useCallback } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { ArrowRight, Zap, Users, Clock } from "lucide-react";

const STEPS = [
  {
    title: "Обери пакет",
    desc: "Стікер-паки або пакети принтів — підбери під формат заходу",
    img: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&q=80",
  },
  {
    title: "Обери товар",
    desc: "Футболки, худі, аксесуари — гості обирають на місці",
    img: "https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=800&q=80",
  },
  {
    title: "Ми приїжджаємо",
    desc: "Привозимо обладнання та наносимо принти прямо на заході",
    img: "https://images.unsplash.com/photo-1562157873-818bc0726f68?w=800&q=80",
  },
];

const STATS = [
  { icon: Zap, value: "5 хв", label: "на виріб" },
  { icon: Users, value: "50k+", label: "гостей" },
  { icon: Clock, value: "500+", label: "заходів" },
];

export function PopupStandSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  const [active, setActive] = useState(0);
  const [direction, setDirection] = useState(1);
  const [dragX, setDragX] = useState(0);
  const dragStartX = useRef(0);
  const isDragging = useRef(false);
  const n = STEPS.length;

  const goTo = useCallback((idx: number, dir: number) => {
    setDirection(dir);
    setActive(((idx % n) + n) % n);
  }, [n]);
  const next = useCallback(() => goTo(active + 1, 1), [active, goTo]);
  const prev = useCallback(() => goTo(active - 1, -1), [active, goTo]);

  const variants = {
    enter: (d: number) => ({ x: d > 0 ? "100%" : "-100%", opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => ({ x: d > 0 ? "-40%" : "40%", opacity: 0 }),
  };

  return (
    <section className="bg-[#06060e] py-20 sm:py-28 overflow-hidden" aria-labelledby="popup-heading">
      <div className="max-w-6xl mx-auto px-5 sm:px-10 lg:px-20">

        {/* Header */}
        <motion.div ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mb-14"
        >
          <div>
            <div className="inline-flex items-center gap-2 bg-white/8 border border-white/12 rounded-full px-3 py-1.5 mb-5">
              <Zap className="w-3.5 h-3.5 text-white" aria-hidden="true" />
              <span className="text-white text-xs font-semibold">U:DO Popup</span>
            </div>
            <h2 id="popup-heading" className="text-white text-3xl sm:text-4xl font-black tracking-tight leading-tight">
              Виїзний стенд<br />з живою кастомізацією
            </h2>
          </div>
          <p className="text-white/55 text-sm max-w-xs leading-relaxed">
            Гості створюють унікальний мерч прямо на заході і забирають одразу.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-[1fr_1fr] gap-10 lg:gap-16 items-start">

          {/* Left — image carousel */}
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.75, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          >
            <div
              className="relative overflow-hidden rounded-2xl aspect-[4/3] select-none"
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
                  transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
                  style={{ x: dragX }}
                  className="absolute inset-0"
                >
                  <Image src={STEPS[active].img} alt={STEPS[active].title} fill className="object-cover" draggable={false} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                </motion.div>
              </AnimatePresence>

              {/* Slide controls */}
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                <div className="flex gap-1.5">
                  {STEPS.map((_, i) => (
                    <button key={i} onClick={() => goTo(i, i > active ? 1 : -1)} aria-label={`Фото ${i + 1}`}
                      className="rounded-full transition-all duration-300"
                      style={{ width: i === active ? 20 : 6, height: 6, backgroundColor: i === active ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.35)" }} />
                  ))}
                </div>
                <div className="flex gap-1.5">
                  {[{ fn: prev, d: "M9 11L5 7l4-4", label: "Попереднє" }, { fn: next, d: "M5 3l4 4-4 4", label: "Наступне" }].map(({ fn, d, label }) => (
                    <button key={label} onClick={fn} aria-label={label}
                      className="w-7 h-7 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white transition-colors">
                      <svg width="12" height="12" viewBox="0 0 14 14" fill="none"><path d={d} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right — steps + stats */}
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.75, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col gap-6"
          >
            {/* Steps */}
            <div className="space-y-3">
              {STEPS.map((step, i) => (
                <motion.button
                  key={step.title}
                  onClick={() => goTo(i, i > active ? 1 : -1)}
                  animate={{
                    backgroundColor: i === active ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.03)",
                    borderColor: i === active ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.07)",
                  }}
                  transition={{ duration: 0.3 }}
                  className="w-full text-left flex items-start gap-4 p-4 rounded-xl border transition-all duration-200 hover:bg-white/[0.06]"
                  aria-pressed={i === active}
                >
                  <span className="text-white/25 text-sm font-black tabular-nums mt-0.5 w-5 shrink-0" aria-hidden="true">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <p className="text-white font-semibold text-sm mb-0.5">{step.title}</p>
                    <p className="text-white/50 text-xs leading-relaxed">{step.desc}</p>
                  </div>
                </motion.button>
              ))}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
              {STATS.map((s) => {
                const Icon = s.icon;
                return (
                  <div key={s.label} className="bg-white/[0.04] border border-white/8 rounded-xl p-4 text-center">
                    <Icon className="w-4 h-4 text-primary mx-auto mb-2" aria-hidden="true" />
                    <p className="text-white font-black text-lg leading-none">{s.value}</p>
                    <p className="text-white/40 text-[10px] mt-1">{s.label}</p>
                  </div>
                );
              })}
            </div>

            {/* CTA */}
            <div className="flex items-center gap-4">
              <Link href="/popup"
                className="inline-flex items-center gap-2 bg-white text-[#06060e] font-bold text-sm px-6 py-3 rounded-full hover:bg-white/90 active:scale-[0.97] transition-all duration-200">
                Дізнатись більше <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </Link>
              <Link href="#contact?ref=popup" className="text-white/50 hover:text-white/80 font-medium text-sm transition-colors duration-200">
                Обговорити →
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
