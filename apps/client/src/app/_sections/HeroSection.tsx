"use client";

import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Shrink, Play } from "lucide-react";

interface HeroSectionProps {
  cinemaMode: boolean;
  onCinemaEnter: () => void;
  onCinemaExit: () => void;
  heading: string;
  subheading: string;
  ctaPrimaryText: string;
  ctaPrimaryUrl: string;
  ctaSecondaryText: string;
  badge1: string;
  badge2: string;
  badge3: string;
}

function AnimatedHeadline({ text }: { text: string }) {
  const words = text.split(" ");
  return (
    <span aria-label={text}>
      {words.map((word, i) => (
        <span key={i} className="inline-block overflow-hidden mr-[0.22em] last:mr-0">
          <motion.span
            className="inline-block"
            initial={{ y: "110%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 1.3 + i * 0.065, ease: [0.22, 1, 0.36, 1] }}
          >
            {word}
          </motion.span>
        </span>
      ))}
    </span>
  );
}

export function HeroSection({
  cinemaMode, onCinemaEnter, onCinemaExit,
  heading, subheading,
  ctaPrimaryText, ctaPrimaryUrl,
  ctaSecondaryText,
  badge1, badge2, badge3,
}: HeroSectionProps) {
  return (
    <section className="relative min-h-[100svh] bg-[#06060e] overflow-hidden flex flex-col" aria-label="Головна секція">
      {/* Skip link */}
      <a href="#collections" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:bg-primary focus:text-white focus:px-4 focus:py-2 focus:rounded-full focus:text-sm focus:font-semibold">
        Перейти до каталогу
      </a>

      {/* Video */}
      <video
        className="absolute inset-0 w-full h-full object-cover opacity-0 transition-[opacity] duration-[2s]"
        onCanPlay={(e) => {
          if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
            (e.target as HTMLVideoElement).style.opacity = "0.3";
          }
        }}
        src="/hero-video.mp4" poster="/hero-poster.jpg"
        autoPlay loop muted playsInline preload="auto" aria-hidden="true"
      />

      {/* Overlays */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#06060e]/60 via-transparent to-[#06060e]/95 pointer-events-none" aria-hidden="true" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#06060e]/50 to-transparent pointer-events-none" aria-hidden="true" />

      {/* Cinema */}
      <AnimatePresence>
        {cinemaMode && (
          <motion.div key="cinema" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9998] bg-black" role="dialog" aria-label="Відео у повноекранному режимі">
            <video className="absolute inset-0 w-full h-full object-cover" src="/hero-video.mp4" autoPlay loop muted playsInline aria-hidden="true" />
            <button onClick={onCinemaExit} aria-label="Закрити відео"
              className="absolute bottom-6 right-6 flex items-center gap-2 px-4 py-2.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-semibold transition-all">
              <Shrink className="w-3.5 h-3.5" aria-hidden="true" /> Закрити
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content */}
      <motion.div
        animate={{ opacity: cinemaMode ? 0 : 1 }}
        transition={{ duration: 0.4 }}
        style={{ pointerEvents: cinemaMode ? "none" : "auto" }}
        className="relative flex-1 flex flex-col justify-end px-5 sm:px-10 lg:px-20 pb-16 pt-36"
        aria-hidden={cinemaMode}
      >
        {/* Eyebrow — accessible contrast: white/60 on near-black = 7:1+ */}
        <motion.p
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.55, delay: 1.1, ease: [0.22, 1, 0.36, 1] }}
          className="text-white/60 text-[11px] font-semibold uppercase tracking-[0.22em] mb-6 flex items-center gap-3"
        >
          <span className="w-5 h-px bg-primary" aria-hidden="true" />
          Корпоративний мерч · Україна
        </motion.p>

        {/* Headline */}
        <h1 className="text-white font-black leading-[0.9] tracking-[-0.03em] mb-8"
          style={{ fontSize: "clamp(2.8rem, 9vw, 8rem)" }}>
          <AnimatedHeadline text={heading} />
        </h1>

        {/* Bottom row */}
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">
          {/* Subheading — white/70 on dark = 9:1+ passes AAA */}
          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.85, ease: [0.22, 1, 0.36, 1] }}
            className="text-white/70 text-sm sm:text-base leading-relaxed max-w-sm"
          >
            {subheading}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 2.0, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-wrap items-center gap-3 shrink-0"
          >
            <Link href={ctaPrimaryUrl}
              className="inline-flex items-center gap-2.5 bg-primary text-white font-semibold text-sm px-7 py-3.5 rounded-full hover:bg-primary/90 active:scale-[0.97] transition-all duration-200 shadow-lg shadow-primary/30">
              {ctaPrimaryText} <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
            <button onClick={onCinemaEnter}
              className="inline-flex items-center gap-2.5 border border-white/25 text-white font-semibold text-sm px-7 py-3.5 rounded-full hover:border-white/50 hover:bg-white/8 active:scale-[0.97] transition-all duration-200">
              <Play className="w-3.5 h-3.5 fill-current" aria-hidden="true" /> {ctaSecondaryText}
            </button>
          </motion.div>
        </div>

        {/* Trust strip — white/60 passes AA on dark */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 2.25 }}
          className="flex flex-wrap gap-x-8 gap-y-2 mt-10 pt-8 border-t border-white/10"
          aria-label="Ключові переваги"
        >
          {[badge1, badge2, badge3].map((b, i) => (
            <span key={i} className="text-white/60 text-xs font-medium">{b}</span>
          ))}
        </motion.div>
      </motion.div>
    </section>
  );
}
