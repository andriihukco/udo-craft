"use client";

import React, { useState } from "react";
import { Check, ChevronDown, ChevronUp } from "lucide-react";
import { Material, ProductColorVariant, Product } from "@udo-craft/shared";

interface ProductWithConfig extends Product {
  size_chart_id?: string | null;
  discount_grid?: { qty: number; discount_pct: number }[];
}

export interface ProductInfoBarProps {
  product: ProductWithConfig;
  unitPrice: number;
  variants: ProductColorVariant[];
  materials: Material[];
  selectedVariant: ProductColorVariant | null;
  selectedColor: string;
  selectedSize: string;
  onColorChange: (color: string, variant: ProductColorVariant) => void;
  onSizeChange: (size: string) => void;
}

export function ProductInfoBar({
  product, unitPrice, variants, materials,
  selectedVariant, selectedColor, selectedSize,
  onColorChange, onSizeChange,
}: ProductInfoBarProps) {
  const [expanded, setExpanded] = useState(false);

  const hasColors = variants.length > 0;
  const hasSizes = Array.isArray(product.available_sizes) && product.available_sizes.length > 0;

  if (!hasColors && !hasSizes) return null;

  return (
    <div className="w-full bg-card border border-border rounded-xl overflow-hidden mb-3">
      {/* Collapsed summary row */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="cursor-pointer w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-muted/40 transition-colors"
        aria-expanded={expanded}
        aria-label="Налаштування товару: колір та розмір"
      >
        <span className="text-xs font-semibold text-foreground truncate flex-1">
          {product.name}
          {selectedColor && <span className="text-muted-foreground font-normal"> · {selectedColor}</span>}
          {selectedSize && <span className="text-muted-foreground font-normal"> · {selectedSize}</span>}
          {!selectedSize && hasSizes && <span className="text-amber-500 font-normal"> · оберіть розмір</span>}
        </span>
        <span className="text-xs text-muted-foreground shrink-0">від {unitPrice.toFixed(0)} ₴</span>
        {expanded
          ? <ChevronUp className="size-3.5 text-muted-foreground shrink-0" />
          : <ChevronDown className="size-3.5 text-muted-foreground shrink-0" />}
      </button>

      {/* Expanded controls */}
      {expanded && (
        <div className="px-3 pb-3 pt-1 space-y-3 border-t border-border">
          {hasColors && (
            <div className="space-y-1.5">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Колір</p>
              <div className="flex gap-2 flex-wrap">
                {variants.map((v) => {
                  const mat = materials.find((m) => m.id === v.material_id);
                  if (!mat) return null;
                  const isSelected = selectedVariant?.id === v.id;
                  const isWhite =
                    mat.hex_code.toLowerCase() === "#ffffff" ||
                    mat.hex_code.toLowerCase() === "#f5f5f5";
                  return (
                    <button
                      key={v.id}
                      onClick={() => onColorChange(mat.name, v)}
                      title={mat.name}
                      aria-label={mat.name}
                      aria-pressed={isSelected}
                      className={`cursor-pointer relative size-8 rounded-full transition-all min-w-[44px] min-h-[44px] flex items-center justify-center ${
                        isSelected
                          ? "ring-2 ring-primary ring-offset-2 scale-110"
                          : "hover:scale-105"
                      } ${isWhite ? "border border-border" : ""}`}
                      style={{ backgroundColor: mat.hex_code }}
                    >
                      {isSelected && (
                        <Check
                          className="size-3"
                          style={{ color: isWhite ? "#1a1a1a" : "#fff" }}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
              {selectedColor && (
                <p className="text-xs text-muted-foreground">{selectedColor}</p>
              )}
            </div>
          )}

          {hasSizes && (
            <div className="space-y-1.5">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Розмір</p>
              <div className="flex gap-1.5 flex-wrap">
                {(product.available_sizes as string[]).map((size) => (
                  <button
                    key={size}
                    onClick={() => onSizeChange(size)}
                    aria-pressed={selectedSize === size}
                    className={`cursor-pointer min-w-[44px] min-h-[44px] px-2 py-1.5 rounded-lg text-sm font-semibold border transition-all ${
                      selectedSize === size
                        ? "bg-foreground text-background border-foreground shadow-sm"
                        : "border-border hover:border-foreground/40 hover:bg-muted/50"
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
