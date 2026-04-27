"use client";

import Link from "next/link";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ChevronDown, Fullscreen, Shrink } from "lucide-react";
import { AnimBtnWhite } from "@/app/_components/AnimatedButton";

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
    <section
      className="relative overflow-hidden bg-primary min-h-screen flex flex-col"
      style={{ backgroundImage: "url('/hero-poster.jpg')" }}
    >
      {/* Background video */}
      <video
        className="absolute inset-0 w-full h-full object-cover opacity-0 transition-opacity duration-1000"
        onCanPlay={(e) => {
          const v = e.target as HTMLVideoElement;
          v.classList.remove("opacity-0");
          v.classList.add("opacity-60");
        }}
        src="/hero-video.mp4"
        poster="/hero-poster.jpg"
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
      />

      {/* Dark gradient overlay for text legibility */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-black/60 pointer-events-none" />

      {/* Cinema fullscreen */}
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
              autoPlay
              loop
              muted
              playsInline
            />
            <button
              onClick={onCinemaExit}
              aria-label="Вийти з режиму перегляду"
              className="absolute bottom-6 right-6 z-10 flex items-center justify-center w-10 h-10 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-sm border border-white/15 text-white/70 hover:text-white transition-all duration-200"
            >
              <Shrink className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero content */}
      <motion.div
        animate={{ opacity: cinemaMode ? 0 : 1 }}
        transition={{ duration: 0.5 }}
        style={{ pointerEvents: cinemaMode ? "none" : "auto" }}
        className="relative flex-1 flex flex-col items-center justify-center px-4 sm:px-6 pt-28 pb-20 text-center"
        aria-hidden={cinemaMode}
      >
        {/* Eyebrow label */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.3, ease: [0.22, 1, 0.36, 1] }}
          className="text-white/50 text-xs font-semibold uppercase tracking-[0.2em] mb-6"
        >
          B2B мерч-платформа
        </motion.p>

        {/* Main headline — word-by-word stagger */}
        <motion.h1
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.85, delay: 1.5, ease: [0.22, 1, 0.36, 1] }}
          className="text-white text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black leading-[1.02] tracking-tight max-w-4xl text-balance"
        >
          {heading}
        </motion.h1>

        {/* Subheading */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, delay: 1.75, ease: [0.22, 1, 0.36, 1] }}
          className="text-white/70 mt-6 text-base sm:text-lg leading-relaxed max-w-xl"
        >
          {subheading}
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 1.95, ease: [0.22, 1, 0.36, 1] }}
          className="mt-10 flex flex-wrap justify-center gap-3"
        >
          <AnimBtnWhite href={ctaPrimaryUrl}>{ctaPrimaryText}</AnimBtnWhite>
          <Link
            href={ctaSecondaryUrl}
            className="inline-flex items-center gap-2 border border-white/30 text-white font-semibold text-sm px-7 py-3.5 rounded-full hover:bg-white/10 hover:border-white/60 active:scale-95 transition-all duration-200"
          >
            <span>{ctaSecondaryText}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>

        {/* Trust badges */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 2.2 }}
          className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-1.5 text-white/50 text-xs font-medium"
        >
          <span>{badge1}</span>
          <span className="text-white/20">·</span>
          <span>{badge2}</span>
          <span className="text-white/20">·</span>
          <span>{badge3}</span>
        </motion.div>

        {/* Scroll cue */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 2.5 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <a
            href="#collections"
            className="text-white/40 hover:text-white/70 transition-colors duration-200 focus-visible:outline-none rounded-full"
            aria-label="Прокрутити вниз"
          >
            <ChevronDown className="w-5 h-5 animate-bounce" />
          </a>
        </motion.div>
      </motion.div>

      {/* Cinema toggle */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 2.6 }}
        onClick={onCinemaEnter}
        aria-label="Режим перегляду відео"
        className="absolute bottom-6 right-6 z-10 flex items-center justify-center w-9 h-9 rounded-full bg-black/30 hover:bg-black/50 backdrop-blur-sm border border-white/10 text-white/50 hover:text-white transition-all duration-200"
      >
        <Fullscreen className="w-4 h-4" />
      </motion.button>
    </section>
  );
}
