"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { FileDown, Loader2 } from "lucide-react";
import type { CartItem } from "./CartSummary";
import { PREDEFINED_TAGS, DELIVERY_OPTIONS, getDiscount } from "../_lib/constants";

const KEY_LABELS: Record<string, string> = { front: "Перед", back: "Зад", left: "Ліво", right: "Право" };

interface ContactData {
  name: string; email: string; phone: string; company: string; edrpou: string;
  socialNetwork: string; socialHandle: string; delivery: string;
  novaPoshtaDetails: string; deadline: string; comment: string;
}

interface ReviewStepProps {
  cart: CartItem[];
  totalCents: number;
  contact: ContactData;
  orderTags: string[];
  extraFiles: File[];
  generatingPdf: boolean;
  submitting: boolean;
  onBack: () => void;
  onSubmit: () => void;
  onDownloadInvoice: () => void;
}

export function ReviewStep({ cart, totalCents, contact, orderTags, extraFiles, generatingPdf, submitting, onBack, onSubmit, onDownloadInvoice }: ReviewStepProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Перевірте замовлення</h2>
      <div className="bg-card rounded-xl border border-border p-6 space-y-5">
        <div>
          <h3 className="font-bold mb-3">Товари ({cart.length})</h3>
          <div className="space-y-2">
            {cart.map((item, i) => {
              const disc = getDiscount(item.quantity) / 100;
              const lineTotal = (item.unitPriceCents + item.printCostCents) * item.quantity / 100;
              const mockupKeys = item.mockupsMap ? Object.keys(item.mockupsMap).filter((k) => item.mockupsMap![k]) : [];
              return (
                <div key={i} className="bg-muted/30 rounded-xl overflow-hidden">
                  {mockupKeys.length > 0 ? (
                    <div className={`grid gap-1.5 p-2 ${mockupKeys.length === 1 ? "grid-cols-1 max-w-[160px]" : "grid-cols-2"}`}>
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
                    <div className="p-2 max-w-[160px]">
                      <div className="bg-white rounded-lg overflow-hidden aspect-square border border-border/40">
                        <img src={item.mockupDataUrl || item.productImage} alt={item.productName} className="w-full h-full object-contain p-1" />
                      </div>
                    </div>
                  ) : null}
                  <div className="flex gap-3 px-3 pb-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold">{item.productName}</p>
                      <p className="text-xs text-muted-foreground">{item.quantity} шт. · {item.size} · {item.color}</p>
                      {item.layers && item.layers.length > 0 && (
                        <div className="mt-1 space-y-0.5">
                          {item.layers.map((layer, li) => (
                            <p key={li} className="text-[10px] text-muted-foreground">
                              {layer.type}{layer.sizeLabel ? ` · ${layer.sizeLabel}` : ""} ({layer.side}) ·{" "}
                              {layer.priceCents != null ? `+${(layer.priceCents / 100).toFixed(0)} ₴/шт` : "ціна не вказана"}
                            </p>
                          ))}
                        </div>
                      )}
                      {disc > 0 && <p className="text-[10px] text-emerald-600 mt-0.5">−{getDiscount(item.quantity)}% знижка</p>}
                      {item.itemNote && <p className="text-[10px] text-muted-foreground italic mt-0.5">&ldquo;{item.itemNote}&rdquo;</p>}
                    </div>
                    <p className="text-sm font-bold shrink-0">{lineTotal.toFixed(0)} ₴</p>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex justify-between font-bold text-base mt-3 pt-3 border-t border-border">
            <span>Разом</span><span>{(totalCents / 100).toFixed(0)} ₴</span>
          </div>
          <div className="pt-4">
            <button onClick={onDownloadInvoice} disabled={generatingPdf}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-primary text-primary font-semibold rounded-full hover:bg-primary/5 transition-colors text-sm disabled:opacity-50">
              <FileDown className="w-4 h-4" />
              {generatingPdf ? "Генеруємо PDF..." : "Завантажити рахунок-фактуру (PDF)"}
            </button>
          </div>
        </div>

        <div className="border-t border-border pt-4 space-y-4">
          <h3 className="font-bold">Контакти</h3>
          <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
            {[
              { label: "Ім'я", value: contact.name },
              { label: "Телефон", value: contact.phone },
              { label: "Email", value: contact.email || "—" },
              { label: "Компанія", value: contact.company || "—" },
              { label: "ЄДРПОУ", value: contact.edrpou || "—" },
              { label: "Соцмережа", value: contact.socialHandle ? `${contact.socialNetwork}: ${contact.socialHandle}` : "—" },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-[11px] text-muted-foreground uppercase tracking-wide font-medium">{label}</p>
                <p className="font-medium text-foreground mt-0.5">{value}</p>
              </div>
            ))}
          </div>
          <div className="border-t border-border pt-3 space-y-2">
            <h4 className="text-[11px] text-muted-foreground uppercase tracking-wide font-medium">Доставка</h4>
            <p className="text-sm font-medium">{DELIVERY_OPTIONS.find((o) => o.id === contact.delivery)?.label ?? "—"}</p>
            {contact.novaPoshtaDetails && <p className="text-sm text-muted-foreground">{contact.novaPoshtaDetails}</p>}
          </div>
          {(contact.deadline || contact.comment) && (
            <div className="border-t border-border pt-3 grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
              {contact.deadline && (
                <div>
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wide font-medium">Дедлайн</p>
                  <p className="font-medium mt-0.5">{new Date(contact.deadline).toLocaleDateString("uk-UA")}</p>
                </div>
              )}
              {contact.comment && (
                <div className="col-span-2">
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wide font-medium">Коментар</p>
                  <p className="text-sm mt-0.5">{contact.comment}</p>
                </div>
              )}
            </div>
          )}
          {extraFiles.length > 0 && (
            <div className="border-t border-border pt-3">
              <p className="text-[11px] text-muted-foreground uppercase tracking-wide font-medium mb-1.5">Додаткові файли</p>
              <div className="space-y-1">
                {extraFiles.map((f, i) => <p key={i} className="text-xs text-muted-foreground truncate">📎 {f.name}</p>)}
              </div>
            </div>
          )}
          {orderTags.length > 0 && (
            <div className="border-t border-border pt-3">
              <p className="text-[11px] text-muted-foreground uppercase tracking-wide font-medium mb-1.5">Теги</p>
              <div className="flex flex-wrap gap-1.5">
                {orderTags.map((tagId) => {
                  const pre = PREDEFINED_TAGS.find((t) => t.id === tagId);
                  return pre ? (
                    <span key={tagId} className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-0.5 rounded-full border"
                      style={{ color: pre.color, backgroundColor: pre.bg, borderColor: `${pre.color}40` }}>
                      <span className="size-1.5 rounded-full" style={{ backgroundColor: pre.color }} />{pre.label}
                    </span>
                  ) : (
                    <span key={tagId} className="inline-flex items-center text-xs font-medium px-2.5 py-0.5 rounded-full border border-border bg-muted/50 text-foreground">{tagId}</span>
                  );
                })}
              </div>
            </div>
          )}
        </div>
        <div className="h-16" />
      </div>

      {/* Sticky bottom nav — matches client */}
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card px-4 py-3 flex gap-2">
        <Button variant="outline" className="flex-1" onClick={onBack}>Редагувати</Button>
        <Button className="flex-1 gap-1.5" onClick={onSubmit} disabled={submitting}>
          {submitting ? <><Loader2 className="size-3.5 animate-spin" /> Зберігаємо...</> : "Підтвердити замовлення"}
        </Button>
      </div>
    </div>
  );
}
