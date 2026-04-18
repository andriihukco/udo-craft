"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { RefreshCw, ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { MetricCard, calcTrend, fmtCurrency } from "@/components/metrics";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { BarChart2 } from "lucide-react";

// ─── Date Range Types ─────────────────────────────────────────────────────────

type PresetKey = "today" | "yesterday" | "7d" | "30d" | "90d" | "thisYear" | "lastYear" | "max" | "custom";

interface DateRange {
  preset: PresetKey;
  from: Date;
  to: Date;
}

const PRESETS: { key: PresetKey; label: string }[] = [
  { key: "today",     label: "Сьогодні" },
  { key: "yesterday", label: "Вчора" },
  { key: "7d",        label: "7 днів" },
  { key: "30d",       label: "30 днів" },
  { key: "90d",       label: "90 днів" },
  { key: "thisYear",  label: "Цей рік" },
  { key: "lastYear",  label: "Минулий рік" },
  { key: "max",       label: "Весь час" },
  { key: "custom",    label: "Довільний" },
];

function presetToDates(key: PresetKey, customFrom?: Date, customTo?: Date): { from: Date; to: Date } {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  switch (key) {
    case "today":     return { from: today, to: now };
    case "yesterday": { const y = new Date(today); y.setDate(y.getDate() - 1); return { from: y, to: today }; }
    case "7d":        { const f = new Date(today); f.setDate(f.getDate() - 7); return { from: f, to: now }; }
    case "30d":       { const f = new Date(today); f.setDate(f.getDate() - 30); return { from: f, to: now }; }
    case "90d":       { const f = new Date(today); f.setDate(f.getDate() - 90); return { from: f, to: now }; }
    case "thisYear":  return { from: new Date(now.getFullYear(), 0, 1), to: now };
    case "lastYear":  return { from: new Date(now.getFullYear() - 1, 0, 1), to: new Date(now.getFullYear() - 1, 11, 31) };
    case "max":       return { from: new Date("2020-01-01"), to: now };
    case "custom":    return { from: customFrom ?? today, to: customTo ?? now };
  }
}

function fmtPresetLabel(range: DateRange): string {
  if (range.preset !== "custom") return PRESETS.find(p => p.key === range.preset)!.label;
  const fmt = (d: Date) => d.toLocaleDateString("uk-UA", { day: "numeric", month: "short", year: "2-digit" });
  return `${fmt(range.from)} — ${fmt(range.to)}`;
}

// ─── Mini Calendar ────────────────────────────────────────────────────────────

const MONTHS_UK = ["Січень","Лютий","Березень","Квітень","Травень","Червень","Липень","Серпень","Вересень","Жовтень","Листопад","Грудень"];
const DAYS_UK = ["Пн","Вт","Ср","Чт","Пт","Сб","Нд"];

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
function startOfDay(d: Date) { return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }

interface MiniCalProps {
  year: number; month: number;
  from: Date | null; to: Date | null; hover: Date | null;
  onDay: (d: Date) => void; onHover: (d: Date | null) => void;
  onPrev: () => void; onNext: () => void;
  showPrev?: boolean; showNext?: boolean;
}

function MiniCal({ year, month, from, to, hover, onDay, onHover, onPrev, onNext, showPrev = true, showNext = true }: MiniCalProps) {
  const firstDow = new Date(year, month, 1).getDay();
  const offset = (firstDow + 6) % 7; // Mon-based
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (Date | null)[] = Array(offset).fill(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
  while (cells.length % 7 !== 0) cells.push(null);

  const rangeEnd = hover && from && !to ? hover : to;
  const monthLabel = `${MONTHS_UK[month]} ${year}`;

  return (
    <div role="grid" aria-label={monthLabel} className="select-none w-[224px]">
      {/* Month nav */}
      <div className="flex items-center justify-between mb-2">
        <button
          type="button"
          onClick={onPrev}
          aria-label="Попередній місяць"
          tabIndex={showPrev ? 0 : -1}
          className={[
            "flex items-center justify-center size-8 rounded-md transition-colors",
            "hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            !showPrev ? "invisible pointer-events-none" : "",
          ].join(" ")}
        >
          <ChevronLeft className="size-4 text-muted-foreground" />
        </button>
        <span className="text-xs font-semibold" aria-live="polite">{monthLabel}</span>
        <button
          type="button"
          onClick={onNext}
          aria-label="Наступний місяць"
          tabIndex={showNext ? 0 : -1}
          className={[
            "flex items-center justify-center size-8 rounded-md transition-colors",
            "hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            !showNext ? "invisible pointer-events-none" : "",
          ].join(" ")}
        >
          <ChevronRight className="size-4 text-muted-foreground" />
        </button>
      </div>

      {/* Day-of-week headers */}
      <div role="row" className="grid grid-cols-7 mb-1">
        {DAYS_UK.map(d => (
          <div key={d} role="columnheader" aria-label={d} className="flex items-center justify-center h-7 text-[10px] text-muted-foreground font-medium">
            {d}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7">
        {cells.map((day, i) => {
          if (!day) return <div key={i} role="gridcell" aria-hidden="true" className="w-8 h-8" />;

          const isFrom = !!(from && isSameDay(day, from));
          const isTo = !!(rangeEnd && isSameDay(day, rangeEnd));
          const isEndpoint = isFrom || isTo;
          const inRange = !!(from && rangeEnd && day > startOfDay(from) && day < startOfDay(rangeEnd));
          const isToday = isSameDay(day, new Date());
          const isSelected = isEndpoint || inRange;
          const hasRange = !!(from && rangeEnd && !isSameDay(from, rangeEnd));

          return (
            <div key={i} role="gridcell" className="relative flex items-center justify-center w-8 h-8">
              {/* Continuous range fill — vertically centered band */}
              {inRange && (
                <span aria-hidden="true" className="absolute inset-x-0 top-[20%] bottom-[20%] bg-primary/15" />
              )}
              {/* Right half-fill for "from" endpoint */}
              {isFrom && hasRange && (
                <span aria-hidden="true" className="absolute left-1/2 right-0 top-[20%] bottom-[20%] bg-primary/15" />
              )}
              {/* Left half-fill for "to" endpoint */}
              {isTo && hasRange && (
                <span aria-hidden="true" className="absolute right-1/2 left-0 top-[20%] bottom-[20%] bg-primary/15" />
              )}
              <button
                type="button"
                onClick={() => onDay(day)}
                onMouseEnter={() => onHover(day)}
                onMouseLeave={() => onHover(null)}
                aria-label={day.toLocaleDateString("uk-UA", { day: "numeric", month: "long", year: "numeric" })}
                aria-selected={isSelected}
                aria-current={isToday ? "date" : undefined}
                className={[
                  "relative z-10 flex items-center justify-center w-8 h-8 shrink-0 text-xs font-medium transition-colors rounded-full",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
                  isEndpoint
                    ? "bg-primary text-primary-foreground"
                    : inRange
                    ? "text-foreground hover:bg-primary/20"
                    : "text-foreground hover:bg-muted",
                  isToday && !isEndpoint ? "font-bold underline decoration-dotted underline-offset-2" : "",
                ].join(" ")}
              >
                {day.getDate()}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Date Range Picker ────────────────────────────────────────────────────────

function DateRangePicker({ range, onChange }: { range: DateRange; onChange: (r: DateRange) => void }) {
  const [open, setOpen] = useState(false);
  const now = new Date();
  const [calYear, setCalYear] = useState(now.getFullYear());
  const [calMonth, setCalMonth] = useState(now.getMonth() === 0 ? 11 : now.getMonth() - 1);
  const [picking, setPicking] = useState<"from" | "to">("from");
  const [tempFrom, setTempFrom] = useState<Date | null>(null);
  const [tempTo, setTempTo] = useState<Date | null>(null);
  const [hover, setHover] = useState<Date | null>(null);

  const rightYear = calMonth === 11 ? calYear + 1 : calYear;
  const rightMonth = calMonth === 11 ? 0 : calMonth + 1;

  const prevMonth = () => {
    if (calMonth === 0) { setCalYear(y => y - 1); setCalMonth(11); }
    else setCalMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (calMonth === 11) { setCalYear(y => y + 1); setCalMonth(0); }
    else setCalMonth(m => m + 1);
  };

  const handleDay = (day: Date) => {
    if (picking === "from" || (tempFrom && day < tempFrom)) {
      setTempFrom(day);
      setTempTo(null);
      setPicking("to");
    } else {
      setTempTo(day);
      setPicking("from");
    }
  };

  const handleApply = () => {
    if (tempFrom && tempTo) {
      onChange({
        preset: "custom",
        from: startOfDay(tempFrom),
        to: new Date(tempTo.getFullYear(), tempTo.getMonth(), tempTo.getDate(), 23, 59, 59),
      });
    }
    setTempFrom(null);
    setTempTo(null);
    setPicking("from");
    setOpen(false);
  };

  const applyPreset = (key: PresetKey) => {
    const { from, to } = presetToDates(key);
    onChange({ preset: key, from, to });
    setTempFrom(null);
    setTempTo(null);
    setPicking("from");
    setOpen(false);
  };

  const handleClose = () => {
    setTempFrom(null);
    setTempTo(null);
    setPicking("from");
    setOpen(false);
  };

  const displayFrom = tempFrom ?? range.from;
  const displayTo = tempTo ?? (tempFrom ? null : range.to);
  const canApply = !!(tempFrom && tempTo);

  return (
    <Popover open={open} onOpenChange={o => { if (!o) handleClose(); else setOpen(true); }}>
      <PopoverTrigger
        aria-label={`Обрати діапазон дат, зараз: ${fmtPresetLabel(range)}`}
        aria-haspopup="dialog"
        aria-expanded={open}
        className="outline-none focus:outline-none inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1.5 text-xs font-medium text-foreground shadow-xs hover:bg-muted transition-colors"
      >
        <CalendarDays className="size-3.5 text-muted-foreground" aria-hidden="true" />
        <span>{fmtPresetLabel(range)}</span>
        <ChevronRight className="size-3 text-muted-foreground rotate-90" aria-hidden="true" />
      </PopoverTrigger>
      <PopoverContent side="bottom" align="end" className="w-auto p-0 overflow-hidden" role="dialog" aria-label="Вибір діапазону дат">
        <div className="flex">
          {/* Presets */}
          <div className="flex flex-col border-r py-2 px-1.5 min-w-[136px] gap-0.5" role="listbox" aria-label="Швидкий вибір">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-2 pb-1" aria-hidden="true">
              Швидкий вибір
            </p>
            {PRESETS.filter(p => p.key !== "custom").map(p => (
              <button
                key={p.key}
                type="button"
                role="option"
                aria-selected={range.preset === p.key && !tempFrom}
                onClick={() => applyPreset(p.key)}
                className={[
                  "w-full text-left px-2 py-2 rounded-md text-xs transition-colors min-h-[32px]",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  range.preset === p.key && !tempFrom
                    ? "bg-primary text-primary-foreground font-medium"
                    : "text-foreground hover:bg-muted",
                ].join(" ")}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Calendars */}
          <div className="p-3 flex flex-col gap-2">
            <p aria-live="polite" aria-atomic="true" className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-1">
              {picking === "from" ? "Оберіть початок" : "Оберіть кінець"}
            </p>

            <div className="flex gap-4">
              <MiniCal
                year={calYear} month={calMonth}
                from={displayFrom} to={displayTo} hover={hover}
                onDay={handleDay} onHover={setHover}
                onPrev={prevMonth} onNext={nextMonth}
                showNext={false}
              />
              <MiniCal
                year={rightYear} month={rightMonth}
                from={displayFrom} to={displayTo} hover={hover}
                onDay={handleDay} onHover={setHover}
                onPrev={prevMonth} onNext={nextMonth}
                showPrev={false}
              />
            </div>

            {/* Status + Apply */}
            <div className="flex items-center justify-between px-1 pt-1 border-t">
              <p aria-live="polite" className="text-[10px] text-muted-foreground">
                {tempFrom && !tempTo
                  ? <>Початок: <span className="font-medium text-foreground">{tempFrom.toLocaleDateString("uk-UA", { day: "numeric", month: "short" })}</span> — оберіть кінець</>
                  : tempFrom && tempTo
                  ? <><span className="font-medium text-foreground">{tempFrom.toLocaleDateString("uk-UA", { day: "numeric", month: "short" })}</span> — <span className="font-medium text-foreground">{tempTo.toLocaleDateString("uk-UA", { day: "numeric", month: "short" })}</span></>
                  : "Оберіть діапазон"}
              </p>
              <button
                type="button"
                onClick={handleApply}
                disabled={!canApply}
                className="ml-3 px-3 py-1 rounded-md text-xs font-medium bg-primary text-primary-foreground disabled:opacity-40 disabled:pointer-events-none hover:bg-primary/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                Застосувати
              </button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// ─── Data Types ───────────────────────────────────────────────────────────────

interface AnalyticsData {
  sessions: number; sessionsPrev: number;
  uniqueVisitors: number; uniqueVisitorsPrev: number;
  pageViews: number; pageViewsPrev: number;
  pagesPerSession: number;
  formSubmissions: number; formSubmissionsPrev: number;
  customizationStarts: number; customizationCompletions: number;
  conversionRate: number; conversionRatePrev: number;
  totalOrders: number; totalOrdersPrev: number;
  totalRevenue: number; totalRevenuePrev: number;
  paidRevenue: number; paidRevenuePrev: number;
  avgOrderValue: number; avgOrderValuePrev: number;
  itemsSold: number;
  totalClients: number; totalClientsPrev: number;
  completedOrders: number; completedOrdersPrev: number;
  dailyStats: Array<{ date: string; sessions: number; pageViews: number; forms: number; revenue: number }>;
}

// ─── Quick Chips ──────────────────────────────────────────────────────────────

const QUICK_CHIPS: { key: PresetKey; label: string }[] = [
  { key: "7d",  label: "7д" },
  { key: "30d", label: "30д" },
  { key: "90d", label: "90д" },
  { key: "max", label: "Весь час" },
];

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const supabase = createClient();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<DateRange>(() => {
    const { from, to } = presetToDates("30d");
    return { preset: "30d", from, to };
  });

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    const rangeMs = range.to.getTime() - range.from.getTime();
    const prevFrom = new Date(range.from.getTime() - rangeMs);
    const prevTo = range.from;

    try {
      const [
        { data: events },
        { data: prevEvents },
        { data: leads },
        { data: prevLeads },
        { data: items },
      ] = await Promise.all([
        supabase.from("site_events").select("event_type, session_id, visitor_id, created_at")
          .gte("created_at", range.from.toISOString()).lte("created_at", range.to.toISOString()),
        supabase.from("site_events").select("event_type, session_id, visitor_id, created_at")
          .gte("created_at", prevFrom.toISOString()).lt("created_at", prevTo.toISOString()),
        supabase.from("leads").select("id, status, total_amount_cents, customer_data, created_at")
          .gte("created_at", range.from.toISOString()).lte("created_at", range.to.toISOString()),
        supabase.from("leads").select("id, status, total_amount_cents, created_at")
          .gte("created_at", prevFrom.toISOString()).lt("created_at", prevTo.toISOString()),
        supabase.from("order_items").select("id, quantity, lead_id, created_at")
          .gte("created_at", range.from.toISOString()).lte("created_at", range.to.toISOString()),
      ]);

      const ev = events || [];
      const pev = prevEvents || [];
      const lds = leads || [];
      const plds = prevLeads || [];
      const its = items || [];

      const sessions = new Set(ev.filter((e: any) => e.event_type === "session_start").map((e: any) => e.session_id)).size;
      const sessionsPrev = new Set(pev.filter((e: any) => e.event_type === "session_start").map((e: any) => e.session_id)).size;
      const uniqueVisitors = new Set(ev.map((e: any) => e.visitor_id)).size;
      const uniqueVisitorsPrev = new Set(pev.map((e: any) => e.visitor_id)).size;
      const pageViews = ev.filter((e: any) => e.event_type === "pageview").length;
      const pageViewsPrev = pev.filter((e: any) => e.event_type === "pageview").length;
      const formSubmissions = ev.filter((e: any) => e.event_type === "form_submit").length;
      const formSubmissionsPrev = pev.filter((e: any) => e.event_type === "form_submit").length;
      const customStarts = ev.filter((e: any) => e.event_type === "customize_start").length;
      const customCompletes = ev.filter((e: any) => e.event_type === "customize_complete").length;
      const conversionRate = sessions > 0 ? (formSubmissions / sessions) * 100 : 0;
      const conversionRatePrev = sessionsPrev > 0 ? (formSubmissionsPrev / sessionsPrev) * 100 : 0;
      const totalOrders = lds.length;
      const totalOrdersPrev = plds.length;
      const totalRevenue = lds.reduce((s: number, l: any) => s + (l.total_amount_cents || 0), 0);
      const totalRevenuePrev = plds.reduce((s: number, l: any) => s + (l.total_amount_cents || 0), 0);
      const completed = lds.filter((l: any) => l.status === "completed");
      const completedPrev = plds.filter((l: any) => l.status === "completed");
      const paidRevenue = completed.reduce((s: number, l: any) => s + (l.total_amount_cents || 0), 0);
      const paidRevenuePrev = completedPrev.reduce((s: number, l: any) => s + (l.total_amount_cents || 0), 0);
      const avgOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;
      const avgOrderValuePrev = totalOrdersPrev > 0 ? Math.round(totalRevenuePrev / totalOrdersPrev) : 0;
      const itemsSold = its.reduce((s: number, i: any) => s + (i.quantity || 0), 0);
      const totalClients = new Set(lds.map((l: any) => l.customer_data?.email).filter(Boolean)).size;
      const totalClientsPrev = new Set(plds.map((l: any) => (l as any).customer_data?.email).filter(Boolean)).size;

      const dailyMap = new Map<string, { sessions: number; pageViews: number; forms: number; revenue: number }>();
      ev.forEach((e: any) => {
        const key = new Date(e.created_at).toLocaleDateString("uk-UA", { day: "numeric", month: "short" });
        if (!dailyMap.has(key)) dailyMap.set(key, { sessions: 0, pageViews: 0, forms: 0, revenue: 0 });
        const d = dailyMap.get(key)!;
        if (e.event_type === "session_start") d.sessions++;
        if (e.event_type === "pageview") d.pageViews++;
        if (e.event_type === "form_submit") d.forms++;
      });
      lds.forEach((l: any) => {
        const key = new Date(l.created_at).toLocaleDateString("uk-UA", { day: "numeric", month: "short" });
        if (!dailyMap.has(key)) dailyMap.set(key, { sessions: 0, pageViews: 0, forms: 0, revenue: 0 });
        dailyMap.get(key)!.revenue += (l.total_amount_cents || 0) / 100;
      });

      setData({
        sessions, sessionsPrev, uniqueVisitors, uniqueVisitorsPrev,
        pageViews, pageViewsPrev,
        pagesPerSession: sessions > 0 ? pageViews / sessions : 0,
        formSubmissions, formSubmissionsPrev,
        customizationStarts: customStarts, customizationCompletions: customCompletes,
        conversionRate, conversionRatePrev,
        totalOrders, totalOrdersPrev, totalRevenue, totalRevenuePrev,
        paidRevenue, paidRevenuePrev, avgOrderValue, avgOrderValuePrev,
        itemsSold, totalClients, totalClientsPrev,
        completedOrders: completed.length, completedOrdersPrev: completedPrev.length,
        dailyStats: Array.from(dailyMap.entries()).map(([date, s]) => ({ date, ...s })),
      });
    } catch (err) {      console.error("Analytics fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => { fetchAnalytics(); }, [fetchAnalytics]);

  const applyQuickChip = (key: PresetKey) => {
    const { from, to } = presetToDates(key);
    setRange({ preset: key, from, to });
  };

  const skeletonRows = (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="bg-card border rounded-lg p-4 h-20 animate-pulse" />
        ))}
      </div>
      <div className="bg-card border rounded-lg h-[300px] animate-pulse" />
    </div>
  );

  const d = data;

  return (
    <div className="flex flex-1 h-0 flex-col overflow-hidden">
      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
      <PageHeader
        title="Аналітика"
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            {QUICK_CHIPS.map(chip => (
              <Button
                key={chip.key}
                type="button"
                variant={range.preset === chip.key ? "default" : "outline"}
                size="sm"
                className="h-7 text-xs px-2"
                onClick={() => applyQuickChip(chip.key)}
              >
                {chip.label}
              </Button>
            ))}
            <DateRangePicker range={range} onChange={r => setRange(r)} />
            <Button variant="outline" size="sm" className="h-7 w-7 p-0" onClick={fetchAnalytics} disabled={loading}>
              <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        }
      />
      {loading && !d ? skeletonRows : d ? (
        d.sessions === 0 && d.totalOrders === 0 && d.totalRevenue === 0 ? (
          <EmptyState
            icon={BarChart2}
            title="Даних ще немає"
            description="Аналітика з'явиться після перших відвідувань та замовлень за обраний період"
            action={
              <Button variant="outline" size="sm" onClick={() => applyQuickChip("max")}>
                Показати весь час
              </Button>
            }
          />
        ) : (
        <>
          {/* ── Traffic ── */}
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Трафік</p>
            <div className="grid grid-cols-4 gap-3">
              <MetricCard label="Унікальні відвідувачі" value={d.uniqueVisitors.toLocaleString()} trend={calcTrend(d.uniqueVisitors, d.uniqueVisitorsPrev)} sub={`${d.uniqueVisitorsPrev} попередній період`} sparkData={[d.uniqueVisitorsPrev, d.uniqueVisitors]} />
              <MetricCard label="Сеанси" value={d.sessions.toLocaleString()} trend={calcTrend(d.sessions, d.sessionsPrev)} sub={`${d.sessionsPrev} попередній період`} sparkData={[d.sessionsPrev, d.sessions]} />
              <MetricCard label="Перегляди сторінок" value={d.pageViews.toLocaleString()} trend={calcTrend(d.pageViews, d.pageViewsPrev)} sub={`${d.pageViewsPrev} попередній період`} sparkData={[d.pageViewsPrev, d.pageViews]} />
              <MetricCard label="Сторінок за сесію" value={d.pagesPerSession.toFixed(1)} sub="Середній показник" sparkData={[d.pageViewsPrev, d.pageViews]} />
            </div>
          </div>

          {/* ── Funnel ── */}
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Воронка</p>
            <div className="grid grid-cols-4 gap-3">
              <MetricCard label="Заявки (форми)" value={d.formSubmissions} trend={calcTrend(d.formSubmissions, d.formSubmissionsPrev)} sub={`${d.formSubmissionsPrev} попередній період`} sparkData={[d.formSubmissionsPrev, d.formSubmissions]} />
              <MetricCard label="Конверсія" value={`${d.conversionRate.toFixed(1)}%`} trend={calcTrend(d.conversionRate, d.conversionRatePrev)} sub={`${d.conversionRatePrev.toFixed(1)}% попередній`} sparkData={[d.conversionRatePrev, d.conversionRate]} />
              <MetricCard label="Почали кастомізацію" value={d.customizationStarts} sub="Воронка кастомізації" sparkData={[0, d.customizationStarts]} />
              <MetricCard label="Завершили кастомізацію" value={d.customizationCompletions} trend={d.customizationStarts > 0 ? Math.round((d.customizationCompletions / d.customizationStarts) * 100) : 0} sub="% завершення" sparkData={[0, d.customizationCompletions]} />
            </div>
          </div>

          {/* ── Sales ── */}
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Продажі</p>
            <div className="grid grid-cols-4 gap-3">
              <MetricCard label="Усі замовлення" value={d.totalOrders} trend={calcTrend(d.totalOrders, d.totalOrdersPrev)} sub={`${d.totalOrdersPrev} попередній період`} sparkData={[d.totalOrdersPrev, d.totalOrders]} />
              <MetricCard label="Загальний дохід" value={fmtCurrency(d.totalRevenue)} trend={calcTrend(d.totalRevenue, d.totalRevenuePrev)} sub={`${fmtCurrency(d.totalRevenuePrev)} попередній`} sparkData={[d.totalRevenuePrev, d.totalRevenue]} />
              <MetricCard label="Сплачено" value={fmtCurrency(d.paidRevenue)} trend={calcTrend(d.paidRevenue, d.paidRevenuePrev)} sub={`${fmtCurrency(d.paidRevenuePrev)} попередній`} sparkData={[d.paidRevenuePrev, d.paidRevenue]} />
              <MetricCard label="Середній чек" value={fmtCurrency(d.avgOrderValue)} trend={calcTrend(d.avgOrderValue, d.avgOrderValuePrev)} sub={`${fmtCurrency(d.avgOrderValuePrev)} попередній`} sparkData={[d.avgOrderValuePrev, d.avgOrderValue]} />
            </div>
            <div className="grid grid-cols-4 gap-3 mt-3">
              <MetricCard label="Завершені замовлення" value={d.completedOrders} trend={calcTrend(d.completedOrders, d.completedOrdersPrev)} sub={`${d.completedOrdersPrev} попередній`} sparkData={[d.completedOrdersPrev, d.completedOrders]} />
              <MetricCard label="Продані товари" value={d.itemsSold} sub="Одиниць за період" sparkData={[0, d.itemsSold]} />
              <MetricCard label="Клієнти" value={d.totalClients} trend={calcTrend(d.totalClients, d.totalClientsPrev)} sub={`${d.totalClientsPrev} попередній`} sparkData={[d.totalClientsPrev, d.totalClients]} />
              <MetricCard label="Повернення коштів" value={fmtCurrency(0)} sub="За період" sparkData={[0, 0]} />
            </div>
          </div>

          {/* ── Chart ── */}
          <Card>
            <CardHeader className="pb-0">
              <CardTitle className="text-base font-medium">Трафік та дохід за період</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={d.dailyStats}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
                    <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }} />
                    <Line yAxisId="left" type="monotone" dataKey="sessions" stroke="hsl(var(--muted-foreground))" strokeWidth={2} name="Сесії" dot={false} />
                    <Line yAxisId="left" type="monotone" dataKey="pageViews" stroke="#10b981" strokeWidth={2} name="Перегляди" dot={false} />
                    <Line yAxisId="left" type="monotone" dataKey="forms" stroke="#f59e0b" strokeWidth={2} name="Заявки" dot={false} />
                    <Line yAxisId="right" type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2} name="Дохід ₴" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </>
        )
      ) : (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Не вдалося завантажити аналітику</p>
          <Button onClick={fetchAnalytics} className="mt-4">Спробувати знову</Button>
        </div>
      )}
      </div>
    </div>
  );
}
