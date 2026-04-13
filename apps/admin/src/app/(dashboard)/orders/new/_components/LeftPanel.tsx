"use client";

import React from "react";
import { Product, Material, ProductColorVariant } from "@udo-craft/shared";
import LayersPanel from "@/components/layers-panel";
import { ArrowLeft, Check } from "lucide-react";
import { type PrintLayer } from "@/components/print-types";

interface PrintTypePricingRow {
  id: string;
  print_type: string;
  size_label: string;
  size_min_cm: number;
  size_max_cm: number;
  qty_tiers: { min_qty: number; price_cents: number }[];
}

interface ProductWithConfig extends Product {
  size_chart_id?: string | null;
  discount_grid?: { qty: number; discount_pct: number }[];
}

export interface LeftPanelProps {
  product: ProductWithConfig;
  unitPrice: number;
  variants: ProductColorVariant[];
  materials: Material[];
  selectedVariant: ProductColorVariant | null;
  selectedColor: string;
  selectedSize: string;
  onColorChange: (color: string, variant: ProductColorVariant) => void;
  onSizeChange: (size: string) => void;
  layers: PrintLayer[];
  activeSide: string;
  activeLayerId: string | null;
  printPricing: PrintTypePricingRow[];
  quantity: number;
  layerScales: Record<string, number>;
  fileInputRef: React.RefObject<HTMLInputElement>;
  onLayerSelect: (id: string | null) => void;
  onLayerDelete: (id: string) => void;
  onLayerDuplicate: (id: string) => void;
  onRemoveBg: (id: string, newUrl: string) => void;
  onTypeChange: (id: string, type: string) => void;
  onSizeLabelChange: (id: string, sizeLabel: string) => void;
  onReorder: (layers: PrintLayer[] | ((prev: PrintLayer[]) => PrintLayer[])) => void;
  onAddClick: () => void;
  onAddText: () => void;
  onTextChange: (id: string, patch: Partial<Pick<PrintLayer, "textContent" | "textFont" | "textColor" | "textFontSize" | "textAlign" | "textCurve">>) => void;
  onFileChange: (file: File) => void;
  onClose: () => void;
}

export function LeftPanel({
  product, unitPrice, variants, materials, selectedVariant, selectedColor, selectedSize,
  onColorChange, onSizeChange, layers, activeSide, activeLayerId, printPricing, quantity,
  layerScales, fileInputRef, onLayerSelect, onLayerDelete, onLayerDuplicate, onRemoveBg,
  onTypeChange, onSizeLabelChange, onReorder, onAddClick, onAddText, onTextChange,
  onFileChange, onClose,
}: LeftPanelProps) {
  return (
    <div className="space-y-5">
      <div>
        <button onClick={() => { if (!confirm("Повернутися? Незбережені зміни буде втрачено.")) return; onClose(); }}
          className="cursor-pointer flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-3">
          <ArrowLeft className="size-3.5" /> Назад
        </button>
        <p className="text-sm font-bold leading-tight">{product.name}</p>
        <p className="text-xs text-muted-foreground mt-0.5">від {unitPrice.toFixed(0)} ₴ / шт</p>
      </div>

      <div className="space-y-2">
        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Колір</p>
        {variants.length > 0 ? (
          <div className="flex gap-2 flex-wrap">
            {variants.map((v) => {
              const mat = materials.find((m) => m.id === v.material_id);
              if (!mat) return null;
              const isSelected = selectedVariant?.id === v.id;
              const isWhite = mat.hex_code.toLowerCase() === "#ffffff" || mat.hex_code.toLowerCase() === "#f5f5f5";
              return (
                <button key={v.id} onClick={() => onColorChange(mat.name, v)} title={mat.name}
                  className={`cursor-pointer relative size-8 rounded-full transition-all ${isSelected ? "ring-2 ring-primary ring-offset-2 scale-110" : "hover:scale-105"} ${isWhite ? "border border-border" : ""}`}
                  style={{ backgroundColor: mat.hex_code }}>
                  {isSelected && <Check className="absolute inset-0 m-auto size-3" style={{ color: isWhite ? "#1a1a1a" : "#fff" }} />}
                </button>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">Кольори не налаштовані</p>
        )}
        {selectedColor && <p className="text-xs text-muted-foreground">{selectedColor}</p>}
      </div>

      <div className="space-y-2">
        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Розмір</p>
        <div className="flex gap-1.5 flex-wrap">
          {(Array.isArray(product.available_sizes) && product.available_sizes.length > 0
            ? (product.available_sizes as string[]) : []
          ).map((size) => (
            <button key={size} onClick={() => onSizeChange(size)}
              className={`cursor-pointer min-w-[38px] px-2 py-1.5 rounded-lg text-sm font-semibold border transition-all ${selectedSize === size ? "bg-foreground text-background border-foreground shadow-sm" : "border-border hover:border-foreground/40 hover:bg-muted/50"}`}>
              {size}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Нанесення</p>
        <LayersPanel
          layers={layers} activeSide={activeSide} activeLayerId={activeLayerId}
          onSelect={onLayerSelect}
          onDelete={onLayerDelete} onDuplicate={onLayerDuplicate}
          onTypeChange={onTypeChange} onSizeLabelChange={onSizeLabelChange}
          onReorder={onReorder} onAddClick={onAddClick} onAddText={onAddText}
          onTextChange={onTextChange} fileInputRef={fileInputRef} onFileChange={onFileChange}
          pricing={printPricing} quantity={quantity} layerScales={layerScales}
          pxToMmRatio={product.px_to_mm_ratio || 0}
        />
      </div>
    </div>
  );
}
