"use client";

import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Shrink, Fullscreen } from "lucide-react";

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

export function HeroSection({
  cinemaMode,
  onCinemaEnter,
  onCinemaExit,
  heading,
  subheading,
  ctaPrimaryText,
  ctaPrimaryUrl,
  ctaSecondaryText,
  ctaSecondaryUrl,
  badge1,
  badge2,
  badge3,
}: HeroSectionProps) {
  return (
    <section className="relative min-h-screen bg-[#050508] overflow-hidden flex flex-col">
      {/* Background video — full bleed */}
      <video
        className="absolute inset-0 w-full h-full object-cover opacity-0 transition-opacity duration-1500"
        onCanPlay={(e) => {
          const v = e.target as HTMLVideoElement;
          v.style.opacity = "0.35";
        }}
        src="/hero-video.mp4"
        poster="/hero-poster.jpg"
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
      />

      {/* Layered overlays for depth */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#050508]/80 via-transparent to-[#050508]" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#050508]/60 via-transparent to-[#050508]/40" />

      {/* Noise texture overlay */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          backgroundRepeat: "repeat",
          backgroundSize: "128px",
        }}
      />

      {/* Cinema mode */}
      <AnimatePresence>
        {cinemaMode && (
          <motion.div
            key="cinema"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="fixed inset-0 z-[9998] bg-black overflow-hidden"
          >
            <video
              className="absolute inset-0 w-full h-full object-cover"
              src="/hero-video.mp4"
              autoPlay loop muted playsInline
            />
            <button
              onClick={onCinemaExit}
              aria-label="Вийти з режиму перегляду"
              className="absolute bottom-6 right-6 z-10 flex items-center justify-center w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/15 text-white/70 hover:text-white transition-all duration-200"
            >
              <Shrink className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main content */}
      <motion.div
        animate={{ opacity: cinemaMode ? 0 : 1 }}
        transition={{ duration: 0.4 }}
        style={{ pointerEvents: cinemaMode ? "none" : "auto" }}
        className="relative flex-1 flex flex-col justify-end px-5 sm:px-8 lg:px-16 pb-16 pt-36"
        aria-hidden={cinemaMode}
      >
        {/* Eyebrow */}
        <motion.div
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 1.2, ease: [0.22, 1, 0.36, 1] }}
          className="flex items-center gap-3 mb-8"
        >
          <span className="w-8 h-px bg-primary" />
          <span className="text-white/40 text-[11px] font-semibold uppercase tracking-[0.22em]">
            B2B мерч-платформа · Україна
          </span>
        </motion.div>

        {/* Giant headline — editorial scale */}
        <div className="overflow-hidden mb-6">
          <motion.h1
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            transition={{ duration: 0.9, delay: 1.35, ease: [0.22, 1, 0.36, 1] }}
            className="text-white font-black leading-[0.92] tracking-[-0.03em]"
            style={{ fontSize: "clamp(3rem, 10vw, 9rem)" }}
          >
            {heading}
          </motion.h1>
        </div>

        {/* Bottom row — subheading + CTAs */}
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8 mt-4">
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 1.7, ease: [0.22, 1, 0.36, 1] }}
            className="text-white/45 text-sm sm:text-base leading-relaxed max-w-md"
          >
            {subheading}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 1.9, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-wrap items-center gap-3 shrink-0"
          >
            <Link
              href={ctaPrimaryUrl}
              className="inline-flex items-center gap-2.5 bg-primary text-white font-semibold text-sm px-6 py-3.5 rounded-full hover:bg-primary/90 active:scale-95 transition-all duration-200 shadow-lg shadow-primary/25"
            >
              {ctaPrimaryText}
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href={ctaSecondaryUrl}
              className="inline-flex items-center gap-2.5 border border-white/15 text-white/70 font-semibold text-sm px-6 py-3.5 rounded-full hover:border-white/35 hover:text-white active:scale-95 transition-all duration-200"
            >
              {ctaSecondaryText}
            </Link>
          </motion.div>
        </div>

        {/* Trust badges — bottom strip */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 2.1 }}
          className="flex flex-wrap gap-x-8 gap-y-2 mt-10 pt-8 border-t border-white/8"
        >
          {[badge1, badge2, badge3].map((b, i) => (
            <span key={i} className="text-white/30 text-xs font-medium">
              {b}
            </span>
          ))}
        </motion.div>
      </motion.div>

      {/* Cinema toggle */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 2.4 }}
        onClick={onCinemaEnter}
        aria-label="Режим перегляду відео"
        className="absolute bottom-6 right-6 z-10 flex items-center gap-2 px-3 py-2 rounded-full bg-white/8 hover:bg-white/15 backdrop-blur-sm border border-white/10 text-white/40 hover:text-white/70 transition-all duration-200 text-xs font-medium"
      >
        <Fullscreen className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Відео</span>
      </motion.button>
    </section>
  );
}
