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
    <div className="flex flex-col h-full bg-background/30 backdrop-blur-2xl border-l border-border/40 selection:bg-primary/10">
      {/* Header */}
      <div className="h-16 px-6 border-b border-border/40 flex items-center justify-between shrink-0 glass-morphic">
        <div className="flex items-center gap-3">
          <div className="size-9 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/5 shadow-sm">
            <ShoppingCart className="size-4.5 text-primary" />
          </div>
          <span className="font-black text-[11px] uppercase tracking-[0.2em] text-foreground/80">Кошик</span>
        </div>
        <Badge variant="outline" className="font-black text-[10px] h-6 px-3 bg-muted/20 border-border/40 text-muted-foreground">
          {cart.length}
        </Badge>
      </div>

      {/* Cart Items List */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
        {cart.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-5 text-center py-20 animate-in fade-in zoom-in-95 duration-700">
            <div className="size-24 rounded-3xl bg-muted/10 flex items-center justify-center border border-border/20 shadow-inner">
              <ShoppingCart className="size-10 text-muted-foreground/10" />
            </div>
            <div className="space-y-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-foreground/40">Кошик порожній</p>
              <p className="text-[11px] text-muted-foreground/50 max-w-[180px] font-medium leading-relaxed">Додайте товари з каталогу, щоб почати оформлення</p>
            </div>
          </div>
        ) : (
          cart.map((item, i) => {
            const prod = products.find((p) => p.id === item.productId);
            return (
              <div key={i} className="group relative rounded-3xl border border-border/40 bg-background/50 overflow-hidden hover:border-primary/20 hover:shadow-premium transition-all duration-300 animate-in slide-in-from-right-8" style={{ animationDelay: `${i * 100}ms` }}>
                {/* Product Image/Mockup */}
                <div className="relative aspect-square bg-white/[0.03] p-6 flex items-center justify-center overflow-hidden border-b border-border/20">
                  <MockupViewer
                    images={item.mockupsMap}
                    frontUrl={item.mockupDataUrl}
                    backUrl={item.mockupBackDataUrl}
                    fallbackUrl={item.productImage}
                    alt={item.productName}
                    size="lg"
                    className="w-full h-full object-contain drop-shadow-2xl transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute top-4 left-4 flex gap-1.5">
                    <Badge variant="glass" className="h-6 px-2.5 text-[9px] font-black uppercase tracking-wider">{item.size}</Badge>
                    <Badge variant="glass" className="h-6 px-2.5 text-[9px] font-black uppercase tracking-wider">{item.color}</Badge>
                  </div>
                  <button
                    onClick={() => onRemove(i)}
                    className="absolute top-4 right-4 size-9 rounded-2xl bg-white/60 backdrop-blur-md border border-white/40 flex items-center justify-center text-muted-foreground hover:bg-destructive hover:text-white hover:border-destructive transition-all opacity-0 group-hover:opacity-100 shadow-sm active:scale-90"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>

                {/* Info & Price */}
                <div className="p-5 space-y-4">
                  <div className="space-y-1.5">
                    <p className="text-sm font-black tracking-tight line-clamp-2 text-foreground/90 group-hover:text-primary transition-colors">
                      {item.productName}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black text-primary/60 bg-primary/5 px-2 py-0.5 rounded-full border border-primary/10">{item.quantity} шт</span>
                      <span className="text-[10px] font-bold text-muted-foreground/40">×</span>
                      <span className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest">{((item.unitPriceCents + item.printCostCents) / 100).toFixed(0)} ₴</span>
                    </div>
                  </div>

                  {item.layers && item.layers.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {item.layers.map((layer, li) => (
                        <Badge key={li} variant="info" className="text-[8px] font-black h-5 px-2 border-primary/5 bg-primary/[0.03]">
                          {layer.side}
                        </Badge>
                      ))}
                    </div>
                  )}

                  <div className="pt-4 border-t border-border/40 flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/30">Підсумок</span>
                    <span className="text-lg font-black text-primary tracking-tight">
                      ₴{((item.unitPriceCents + item.printCostCents) * item.quantity / 100).toFixed(0)}
                    </span>
                  </div>

                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => { if (!prod) return; onEdit(i); }}
                    className="w-full h-11 rounded-2xl text-[10px] font-black uppercase tracking-[0.15em] border-border/60 hover:border-primary/30 hover:text-primary hover:bg-primary/[0.02] transition-all"
                  >
                    Налаштувати
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer / Summary */}
      <div className="p-8 border-t border-border/40 bg-background/60 backdrop-blur-2xl space-y-6">
        <div className="flex items-end justify-between px-1">
          <div className="space-y-1.5">
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/40">Загальна сума</span>
            <p className="text-3xl font-black text-foreground tracking-tighter">₴{(totalCents / 100).toFixed(0)}</p>
          </div>
          <Badge variant="outline" className="h-7 px-3 font-black text-[10px] uppercase tracking-wider border-border/60 text-muted-foreground">
            {cart.length} позицій
          </Badge>
        </div>
        
        <Button 
          className="w-full h-15 rounded-3xl font-black uppercase tracking-[0.2em] text-[10px] shadow-2xl shadow-primary/30 transition-all active:scale-[0.98] gap-3"
          onClick={onCheckout}
          disabled={cart.length === 0}
        >
          <span>Перейти до оплати</span>
          <ShoppingCart className="size-4" />
        </Button>
      </div>
    </div>
  );
}


// ── Mobile cart drawer — see MobileAdminCart.tsx ─────────────────────────
