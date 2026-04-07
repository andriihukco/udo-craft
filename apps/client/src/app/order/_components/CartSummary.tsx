"use client";

import React, { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { MockupViewer } from "@/components/MockupViewer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { generateInvoicePDF } from "@/lib/generate-invoice";
import { track } from "@/lib/analytics";
import { Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { PrintLayer } from "@udo-craft/shared";
import { OrderReview } from "./OrderReview";
import { ContactForm } from "./ContactForm";

// ── Types ─────────────────────────────────────────────────────────────────

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

export interface ContactData {
  name: string;
  email: string;
  phone: string;
  company: string;
  edrpou: string;
  socialNetwork: string;
  socialHandle: string;
  delivery: string;
  novaPoshtaDetails: string;
  deadline: string;
  comment: string;
}

const DELIVERY_OPTIONS = [
  { id: "nova_poshta", label: "Нова Пошта", desc: "2–3 робочих дні" },
  { id: "pickup", label: "Самовивіз", desc: "Львів, Джерельна, 69, офіс 10" },
];

const SESSION_KEY = "client-order-draft";

export interface CartSummaryProps {
  cart: CartItem[];
  contact: ContactData;
  setContact: (c: ContactData) => void;
  step: "select" | "contact" | "review";
  setStep: (s: "select" | "contact" | "review") => void;
  highlightRequired: boolean;
  cipherText: string;
  showExtraDetails: boolean;
  setShowExtraDetails: (v: boolean) => void;
  onRemoveCartItem: (i: number) => void;
  onEditCartItem: (i: number) => void;
  onSubmitSuccess: (email: string) => void;
  products: { id: string }[];
  extraFiles: File[];
  setExtraFiles: (files: File[]) => void;
}

// ── Component ─────────────────────────────────────────────────────────────

export function CartSummary({
  cart,
  contact,
  setContact,
  step,
  setStep,
  highlightRequired,
  cipherText,
  showExtraDetails,
  setShowExtraDetails,
  onRemoveCartItem,
  onEditCartItem,
  onSubmitSuccess,
  extraFiles,
  setExtraFiles,
}: CartSummaryProps) {
  const supabase = createClient();
  const [submitting, setSubmitting] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);

  const totalCents = cart.reduce(
    (sum, item) => sum + (item.unitPriceCents + item.printCostCents) * item.quantity,
    0
  );

  const handleSubmit = async () => {
    if (!contact.name || !contact.phone) { toast.error("Заповніть обов'язкові поля"); return; }
    if (contact.delivery === "nova_poshta" && !contact.novaPoshtaDetails.trim()) {
      toast.error("Вкажіть адресу Нової Пошти"); return;
    }
    if (cart.length === 0) { toast.error("Додайте товар"); return; }
    setSubmitting(true);
    try {
      let attachmentUrls: string[] = [];
      if (extraFiles.length > 0) {
        const fd = new FormData();
        extraFiles.forEach((f) => fd.append("files", f));
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        if (res.ok) attachmentUrls = (await res.json()).urls ?? [];
      }

      const { data: lead, error: leadErr } = await supabase.from("leads").insert({
        status: "new",
        customer_data: {
          name: contact.name,
          ...(contact.email ? { email: contact.email } : {}),
          phone: contact.phone,
          company: contact.company || undefined,
          edrpou: contact.edrpou || undefined,
          social_channel: contact.socialHandle ? `${contact.socialNetwork}:${contact.socialHandle}` : undefined,
          delivery: contact.delivery,
          delivery_details: contact.novaPoshtaDetails || undefined,
          deadline: contact.deadline || undefined,
          comment: contact.comment || undefined,
          attachments: attachmentUrls,
        },
        total_amount_cents: Math.round(totalCents),
      }).select().single();

      if (leadErr || !lead) throw leadErr;

      track("form_submit", { form: "order", lead_id: lead.id });
      sessionStorage.removeItem(SESSION_KEY);
      onSubmitSuccess(contact.email);

      for (const item of cart) {
        const mockupUrl = item.mockupUploadedUrl;
        const uploadedMockupsMap: Record<string, string> = {};
        if (item.mockupsMap && Object.keys(item.mockupsMap).length > 0) {
          for (const [side, dataUrl] of Object.entries(item.mockupsMap)) {
            if (!dataUrl.startsWith("data:image")) continue;
            try {
              const res = await fetch(dataUrl);
              const blob = await res.blob();
              const fd = new FormData();
              fd.append("files", new File([blob], `mockup-${side}.png`, { type: "image/png" }));
              const up = await fetch("/api/upload", { method: "POST", body: fd });
              if (up.ok) {
                const url = (await up.json()).urls?.[0];
                if (url) uploadedMockupsMap[side] = url;
              }
            } catch { /* non-critical */ }
          }
        }

        const layerUrls: { url: string; type: string; side: string; sizeLabel?: string; sizeMinCm?: number; sizeMaxCm?: number; priceCents?: number }[] = [];
        for (const layer of (item.layers ?? [])) {
          const url = layer.uploadedUrl;
          if (!url) continue;
          layerUrls.push({ url, type: layer.type, side: layer.side, sizeLabel: layer.sizeLabel, sizeMinCm: layer.sizeMinCm, sizeMaxCm: layer.sizeMaxCm, priceCents: layer.priceCents });
        }
        await supabase.from("order_items").insert({
          lead_id: lead.id, product_id: item.productId,
          size: item.size, color: item.color, quantity: item.quantity,
          mockup_url: mockupUrl,
          custom_print_url: layerUrls[0]?.url,
          technical_metadata: {
            ...(item.offsetTopMm !== undefined ? { offset_top_mm: item.offsetTopMm } : {}),
            layers: layerUrls,
            product_image_url: item.productImage || undefined,
            ...(item.itemNote ? { item_note: item.itemNote } : {}),
            ...(Object.keys(uploadedMockupsMap).length > 0 ? { mockups_map: uploadedMockupsMap } : {}),
          },
        });
      }
    } catch (err) {
      console.error("[handleSubmit]", err);
      toast.error("Помилка при відправці замовлення");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownloadInvoice = async () => {
    setGeneratingPdf(true);
    try {
      await generateInvoicePDF({
        items: cart.map((item) => ({
          productName: item.productName,
          productImage: item.productImage,
          size: item.size, color: item.color, quantity: item.quantity,
          unitPriceCents: item.productPrice,
          printCostCents: item.printCostCents,
          printUrl: item.mockupDataUrl,
          layers: item.layers?.map((l) => ({
            type: l.type, sizeLabel: l.sizeLabel, sizeMinCm: l.sizeMinCm,
            sizeMaxCm: l.sizeMaxCm, priceCents: l.priceCents, kind: l.kind, textContent: l.textContent,
          })),
        })),
        contact: { name: contact.name, email: contact.email, phone: contact.phone, company: contact.company || undefined },
        createdAt: new Date(),
      });
    } catch { toast.error("Помилка при генерації PDF"); }
    finally { setGeneratingPdf(false); }
  };

  // ── Contact step ──────────────────────────────────────────────────────────

  if (step === "contact") {
    return (
      <ContactForm
        contact={contact}
        setContact={setContact}
        highlightRequired={highlightRequired}
        cipherText={cipherText}
        showExtraDetails={showExtraDetails}
        setShowExtraDetails={setShowExtraDetails}
        extraFiles={extraFiles}
        setExtraFiles={setExtraFiles}
        onBack={() => setStep("select")}
        onNext={() => setStep("review")}
      />
    );
  }
  // ── Review step ───────────────────────────────────────────────────────────

  if (step === "review") {
    return (
      <OrderReview
        cart={cart}
        contact={contact}
        extraFiles={extraFiles}
        submitting={submitting}
        generatingPdf={generatingPdf}
        onBack={() => setStep("contact")}
        onSubmit={handleSubmit}
        onDownloadInvoice={handleDownloadInvoice}
      />
    );
  }

  // ── Cart items list (used in desktop side panel and mobile sheet) ─────────

  return (
    <div className="space-y-2">
      {cart.map((item, i) => {
        const lineTotal = (item.unitPriceCents + item.printCostCents) * item.quantity / 100;
        return (
          <div key={i} className="flex items-center gap-3 p-3 bg-muted/50 rounded-2xl">
            <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 bg-card border border-border">
              <MockupViewer images={item.mockupsMap} frontUrl={item.mockupDataUrl} backUrl={item.mockupBackDataUrl} fallbackUrl={item.productImage} alt={item.productName} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">{item.productName}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{item.quantity} шт · {item.size} · {item.color}</p>
              <p className="text-sm font-bold text-primary mt-0.5">{lineTotal.toFixed(0)} ₴</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button onClick={() => onEditCartItem(i)}
                className="h-9 px-3 rounded-xl text-xs font-semibold border border-border bg-background hover:bg-muted transition-colors">
                Редагувати
              </button>
              <button onClick={() => onRemoveCartItem(i)}
                className="size-9 rounded-full border border-border hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-colors text-muted-foreground flex items-center justify-center">
                <Trash2 className="size-4" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
