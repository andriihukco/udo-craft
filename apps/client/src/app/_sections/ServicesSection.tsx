"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { FadeUp, cardVariant } from "@/app/_components/FadeUp";

const POPUP_STEPS = [
  { step: "01", title: "Обери пакет", desc: "Стікер-паки або пакети принтів — підбери під формат заходу", img: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&q=80" },
  { step: "02", title: "Обери товар", desc: "Футболки, худі, аксесуари — гості обирають на місці", img: "https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=600&q=80" },
  { step: "03", title: "Ми приїжджаємо", desc: "Привозимо обладнання та наносимо принти прямо на заході", img: "https://images.unsplash.com/photo-1562157873-818bc0726f68?w=600&q=80" },
];

function PopupCarousel() {
  const [active, setActive] = useState(0);
  const [direction, setDirection] = useState(1);
  const [dragX, setDragX] = useState(0);
  const dragStartX = useRef(0);
  const isDragging = useRef(false);
  const n = POPUP_STEPS.length;
  const goTo = useCallback((idx: number, dir: number) => { setDirection(dir); setActive(((idx % n) + n) % n); }, [n]);
  const next = useCallback(() => goTo(active + 1, 1), [active, goTo]);
  const prev = useCallback(() => goTo(active - 1, -1), [active, goTo]);
  const variants = {
    enter: (d: number) => ({ x: d > 0 ? "100%" : "-100%", opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => ({ x: d > 0 ? "-60%" : "60%", opacity: 0 }),
  };
  return (
    <div className="flex flex-col gap-3 select-none">
      <div className="relative overflow-hidden rounded-xl aspect-[4/3]"
        onPointerDown={(e) => { dragStartX.current = e.clientX; isDragging.current = true; setDragX(0); }}
        onPointerMove={(e) => { if (!isDragging.current) return; setDragX(e.clientX - dragStartX.current); }}
        onPointerUp={() => { if (Math.abs(dragX) > 40) dragX < 0 ? next() : prev(); setDragX(0); isDragging.current = false; }}
        onPointerLeave={() => { setDragX(0); isDragging.current = false; }}
        style={{ cursor: "grab" }}>
        <AnimatePresence initial={false} custom={direction} mode="popLayout">
          <motion.div key={active} custom={direction} variants={variants} initial="enter" animate="center" exit="exit"
            transition={{ duration: 0.45, ease: [0.32, 0.72, 0, 1] }} style={{ x: dragX }} className="absolute inset-0">
            <Image src={POPUP_STEPS[active].img} alt={POPUP_STEPS[active].title} fill className="object-cover" draggable={false} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <div className="absolute top-3 left-3 px-2 py-0.5 rounded-full bg-black/50 backdrop-blur-sm border border-white/15 text-white text-[10px] font-bold tracking-wider">{POPUP_STEPS[active].step}</div>
            <div className="absolute bottom-0 left-0 right-0 px-4 pb-4">
              <p className="text-white font-bold text-sm mb-0.5">{POPUP_STEPS[active].title}</p>
              <p className="text-white/60 text-xs leading-relaxed">{POPUP_STEPS[active].desc}</p>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex gap-1.5">
          {POPUP_STEPS.map((_, i) => (
            <button key={i} onClick={() => goTo(i, i > active ? 1 : -1)} aria-label={`Крок ${i + 1}`}
              className="rounded-full transition-all duration-300"
              style={{ width: i === active ? 18 : 6, height: 6, backgroundColor: i === active ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.25)" }} />
          ))}
        </div>
        <div className="flex gap-1.5">
          {[{ fn: prev, d: "M9 11L5 7l4-4", label: "Попередній" }, { fn: next, d: "M5 3l4 4-4 4", label: "Наступний" }].map(({ fn, d, label }) => (
            <button key={label} onClick={fn} aria-label={label}
              className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 flex items-center justify-center text-white transition-colors">
              <svg width="12" height="12" viewBox="0 0 14 14" fill="none"><path d={d} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

interface ServicesSectionProps {
  heading: string;
  service1Title: string; service1Desc: string; service1Cta: string;
  service2Title: string; service2Desc: string; service2Cta: string;
}

export function ServicesSection({ heading, service1Title, service1Desc, service1Cta, service2Title, service2Desc, service2Cta }: ServicesSectionProps) {
  return (
    <section className="bg-background py-20 sm:py-28">
      <div className="max-w-6xl mx-auto px-5 sm:px-8 lg:px-16">
        {/* Header */}
        <FadeUp className="flex items-end justify-between mb-12">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary block mb-2">03</span>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight">{heading}</h2>
          </div>
        </FadeUp>

        {/* Bento grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-auto">

          {/* Box of Touch — tall left card */}
          <motion.div variants={cardVariant} initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="lg:row-span-2 relative bg-[#08080f] rounded-2xl overflow-hidden flex flex-col min-h-[320px] lg:min-h-0 group">
            <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(ellipse at 20% 20%, #3b82f6 0%, transparent 60%), radial-gradient(ellipse at 85% 85%, #6366f1 0%, transparent 55%)" }} />
            <div className="relative z-10 flex flex-col flex-1 p-7 sm:p-8">
              <div className="flex-1">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30 block mb-5">Семпли</span>
                <h3 className="text-white text-2xl sm:text-3xl font-black tracking-tight leading-tight mb-3">{service1Title}</h3>
                <p className="text-white/45 text-sm leading-relaxed">{service1Desc}</p>
              </div>
              <div className="mt-8 pt-6 border-t border-white/8">
                <Link href="#contact?ref=box"
                  className="inline-flex items-center gap-2 bg-white text-gray-900 text-xs font-bold px-5 py-2.5 rounded-full hover:bg-gray-100 active:scale-95 transition-all duration-200">
                  {service1Cta} <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </motion.div>

          {/* Designer — top right */}
          <motion.div variants={cardVariant} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-40px" }}
            className="relative rounded-2xl overflow-hidden flex flex-col min-h-[260px] group">
            <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('/designer-bg.jpg')" }} />
            <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-black/60 to-black/40" />
            <div className="relative z-10 flex flex-col flex-1 p-7 sm:p-8">
              <div className="flex-1">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30 block mb-5">Дизайн</span>
                <h3 className="text-white text-2xl font-black tracking-tight leading-tight mb-3">{service2Title}</h3>
                <p className="text-white/50 text-sm leading-relaxed">{service2Desc}</p>
              </div>
              <div className="mt-6">
                <Link href="#contact?ref=designer"
                  className="inline-flex items-center gap-2 bg-primary text-white text-xs font-bold px-5 py-2.5 rounded-full hover:bg-primary/90 active:scale-95 transition-all duration-200">
                  {service2Cta} <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </motion.div>

          {/* Popup carousel — bottom right */}
          <motion.div variants={cardVariant} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-40px" }}
            className="relative bg-[#0c0c0c] rounded-2xl overflow-hidden flex flex-col p-7 sm:p-8">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30 block mb-4">Popup-стенд</span>
            <PopupCarousel />
            <div className="mt-5 pt-5 border-t border-white/8 flex items-center justify-between">
              <div className="flex gap-5">
                {[["500+", "заходів"], ["5 хв", "виріб"]].map(([v, l]) => (
                  <div key={l}><p className="text-white text-base font-black">{v}</p><p className="text-white/25 text-[10px]">{l}</p></div>
                ))}
              </div>
              <Link href="/popup" className="inline-flex items-center gap-1.5 text-white/50 hover:text-white text-xs font-semibold transition-colors duration-200">
                Детальніше <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </motion.div>

          {/* Popup full-width banner */}
          <motion.div variants={cardVariant} initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="md:col-span-2 lg:col-span-3 relative bg-[#0c0c0c] rounded-2xl overflow-hidden">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 px-8 py-7 sm:px-10">
              <div className="flex items-center gap-8">
                <div>
                  <p className="text-white/20 text-[10px] font-bold uppercase tracking-[0.2em] mb-1">U:DO Popup</p>
                  <p className="text-white text-lg font-black tracking-tight">Виїзний стенд з живою кастомізацією</p>
                </div>
                <div className="hidden sm:flex gap-6 pl-8 border-l border-white/8">
                  {[["500+", "заходів"], ["50k+", "гостей"], ["5 хв", "на виріб"]].map(([v, l]) => (
                    <div key={l}><p className="text-white text-lg font-black">{v}</p><p className="text-white/25 text-[10px]">{l}</p></div>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-4 shrink-0">
                <Link href="/popup" className="inline-flex items-center gap-2 bg-white text-[#0c0c0c] font-bold text-xs px-5 py-2.5 rounded-full hover:bg-white/90 active:scale-95 transition-all duration-200">
                  Дізнатись більше <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <Link href="#contact?ref=popup" className="text-white/30 hover:text-white/60 font-medium text-xs transition-colors duration-200 whitespace-nowrap">
                  Обговорити →
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
