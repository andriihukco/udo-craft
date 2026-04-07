"use client";

import React, { useState } from "react";
import { Product, Material, ProductColorVariant } from "@udo-craft/shared";

interface ProductWithConfig extends Product {
  size_chart_id?: string | null;
  discount_grid?: { qty: number; discount_pct: number }[];
}

interface ProductCardInlineProps {
  product: ProductWithConfig;
  variants: ProductColorVariant[];
  materials: Material[];
  onOpen: (variant: ProductColorVariant | null, size?: string | null) => void;
  onAddWithoutPrint: (variant: ProductColorVariant | null, size?: string | null) => void;
}

export function ProductCardInline({ product, variants, materials, onOpen, onAddWithoutPrint }: ProductCardInlineProps) {
  const [activeVariantId, setActiveVariantId] = useState<string | null>(variants[0]?.id ?? null);
  const [hoveredVariantId, setHoveredVariantId] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);

  const displayVariantId = hoveredVariantId ?? activeVariantId;
  const activeVariant = variants.find((v) => v.id === displayVariantId) ?? null;

  const imgs = (activeVariant?.images && Object.keys(activeVariant.images).length > 0
    ? activeVariant.images : product.images) as Record<string, string> ?? {};
  const imgUrl = imgs.front ?? Object.values(imgs)[0] ?? "";

  const sizes = (product.available_sizes as string[]) ?? [];
  const actionsVisible = sizes.length === 0 || selectedSize !== null;

  const resolveSize = () => selectedSize ?? (sizes.length ? sizes[Math.floor(sizes.length / 2)] : null);

  const handleCardClick = () => {
    const size = resolveSize();
    if (size && !selectedSize) setSelectedSize(size);
    onOpen(activeVariant, size);
  };

  return (
    <div onClick={handleCardClick} className="bg-[#f5f5f5] rounded-2xl overflow-hidden flex flex-col cursor-pointer">
      <div className="pt-3 pb-3 px-3 sm:pt-4 sm:pb-4 sm:px-4 flex items-center justify-center aspect-square">
        {imgUrl
          ? <img src={imgUrl} alt={product.name} className="w-full h-full object-contain" />
          : <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">Немає фото</div>
        }
      </div>
      <div className="px-3 pb-3 flex flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-semibold leading-tight line-clamp-2">{product.name}</p>
          <p className="text-sm font-bold text-primary shrink-0">від &#8372;{(product.base_price_cents / 100).toFixed(0)}</p>
        </div>
        <div className="flex items-center justify-between gap-2 min-h-[28px]">
          {sizes.length > 0 && (
            <div className="flex items-center gap-1 flex-wrap">
              {sizes.map((size) => (
                <button key={size} type="button"
                  onClick={(e) => { e.stopPropagation(); setSelectedSize(selectedSize === size ? null : size); }}
                  className={`min-w-[32px] text-[11px] font-semibold px-2 py-1.5 rounded-lg border transition-all duration-150 touch-manipulation ${selectedSize === size ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"}`}>
                  {size}
                </button>
              ))}
            </div>
          )}
          {variants.length > 0 && (
            <div className="flex items-center gap-1 shrink-0 ml-auto">
              {variants.slice(0, 6).map((v) => {
                const mat = materials.find((m) => m.id === v.material_id);
                if (!mat) return null;
                const isWhite = mat.hex_code.toLowerCase() === "#ffffff" || mat.hex_code.toLowerCase() === "#f5f5f5";
                const isActive = displayVariantId === v.id;
                return (
                  <button key={v.id} type="button" title={mat.name}
                    onClick={(e) => { e.stopPropagation(); setActiveVariantId(v.id); }}
                    onMouseEnter={() => setHoveredVariantId(v.id)}
                    onMouseLeave={() => setHoveredVariantId(null)}
                    className={`w-6 h-6 rounded-full shrink-0 touch-manipulation transition-all ${isWhite ? "ring-1 ring-gray-300" : ""} ${isActive ? "ring-2 ring-offset-1 ring-gray-900 scale-110" : ""}`}
                    style={{ backgroundColor: mat.hex_code }}
                  />
                );
              })}
              {variants.length > 6 && <span className="text-[10px] text-muted-foreground">+{variants.length - 6}</span>}
            </div>
          )}
        </div>
        <div className={`grid gap-2 overflow-hidden transition-all duration-200 ease-out ${actionsVisible ? "max-h-28 opacity-100 mt-1" : "max-h-0 opacity-0 pointer-events-none"}`}>
          <button type="button"
            onClick={(e) => { e.stopPropagation(); onOpen(activeVariant, resolveSize()); }}
            className="w-full py-2.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary/90 active:scale-[0.98] transition-all duration-150 touch-manipulation">
            Додати принт
          </button>
          <button type="button"
            onClick={(e) => { e.stopPropagation(); onAddWithoutPrint(activeVariant, resolveSize()); }}
            className="w-full py-2.5 rounded-xl border border-gray-300 bg-white text-gray-900 text-xs font-bold hover:border-gray-400 hover:bg-gray-50 active:scale-[0.98] transition-all duration-150 touch-manipulation">
            Додати без принта
          </button>
        </div>
      </div>
    </div>
  );
}
