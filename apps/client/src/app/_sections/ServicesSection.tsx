"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { FadeUp, cardVariant } from "@/app/_components/FadeUp";

const POPUP_STEPS = [
  {
    step: "01",
    title: "Обери пакет",
    desc: "Стікер-паки або пакети принтів — підбери під формат заходу",
    img: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&q=80",
  },
  {
    step: "02",
    title: "Обери товар",
    desc: "Футболки, худі, аксесуари — гості обирають на місці",
    img: "https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=600&q=80",
  },
  {
    step: "03",
    title: "Ми приїжджаємо",
    desc: "Привозимо обладнання та наносимо принти прямо на заході",
    img: "https://images.unsplash.com/photo-1562157873-818bc0726f68?w=600&q=80",
  },
];

function PopupCarousel() {
  const [active, setActive] = useState(0);
  const [direction, setDirection] = useState(1);
  const [dragX, setDragX] = useState(0);
  const dragStartX = useRef(0);
  const isDragging = useRef(false);
  const n = POPUP_STEPS.length;

  const goTo = useCallback(
    (idx: number, dir: number) => {
      setDirection(dir);
      setActive(((idx % n) + n) % n);
    },
    [n]
  );

  const next = useCallback(() => goTo(active + 1, 1), [active, goTo]);
  const prev = useCallback(() => goTo(active - 1, -1), [active, goTo]);

  const variants = {
    enter: (d: number) => ({ x: d > 0 ? "100%" : "-100%", opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => ({ x: d > 0 ? "-60%" : "60%", opacity: 0 }),
  };

  return (
    <div className="flex flex-col gap-4 select-none" role="region" aria-label="Кроки popup-стенду">
      <div
        className="relative overflow-hidden rounded-2xl aspect-[4/3]"
        onPointerDown={(e) => { dragStartX.current = e.clientX; isDragging.current = true; setDragX(0); }}
        onPointerMove={(e) => { if (!isDragging.current) return; setDragX(e.clientX - dragStartX.current); }}
        onPointerUp={() => { if (Math.abs(dragX) > 40) dragX < 0 ? next() : prev(); setDragX(0); isDragging.current = false; }}
        onPointerLeave={() => { setDragX(0); isDragging.current = false; }}
        style={{ cursor: isDragging.current ? "grabbing" : "grab" }}
      >
        <AnimatePresence initial={false} custom={direction} mode="popLayout">
          <motion.div
            key={active}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.45, ease: [0.32, 0.72, 0, 1] }}
            style={{ x: dragX }}
            className="absolute inset-0"
          >
            <Image src={POPUP_STEPS[active].img} alt={POPUP_STEPS[active].title} fill className="object-cover" draggable={false} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
            <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-sm border border-white/20 text-white text-[11px] font-black tracking-wide">
              {POPUP_STEPS[active].step}
            </div>
            <div className="absolute bottom-0 left-0 right-0 px-5 pb-5 pt-8">
              <p className="text-white font-bold text-base leading-tight mb-1">{POPUP_STEPS[active].title}</p>
              <p className="text-white/70 text-sm leading-relaxed">{POPUP_STEPS[active].desc}</p>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-1.5">
          {POPUP_STEPS.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i, i > active ? 1 : -1)}
              aria-label={`Крок ${i + 1}`}
              className="transition-all duration-300 rounded-full"
              style={{ width: i === active ? 20 : 6, height: 6, backgroundColor: i === active ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.3)" }}
            />
          ))}
        </div>
        <div className="flex items-center gap-2">
          {[{ fn: prev, d: "M9 11L5 7l4-4", label: "Попередній" }, { fn: next, d: "M5 3l4 4-4 4", label: "Наступний" }].map(({ fn, d, label }) => (
            <button key={label} onClick={fn} aria-label={label}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center text-white transition-colors">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <path d={d} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

interface ServicesSectionProps {
  heading: string;
  service1Title: string;
  service1Desc: string;
  service1Cta: string;
  service2Title: string;
  service2Desc: string;
  service2Cta: string;
}

export function ServicesSection({
  heading,
  service1Title,
  service1Desc,
  service1Cta,
  service2Title,
  service2Desc,
  service2Cta,
}: ServicesSectionProps) {
  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 py-20 sm:py-28">
      <FadeUp className="mb-12">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary mb-2">
          Додаткові послуги
        </p>
        <h2 className="text-3xl sm:text-4xl font-black tracking-tight">{heading}</h2>
      </FadeUp>

      <div className="flex flex-col gap-4">
        {/* Row 1 — two service cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Box of Touch */}
          <motion.div
            variants={cardVariant}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="relative bg-[#0a0a0f] rounded-3xl overflow-hidden flex flex-col min-h-[300px] group"
          >
            <div
              className="absolute inset-0 opacity-25"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 25% 25%, #3b82f6 0%, transparent 55%), radial-gradient(circle at 80% 80%, #6366f1 0%, transparent 50%)",
              }}
            />
            <div className="relative z-10 flex flex-col flex-1 p-8 sm:p-10">
              <div className="flex-1">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-white/35 mb-6">
                  <span className="w-1 h-1 rounded-full bg-white/25" />
                  Семпли
                </span>
                <h3 className="text-white text-3xl sm:text-4xl font-black tracking-tight leading-tight mb-4">
                  {service1Title}
                </h3>
                <p className="text-white/50 text-sm leading-relaxed max-w-sm">{service1Desc}</p>
              </div>
              <div className="mt-10">
                <Link
                  href="#contact?ref=box"
                  className="inline-flex items-center gap-2 bg-white text-gray-900 text-sm font-semibold px-6 py-3 rounded-full hover:bg-gray-100 active:scale-95 transition-all duration-200"
                >
                  {service1Cta} <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </motion.div>

          {/* Designer */}
          <motion.div
            variants={cardVariant}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-40px" }}
            className="relative rounded-3xl overflow-hidden flex flex-col min-h-[300px] group"
          >
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: "url('/designer-bg.jpg')" }}
            />
            <div className="absolute inset-0 bg-gradient-to-br from-black/75 via-black/55 to-black/35" />
            <div className="relative z-10 flex flex-col flex-1 p-8 sm:p-10">
              <div className="flex-1">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-white/35 mb-6">
                  <span className="w-1 h-1 rounded-full bg-white/25" />
                  Дизайн
                </span>
                <h3 className="text-white text-3xl sm:text-4xl font-black tracking-tight leading-tight mb-4">
                  {service2Title}
                </h3>
                <p className="text-white/55 text-sm leading-relaxed max-w-xs">{service2Desc}</p>
              </div>
              <div className="mt-10">
                <Link
                  href="#contact?ref=designer"
                  className="inline-flex items-center gap-2 bg-primary text-white text-sm font-semibold px-6 py-3 rounded-full hover:bg-primary/90 active:scale-95 transition-all duration-200"
                >
                  {service2Cta} <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Row 2 — Popup */}
        <motion.div
          variants={cardVariant}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="relative overflow-hidden rounded-3xl bg-[#0c0c0c] min-h-[480px] flex flex-col justify-between"
        >
          <div className="px-8 pt-12 md:px-14 md:pt-14 lg:px-16 lg:pt-16">
            <p className="text-white/20 text-[11px] font-bold uppercase tracking-[0.25em] mb-8">
              Popup-стенд
            </p>
            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-10">
              <div>
                <h2 className="text-white text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[0.95] mb-6">
                  U:DO
                  <br />
                  Popup
                </h2>
                <p className="text-white/40 text-base max-w-sm leading-relaxed">
                  Виїзний стенд з живою кастомізацією. Гості створюють унікальний мерч і забирають
                  одразу.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row gap-px bg-white/5 rounded-2xl overflow-hidden shrink-0 lg:max-w-xs xl:max-w-none">
                {[
                  { n: "01", label: "Виїзд" },
                  { n: "02", label: "Кастомізація" },
                  { n: "03", label: "Готово" },
                ].map((s) => (
                  <div key={s.n} className="bg-[#0c0c0c] px-6 py-4 flex items-center gap-3 flex-1">
                    <span className="text-white/15 text-2xl font-black leading-none select-none w-8 shrink-0">
                      {s.n}
                    </span>
                    <span className="text-white/55 text-sm font-medium">{s.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-8 py-8 md:px-14 lg:px-16 mt-8 border-t border-white/5">
            <div className="flex gap-8">
              {[["500+", "заходів"], ["50k+", "гостей"], ["5 хв", "на виріб"]].map(([v, l]) => (
                <div key={l}>
                  <p className="text-white text-xl font-black">{v}</p>
                  <p className="text-white/25 text-xs mt-0.5">{l}</p>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-5">
              <Link
                href="/popup"
                className="inline-flex items-center gap-2 bg-white text-[#0c0c0c] font-semibold text-sm px-6 py-3 rounded-full hover:bg-white/90 active:scale-95 transition-all duration-200"
              >
                Дізнатись більше <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link
                href="#contact?ref=popup"
                className="text-white/35 hover:text-white/70 font-medium text-sm transition-colors duration-200 whitespace-nowrap"
              >
                Обговорити →
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
