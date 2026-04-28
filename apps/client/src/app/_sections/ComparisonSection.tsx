"use client";

import { useRef } from "react";
import { motion, useInView, useScroll, useTransform } from "framer-motion";
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

const COLUMNS: { name: string; highlight: boolean; values: CellValue[] }[] = [
  {
    name: "Типовий постачальник",
    highlight: false,
    values: ["500+ шт", "cross", "cross", "cross", "cross", "30+ днів", "partial", "cross"],
  },
  {
    name: "U:DO Craft",
    highlight: true,
    values: ["від 10 шт", "check", "check", "check", "check", "7–14 днів", "check", "check"],
  },
  {
    name: "Друкарня",
    highlight: false,
    values: ["100+ шт", "cross", "partial", "cross", "partial", "14–21 днів", "partial", "cross"],
  },
];

function Cell({ value, highlight }: { value: CellValue; highlight: boolean }) {
  if (value === "check") return (
    <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full ${highlight ? "bg-white/20 border border-white/30" : "bg-primary/10 border border-primary/25"}`} aria-label="Так">
      <Check className={`w-3.5 h-3.5 ${highlight ? "text-white" : "text-primary"}`} aria-hidden="true" />
    </span>
  );
  if (value === "cross") return (
    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-50 border border-red-200" aria-label="Ні">
      <X className="w-3.5 h-3.5 text-red-500" aria-hidden="true" />
    </span>
  );
  if (value === "partial") return (
    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-50 border border-amber-200" aria-label="Частково">
      <Minus className="w-3.5 h-3.5 text-amber-500" aria-hidden="true" />
    </span>
  );
  return <span className={`text-sm font-semibold ${highlight ? "text-white" : "text-foreground"}`}>{value}</span>;
}

function CardContent({ col, highlight }: { col: typeof COLUMNS[0]; highlight: boolean }) {
  return (
    <div className={`rounded-2xl overflow-hidden border ${highlight ? "border-primary bg-primary" : "border-border bg-card"}`}>
      <div className={`px-5 py-4 border-b ${highlight ? "border-white/15" : "border-border"}`}>
        {highlight && (
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/70 mb-0.5">Рекомендовано</p>
        )}
        <p className={`font-bold text-base ${highlight ? "text-white" : "text-foreground"}`}>{col.name}</p>
      </div>
      <div className={`divide-y ${highlight ? "divide-white/10" : "divide-border/50"}`}>
        {FEATURES.map((feature, fi) => (
          <div key={feature} className="flex items-center justify-between px-5 py-3 gap-4">
            <span className={`text-sm ${highlight ? "text-white/80" : "text-muted-foreground"}`}>{feature}</span>
            <Cell value={col.values[fi]} highlight={highlight} />
          </div>
        ))}
      </div>
    </div>
  );
}

// Scroll-driven sticky card — scales down as next card slides over it
function StickyCard({
  col,
  i,
  total,
  scrollYProgress,
}: {
  col: typeof COLUMNS[0];
  i: number;
  total: number;
  scrollYProgress: ReturnType<typeof useScroll>["scrollYProgress"];
}) {
  // Each card occupies 1/total of the scroll range
  const rangeStart = i / total;
  const rangeEnd = (i + 1) / total;

  // Scale shrinks slightly as the next card comes over
  const scale = useTransform(scrollYProgress, [rangeStart, rangeEnd], [1, 0.94]);
  // Slight upward push as it gets covered
  const y = useTransform(scrollYProgress, [rangeStart, rangeEnd], [0, -12]);

  return (
    <div className="sticky top-20">
      <motion.div style={{ scale, y, transformOrigin: "top center" }}>
        <CardContent col={col} highlight={col.highlight} />
      </motion.div>
    </div>
  );
}

// Mobile stack — scroll-driven, cards stack on top of each other
function MobileCardStack() {
  const container = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: container,
    offset: ["start start", "end end"],
  });

  // Order: U:DO first, then competitors
  const ordered = [
    COLUMNS.find((c) => c.highlight)!,
    ...COLUMNS.filter((c) => !c.highlight),
  ];

  return (
    // Height = number of cards × viewport height so each card gets scroll space
    <div
      ref={container}
      style={{ height: `${ordered.length * 100}vh` }}
      className="relative"
      aria-label="Порівняння карток"
    >
      {ordered.map((col, i) => (
        <StickyCard
          key={col.name}
          col={col}
          i={i}
          total={ordered.length}
          scrollYProgress={scrollYProgress}
        />
      ))}
    </div>
  );
}

export function ComparisonSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section className="bg-background py-20 sm:py-28" aria-labelledby="comparison-heading">
      <div className="max-w-6xl mx-auto px-5 sm:px-10 lg:px-20">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="mb-12"
        >
          <h2 id="comparison-heading" className="text-3xl sm:text-4xl font-black tracking-tight mb-4">
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
          <table className="w-full border-collapse min-w-[560px]" role="table" aria-label="Порівняння постачальників мерчу">
            <thead>
              <tr>
                <th className="text-left py-4 pr-6 text-sm font-semibold text-muted-foreground w-[35%]" scope="col">
                  Характеристика
                </th>
                {COLUMNS.map((col) => (
                  <th
                    key={col.name}
                    scope="col"
                    className={`py-4 px-4 text-center text-sm font-bold rounded-t-xl ${col.highlight ? "bg-primary text-white" : "text-muted-foreground"}`}
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
                  <td className="py-4 pr-6 text-sm text-foreground font-medium">{feature}</td>
                  {COLUMNS.map((col) => (
                    <td
                      key={col.name}
                      className={`py-4 px-4 text-center ${col.highlight ? "bg-primary/5 border-x border-primary/15" : ""} ${fi === FEATURES.length - 1 && col.highlight ? "rounded-b-xl" : ""}`}
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

        {/* Mobile — scroll-driven card stack */}
        <div className="sm:hidden -mx-5">
          <div className="px-5">
            <MobileCardStack />
          </div>
        </div>
      </div>
    </section>
  );
}
