"use client";

import { CountUp } from "@/app/_components/CountUp";

interface StatsSectionProps {
  stat1Value: number;
  stat1Suffix: string;
  stat1Label: string;
  stat2Value: number;
  stat2Suffix: string;
  stat2Label: string;
  stat3Value: number;
  stat3Suffix: string;
  stat3Label: string;
  stat4Value: number;
  stat4Suffix: string;
  stat4Label: string;
}

export function StatsSection({
  stat1Value, stat1Suffix, stat1Label,
  stat2Value, stat2Suffix, stat2Label,
  stat3Value, stat3Suffix, stat3Label,
  stat4Value, stat4Suffix, stat4Label,
}: StatsSectionProps) {
  const stats = [
    { value: stat1Value, suffix: stat1Suffix, label: stat1Label },
    { value: stat2Value, suffix: stat2Suffix, label: stat2Label },
    { value: stat3Value, suffix: stat3Suffix, label: stat3Label },
    { value: stat4Value, suffix: stat4Suffix, label: stat4Label },
  ];

  return (
    <section className="border-b border-border bg-background">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-border">
          {stats.map((s) => (
            <div key={s.label} className="py-8 px-4 sm:px-8 text-center group">
              <p className="text-3xl sm:text-4xl font-black text-primary tabular-nums tracking-tight">
                <CountUp end={s.value} suffix={s.suffix} />
              </p>
              <p className="text-xs text-muted-foreground mt-2 font-medium leading-snug">
                {s.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
