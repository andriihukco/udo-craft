"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";

/**
 * Animates a yellow marker highlight under/behind text as it enters viewport.
 * Usage: <HighlightText delay={0.4}>ключове слово</HighlightText>
 */
export function HighlightText({
  children,
  delay = 0,
  color = "rgba(59,130,246,0.15)", // default: blue wash on light bg
}: {
  children: React.ReactNode;
  delay?: number;
  color?: string;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <span ref={ref} className="relative inline whitespace-nowrap">
      {/* Highlight wash — slides in from left */}
      <motion.span
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 rounded-sm pointer-events-none"
        style={{
          height: "55%",
          backgroundColor: color,
          transformOrigin: "left center",
        }}
        initial={{ scaleX: 0 }}
        animate={isInView ? { scaleX: 1 } : { scaleX: 0 }}
        transition={{
          duration: 0.65,
          delay,
          ease: [0.22, 1, 0.36, 1],
        }}
      />
      <span className="relative">{children}</span>
    </span>
  );
}

/**
 * Underline variant — thin animated underline, more subtle
 */
export function UnderlineText({
  children,
  delay = 0,
}: {
  children: React.ReactNode;
  delay?: number;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <span ref={ref} className="relative inline-block">
      <span className="relative">{children}</span>
      <motion.span
        aria-hidden="true"
        className="absolute bottom-0 left-0 h-[3px] bg-primary rounded-full"
        initial={{ width: 0 }}
        animate={isInView ? { width: "100%" } : { width: 0 }}
        transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
      />
    </span>
  );
}
