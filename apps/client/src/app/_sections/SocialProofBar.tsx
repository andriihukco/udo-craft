"use client";

import { motion } from "framer-motion";
import { useRef } from "react";
import { useInView } from "framer-motion";

// Placeholder brand names — in production these would be real client logos
const BRANDS = [
  "Kyivstar", "Genesis", "Monobank", "Rozetka", "Nova Poshta",
  "Uklon", "Grammarly", "Ajax Systems", "MacPaw", "Intellias",
];

export function SocialProofBar() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  return (
    <section
      ref={ref}
      className="bg-background border-b border-border py-10 overflow-hidden"
      aria-label="Наші клієнти"
    >
      <div className="max-w-6xl mx-auto px-5 sm:px-10 lg:px-20">
        <motion.p
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.6 }}
          className="text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground/40 text-center mb-8"
        >
          Нам довіряють команди
        </motion.p>

        {/* Scrolling ticker */}
        <div className="relative">
          {/* Fade edges */}
          <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" aria-hidden="true" />
          <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" aria-hidden="true" />

          <motion.div
            className="flex gap-12 items-center"
            animate={{ x: ["0%", "-50%"] }}
            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
            aria-hidden="true"
          >
            {/* Duplicate for seamless loop */}
            {[...BRANDS, ...BRANDS].map((brand, i) => (
              <span
                key={i}
                className="text-muted-foreground/25 font-black text-sm tracking-tight whitespace-nowrap uppercase"
              >
                {brand}
              </span>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
