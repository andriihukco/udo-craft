"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import * as Collapsible from "@radix-ui/react-collapsible";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ChevronDown } from "lucide-react";

// ── Colour math ───────────────────────────────────────────────────────────

function hexToHsv(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  let h = 0;
  if (d) {
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
  }
  return [h * 360, max ? d / max : 0, max];
}

function hsvToHex(h: number, s: number, v: number): string {
  h = h / 360;
  const i = Math.floor(h * 6), f = h * 6 - i;
  const p = v * (1 - s), q = v * (1 - f * s), t = v * (1 - (1 - f) * s);
  let r = 0, g = 0, b = 0;
  switch (i % 6) {
    case 0: r = v; g = t; b = p; break; case 1: r = q; g = v; b = p; break;
    case 2: r = p; g = v; b = t; break; case 3: r = p; g = q; b = v; break;
    case 4: r = t; g = p; b = v; break; case 5: r = v; g = p; b = q; break;
  }
  return "#" + [r, g, b].map((x) => Math.round(x * 255).toString(16).padStart(2, "0")).join("");
}

function isValidHex(v: string) { return /^#[0-9a-fA-F]{6}$/.test(v); }

const PRESETS = [
  "#000000","#ffffff","#ef4444","#f97316","#eab308",
  "#22c55e","#3b82f6","#8b5cf6","#ec4899","#06b6d4",
  "#1B3BFF","#6b7280",
];

// ── Color wheel (polar HSV) ───────────────────────────────────────────────

function ColorWheel({ hue, sat, onChange }: {
  hue: number; sat: number;
  onChange: (hue: number, sat: number) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dragging, setDragging] = useState(false);
  const SIZE = 160;
  const R = SIZE / 2;

  // Draw the wheel once
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d"); if (!ctx) return;
    const img = ctx.createImageData(SIZE, SIZE);
    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        const dx = x - R, dy = y - R;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > R) { img.data[(y * SIZE + x) * 4 + 3] = 0; continue; }
        const angle = (Math.atan2(dy, dx) * 180 / Math.PI + 360) % 360;
        const s = dist / R;
        // HSV → RGB at full brightness
        const [rr, gg, bb] = hsvToRgb(angle, s, 1);
        const idx = (y * SIZE + x) * 4;
        img.data[idx] = rr; img.data[idx + 1] = gg; img.data[idx + 2] = bb; img.data[idx + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
  }, []);

  const pick = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current; if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const dx = clientX - rect.left - R;
    const dy = clientY - rect.top - R;
    const dist = Math.min(Math.sqrt(dx * dx + dy * dy), R);
    const angle = (Math.atan2(dy, dx) * 180 / Math.PI + 360) % 360;
    onChange(angle, dist / R);
  }, [onChange]);

  useEffect(() => {
    if (!dragging) return;
    const mv = (e: MouseEvent | TouchEvent) => { const t = "touches" in e ? e.touches[0] : e; pick(t.clientX, t.clientY); };
    const up = () => setDragging(false);
    window.addEventListener("mousemove", mv); window.addEventListener("mouseup", up);
    window.addEventListener("touchmove", mv, { passive: false }); window.addEventListener("touchend", up);
    return () => { window.removeEventListener("mousemove", mv); window.removeEventListener("mouseup", up); window.removeEventListener("touchmove", mv); window.removeEventListener("touchend", up); };
  }, [dragging, pick]);

  // Cursor position
  const angle = hue * Math.PI / 180;
  const cx = R + sat * R * Math.cos(angle);
  const cy = R + sat * R * Math.sin(angle);

  return (
    <div className="relative mx-auto" style={{ width: SIZE, height: SIZE }}>
      <canvas ref={canvasRef} width={SIZE} height={SIZE}
        className="rounded-full cursor-crosshair"
        onMouseDown={(e) => { setDragging(true); pick(e.clientX, e.clientY); }}
        onTouchStart={(e) => { setDragging(true); pick(e.touches[0].clientX, e.touches[0].clientY); }}
      />
      {/* Cursor dot */}
      <div className="absolute size-4 rounded-full border-2 border-white shadow-md ring-1 ring-black/20 pointer-events-none -translate-x-1/2 -translate-y-1/2"
        style={{ left: cx, top: cy, backgroundColor: hsvToHex(hue, sat, 1) }}
      />
    </div>
  );
}

function hsvToRgb(h: number, s: number, v: number): [number, number, number] {
  const hex = hsvToHex(h, s, v);
  return [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)];
}

// ── Brightness slider ─────────────────────────────────────────────────────

function BrightnessSlider({ hue, sat, val, onChange }: { hue: number; sat: number; val: number; onChange: (v: number) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);

  const pick = useCallback((clientX: number) => {
    const el = ref.current; if (!el) return;
    const r = el.getBoundingClientRect();
    onChange(Math.max(0, Math.min(1, (clientX - r.left) / r.width)));
  }, [onChange]);

  useEffect(() => {
    if (!dragging) return;
    const mv = (e: MouseEvent | TouchEvent) => { const t = "touches" in e ? e.touches[0] : e; pick(t.clientX); };
    const up = () => setDragging(false);
    window.addEventListener("mousemove", mv); window.addEventListener("mouseup", up);
    window.addEventListener("touchmove", mv, { passive: false }); window.addEventListener("touchend", up);
    return () => { window.removeEventListener("mousemove", mv); window.removeEventListener("mouseup", up); window.removeEventListener("touchmove", mv); window.removeEventListener("touchend", up); };
  }, [dragging, pick]);

  const fullColor = hsvToHex(hue, sat, 1);

  return (
    <div ref={ref}
      className="relative h-3 rounded-full cursor-pointer select-none"
      style={{ background: `linear-gradient(to right, #000, ${fullColor})` }}
      onMouseDown={(e) => { setDragging(true); pick(e.clientX); }}
      onTouchStart={(e) => { setDragging(true); pick(e.touches[0].clientX); }}>
      <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 size-4 rounded-full border-2 border-white shadow-md pointer-events-none ring-1 ring-black/20"
        style={{ left: `${val * 100}%`, backgroundColor: hsvToHex(hue, sat, val) }} />
    </div>
  );
}

// ── Main ColorPicker ──────────────────────────────────────────────────────

interface ColorPickerProps {
  value: string;
  onChange: (hex: string) => void;
  triggerClassName?: string;
}

export function ColorPicker({ value, onChange, triggerClassName }: ColorPickerProps) {
  const safe = isValidHex(value) ? value : "#000000";
  const [hue, setHue] = useState(() => hexToHsv(safe)[0]);
  const [sat, setSat] = useState(() => hexToHsv(safe)[1]);
  const [val, setVal] = useState(() => hexToHsv(safe)[2]);
  const [hexInput, setHexInput] = useState(safe.slice(1).toUpperCase());
  const [wheelOpen, setWheelOpen] = useState(false);

  useEffect(() => {
    if (!isValidHex(value)) return;
    const [h, s, v] = hexToHsv(value);
    setHue(h); setSat(s); setVal(v); setHexInput(value.slice(1).toUpperCase());
  }, [value]);

  const emit = useCallback((h: number, s: number, v: number) => {
    const hex = hsvToHex(h, s, v);
    setHexInput(hex.slice(1).toUpperCase());
    onChange(hex);
  }, [onChange]);

  const currentHex = hsvToHex(hue, sat, val);

  return (
    <Popover>
      <PopoverTrigger
        type="button"
        title={currentHex}
        className={triggerClassName ?? "size-8 rounded-lg border-2 border-border hover:border-violet-400 transition-all shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"}
        style={{ backgroundColor: currentHex }}
        aria-label={`Колір: ${currentHex}`}
      />
      <PopoverContent side="bottom" align="start" sideOffset={6} className="w-56 p-3 space-y-2.5">

        {/* Preset swatches */}
        <div className="grid grid-cols-6 gap-1">
          {PRESETS.map((color) => (
            <button key={color} type="button" title={color}
              onClick={() => {
                onChange(color);
                const [h, s, v] = hexToHsv(color);
                setHue(h); setSat(s); setVal(v); setHexInput(color.slice(1).toUpperCase());
              }}
              className={`h-6 rounded-md transition-all hover:scale-110 ${currentHex.toLowerCase() === color.toLowerCase() ? "ring-2 ring-violet-500 ring-offset-1 scale-110" : ""} ${color === "#ffffff" ? "border border-border" : ""}`}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>

        {/* Hex input + preview */}
        <div className="flex items-center gap-2">
          <div className="size-7 rounded-md border border-border shrink-0 shadow-sm" style={{ backgroundColor: currentHex }} />
          <div className="flex-1 flex items-center border border-border rounded-lg overflow-hidden bg-background focus-within:ring-2 focus-within:ring-violet-400">
            <span className="pl-2 text-xs text-muted-foreground select-none font-mono">#</span>
            <input type="text" value={hexInput}
              onChange={(e) => {
                const raw = e.target.value.replace(/[^0-9a-fA-F]/g, "").slice(0, 6).toUpperCase();
                setHexInput(raw);
                if (raw.length === 6) {
                  const hex = "#" + raw;
                  const [h, s, v] = hexToHsv(hex);
                  setHue(h); setSat(s); setVal(v); onChange(hex);
                }
              }}
              maxLength={6} spellCheck={false} placeholder="000000"
              className="flex-1 h-7 px-1 text-xs font-mono bg-transparent focus:outline-none uppercase"
            />
          </div>
        </div>

        {/* Accordion: colour wheel + brightness */}
        <Collapsible.Root open={wheelOpen} onOpenChange={setWheelOpen}>
          <Collapsible.Trigger asChild>
            <button type="button"
              className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg border border-border bg-muted/40 hover:bg-muted/70 transition-colors text-xs text-muted-foreground font-medium">
              <span>Колірне колесо</span>
              <ChevronDown className={`size-3.5 transition-transform duration-200 ${wheelOpen ? "rotate-180" : ""}`} />
            </button>
          </Collapsible.Trigger>
          <Collapsible.Content
            className="overflow-hidden data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:slide-out-to-top-1 data-[state=open]:slide-in-from-top-1"
          >
            <div className="pt-3 space-y-3">
              {/* Color wheel */}
              <ColorWheel hue={hue} sat={sat}
                onChange={(h, s) => { setHue(h); setSat(s); emit(h, s, val); }}
              />
              {/* Brightness slider */}
              <BrightnessSlider hue={hue} sat={sat} val={val}
                onChange={(v) => { setVal(v); emit(hue, sat, v); }}
              />
            </div>
          </Collapsible.Content>
        </Collapsible.Root>

      </PopoverContent>
    </Popover>
  );
}
