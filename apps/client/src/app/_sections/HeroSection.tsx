"use client";

import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Shrink } from "lucide-react";

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
            transition={{ duration: 0.85, delay: 1.2 + i * 0.07, ease: [0.22, 1, 0.36, 1] }}
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
  heading, ctaPrimaryText, ctaPrimaryUrl, ctaSecondaryText,
}: HeroSectionProps) {
  return (
    <section
      className="relative min-h-[100svh] bg-[#06060e] overflow-hidden flex flex-col"
      aria-label="Головна секція"
    >
      {/* Skip link */}
      <a href="#collections" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:bg-primary focus:text-white focus:px-4 focus:py-2 focus:rounded-full focus:text-sm focus:font-semibold">
        Перейти до каталогу
      </a>

      {/* Video */}
      <video
        className="absolute inset-0 w-full h-full object-cover opacity-0 transition-[opacity] duration-[2s]"
        onCanPlay={(e) => {
          if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
            (e.target as HTMLVideoElement).style.opacity = "0.28";
          }
        }}
        src="/hero-video.mp4"
        poster="/hero-poster.jpg"
        autoPlay loop muted playsInline preload="auto"
        aria-hidden="true"
      />

      {/* Single gradient — bottom only */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#06060e]/80 pointer-events-none" aria-hidden="true" />

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

      {/* Content — centered, minimal */}
      <motion.div
        animate={{ opacity: cinemaMode ? 0 : 1 }}
        transition={{ duration: 0.4 }}
        style={{ pointerEvents: cinemaMode ? "none" : "auto" }}
        className="relative flex-1 flex flex-col items-center justify-center px-5 sm:px-10 text-center"
        aria-hidden={cinemaMode}
      >
        {/* Big title — the only thing that matters */}
        <h1
          className="text-white font-black leading-[0.9] tracking-[-0.03em] mb-12"
          style={{ fontSize: "clamp(3rem, 10vw, 9rem)" }}
        >
          <AnimatedHeadline text={heading} />
        </h1>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 2.1, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-wrap items-center justify-center gap-3"
        >
          <Link href={ctaPrimaryUrl}
            className="inline-flex items-center gap-2 bg-white text-[#06060e] font-bold text-sm px-7 py-3.5 rounded-full hover:bg-white/90 active:scale-[0.97] transition-all duration-200">
            {ctaPrimaryText}
          </Link>
          <button onClick={onCinemaEnter}
            className="inline-flex items-center gap-2 border border-white/20 text-white/70 font-semibold text-sm px-7 py-3.5 rounded-full hover:border-white/40 hover:text-white active:scale-[0.97] transition-all duration-200">
            {ctaSecondaryText}
          </button>
        </motion.div>
      </motion.div>

      {/* Scroll chevron — bottom center, bouncing */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 2.6 }}
        className="relative flex justify-center pb-10"
        aria-hidden="true"
      >
        <a href="#collections" tabIndex={-1} aria-hidden="true">
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <ChevronDown className="w-6 h-6 text-white/30" />
          </motion.div>
        </a>
      </motion.div>
    </section>
  );
}
