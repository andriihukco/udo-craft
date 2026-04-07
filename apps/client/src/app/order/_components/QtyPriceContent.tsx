"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { AnimatedNumber } from "@/components/AnimatedNumber";
import { Loader2 } from "lucide-react";
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

      {/* Discount grid */}
      {(() => {
        const grid = product.discount_grid;
        if (!grid?.length) return null;
        const sorted = [...grid].sort((a, b) => a.qty - b.qty);
        return (
          <div className="grid grid-cols-3 gap-1.5">
            {sorted.map((tier, i) => {
              const nextQty = sorted[i + 1]?.qty;
              const active = quantity >= tier.qty && (nextQty === undefined || quantity < nextQty);
              return (
                <button
                  key={tier.qty}
                  onClick={() => { setQuantity(tier.qty); setQtyStr(String(tier.qty)); }}
                  disabled={disabled}
                  className={`cursor-pointer text-center px-1 py-2 rounded-xl border text-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed ${active ? "border-primary bg-primary/10 text-primary font-semibold" : "border-border text-muted-foreground hover:border-primary/30"}`}
                >
                  <div className="font-bold">від {tier.qty}</div>
                  <div className="opacity-80 text-[10px]">−{tier.discount_pct}%</div>
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
                    {row?.size_min_cm && row?.size_max_cm ? ` (${row.size_min_cm}–${row.size_max_cm} см)` : ""}
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
        <div className="border-t border-border/60 pt-2 flex justify-between font-bold text-lg">
          <span>Разом</span>
          <AnimatedNumber value={total} decimals={0} className="text-primary" />
          <span>₴</span>
        </div>
      </div>

      {/* Item note */}
      <div className="space-y-1.5">
        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Нотатка до позиції</p>
        <textarea
          value={itemNote}
          onChange={(e) => setItemNote(e.target.value)}
          disabled={disabled}
          placeholder="Особливі побажання..."
          rows={2}
          className="w-full resize-none rounded-xl border border-border bg-muted/30 px-3 py-2 text-xs outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors placeholder:text-muted-foreground disabled:opacity-50 disabled:cursor-not-allowed"
        />
      </div>

      {/* Add to cart button */}
      {onAddToCart && (
        <>
          {addDisabledReason && (
            <p className="text-xs text-amber-600">{addDisabledReason}</p>
          )}
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-2.5">
            <p className="text-xs text-amber-900">
              <span className="font-semibold">Важливо:</span> Ціни є орієнтовними. Остаточна вартість може змінитися після обговорення з менеджером.
            </p>
          </div>
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
