"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { AnimatedNumber } from "@/components/AnimatedNumber";
import { Loader2, Plus, Minus } from "lucide-react";
import type { PrintLayer } from "@udo-craft/shared";
import type { PrintTypePricingRow } from "@/components/LayersPanel";

// ── Types ─────────────────────────────────────────────────────────────────

interface ProductWithDiscountGrid {
  base_price_cents: number;
  available_sizes?: string[];
  discount_grid?: { qty: number; discount_pct: number }[];
  [key: string]: unknown;
}

export interface QtyPriceContentProps {
  product: ProductWithDiscountGrid;
  quantity: number;
  qtyStr: string;
  setQuantity: (n: number) => void;
  setQtyStr: (s: string) => void;
  discountPct: number;
  unitPrice: number;
  discounted: number;
  printCostPerUnit: number;
  total: number;
  layers: PrintLayer[];
  pricing: PrintTypePricingRow[];
  itemNote: string;
  setItemNote: (s: string) => void;
  onAddToCart: (() => void) | null;
  loading?: boolean;
  showTitle?: boolean;
  addDisabled?: boolean;
  addDisabledReason?: string | null;
  disabled?: boolean;
}

// ── Component ─────────────────────────────────────────────────────────────

export function QtyPriceContent({
  product,
  quantity,
  qtyStr,
  setQuantity,
  setQtyStr,
  discountPct,
  unitPrice,
  discounted,
  printCostPerUnit,
  total,
  layers,
  pricing,
  itemNote,
  setItemNote,
  onAddToCart,
  loading,
  showTitle = true,
  addDisabled = false,
  addDisabledReason = null,
  disabled = false,
}: QtyPriceContentProps) {
  const [noteOpen, setNoteOpen] = React.useState(false);

  return (
    <div className={`space-y-5 pb-4 ${disabled ? "opacity-50 pointer-events-none" : ""}`}>
      {showTitle && (
        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
          Тираж та ціна
        </p>
      )}

      {/* Quantity stepper */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => { const n = Math.max(1, quantity - 1); setQuantity(n); setQtyStr(String(n)); }}
          disabled={disabled}
          className="cursor-pointer size-8 rounded-lg border border-border flex items-center justify-center text-base font-medium hover:bg-muted transition-colors shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
        >−</button>
        <input
          type="number"
          min={1}
          value={qtyStr}
          disabled={disabled}
          onChange={(e) => {
            const next = Math.max(1, parseInt(e.target.value) || 1);
            setQuantity(next);
            setQtyStr(String(next));
          }}
          onBlur={() => {
            const safe = Math.max(1, parseInt(qtyStr) || 1);
            setQuantity(safe);
            setQtyStr(String(safe));
          }}
          className="flex-1 min-w-0 text-center text-xl font-bold tabular-nums border border-border rounded-lg py-1.5 focus:outline-none focus:ring-1 focus:ring-primary bg-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none disabled:opacity-50 disabled:cursor-not-allowed"
        />
        <button
          onClick={() => { const n = quantity + 1; setQuantity(n); setQtyStr(String(n)); }}
          disabled={disabled}
          className="cursor-pointer size-8 rounded-lg border border-border flex items-center justify-center text-base font-medium hover:bg-muted transition-colors shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
        >+</button>
      </div>

      {/* Discount chips — auto-fit grid so all chips fit without cropping */}
      {(() => {
        const grid = product.discount_grid;
        if (!grid?.length) return null;
        const sorted = [...grid].sort((a, b) => a.qty - b.qty);
        return (
          <div
            className="grid gap-1.5"
            style={{ gridTemplateColumns: `repeat(${sorted.length}, minmax(0, 1fr))` }}
          >
            {sorted.map((tier, i) => {
              const nextQty = sorted[i + 1]?.qty;
              const active = quantity >= tier.qty && (nextQty === undefined || quantity < nextQty);
              return (
                <button
                  key={tier.qty}
                  onClick={() => { setQuantity(tier.qty); setQtyStr(String(tier.qty)); }}
                  disabled={disabled}
                  className={`cursor-pointer text-center px-1 py-2 rounded-xl border text-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                    active
                      ? "border-primary bg-primary text-primary-foreground font-semibold"
                      : "border-primary/40 text-primary hover:border-primary hover:bg-primary/5"
                  }`}
                >
                  <div className="font-bold whitespace-nowrap">від {tier.qty}</div>
                  <div className="text-[10px] opacity-80">−{tier.discount_pct}%</div>
                </button>
              );
            })}
          </div>
        );
      })()}

      {/* Price breakdown */}
      <div className="rounded-xl border border-border/40 bg-muted/50 p-3.5 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Товар</span>
          <div className="flex items-center gap-1.5">
            {discountPct > 0 && (
              <span className="text-xs text-muted-foreground line-through">{unitPrice.toFixed(0)} ₴</span>
            )}
            <span className="font-medium">{discounted.toFixed(0)} ₴/шт</span>
          </div>
        </div>
        {discountPct > 0 && (
          <div className="flex justify-between text-sm text-emerald-600">
            <span>Знижка</span>
            <span className="font-medium">−{discountPct}%</span>
          </div>
        )}
        {layers.length > 0 && (
          <div className="space-y-1 pt-1 border-t border-border/40">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Нанесення</p>
            {layers.map((layer) => {
              const rows = pricing.filter((r) => r.print_type === layer.type);
              const sizeLabel = layer.sizeLabel as string | undefined;
              const row = rows.length && sizeLabel
                ? (rows.find((r) => r.size_label === sizeLabel) ?? null)
                : null;
              const sorted = row ? [...row.qty_tiers].sort((a, b) => b.min_qty - a.min_qty) : [];
              const tier = sorted.find((t) => quantity >= t.min_qty) ?? sorted[sorted.length - 1];
              const price = sizeLabel ? (((tier?.price_cents ?? layer.priceCents) ?? 0) / 100) : 0;
              const printTypeLabels: Record<string, string> = {
                dtf: "DTF", embroidery: "Вишивка", screen: "Шовкодрук",
                sublimation: "Сублімація", patch: "Нашивка",
              };
              return (
                <div key={layer.id} className="flex justify-between text-xs text-muted-foreground">
                  <span className="truncate max-w-[60%]">
                    <span className="font-medium text-foreground">{printTypeLabels[layer.type] ?? layer.type}</span>
                    {sizeLabel ? ` · ${sizeLabel}` : " · Оберіть розмір"}
                    <span className="text-[10px] ml-1 opacity-60">({layer.side})</span>
                  </span>
                  <span className="font-medium shrink-0 ml-2 text-right">
                    {sizeLabel ? (price > 0 ? `+${price.toFixed(0)} ₴/шт` : "—") : "Оберіть розмір"}
                  </span>
                </div>
              );
            })}
            {printCostPerUnit > 0 && (
              <div className="flex justify-between text-xs font-medium pt-0.5 border-t border-border/30">
                <span className="text-muted-foreground">Разом нанесення</span>
                <span>+{printCostPerUnit.toFixed(0)} ₴/шт</span>
              </div>
            )}
          </div>
        )}
        <div className="border-t border-border/60 pt-2 flex items-baseline justify-between font-bold text-lg">
          <span>Разом</span>
          <div className="flex items-baseline gap-1.5 ml-auto">
            <AnimatedNumber value={total} decimals={0} className="text-primary" />
            <span className="text-base">₴</span>
          </div>
        </div>
      </div>

      {/* Disclaimer — right below total */}
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-2.5">
        <p className="text-xs text-amber-900">
          <span className="font-semibold">Важливо:</span> Ціни є орієнтовними. Остаточна вартість може змінитися після обговорення з менеджером.
        </p>
      </div>

      {/* Item note — collapsible accordion with smooth animation */}
      <div className="rounded-xl border border-border overflow-hidden">
        <button
          type="button"
          onClick={() => setNoteOpen((v) => !v)}
          disabled={disabled}
          className="w-full flex items-center justify-between px-3 py-2.5 text-left hover:bg-muted/40 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Нотатка до позиції</span>
          {noteOpen ? <Minus className="size-3.5 text-muted-foreground shrink-0" /> : <Plus className="size-3.5 text-muted-foreground shrink-0" />}
        </button>
        <AnimatePresence initial={false}>
          {noteOpen && (
            <motion.div
              key="note"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.22, ease: "easeInOut" }}
              style={{ overflow: "hidden" }}
            >
              <div className="px-3 pb-3">
                <textarea
                  value={itemNote}
                  onChange={(e) => setItemNote(e.target.value)}
                  disabled={disabled}
                  placeholder="Особливі побажання..."
                  rows={2}
                  className="w-full resize-none rounded-lg border border-border bg-muted/30 px-3 py-2 text-xs outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors placeholder:text-muted-foreground disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Add to cart button */}
      {onAddToCart && (
        <>
          {addDisabledReason && (
            <p className="text-xs text-amber-600">{addDisabledReason}</p>
          )}
          <Button
            className="w-full h-11 text-sm font-semibold cursor-pointer"
            disabled={loading || addDisabled}
            onClick={onAddToCart}
          >
            {loading
              ? <><Loader2 className="size-3.5 animate-spin" /> Додаємо...</>
              : "Додати до замовлення"}
          </Button>
        </>
      )}
    </div>
  );
}
