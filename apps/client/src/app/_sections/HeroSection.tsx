"use client";

import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Play, X } from "lucide-react";

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
        <span key={i} className="inline-block overflow-hidden mr-[0.2em] last:mr-0">
          <motion.span
            className="inline-block"
            initial={{ y: "110%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{
              duration: 0.8,
              delay: 1.0 + i * 0.06,
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
  cinemaMode,
  onCinemaEnter,
  onCinemaExit,
  heading,
  ctaPrimaryText,
  ctaPrimaryUrl,
  ctaSecondaryText,
}: HeroSectionProps) {
  return (
    <section
      className="relative min-h-[100svh] bg-[#06060e] overflow-hidden flex flex-col"
      aria-label="Головна секція"
    >
      {/* Skip link */}
      <a
        href="#collections"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:bg-primary focus:text-white focus:px-4 focus:py-2 focus:rounded-full focus:text-sm focus:font-semibold"
      >
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
        src="/hero-video.mp4"
        poster="/hero-poster.jpg"
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        aria-hidden="true"
      />

      {/* Primary blue overlay at 25% + bottom fade for text legibility */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ backgroundColor: "oklch(0.36 0.22 264 / 0.25)" }}
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#06060e]/70 pointer-events-none"
        aria-hidden="true"
      />

      {/* Cinema overlay — video unmuted on user gesture */}
      <AnimatePresence>
        {cinemaMode && (
          <motion.div
            key="cinema"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9998] bg-black"
            role="dialog"
            aria-label="Відео у повноекранному режимі"
          >
            <video
              ref={(el) => {
                if (el) {
                  // Unmute after user gesture — browsers allow this
                  el.muted = false;
                  el.volume = 0.8;
                  el.play().catch(() => {
                    // Fallback: keep muted if browser blocks
                    el.muted = true;
                    el.play().catch(() => {});
                  });
                }
              }}
              className="absolute inset-0 w-full h-full object-cover"
              src="/hero-video.mp4"
              loop
              playsInline
              aria-hidden="true"
            />
            {/* Close is handled by the bottom-right circle button */}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main content — padded to clear the fixed nav (~64px) + breathing room */}
      <motion.div
        animate={{ opacity: cinemaMode ? 0 : 1 }}
        transition={{ duration: 0.4 }}
        style={{ pointerEvents: cinemaMode ? "none" : "auto" }}
        className="relative flex-1 flex flex-col items-center justify-center px-5 sm:px-10 pt-24 pb-20 text-center"
        aria-hidden={cinemaMode}
      >
        {/* Headline — clamped so it never overflows or touches nav */}
        <h1
          className="text-white font-black leading-[0.92] tracking-[-0.025em] mb-10 max-w-4xl"
          style={{ fontSize: "clamp(2.2rem, 6.5vw, 6rem)" }}
        >
          <AnimatedHeadline text={heading} />
        </h1>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 1.9, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-wrap items-center justify-center gap-3"
        >
          <Link
            href={ctaPrimaryUrl}
            className="inline-flex items-center gap-2 bg-white text-[#06060e] font-bold text-sm px-7 py-3.5 rounded-full hover:bg-white/90 active:scale-[0.97] transition-all duration-200"
          >
            {ctaPrimaryText}
          </Link>
          <Link
            href="#contact"
            className="inline-flex items-center gap-2 border border-white/20 text-white/70 font-semibold text-sm px-7 py-3.5 rounded-full hover:border-white/40 hover:text-white active:scale-[0.97] transition-all duration-200"
          >
            {ctaSecondaryText}
          </Link>
        </motion.div>
      </motion.div>

      {/* Video reel button — fixed 44×44 circle, icon toggles Play ↔ X */}
      <motion.button
        onClick={cinemaMode ? onCinemaExit : onCinemaEnter}
        aria-label={cinemaMode ? "Закрити відео" : "Дивитись відео"}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, delay: 1.5, ease: [0.22, 1, 0.36, 1] }}
        className={`z-[9999] w-11 h-11 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/15 text-white transition-colors duration-200 ${
          cinemaMode
            ? "fixed bottom-8 right-6 sm:right-8"
            : "absolute bottom-8 right-6 sm:right-8"
        }`}
      >
        <AnimatePresence mode="wait" initial={false}>
          {cinemaMode ? (
            <motion.span key="close"
              initial={{ opacity: 0, rotate: -90, scale: 0.5 }}
              animate={{ opacity: 1, rotate: 0, scale: 1 }}
              exit={{ opacity: 0, rotate: 90, scale: 0.5 }}
              transition={{ duration: 0.2 }}
              className="flex items-center justify-center"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </motion.span>
          ) : (
            <motion.span key="play"
              initial={{ opacity: 0, rotate: 90, scale: 0.5 }}
              animate={{ opacity: 1, rotate: 0, scale: 1 }}
              exit={{ opacity: 0, rotate: -90, scale: 0.5 }}
              transition={{ duration: 0.2 }}
              className="flex items-center justify-center"
            >
              <Play className="w-4 h-4 fill-current" aria-hidden="true" />
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Scroll chevron — bottom center */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 2.4 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
        aria-hidden="true"
      >
        <a href="#collections" tabIndex={-1} aria-hidden="true">
          <motion.div
            animate={{ y: [0, 7, 0] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
          >
            <ChevronDown className="w-5 h-5 text-white/30" />
          </motion.div>
        </a>
      </motion.div>
    </section>
  );
}
