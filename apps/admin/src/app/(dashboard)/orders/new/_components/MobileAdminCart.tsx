"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Trash2, ShoppingCart, ChevronRight, X } from "lucide-react";
import type { CartItem } from "./CartSummary";

const KEY_LABELS: Record<string, string> = { front: "Перед", back: "Зад", left: "Ліво", right: "Право" };

interface MobileAdminCartProps {
  cart: CartItem[];
  totalCents: number;
  onEdit: (i: number) => void;
  onRemove: (i: number) => void;
  onCheckout: () => void;
}

export function MobileAdminCart({ cart, totalCents, onEdit, onRemove, onCheckout }: MobileAdminCartProps) {
  const [open, setOpen] = useState(false);
  if (cart.length === 0) return null;

  return (
    <>
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-card border-t border-border px-4 pb-5 pt-3 shadow-[0_-4px_24px_rgba(0,0,0,0.08)]">
        <button onClick={() => setOpen(true)}
          className="w-full flex items-center gap-3 bg-primary text-primary-foreground rounded-xl px-4 py-3 active:scale-[0.98] transition-transform">
          <div className="relative shrink-0">
            <ShoppingCart className="size-4" />
            <span className="absolute -top-2 -right-2 bg-white text-primary text-[9px] font-black rounded-full w-4 h-4 flex items-center justify-center">{cart.length}</span>
          </div>
          <span className="flex-1 text-left text-sm font-semibold">Кошик · {cart.length} {cart.length === 1 ? "товар" : "товари"}</span>
          <span className="text-sm font-bold">{(totalCents / 100).toFixed(0)} ₴</span>
          <ChevronRight className="size-4 opacity-70 shrink-0" />
        </button>
      </div>

      {open && (
        <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <div className="relative bg-card rounded-t-2xl flex flex-col max-h-[85vh] shadow-2xl">
            <div className="flex justify-center pt-3 pb-1 shrink-0"><div className="w-10 h-1 rounded-full bg-border" /></div>
            <div className="flex items-center justify-between px-4 py-2 shrink-0 border-b border-border">
              <span className="font-semibold text-sm">Кошик ({cart.length})</span>
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground">{(totalCents / 100).toFixed(0)} ₴</span>
                <button onClick={() => setOpen(false)} className="size-7 flex items-center justify-center rounded-full bg-muted hover:bg-muted/80 transition-colors">
                  <X className="size-3.5" />
                </button>
              </div>
            </div>
            <div className="overflow-y-auto flex-1 p-3 space-y-2">
              {cart.map((item, i) => {
                const lineTotal = (item.unitPriceCents + item.printCostCents) * item.quantity / 100;
                const mockupKeys = item.mockupsMap ? Object.keys(item.mockupsMap).filter((k) => item.mockupsMap![k]) : [];
                return (
                  <div key={i} className="bg-muted/40 rounded-xl overflow-hidden">
                    {mockupKeys.length > 0 ? (
                      <div className={`grid gap-1 p-2 ${mockupKeys.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
                        {mockupKeys.map((key) => (
                          <div key={key} className="relative bg-white rounded-lg overflow-hidden aspect-square border border-border/40">
                            <img src={item.mockupsMap![key]} alt={key} className="w-full h-full object-contain p-1" />
                            <span className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[10px] font-semibold bg-black/50 text-white px-2 py-0.5 rounded-full whitespace-nowrap">
                              {KEY_LABELS[key] ?? key}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (item.mockupDataUrl || item.productImage) ? (
                      <div className="p-2">
                        <div className="bg-white rounded-lg overflow-hidden aspect-square border border-border/40">
                          <img src={item.mockupDataUrl || item.productImage} alt={item.productName} className="w-full h-full object-contain p-1" />
                        </div>
                      </div>
                    ) : null}
                    <div className="flex items-center gap-3 px-3 pb-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">{item.productName}</p>
                        <p className="text-xs text-muted-foreground">{item.quantity} шт. · {item.size} · {item.color}</p>
                        <p className="text-sm font-bold text-primary">{lineTotal.toFixed(0)} ₴</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button onClick={() => { setOpen(false); onEdit(i); }}
                          className="h-9 px-3 rounded-xl text-xs font-semibold border border-border bg-background hover:bg-muted transition-colors">
                          Редагувати
                        </button>
                        <button onClick={() => onRemove(i)}
                          className="size-9 rounded-full border border-border hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-colors text-muted-foreground flex items-center justify-center">
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="shrink-0 p-4 border-t border-border space-y-3 pb-6">
              <div className="flex justify-between font-bold text-sm"><span>Разом</span><span>{(totalCents / 100).toFixed(0)} ₴</span></div>
              <Button className="w-full" onClick={() => { setOpen(false); onCheckout(); }}>Оформити →</Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
