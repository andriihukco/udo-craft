"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Fullscreen, Shrink, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface HeroSectionProps {
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
  const [cinemaMode, setCinemaMode] = useState(false);

  return (
    <section className="relative overflow-hidden bg-primary" style={{ backgroundImage: "url('/hero-poster.jpg')" }}>
      {/* Video — rendered immediately, no delay, bg-primary shows while buffering */}
      <video
        className="absolute inset-0 w-full h-full object-cover opacity-0 transition-opacity duration-1000"
        style={{ animationFillMode: "forwards" }}
        onCanPlay={(e) => {
          (e.target as HTMLVideoElement).classList.remove("opacity-0");
          (e.target as HTMLVideoElement).classList.add("opacity-75");
        }}
        src="/hero-video.mp4"
        poster="/hero-poster.jpg"
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
      />

      {/* Cinema fullscreen overlay — covers entire viewport */}
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
            {/* Exit button */}
            <button
              onClick={() => setCinemaMode(false)}
              aria-label="Вийти з режиму перегляду"
              className="absolute bottom-6 right-6 z-10 flex items-center justify-center w-10 h-10 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-sm border border-white/15 text-white/70 hover:text-white transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
            >
              <Shrink className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        animate={{ opacity: cinemaMode ? 0 : 1 }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
        className="relative max-w-3xl mx-auto px-4 sm:px-6 pt-32 sm:pt-48 pb-16 text-center"
        aria-hidden={cinemaMode}
        style={{ pointerEvents: cinemaMode ? "none" : "auto" }}
      >
        <motion.h1
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.75, delay: 1.65, ease: [0.22, 1, 0.36, 1] }}
          className="text-white text-4xl sm:text-5xl lg:text-[3.5rem] font-black leading-[1.05] tracking-tight"
        >
          {heading}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.85 }}
          className="text-white/80 mt-5 text-base sm:text-lg leading-relaxed max-w-xl mx-auto"
        >
          {subheading}
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 2.05 }}
          className="mt-8 flex flex-wrap justify-center gap-3"
        >
          {/* Primary CTA — white button */}
          <Link
            href={ctaPrimaryUrl}
            className="group inline-flex items-center gap-2 bg-white text-primary font-bold text-sm px-7 py-3.5 rounded-full hover:bg-white/90 active:scale-95 transition-all duration-200 shadow-lg hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span>{ctaPrimaryText}</span>
            <motion.span
              className="flex items-center"
              initial={{ x: 0 }}
              whileHover={{ x: 4 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              <ArrowRight className="w-4 h-4" />
            </motion.span>
          </Link>
          {/* Secondary CTA — ghost button */}
          <Link
            href={ctaSecondaryUrl}
            className="group inline-flex items-center gap-2 border-2 border-white/30 text-white font-bold text-sm px-7 py-3.5 rounded-full hover:bg-white/10 hover:border-white active:scale-95 transition-all duration-200"
          >
            <span>{ctaSecondaryText}</span>
            <motion.span
              className="flex items-center"
              initial={{ x: 0 }}
              whileHover={{ x: 4 }}
              transition={{ duration: 0.2 }}
            >
              <ArrowRight className="w-4 h-4" />
            </motion.span>
          </Link>
        </motion.div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 2.25 }}
          className="mt-8 flex flex-wrap justify-center gap-x-5 gap-y-1 text-white/70 text-xs font-medium"
        >
          <span>{badge1}</span>
          <span className="text-white/40">•</span>
          <span>{badge2}</span>
          <span className="text-white/40">•</span>
          <span>{badge3}</span>
        </motion.div>
      </motion.div>

      <motion.div
        animate={{ opacity: cinemaMode ? 0 : 1 }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
        className="flex justify-center pb-8"
        style={{ pointerEvents: cinemaMode ? "none" : "auto" }}
        aria-hidden={cinemaMode}
      >
        <a
          href="#collections"
          className="text-white/50 hover:text-white/80 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 rounded-full"
          aria-label="Прокрутити вниз"
        >
          <ChevronDown className="w-5 h-5 animate-bounce" />
        </a>
      </motion.div>

      {/* Cinema mode toggle — bottom-right corner */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 2.5 }}
        onClick={() => setCinemaMode(true)}
        aria-label="Режим перегляду відео"
        className="absolute bottom-4 right-4 z-10 flex items-center justify-center w-9 h-9 rounded-full bg-black/30 hover:bg-black/50 backdrop-blur-sm border border-white/10 text-white/60 hover:text-white transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
      >
        <Fullscreen className="w-4 h-4" />
      </motion.button>
    </section>
  );
}
