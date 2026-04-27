"use client";

import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Shrink, Fullscreen, Play } from "lucide-react";

interface HeroSectionProps {
  cinemaMode: boolean;
  onCinemaEnter: () => void;
  onCinemaExit: () => void;
  heading: string;
  subheading: string;
  ctaPrimaryText: string;
  ctaPrimaryUrl: string;
  ctaSecondaryText: string;
  ctaSecondaryUrl: string;
  badge1: string;
  badge2: string;
  badge3: string;
}

// Word-by-word reveal animation
function AnimatedHeadline({ text }: { text: string }) {
  const words = text.split(" ");
  return (
    <span aria-label={text}>
      {words.map((word, i) => (
        <span key={i} className="inline-block overflow-hidden mr-[0.25em] last:mr-0">
          <motion.span
            className="inline-block"
            initial={{ y: "110%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{
              duration: 0.75,
              delay: 1.4 + i * 0.07,
              ease: [0.22, 1, 0.36, 1],
            }}
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
  ctaSecondaryText, ctaSecondaryUrl,
  badge1, badge2, badge3,
}: HeroSectionProps) {
  return (
    <section
      className="relative min-h-[100svh] bg-[#04040a] overflow-hidden flex flex-col"
      aria-label="Головна секція"
    >
      {/* Skip to content */}
      <a
        href="#collections"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:bg-primary focus:text-white focus:px-4 focus:py-2 focus:rounded-full focus:text-sm focus:font-semibold"
      >
        Перейти до контенту
      </a>

      {/* Background video — respects prefers-reduced-motion */}
      <video
        className="absolute inset-0 w-full h-full object-cover transition-opacity duration-[2000ms] opacity-0"
        onCanPlay={(e) => {
          const v = e.target as HTMLVideoElement;
          // Respect reduced motion
          if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
            v.style.opacity = "0.28";
          }
        }}
        src="/hero-video.mp4"
        poster="/hero-poster.jpg"
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        aria-hidden="true"
      />

      {/* Gradient layers */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#04040a]/70 via-[#04040a]/20 to-[#04040a]/90 pointer-events-none" aria-hidden="true" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#04040a]/50 to-transparent pointer-events-none" aria-hidden="true" />

      {/* Subtle grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.025] pointer-events-none"
        style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
          backgroundSize: "80px 80px",
        }}
        aria-hidden="true"
      />

      {/* Cinema overlay */}
      <AnimatePresence>
        {cinemaMode && (
          <motion.div
            key="cinema"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="fixed inset-0 z-[9998] bg-black overflow-hidden"
            role="dialog"
            aria-label="Відео у повноекранному режимі"
          >
            <video className="absolute inset-0 w-full h-full object-cover" src="/hero-video.mp4" autoPlay loop muted playsInline aria-hidden="true" />
            <button
              onClick={onCinemaExit}
              aria-label="Вийти з повноекранного режиму"
              className="absolute bottom-6 right-6 z-10 flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/15 text-white/70 hover:text-white transition-all duration-200 text-xs font-medium"
            >
              <Shrink className="w-3.5 h-3.5" aria-hidden="true" />
              Закрити
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content */}
      <motion.div
        animate={{ opacity: cinemaMode ? 0 : 1 }}
        transition={{ duration: 0.4 }}
        style={{ pointerEvents: cinemaMode ? "none" : "auto" }}
        className="relative flex-1 flex flex-col justify-end px-5 sm:px-10 lg:px-20 pb-14 pt-32"
        aria-hidden={cinemaMode}
      >
        {/* Eyebrow */}
        <motion.div
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.55, delay: 1.1, ease: [0.22, 1, 0.36, 1] }}
          className="flex items-center gap-3 mb-7"
        >
          <span className="w-6 h-px bg-primary" aria-hidden="true" />
          <span className="text-white/40 text-[11px] font-semibold uppercase tracking-[0.22em]">
            Корпоративний мерч · Україна
          </span>
        </motion.div>

        {/* Headline — word-by-word */}
        <h1
          className="text-white font-black leading-[0.9] tracking-[-0.03em] mb-8"
          style={{ fontSize: "clamp(2.8rem, 9.5vw, 8.5rem)" }}
        >
          <AnimatedHeadline text={heading} />
        </h1>

        {/* Bottom row */}
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">
          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.9, ease: [0.22, 1, 0.36, 1] }}
            className="text-white/40 text-sm sm:text-base leading-relaxed max-w-sm"
          >
            {subheading}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 2.05, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-wrap items-center gap-3 shrink-0"
          >
            <Link
              href={ctaPrimaryUrl}
              className="inline-flex items-center gap-2.5 bg-primary text-white font-semibold text-sm px-7 py-3.5 rounded-full hover:bg-primary/90 active:scale-[0.97] transition-all duration-200 shadow-lg shadow-primary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#04040a]"
            >
              {ctaPrimaryText}
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
            <button
              onClick={onCinemaEnter}
              className="inline-flex items-center gap-2.5 border border-white/15 text-white/60 font-semibold text-sm px-7 py-3.5 rounded-full hover:border-white/35 hover:text-white active:scale-[0.97] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
            >
              <Play className="w-3.5 h-3.5 fill-current" aria-hidden="true" />
              {ctaSecondaryText}
            </button>
          </motion.div>
        </div>

        {/* Trust strip */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 2.3 }}
          className="flex flex-wrap gap-x-8 gap-y-2 mt-10 pt-8 border-t border-white/[0.07]"
          aria-label="Переваги"
        >
          {[badge1, badge2, badge3].map((b, i) => (
            <span key={i} className="text-white/25 text-xs font-medium">{b}</span>
          ))}
        </motion.div>
      </motion.div>
    </section>
  );
}
