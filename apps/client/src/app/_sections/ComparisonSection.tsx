"use client";

import { useRef } from "react";
import { motion, useInView, useScroll, useTransform, MotionValue } from "framer-motion";
import { Check, X, Minus } from "lucide-react";

const FEATURES = [
  "Мінімальний тираж",
  "Онлайн-редактор",
  "Зразки перед тиражем",
  "Особистий менеджер",
  "Фіксована ціна",
  "Термін виробництва",
  "Гарантія якості",
  "Виїзний Popup-стенд",
];

type CellValue = "check" | "cross" | "partial" | string;

const COLUMNS: {
  name: string;
  highlight: boolean;
  values: CellValue[];
  bg: string;
  textColor: string;
  subTextColor: string;
  borderColor: string;
  rowBorderColor: string;
}[] = [
  {
    name: "Типовий постачальник",
    highlight: false,
    bg: "#e8edf5",
    textColor: "#1a2035",
    subTextColor: "#4a5568",
    borderColor: "rgba(0,0,0,0.12)",
    rowBorderColor: "rgba(0,0,0,0.07)",
    values: ["500+ шт", "cross", "cross", "cross", "cross", "30+ днів", "partial", "cross"],
  },
  {
    name: "Друкарня",
    highlight: false,
    bg: "#d0d8e8",
    textColor: "#1a2035",
    subTextColor: "#3d4f6b",
    borderColor: "rgba(0,0,0,0.14)",
    rowBorderColor: "rgba(0,0,0,0.08)",
    values: ["100+ шт", "cross", "partial", "cross", "partial", "14–21 днів", "partial", "cross"],
  },
  {
    name: "U:DO Craft",
    highlight: true,
    bg: "#1e3a8a",
    textColor: "#ffffff",
    subTextColor: "rgba(255,255,255,0.75)",
    borderColor: "rgba(255,255,255,0.15)",
    rowBorderColor: "rgba(255,255,255,0.08)",
    values: ["від 10 шт", "check", "check", "check", "check", "7–14 днів", "check", "check"],
  },
];

function Cell({ value, highlight }: { value: CellValue; highlight: boolean }) {
  if (value === "check")
    return (
      <span
        className={`inline-flex items-center justify-center w-6 h-6 rounded-full ${
          highlight
            ? "bg-white/20 border border-white/40"
            : "bg-primary/10 border border-primary/25"
        }`}
        aria-label="Так"
      >
        <Check
          className={`w-3.5 h-3.5 ${highlight ? "text-white" : "text-primary"}`}
          aria-hidden="true"
        />
      </span>
    );
  if (value === "cross")
    return (
      <span
        className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-100 border border-red-300"
        aria-label="Ні"
      >
        <X className="w-3.5 h-3.5 text-red-600" aria-hidden="true" />
      </span>
    );
  if (value === "partial")
    return (
      <span
        className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-100 border border-amber-300"
        aria-label="Частково"
      >
        <Minus className="w-3.5 h-3.5 text-amber-600" aria-hidden="true" />
      </span>
    );
  return (
    <span
      className="text-sm font-bold"
      style={{ color: highlight ? "#ffffff" : "#1a2035" }}
    >
      {value}
    </span>
  );
}

// ── Oliver Larose sticky card ─────────────────────────────────────────────

interface StickyCardProps {
  col: (typeof COLUMNS)[0];
  i: number;
  progress: MotionValue<number>;
  range: [number, number];
  targetScale: number;
}

function StickyCard({ col, i, progress, range, targetScale }: StickyCardProps) {
  const scale = useTransform(progress, range, [1, targetScale]);
  const opacity = useTransform(progress, range, [1, 0.5]);

  return (
    <motion.div
      style={{
        backgroundColor: col.bg,
        scale,
        opacity,
        top: `calc(-5vh + ${i * 28}px)`,
      }}
      className="sticky top-0 h-screen flex items-center justify-center origin-top"
    >
      <div className="relative w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div
          className="px-5 py-4 border-b"
          style={{ borderColor: col.borderColor }}
        >
          {col.highlight && (
            <p
              className="text-[10px] font-bold uppercase tracking-widest mb-0.5"
              style={{ color: "rgba(255,255,255,0.65)" }}
            >
              Рекомендовано
            </p>
          )}
          <p className="font-bold text-base" style={{ color: col.textColor }}>
            {col.name}
          </p>
        </div>

        {/* Rows */}
        <div>
          {FEATURES.map((feature, fi) => (
            <div
              key={feature}
              className="flex items-center justify-between px-5 py-3 gap-4"
              style={{
                borderBottom:
                  fi < FEATURES.length - 1
                    ? `1px solid ${col.rowBorderColor}`
                    : "none",
              }}
            >
              <span className="text-sm" style={{ color: col.subTextColor }}>
                {feature}
              </span>
              <Cell value={col.values[fi]} highlight={col.highlight} />
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// ── Mobile card stack (Oliver Larose pattern) ─────────────────────────────

function MobileCardStack() {
  const container = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: container,
    offset: ["start start", "end end"],
  });

  const n = COLUMNS.length;

  return (
    // Each card gets one full screen of scroll space
    <div ref={container} style={{ height: `${n * 100}vh` }}>
      {COLUMNS.map((col, i) => {
        const targetScale = 1 - (n - i) * 0.05;
        const start = i / n;
        const end = (i + 1) / n;
        return (
          <StickyCard
            key={col.name}
            col={col}
            i={i}
            progress={scrollYProgress}
            range={[start, end]}
            targetScale={targetScale}
          />
        );
      })}
    </div>
  );
}

// ── Section ───────────────────────────────────────────────────────────────

export function ComparisonSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section
      className="bg-background py-20 sm:py-28"
      aria-labelledby="comparison-heading"
    >
      <div className="max-w-6xl mx-auto px-5 sm:px-10 lg:px-20">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="mb-12"
        >
          <h2
            id="comparison-heading"
            className="text-3xl sm:text-4xl font-black tracking-tight mb-4"
          >
            U:DO проти решти ринку
          </h2>
          <p className="text-muted-foreground text-base max-w-lg leading-relaxed">
            Порівняй умови — і зрозумій, чому 500+ команд обирають нас.
          </p>
        </motion.div>

        {/* Desktop table */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="hidden sm:block overflow-x-auto"
        >
          <table
            className="w-full border-collapse min-w-[560px]"
            role="table"
            aria-label="Порівняння постачальників мерчу"
          >
            <thead>
              <tr>
                <th
                  className="text-left py-4 pr-6 text-sm font-semibold text-muted-foreground w-[35%]"
                  scope="col"
                >
                  Характеристика
                </th>
                {COLUMNS.map((col) => (
                  <th
                    key={col.name}
                    scope="col"
                    className={`py-4 px-4 text-center text-sm font-bold rounded-t-xl ${
                      col.highlight ? "bg-primary text-white" : "text-muted-foreground"
                    }`}
                  >
                    {col.highlight && (
                      <span className="block text-[10px] font-semibold text-white/70 uppercase tracking-widest mb-0.5">
                        Рекомендовано
                      </span>
                    )}
                    {col.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {FEATURES.map((feature, fi) => (
                <tr key={feature} className="border-t border-border">
                  <td className="py-4 pr-6 text-sm text-foreground font-medium">
                    {feature}
                  </td>
                  {COLUMNS.map((col) => (
                    <td
                      key={col.name}
                      className={`py-4 px-4 text-center ${
                        col.highlight
                          ? "bg-primary/8 border-x border-primary/20"
                          : ""
                      } ${
                        fi === FEATURES.length - 1 && col.highlight
                          ? "rounded-b-xl"
                          : ""
                      }`}
                    >
                      <div className="flex justify-center">
                        <Cell value={col.values[fi]} highlight={col.highlight} />
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>

        {/* Mobile — Oliver Larose sticky card stack */}
        <div className="sm:hidden -mx-5">
          <MobileCardStack />
        </div>
      </div>
    </section>
  );
}
