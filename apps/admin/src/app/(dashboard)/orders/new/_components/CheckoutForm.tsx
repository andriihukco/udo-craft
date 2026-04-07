"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, ChevronDown } from "lucide-react";
import type { CartItem } from "./CartSummary";
import { PREDEFINED_TAGS, DELIVERY_OPTIONS } from "../_lib/constants";

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
}

export function CheckoutForm({
  contact, setContact, orderTags, setOrderTags,
  extraFiles, setExtraFiles, cart, totalCents, onReview,
}: CheckoutFormProps) {
  const set = (field: keyof ContactData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setContact((prev) => ({ ...prev, [field]: e.target.value }));

  const toggleTag = (id: string) =>
    setOrderTags((prev) => prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]);

  const canProceed = contact.name.trim() &&
    (contact.phone.trim() || contact.email.trim() || contact.socialHandle.trim());

  return (
    <div className="max-w-xl space-y-6">
      <div className="bg-card rounded-2xl border border-border p-5 space-y-4">
        <p className="text-sm font-bold">Контактні дані</p>
        <div className="space-y-3">
          <div>
            <Label className="text-xs text-muted-foreground mb-1 block">Ім&apos;я *</Label>
            <Input value={contact.name} onChange={set("name")} placeholder="Ім'я клієнта" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Телефон</Label>
              <Input value={contact.phone} onChange={set("phone")} placeholder="+380..." />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Email</Label>
              <Input value={contact.email} onChange={set("email")} placeholder="email@..." type="email" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Компанія</Label>
              <Input value={contact.company} onChange={set("company")} placeholder="Назва компанії" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">ЄДРПОУ</Label>
              <Input value={contact.edrpou} onChange={set("edrpou")} placeholder="12345678" />
            </div>
          </div>
          <div className="grid grid-cols-[120px_1fr] gap-2">
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Соцмережа</Label>
              <select value={contact.socialNetwork} onChange={set("socialNetwork")}
                className="w-full h-9 rounded-md border border-input bg-background px-2 text-sm">
                {["Instagram", "Telegram", "Facebook", "TikTok", "Viber"].map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Нікнейм</Label>
              <Input value={contact.socialHandle} onChange={set("socialHandle")} placeholder="@username" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border p-5 space-y-3">
        <p className="text-sm font-bold">Доставка</p>
        <div className="space-y-2">
          {DELIVERY_OPTIONS.map((opt) => (
            <label key={opt.id} className="flex items-start gap-3 cursor-pointer">
              <input type="radio" name="delivery" value={opt.id}
                checked={contact.delivery === opt.id} onChange={set("delivery")} className="mt-0.5" />
              <div>
                <p className="text-sm font-medium">{opt.label}</p>
                <p className="text-xs text-muted-foreground">{opt.desc}</p>
              </div>
            </label>
          ))}
        </div>
        {contact.delivery === "nova_poshta" && (
          <Input value={contact.novaPoshtaDetails} onChange={set("novaPoshtaDetails")}
            placeholder="Місто, відділення або адреса" />
        )}
      </div>

      <div className="bg-card rounded-2xl border border-border p-5 space-y-3">
        <p className="text-sm font-bold">Теги</p>
        <div className="flex flex-wrap gap-2">
          {PREDEFINED_TAGS.map((tag) => {
            const active = orderTags.includes(tag.id);
            return (
              <button key={tag.id} type="button" onClick={() => toggleTag(tag.id)}
                className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border transition-all"
                style={{ color: active ? tag.color : undefined, backgroundColor: active ? tag.bg : undefined,
                  borderColor: active ? `${tag.color}40` : undefined }}>
                <span className="size-1.5 rounded-full" style={{ backgroundColor: active ? tag.color : "#9ca3af" }} />
                {tag.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border p-5 space-y-3">
        <p className="text-sm font-bold">Додатково</p>
        <div>
          <Label className="text-xs text-muted-foreground mb-1 block">Дедлайн</Label>
          <Input value={contact.deadline} onChange={set("deadline")} type="date" className="max-w-[180px]" />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground mb-1 block">Коментар</Label>
          <textarea value={contact.comment} onChange={set("comment")} placeholder="Особливі побажання..."
            rows={3} className="w-full resize-none rounded-xl border border-border bg-muted/30 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors placeholder:text-muted-foreground" />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground mb-1 block">Додаткові файли</Label>
          <label className="flex items-center gap-2 cursor-pointer border border-dashed border-border rounded-xl px-4 py-3 hover:bg-muted/30 transition-colors">
            <Upload className="size-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Завантажити файли</span>
            <input type="file" multiple className="hidden"
              onChange={(e) => setExtraFiles((prev) => [...prev, ...Array.from(e.target.files ?? [])])} />
          </label>
          {extraFiles.length > 0 && (
            <div className="mt-2 space-y-1">
              {extraFiles.map((f, i) => (
                <div key={i} className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="truncate">📎 {f.name}</span>
                  <button type="button" onClick={() => setExtraFiles((prev) => prev.filter((_, idx) => idx !== i))}
                    className="ml-2 text-destructive hover:text-destructive/80">×</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border p-5 space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Товарів</span>
          <span className="font-medium">{cart.length}</span>
        </div>
        <div className="flex justify-between font-bold">
          <span>Разом</span>
          <span>{(totalCents / 100).toFixed(0)} ₴</span>
        </div>
        <Button className="w-full h-11 font-semibold" onClick={onReview} disabled={!canProceed}>
          Перевірити замовлення <ChevronDown className="size-4 ml-1 -rotate-90" />
        </Button>
      </div>
    </div>
  );
}
