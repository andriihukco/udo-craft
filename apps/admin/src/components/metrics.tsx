"use client";

import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";
export { fmtCurrency, startOfDay } from "@/lib/utils";

export function Sparkline({ data, color = "hsl(var(--muted-foreground))" }: { data: number[]; color?: string }) {
  if (data.length < 2) return null;
  const max = Math.max(...data, 1);
  const min = Math.min(...data);
  const range = max - min || 1;
  const w = 64;
  const h = 24;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * h;
    return `${x},${y}`;
  });
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} fill="none" aria-hidden="true">
      <polyline points={pts.join(" ")} stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" fill="none" />
    </svg>
  );
}

export function Trend({ value }: { value: number }) {
  if (value === 0) return null;
  const up = value > 0;
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${up ? "text-success" : "text-destructive"}`}>
      {up ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
      {Math.abs(value)}%
    </span>
  );
}

export interface MetricCardProps {
  label: string;
  value: string | number;
  trend?: number;
  sub?: string;
  sparkData?: number[];
  wide?: boolean;
}

export function MetricCard({ label, value, trend, sub, sparkData, wide }: MetricCardProps) {
  return (
    <Card className={wide ? "col-span-2" : ""}>
      <CardContent className="flex items-end justify-between gap-3 p-4">
        <div className="min-w-0 space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          <div className="flex flex-wrap items-baseline gap-2">
            <span className="text-2xl font-semibold tracking-tight">{value}</span>
            {trend !== undefined && <Trend value={trend} />}
          </div>
          {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
        </div>
        {sparkData && sparkData.length > 1 && (
          <div className="shrink-0 text-muted-foreground">
            <Sparkline data={sparkData} color="hsl(var(--primary))" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function calcTrend(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}
