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

const COLUMNS = [
  {
    name: "Типовий постачальник",
    highlight: false,
    values: ["500+ шт", "cross", "cross", "cross", "cross", "30+ днів", "partial", "cross"],
  },
  {
    name: "Друкарня",
    highlight: false,
    values: ["100+ шт", "cross", "partial", "cross", "partial", "14–21 днів", "partial", "cross"],
  },
  {
    name: "U:DO Craft",
    highlight: true,
    values: ["від 10 шт", "check", "check", "check", "check", "7–14 днів", "check", "check"],
  },
];

function Cell({ value, highlight }: { value: CellValue; highlight: boolean }) {
  if (value === "check")
    return (
      <span className="inline-flex items-center justify-center" aria-label="Так">
        <Check className={`w-5 h-5 ${highlight ? "text-white" : "text-green-600"}`} />
      </span>
    );
  if (value === "cross")
    return (
      <span className="inline-flex items-center justify-center" aria-label="Ні">
        <X className="w-5 h-5 text-red-600" />
      </span>
    );
  if (value === "partial")
    return (
      <span className="inline-flex items-center justify-center" aria-label="Частково">
        <Minus className="w-5 h-5 text-amber-600" />
      </span>
    );
  return <span className="text-sm font-semibold">{value}</span>;
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
      <div className="max-w-7xl mx-auto px-5 sm:px-10 lg:px-20">
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

        {/* Responsive Table */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="overflow-x-auto"
        >
          <table
            className="w-full border-collapse"
            role="table"
            aria-label="Порівняння постачальників мерчу"
          >
            <thead>
              <tr className="border-b-2 border-border">
                <th
                  className="text-left py-4 px-3 sm:px-6 text-sm font-semibold text-muted-foreground"
                  scope="col"
                >
                  Характеристика
                </th>
                {COLUMNS.map((col) => (
                  <th
                    key={col.name}
                    scope="col"
                    className={`py-4 px-3 sm:px-6 text-center text-sm font-bold ${
                      col.highlight
                        ? "bg-primary text-white"
                        : "text-foreground"
                    }`}
                  >
                    {col.highlight && (
                      <span className="block text-xs font-semibold opacity-75 mb-1">
                        ⭐ Рекомендовано
                      </span>
                    )}
                    <span className="block">{col.name}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {FEATURES.map((feature, fi) => (
                <tr
                  key={feature}
                  className={`border-b border-border ${
                    fi % 2 === 0 ? "bg-muted/30" : ""
                  }`}
                >
                  <td className="py-4 px-3 sm:px-6 text-sm font-medium text-foreground">
                    {feature}
                  </td>
                  {COLUMNS.map((col) => (
                    <td
                      key={col.name}
                      className={`py-4 px-3 sm:px-6 text-center ${
                        col.highlight ? "bg-primary/5" : ""
                      }`}
                    >
                      <Cell value={col.values[fi]} highlight={col.highlight} />
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
