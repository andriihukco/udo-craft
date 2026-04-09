"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChevronRight, X, Upload } from "lucide-react";
import type { CartItem } from "./CartSummary";
import { PREDEFINED_TAGS, DELIVERY_OPTIONS } from "../_lib/constants";
import { useCipherText } from "./useCipherText";

export interface ContactData {
  name: string; email: string; phone: string; company: string; edrpou: string;
  socialNetwork: string; socialHandle: string; delivery: string;
  novaPoshtaDetails: string; deadline: string; comment: string;
}

interface CheckoutFormProps {
  contact: ContactData;
  setContact: React.Dispatch<React.SetStateAction<ContactData>>;
  orderTags: string[];
  setOrderTags: React.Dispatch<React.SetStateAction<string[]>>;
  extraFiles: File[];
  setExtraFiles: React.Dispatch<React.SetStateAction<File[]>>;
  cart: CartItem[];
  totalCents: number;
  onReview: () => void;
  onBack: () => void;
}

export function CheckoutForm({
  contact, setContact, orderTags, setOrderTags,
  extraFiles, setExtraFiles, cart: _cart, totalCents: _totalCents,
  onReview, onBack,
}: CheckoutFormProps) {
  const [showExtraDetails, setShowExtraDetails] = useState(false);
  const [highlightRequired, setHighlightRequired] = useState(false);
  const cipherText = useCipherText(true);

  const set = (field: keyof ContactData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setContact((prev) => ({ ...prev, [field]: e.target.value }));

  const toggleTag = (id: string) =>
    setOrderTags((prev) => prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]);

  const canProceed = contact.name.trim() && contact.phone.trim() &&
    (contact.delivery !== "nova_poshta" || contact.novaPoshtaDetails.trim());

  const handleNext = () => {
    if (!canProceed) { setHighlightRequired(true); setTimeout(() => setHighlightRequired(false), 1000); return; }
    onReview();
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Контактні дані</h2>

      <div className="bg-card rounded-xl border border-border p-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label className="text-sm font-medium mb-1.5 block">Ім&apos;я та прізвище *</Label>
            <Input type="text" value={contact.name} onChange={set("name")}
              placeholder={cipherText}
              className={`font-mono placeholder:font-mono ${!contact.name && highlightRequired ? "animate-shake" : ""}`} />
          </div>
          <div>
            <Label className="text-sm font-medium mb-1.5 block">Телефон *</Label>
            <Input type="tel" value={contact.phone} onChange={set("phone")}
              placeholder="+380 XX XXX XX XX"
              className={!contact.phone && highlightRequired ? "animate-shake" : ""} />
          </div>
          <div>
            <Label className="text-sm font-medium mb-1.5 block">Email</Label>
            <Input type="email" value={contact.email} onChange={set("email")} placeholder="hr@company.com" />
          </div>
          <div>
            <Label className="text-sm font-medium mb-1.5 block">Компанія</Label>
            <Input type="text" value={contact.company} onChange={set("company")} placeholder="ТОВ «Назва»" />
          </div>
          <div>
            <Label className="text-sm font-medium mb-1.5 block">ЄДРПОУ</Label>
            <Input type="text" value={contact.edrpou} onChange={set("edrpou")} placeholder="12345678" />
          </div>
          <div>
            <Label className="text-sm font-medium mb-1.5 block">Соцмережа</Label>
            <div className="flex gap-2">
              <select value={contact.socialNetwork} onChange={set("socialNetwork")}
                className="h-9 shrink-0 rounded-md border border-input bg-background px-3 text-sm">
                {["Instagram", "Telegram", "Facebook", "TikTok", "Viber"].map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <Input type="text" value={contact.socialHandle} onChange={set("socialHandle")}
                placeholder="@username" className="flex-1 min-w-0" />
            </div>
          </div>
        </div>

        {/* Delivery — card style matching client */}
        <div>
          <Label className="text-sm font-medium mb-2 block">Доставка</Label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {DELIVERY_OPTIONS.map((opt) => (
              <button key={opt.id} type="button"
                onClick={() => setContact((prev) => ({ ...prev, delivery: opt.id }))}
                className={`text-left p-3 rounded-xl border transition-colors ${contact.delivery === opt.id ? "border-primary bg-primary/5" : "border-border hover:border-border/80"}`}>
                <p className="text-sm font-medium">{opt.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{opt.desc}</p>
              </button>
            ))}
          </div>
          {contact.delivery === "nova_poshta" && (
            <div className="mt-2 space-y-1">
              <Label className="text-xs font-medium">Адреса доставки *</Label>
              <Input type="text" value={contact.novaPoshtaDetails} onChange={set("novaPoshtaDetails")}
                placeholder="Місто, відділення або номер поштомату"
                className={!contact.novaPoshtaDetails.trim() && highlightRequired ? "animate-shake" : ""} />
            </div>
          )}
        </div>

        {/* Tags — admin-specific */}
        <div>
          <Label className="text-sm font-medium mb-2 block">Теги</Label>
          <div className="flex flex-wrap gap-2">
            {PREDEFINED_TAGS.map((tag) => {
              const active = orderTags.includes(tag.id);
              return (
                <button key={tag.id} type="button" onClick={() => toggleTag(tag.id)}
                  className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border transition-all"
                  style={{ color: active ? tag.color : undefined, backgroundColor: active ? tag.bg : undefined, borderColor: active ? `${tag.color}40` : undefined }}>
                  <span className="size-1.5 rounded-full" style={{ backgroundColor: active ? tag.color : "#9ca3af" }} />
                  {tag.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Collapsible extra details */}
        <button type="button" onClick={() => setShowExtraDetails(!showExtraDetails)}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors py-1">
          <ChevronRight className={`size-4 transition-transform ${showExtraDetails ? "rotate-90" : ""}`} />
          {showExtraDetails ? "Сховати деталі" : "Додати деталі"}
        </button>

        {showExtraDetails && (
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium mb-1.5 block">Бажаний дедлайн</Label>
              <Input type="date" value={contact.deadline} onChange={set("deadline")} className="w-full sm:w-48" />
            </div>
            <div>
              <Label className="text-sm font-medium mb-1.5 block">Коментар</Label>
              <textarea value={contact.comment} onChange={set("comment")}
                placeholder="Додаткові побажання..." rows={3}
                className="w-full px-3 py-2 border border-input rounded-md text-sm resize-none focus:outline-none focus:ring-1 focus:ring-ring bg-background" />
            </div>
            <div>
              <Label className="text-sm font-medium mb-1.5 block">Додаткові файли</Label>
              <input type="file" multiple id="extra-files-admin" className="hidden"
                onChange={(e) => setExtraFiles((prev) => [...prev, ...Array.from(e.target.files ?? [])])} />
              <label htmlFor="extra-files-admin"
                className="flex flex-col items-center justify-center w-full p-5 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary/40 hover:bg-muted/30 transition-colors">
                <Upload className="size-5 text-muted-foreground mb-1.5" />
                <p className="text-sm text-muted-foreground font-medium">Натисніть або перетягніть файли</p>
                <p className="text-xs text-muted-foreground mt-0.5">Макети, логотипи...</p>
              </label>
              {extraFiles.length > 0 && (
                <div className="mt-2 space-y-1.5">
                  {extraFiles.map((f, i) => (
                    <div key={i} className="flex items-center justify-between p-2 bg-muted/50 rounded border border-border">
                      <span className="text-xs truncate">{f.name}</span>
                      <button type="button" onClick={() => setExtraFiles((prev) => prev.filter((_, idx) => idx !== i))}>
                        <X className="size-3.5 text-muted-foreground hover:text-destructive" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
        <div className="h-4" />
      </div>

      {/* Sticky bottom nav — matches client */}
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card px-4 py-3 flex gap-2">
        <Button variant="outline" className="flex-1" onClick={onBack}>Назад</Button>
        <Button className="flex-1" onClick={handleNext} disabled={!canProceed}>
          Перевірити
        </Button>
      </div>
    </div>
  );
}
