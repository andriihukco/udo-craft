"use client";

import React, { useState } from "react";
import { Product, Material, ProductColorVariant, resolveProductImages, getCustomizableImages } from "@udo-craft/shared";

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

const FALLBACK_COLORS = [
  { name: "Чорний",      hex: "#1a1a1a", border: false },
  { name: "Білий",       hex: "#f0f0f0", border: true  },
  { name: "Сірий",       hex: "#9ca3af", border: false },
  { name: "Темно-синій", hex: "#1e3a5f", border: false },
  { name: "Синій",       hex: "#2563eb", border: false },
  { name: "Червоний",    hex: "#dc2626", border: false },
];

function pickMiddleSize(sizes: string[]): string | null {
  if (!sizes.length) return null;
  return sizes[Math.floor(sizes.length / 2)];
}

export function ProductCardInline({ product, variants, materials, onOpen, onAddWithoutPrint }: ProductCardInlineProps) {
  const isOutOfStock = !product.is_active;
  const hasVariants = variants.length > 0;

  const [activeVariantId, setActiveVariantId] = useState<string | null>(variants[0]?.id ?? null);
  const [hoveredVariantId, setHoveredVariantId] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [descExpanded, setDescExpanded] = useState(false);

  const displayVariantId = hoveredVariantId ?? activeVariantId;
  const activeVariant = hasVariants ? variants.find((v) => v.id === displayVariantId) ?? null : null;

  const imgs = (() => {
    const productImgs = resolveProductImages((product as any).product_images, product.images);
    const variantImgs = activeVariant ? resolveProductImages((activeVariant as any).variant_images, activeVariant.images) : null;
    return getCustomizableImages(variantImgs?.length ? variantImgs : productImgs);
  })();
  const imgUrl = imgs.front ?? Object.values(imgs)[0] ?? "";

  const colorDots = hasVariants && materials
    ? variants.map((v) => {
        const mat = materials.find((m) => m.id === v.material_id);
        const hex = mat?.hex_code || "#ccc";
        return { id: v.id, name: mat?.name || "Невідомий", hex, border: hex.toLowerCase() === "#f0f0f0" || hex.toLowerCase() === "#ffffff" };
      })
    : FALLBACK_COLORS.map((c) => ({ id: c.name, name: c.name, hex: c.hex, border: c.border }));

  const sizes = (product.available_sizes as string[]) ?? [];
  const actionsVisible = sizes.length === 0 || selectedSize !== null;

  const resolveSize = () => selectedSize ?? pickMiddleSize(sizes);

  const getActiveColor = () => {
    if (!activeVariantId || !hasVariants) return null;
    return materials?.find((m) => m.id === variants.find((v) => v.id === activeVariantId)?.material_id)?.name ?? null;
  };

  const handleCardClick = () => {
    if (isOutOfStock) return;
    const size = resolveSize();
    if (size && !selectedSize) setSelectedSize(size);
    onOpen(activeVariant, size);
  };

  return (
    <div
      onClick={handleCardClick}
      className={`bg-[#f5f5f5] rounded-2xl overflow-hidden flex flex-col cursor-pointer ${isOutOfStock ? "opacity-60 pointer-events-none" : ""}`}
    >
      {/* Image */}
      <div className="pt-3 pb-3 px-3 sm:pt-4 sm:pb-4 sm:px-4 flex items-center justify-center aspect-square">
        {imgUrl
          ? <img src={imgUrl} alt={product.name} className="w-full h-full object-contain" />
          : (
            <div className="w-full h-full flex items-center justify-center text-gray-300">
              <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )
        }
      </div>

      {/* Bottom */}
      <div className="px-3 pb-3 sm:px-4 sm:pb-4 flex flex-col gap-2">
        {/* Name + price + description */}
        <div className="flex flex-col gap-1">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-semibold text-gray-900 leading-tight line-clamp-2">{product.name}</p>
            <p className="text-sm font-bold text-primary shrink-0">від ₴{(product.base_price_cents / 100).toFixed(0)}</p>
          </div>
          {product.description && (
            <div className="mt-1">
              <p className={`text-xs text-gray-500 ${descExpanded ? "" : "line-clamp-2"}`}>
                {product.description}
              </p>
              {product.description.length > 80 && (
                <button 
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setDescExpanded(!descExpanded); }}
                  className="text-[11px] text-primary font-semibold hover:underline mt-0.5 touch-manipulation cursor-pointer"
                >
                  {descExpanded ? "Згорнути" : "Розгорнути"}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Sizes + Colors — stacked like client */}
        <div className="flex flex-col gap-2 min-h-[28px]">
          {sizes.length > 0 && (
            <div className="flex items-center gap-1 flex-wrap">
              {sizes.map((size) => (
                <button key={size} type="button"
                  onClick={(e) => { e.stopPropagation(); setSelectedSize(selectedSize === size ? null : size); }}
                  className={`min-w-[32px] text-[11px] font-semibold px-2 py-1.5 rounded-lg border transition-all duration-150 touch-manipulation ${
                    selectedSize === size
                      ? "bg-gray-900 text-white border-gray-900"
                      : "bg-white text-gray-600 border-gray-200 hover:border-gray-400 hover:text-gray-900"
                  }`}>
                  {size}
                </button>
              ))}
            </div>
          )}
          <div className="flex items-center gap-1.5 flex-wrap">
            {colorDots.map((c) => (
              <button key={c.id} type="button" title={c.name}
                onClick={(e) => {
                  e.stopPropagation();
                  if (!hasVariants) return;
                  setActiveVariantId(c.id === activeVariantId ? null : c.id);
                }}
                onMouseEnter={() => hasVariants && setHoveredVariantId(c.id)}
                onMouseLeave={() => setHoveredVariantId(null)}
                className={`w-6 h-6 rounded-full shrink-0 touch-manipulation transition-all ${c.border ? "ring-1 ring-gray-300" : ""} ${
                  hasVariants && displayVariantId === c.id ? "ring-2 ring-offset-1 ring-gray-900 scale-110" : ""
                }`}
                style={{ backgroundColor: c.hex }}
              />
            ))}
          </div>
        </div>

        {/* Action buttons */}
        <div className={`grid grid-cols-1 gap-2 overflow-hidden transition-all duration-200 ease-out ${actionsVisible ? "max-h-28 opacity-100 mt-1" : "max-h-0 opacity-0 pointer-events-none"}`}>
          <button type="button"
            onClick={(e) => { e.stopPropagation(); onOpen(activeVariant, resolveSize()); }}
            disabled={isOutOfStock}
            className="w-full py-2.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary/90 active:scale-[0.98] transition-all duration-150 touch-manipulation">
            Додати принт
          </button>
          <button type="button"
            onClick={(e) => { e.stopPropagation(); onAddWithoutPrint(activeVariant, resolveSize()); }}
            disabled={isOutOfStock}
            className="w-full py-2.5 rounded-xl border border-gray-300 bg-white text-gray-900 text-xs font-bold hover:border-gray-400 hover:bg-gray-50 active:scale-[0.98] transition-all duration-150 touch-manipulation">
            Додати без принта
          </button>
        </div>
      </div>
    </div>
  );
}
