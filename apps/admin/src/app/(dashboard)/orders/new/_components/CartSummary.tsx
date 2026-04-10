"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { MockupViewer } from "@/components/mockup-viewer";
import { Trash2, ShoppingCart } from "lucide-react";
import type { PrintLayer } from "@/components/print-types";
import type { ProductColorVariant, Material, Product } from "@udo-craft/shared";

// ── Types ─────────────────────────────────────────────────────────────────

interface ProductWithConfig extends Product {
  size_chart_id?: string | null;
  discount_grid?: { qty: number; discount_pct: number }[];
}

export interface CartItem {
  productId: string;
  productName: string;
  productImage: string;
  productPrice: number;
  unitPriceCents: number;
  printCostCents: number;
  quantity: number;
  size: string;
  color: string;
  itemNote?: string;
  layers?: PrintLayer[];
  mockupDataUrl?: string;
  mockupUploadedUrl?: string;
  mockupBackDataUrl?: string;
  mockupsMap?: Record<string, string>;
  offsetTopMm?: number;
}

const KEY_LABELS: Record<string, string> = {
  front: "Перед",
  back: "Зад",
  left: "Ліво",
  right: "Право",
};

// ── Desktop cart side panel ───────────────────────────────────────────────

interface DesktopCartPanelProps {
  cart: CartItem[];
  totalCents: number;
  products: ProductWithConfig[];
  variants: ProductColorVariant[];
  materials: Material[];
  onEdit: (i: number) => void;
  onRemove: (i: number) => void;
  onCheckout: () => void;
}

export function DesktopCartPanel({
  cart,
  totalCents,
  products,
  variants,
  materials,
  onEdit,
  onRemove,
  onCheckout,
}: DesktopCartPanelProps) {
  return (
    <div className="hidden lg:flex fixed top-0 right-0 bottom-0 z-40 w-80 border-l border-border bg-card flex-col shadow-xl">
      <div className="h-12 px-4 border-b border-border flex items-center justify-between shrink-0">
        <span className="font-semibold text-sm">Кошик ({cart.length})</span>
        <span className="text-xs text-muted-foreground">{(totalCents / 100).toFixed(0)} ₴</span>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {cart.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground py-12">
            <ShoppingCart className="size-10 opacity-30" />
            <p className="text-sm">Кошик порожній</p>
          </div>
        )}
        {cart.map((item, i) => {
          const prod = products.find((p) => p.id === item.productId);
          const prodVariants = variants.filter((v) => v.product_id === item.productId);
          const itemVariant =
            prodVariants.find((v) => {
              const mat = materials.find((m) => m.id === v.material_id);
              return mat?.name === item.color;
            }) ?? null;
          void itemVariant; // used by parent via onEdit callback
          return (
            <div key={i} className="rounded-xl border border-border bg-white overflow-hidden">
              <div className="relative bg-white aspect-square">
                <MockupViewer
                  images={item.mockupsMap}
                  frontUrl={item.mockupDataUrl}
                  backUrl={item.mockupBackDataUrl}
                  fallbackUrl={item.productImage}
                  alt={item.productName}
                  size="lg"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-2.5 space-y-1.5">
                <p className="text-xs font-semibold">{item.productName}</p>
                <p className="text-xs text-muted-foreground">
                  {item.quantity} шт. · {item.size} · {item.color}
                </p>
                {item.layers && item.layers.length > 0 && (
                  <div className="space-y-0.5 pt-0.5">
                    {item.layers.map((layer, li) => (
                      <p key={li} className="text-[10px] text-muted-foreground flex justify-between">
                        <span className="capitalize">
                          {layer.type}
                          {layer.sizeLabel ? ` · ${layer.sizeLabel}` : ""} ({layer.side})
                        </span>
                        <span>
                          {layer.priceCents != null
                            ? `+${(layer.priceCents / 100).toFixed(0)} ₴/шт`
                            : "—"}
                        </span>
                      </p>
                    ))}
                  </div>
                )}
                <div className="pt-0.5 space-y-0.5 border-t border-border/50">
                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span>Товар × {item.quantity}</span>
                    <span>{(item.unitPriceCents * item.quantity / 100).toFixed(0)} ₴</span>
                  </div>
                  {item.printCostCents > 0 && (
                    <div className="flex justify-between text-[10px] text-muted-foreground">
                      <span>Нанесення × {item.quantity}</span>
                      <span>+{(item.printCostCents * item.quantity / 100).toFixed(0)} ₴</span>
                    </div>
                  )}
                  <div className="flex justify-between text-xs font-semibold text-primary">
                    <span>Разом</span>
                    <span>
                      {((item.unitPriceCents + item.printCostCents) * item.quantity / 100).toFixed(0)} ₴
                    </span>
                  </div>
                </div>
                <div className="flex gap-1.5 pt-1">
                  <button
                    aria-label={`Редагувати ${item.productName}`}
                    onClick={() => { if (!prod) return; onEdit(i); }}
                    className="flex-1 cursor-pointer text-[10px] font-medium border border-border rounded-xl py-1 hover:bg-muted transition-colors text-center"
                  >
                    Редагувати
                  </button>
                  <button
                    aria-label={`Видалити ${item.productName}`}
                    onClick={() => onRemove(i)}
                    className="cursor-pointer size-6 rounded-full border border-border hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-colors text-muted-foreground flex items-center justify-center"
                  >
                    <Trash2 className="size-3" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="p-3 border-t border-border shrink-0 space-y-2">
        <div className="flex justify-between text-sm font-bold">
          <span>Разом</span>
          <span>{(totalCents / 100).toFixed(0)} ₴</span>
        </div>
        <Button className="w-full cursor-pointer" onClick={onCheckout}>
          Оформити →
        </Button>
      </div>
    </div>
  );
}

// ── Mobile cart drawer — see MobileAdminCart.tsx ─────────────────────────
