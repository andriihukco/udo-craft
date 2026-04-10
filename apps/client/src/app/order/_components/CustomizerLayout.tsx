"use client";

import React from "react";
import { ArrowLeft, Palette, Ruler, Loader2 } from "lucide-react";
import { CustomizerMobileSheet } from "./CustomizerMobileSheet";

interface CustomizerLayoutProps {
  productName: string;
  total: number;
  mobileSheet: "config" | "price" | null;
  setMobileSheet: (v: "config" | "price" | null) => void;
  addingToCart: boolean;
  removingBg?: boolean;
  leftPanel: React.ReactNode;
  canvas: React.ReactNode;
  rightPanel: React.ReactNode;
  onClose: () => void;
}

export function CustomizerLayout({
  productName, total, mobileSheet, setMobileSheet, addingToCart, removingBg,
  leftPanel, canvas, rightPanel, onClose,
}: CustomizerLayoutProps) {
  return (
    <div className="fixed inset-0 z-[9999] bg-background flex flex-col">
      <div className="flex flex-1 min-h-0 flex-col lg:grid lg:grid-cols-[280px_1fr_280px]">
        {/* Left panel — desktop */}
        <div className="hidden lg:flex lg:flex-col h-full overflow-y-auto border-r border-border bg-card p-4">
          {leftPanel}
        </div>

        {/* Canvas */}
        <div className="flex-1 min-h-0 overflow-y-auto flex flex-col items-center justify-start lg:justify-center p-3 lg:p-6 bg-muted/40">
          <div className="lg:hidden w-full h-11 mb-3 flex items-center justify-between bg-card rounded-xl px-3 border border-border">
            <button
              onClick={() => { if (!confirm("Повернутися? Незбережені зміни буде втрачено.")) return; onClose(); }}
              className="cursor-pointer flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="size-3.5" /> Назад
            </button>
            <p className="text-xs font-semibold truncate max-w-[140px]">{productName}</p>
            <p className="text-xs font-bold text-primary shrink-0">{total.toFixed(0)} ₴</p>
          </div>
          {canvas}
        </div>

        {/* Right panel — desktop */}
        <div className="hidden lg:flex lg:flex-col h-full overflow-y-auto overflow-x-hidden border-l border-border bg-card p-4">
          <div className="space-y-5">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Тираж та ціна</p>
            {rightPanel}
          </div>
        </div>
      </div>

      {/* Mobile bottom tabs */}
      <div className="lg:hidden shrink-0 border-t border-border bg-card">
        <div className="flex">
          <button
            onClick={() => setMobileSheet(mobileSheet === "config" ? null : "config")}
            className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-semibold transition-colors ${mobileSheet === "config" ? "text-primary border-t-2 border-primary -mt-px" : "text-muted-foreground"}`}
          >
            <Palette className="size-4" />
            Налаштування
          </button>
          <button
            onClick={() => setMobileSheet(mobileSheet === "price" ? null : "price")}
            className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-semibold transition-colors ${mobileSheet === "price" ? "text-primary border-t-2 border-primary -mt-px" : "text-muted-foreground"}`}
          >
            <Ruler className="size-4" />
            Тираж та ціна
          </button>
        </div>
      </div>

      <CustomizerMobileSheet
        activeSheet={mobileSheet}
        onClose={() => setMobileSheet(null)}
        configContent={leftPanel}
        priceContent={rightPanel}
      />

      {addingToCart && (
        <div className="fixed inset-0 z-[10001] bg-background/60 backdrop-blur-sm flex items-center justify-center">
          <div className="flex items-center gap-2.5 rounded-2xl border border-border bg-card px-5 py-3.5 shadow-xl text-sm font-semibold">
            <Loader2 className="size-4 animate-spin text-primary" />
            Додаємо...
          </div>
        </div>
      )}
      {removingBg && (
        <div className="fixed inset-0 z-[10001] bg-background/60 backdrop-blur-sm flex items-center justify-center">
          <div className="flex items-center gap-2.5 rounded-2xl border border-border bg-card px-5 py-3.5 shadow-xl text-sm font-semibold">
            <Loader2 className="size-4 animate-spin text-primary" />
            Видаляємо фон...
          </div>
        </div>
      )}
    </div>
  );
}
