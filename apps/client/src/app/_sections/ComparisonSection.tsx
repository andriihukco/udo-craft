"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
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

function Cell({ value }: { value: CellValue }) {
  if (value === "check") return (
    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary/15 border border-primary/30" aria-label="Так">
      <Check className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
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
  return <span className="text-sm font-semibold">{value}</span>;
}

export function ComparisonSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section className="bg-background py-20 sm:py-28 overflow-x-auto" aria-labelledby="comparison-heading">
      <div className="max-w-6xl mx-auto px-5 sm:px-10 lg:px-20">
        <motion.div ref={ref}
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

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="min-w-[600px]"
        >
          <table className="w-full border-collapse" role="table" aria-label="Порівняння постачальників мерчу">
            <thead>
              <tr>
                <th className="text-left py-4 pr-6 text-sm font-semibold text-muted-foreground w-[35%]" scope="col">
                  Характеристика
                </th>
                {COLUMNS.map((col) => (
                  <th key={col.name} scope="col"
                    className={`py-4 px-4 text-center text-sm font-bold rounded-t-xl ${
                      col.highlight
                        ? "bg-primary text-white"
                        : "text-muted-foreground"
                    }`}
                  >
                    {col.highlight && (
                      <span className="block text-[10px] font-semibold text-white/70 uppercase tracking-widest mb-0.5">Рекомендовано</span>
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
                    <td key={col.name}
                      className={`py-4 px-4 text-center ${
                        col.highlight
                          ? "bg-primary/5 border-x border-primary/15"
                          : ""
                      } ${fi === FEATURES.length - 1 && col.highlight ? "rounded-b-xl" : ""}`}
                    >
                      <div className="flex justify-center">
                        <Cell value={col.values[fi]} />
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      </div>
    </section>
  );
}
