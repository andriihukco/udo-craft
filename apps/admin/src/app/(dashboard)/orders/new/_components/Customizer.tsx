"use client";

import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import dynamic from "next/dynamic";
import { Product, PrintZone, Material, ProductColorVariant, useCustomizer } from "@udo-craft/shared";
import { ArrowLeft, X, Palette, Ruler, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { type PrintLayer } from "@/components/print-types";
import { QtyPricePanel } from "./QtyPricePanel";
import { LeftPanel } from "./LeftPanel";
import { GenerationDrawer } from "./GenerationDrawer";

const ProductCanvas = dynamic(() => import("@/components/product-canvas"), { ssr: false });

// ── Types ─────────────────────────────────────────────────────────────────

interface ProductWithConfig extends Product {
  size_chart_id?: string | null;
  discount_grid?: { qty: number; discount_pct: number }[];
}

interface SizeChart { id: string; name: string; rows: Record<string, string>[]; }

interface CartItem {
  productId: string; productName: string; productImage: string; productPrice: number;
  unitPriceCents: number; printCostCents: number; quantity: number; size: string; color: string;
  itemNote?: string; layers?: PrintLayer[]; mockupDataUrl?: string; mockupUploadedUrl?: string;
  mockupBackDataUrl?: string; mockupsMap?: Record<string, string>; offsetTopMm?: number;
  printZone?: PrintZone | null;
}

export interface CustomizerProps {
  product: ProductWithConfig;
  printZones: { front?: PrintZone | null; back?: PrintZone | null };
  sizeChart?: SizeChart | null;
  materials: Material[];
  variants: ProductColorVariant[];
  initialVariant?: ProductColorVariant | null;
  initialLayers?: PrintLayer[];
  initialSize?: string;
  initialQuantity?: number;
  initialNote?: string;
  onAdd: (item: CartItem) => void;
  onClose: () => void;
}

// ── Customizer ────────────────────────────────────────────────────────────

export function Customizer({ product, printZones, sizeChart, materials, variants,
  initialVariant, initialLayers, initialSize, initialQuantity, initialNote, onAdd, onClose,
}: CustomizerProps) {
  void sizeChart;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasSaveRef = useRef<(() => void) | null>(null);
  const fabricCanvasRef = useRef<import("fabric").fabric.Canvas | null>(null);

  const { layers, activeLayerId, setActiveLayerId, mockups, setMockups, layersRef, captureRef,
    setLayersWithRef, addLayer: addLayerFromHook, addTextLayer: addTextLayerFromHook,
    resolveLayerPrice: resolveLayerPriceFromHook, handleAddToCart: handleAddToCartFromHook,
  } = useCustomizer({ uploadUrl: "/api/upload", uploadResponseKey: "results[0].url", uploadTags: "print" });

  useEffect(() => {
    if (initialLayers && initialLayers.length > 0) setLayersWithRef(initialLayers);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const defaultVariant = initialVariant ?? variants[0] ?? null;
  const defaultColor = defaultVariant ? (materials.find((m) => m.id === defaultVariant.material_id)?.name ?? "black") : "black";
  const firstImageKey = (() => {
    const imgs = defaultVariant?.images && Object.keys(defaultVariant.images).length > 0 ? defaultVariant.images : product.images ?? {};
    return Object.keys(imgs)[0] ?? "front";
  })();

  const [selectedSize, setSelectedSize] = useState((initialSize ?? "") as string);
  const [selectedColor, setSelectedColor] = useState(defaultColor);
  const [selectedVariant, setSelectedVariant] = useState<ProductColorVariant | null>(defaultVariant);
  const [quantity, setQuantity] = useState(initialQuantity ?? 1);
  const [activeSide, setActiveSide] = useState<string>(firstImageKey);
  const [offsetTopMm, setOffsetTopMm] = useState(0);
  const [itemNote, setItemNote] = useState(initialNote ?? "");
  const [printPricing, setPrintPricing] = useState<{ id: string; print_type: string; size_label: string; size_min_cm: number; size_max_cm: number; qty_tiers: { min_qty: number; price_cents: number }[] }[]>([]);
  const [addingToCart, setAddingToCart] = useState(false);
  const [layerScales, setLayerScales] = useState<Record<string, number>>({});
  const [mobileSheet, setMobileSheet] = useState<"config" | "price" | null>(null);
  const [mounted, setMounted] = useState(false);
  const [aiDrawerOpen, setAiDrawerOpen] = useState(false);

  const productImages = selectedVariant?.images ?? product.images ?? {};

  const addLayerForAI = (file: File, side: string, pricing: typeof printPricing) =>
    addLayerFromHook(file, side, pricing);

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => {
    fetch("/api/print-type-pricing").then((r) => r.json()).then((d) => { if (Array.isArray(d)) setPrintPricing(d); }).catch(() => {});
  }, []);

  const discountPct = (() => {
    const grid = product.discount_grid;
    if (!grid?.length) return 0;
    return [...grid].sort((a, b) => b.qty - a.qty).find((t) => quantity >= t.qty)?.discount_pct ?? 0;
  })();
  const unitPrice = product.base_price_cents / 100;
  const discounted = unitPrice * (1 - discountPct / 100);
  const resolveLayerPrice = (layer: PrintLayer) => resolveLayerPriceFromHook(layer, quantity, printPricing);
  const printCostPerUnit = layers.reduce((sum, layer) => sum + resolveLayerPrice(layer) / 100, 0);
  const requiresGarmentSize = Array.isArray(product.available_sizes) && product.available_sizes.length > 0;
  const hasIncompletePrintSizes = layers.some((layer) => !layer.sizeLabel);
  const addDisabledReason = requiresGarmentSize && !selectedSize ? "Оберіть розмір товару."
    : hasIncompletePrintSizes ? "Оберіть розмір для кожного нанесення." : null;

  const addLayer = (file: File) => addLayerFromHook(file, activeSide, printPricing);
  const addTextLayer = () => addTextLayerFromHook(activeSide, printPricing);

  const handleRemoveBg = (id: string, newUrl: string) => {
    setLayersWithRef((prev) => prev.map((l) => (l.id === id ? { ...l, url: newUrl, uploadedUrl: undefined } : l)));
    fetch(newUrl).then((r) => r.blob()).then((blob) => {
      const fd = new FormData();
      fd.append("files", new File([blob], "print-nobg.png", { type: "image/png" }));
      fd.append("tags", "print");
      return fetch("/api/upload", { method: "POST", body: fd });
    }).then((r) => r.ok ? r.json() : null).then((data) => {
      const uploadedUrl = data?.results?.[0]?.url;
      if (uploadedUrl) setLayersWithRef((prev) => prev.map((l) => (l.id === id ? { ...l, uploadedUrl } : l)));
    }).catch(() => {});
  };

  const duplicateLayer = (id: string) => {
    const src = layersRef.current.find((l) => l.id === id);
    if (!src) return;
    const newId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const copy: PrintLayer = { ...src, id: newId };
    setLayersWithRef((prev) => { const idx = prev.findIndex((l) => l.id === id); const next = [...prev]; next.splice(idx + 1, 0, copy); return next; });
    setActiveLayerId(newId);
  };

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of Array.from(items)) {
        if (item.type.startsWith("image/")) { const f = item.getAsFile(); if (f) { addLayer(f); return; } }
      }
      const text = e.clipboardData?.getData("text/plain") ?? "";
      const svgMatch = text.match(/<svg[\s\S]*<\/svg>/i);
      if (svgMatch) addLayer(new File([new Blob([svgMatch[0]], { type: "image/svg+xml" })], "pasted.svg", { type: "image/svg+xml" }));
    };
    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSide]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const dataUrl = captureRef.current?.() ?? "";
      if (dataUrl.startsWith("data:image")) setMockups((prev) => ({ ...prev, [activeSide]: dataUrl }));
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSide]);

  const handleAddToCart = async () => {
    if (addingToCart) return;
    if (requiresGarmentSize && !selectedSize) { toast.error("Оберіть розмір товару"); return; }
    if (hasIncompletePrintSizes) { toast.error("Оберіть розмір для кожного нанесення"); return; }
    setAddingToCart(true);
    try {
      const item = await handleAddToCartFromHook({
        activeSide, mockups, captureRef, layersRef, printPricing, quantity, discounted,
        printCostPerUnit, product, selectedSize, selectedColor, itemNote, offsetTopMm,
        printZone: printZones.front ?? printZones.back ?? null, requiresGarmentSize, hasIncompletePrintSizes,
      });
      onAdd(item);
    } finally { setAddingToCart(false); }
  };

  const leftPanelProps = {
    product, unitPrice, variants, materials, selectedVariant, selectedColor, selectedSize,
    onColorChange: (color: string, variant: ProductColorVariant) => { setSelectedColor(color); setSelectedVariant(variant); },
    onSizeChange: setSelectedSize, layers, activeSide, activeLayerId, printPricing, quantity,
    layerScales, fileInputRef,
    onLayerSelect: setActiveLayerId,
    onLayerDelete: (id: string) => { setLayersWithRef((prev) => prev.filter((l) => l.id !== id)); if (activeLayerId === id) setActiveLayerId(null); },
    onLayerDuplicate: duplicateLayer, onRemoveBg: handleRemoveBg,
    onTypeChange: (id: string, type: string) => setLayersWithRef((prev) => prev.map((l) => l.id !== id ? l : { ...l, type: type as PrintLayer["type"], sizeLabel: undefined, sizeMinCm: undefined, sizeMaxCm: undefined, priceCents: undefined, transform: undefined })),
    onSizeLabelChange: (id: string, sizeLabel: string) => setLayersWithRef((prev) => prev.map((l) => {
      if (l.id !== id) return l;
      const rows = printPricing.filter((r) => r.print_type === l.type);
      const row = rows.find((r) => r.size_label === sizeLabel) ?? rows[0];
      const sorted = row ? [...row.qty_tiers].sort((a, b) => b.min_qty - a.min_qty) : [];
      const tier = sorted.find((t) => quantity >= t.min_qty) ?? sorted[sorted.length - 1];
      return { ...l, sizeLabel, sizeMinCm: row?.size_min_cm, sizeMaxCm: row?.size_max_cm, priceCents: tier?.price_cents };
    })),
    onReorder: setLayersWithRef, onAddClick: () => fileInputRef.current?.click(), onAddText: addTextLayer,
    onTextChange: (id: string, patch: Partial<Pick<PrintLayer, "textContent" | "textFont" | "textColor" | "textFontSize" | "textAlign" | "textCurve">>) => setLayersWithRef((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l))),
    onFileChange: addLayer, onClose,
  };

  const canvasPanel = (
    <ProductCanvas product={product} printZones={printZones} layers={layers} activeSide={activeSide}
      onSideChange={(side) => { const imgs = selectedVariant?.images && Object.keys(selectedVariant.images).length > 0 ? selectedVariant.images : product.images ?? {}; if (!imgs[side]) return; setActiveSide(side); }}
      variantImages={selectedVariant?.images && Object.keys(selectedVariant.images).length > 0 ? selectedVariant.images : undefined}
      color={selectedColor} onSave={(dataUrl, side, mm) => { setMockups((prev) => ({ ...prev, [side]: dataUrl })); setOffsetTopMm(mm); }}
      onOffsetChange={setOffsetTopMm} saveRef={canvasSaveRef} fabricCanvasRef={fabricCanvasRef}
      captureRef={captureRef} activeLayerId={activeLayerId} onLayerSelect={setActiveLayerId}
      onRemoveBg={handleRemoveBg}
      onLayerDelete={(id) => { setLayersWithRef((prev) => prev.filter((l) => l.id !== id)); if (activeLayerId === id) setActiveLayerId(null); }}
      onLayerDuplicate={(layer) => { setLayersWithRef((prev) => [...prev, layer]); setActiveLayerId(layer.id); }}
      onLayerTransformChange={(id, transform) => { setLayerScales((prev) => ({ ...prev, [id]: transform.scaleX })); setLayersWithRef((prev) => prev.map((l) => (l.id === id ? { ...l, transform } : l))); }}
      onTextChange={(id, textContent) => setLayersWithRef((prev) => prev.map((l) => (l.id === id ? { ...l, textContent } : l)))}
      onAIGenerate={() => setAiDrawerOpen(true)}
    />
  );

  const rightPanel = (
    <QtyPricePanel quantity={quantity} setQuantity={setQuantity} discountGrid={product.discount_grid}
      discountPct={discountPct} unitPrice={unitPrice} discounted={discounted} layers={layers}
      printPricing={printPricing} printCostPerUnit={printCostPerUnit} resolveLayerPrice={resolveLayerPrice}
      itemNote={itemNote} setItemNote={setItemNote} addDisabledReason={addDisabledReason}
      addingToCart={addingToCart} onAddToCart={() => void handleAddToCart()} hideButton />
  );

  const content = (
    <div className="fixed inset-0 z-[9999] bg-background flex flex-col">
      <div className="flex flex-1 min-h-0 flex-col lg:grid lg:grid-cols-[280px_1fr_280px]">
        <div className="hidden lg:flex lg:flex-col h-full overflow-y-auto border-r border-border bg-card p-4">
          <LeftPanel {...leftPanelProps} />
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto flex flex-col items-center justify-start lg:justify-center p-3 lg:p-6 bg-muted/40">
          <div className="lg:hidden w-full h-11 mb-3 flex items-center justify-between bg-card rounded-xl px-3 border border-border">
            <button onClick={() => { if (!confirm("Повернутися? Незбережені зміни буде втрачено.")) return; onClose(); }}
              className="cursor-pointer flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="size-3.5" /> Назад
            </button>
            <p className="text-xs font-semibold truncate max-w-[140px]">{product.name}</p>
            <p className="text-xs font-bold text-primary shrink-0">{((discounted + printCostPerUnit) * quantity).toFixed(0)} ₴</p>
          </div>
          <GenerationDrawer
            open={aiDrawerOpen}
            onClose={() => setAiDrawerOpen(false)}
            addLayer={addLayerForAI}
            activeSide={activeSide}
            printPricing={printPricing}
            captureRef={captureRef}
            layers={layers}
            mockups={mockups}
            selectedColor={selectedColor}
            productImages={productImages}
            productName={product.name}
          />
          {canvasPanel}
        </div>
        <div className="hidden lg:flex lg:flex-col h-full overflow-hidden border-l border-border bg-card">
          <div className="flex-1 overflow-y-auto overflow-x-hidden p-4">
            {rightPanel}
          </div>
          <div className="shrink-0 border-t border-border bg-card p-4 space-y-1.5">
            {addDisabledReason && !addingToCart && (
              <p className="text-xs text-amber-600 text-center">{addDisabledReason}</p>
            )}
            <Button
              type="button"
              className="w-full h-11 text-sm font-semibold cursor-pointer"
              onClick={() => void handleAddToCart()}
              disabled={addingToCart || !!addDisabledReason}
            >
              {addingToCart
                ? <><Loader2 className="size-3.5 animate-spin mr-1.5" /> Додаємо...</>
                : "Додати до замовлення"}
            </Button>
          </div>
        </div>
      </div>
      <div className="lg:hidden shrink-0 border-t border-border bg-card">
        <div className="flex">
          {(["config", "price"] as const).map((tab) => (
            <button key={tab} onClick={() => setMobileSheet(mobileSheet === tab ? null : tab)}
              className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-semibold transition-colors ${mobileSheet === tab ? "text-primary border-t-2 border-primary -mt-px" : "text-muted-foreground"}`}>
              {tab === "config" ? <><Palette className="size-4" />Налаштування</> : <><Ruler className="size-4" />Тираж та ціна</>}
            </button>
          ))}
        </div>
      </div>
      {mobileSheet && (
        <div className="lg:hidden fixed inset-0 z-[10000] flex flex-col justify-end" onClick={() => setMobileSheet(null)}>
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative bg-background rounded-t-2xl max-h-[80vh] flex flex-col shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-center pt-3 pb-1 shrink-0"><div className="w-10 h-1 rounded-full bg-border" /></div>
            <div className="flex items-center justify-between px-4 pb-3 shrink-0">
              <p className="text-sm font-semibold">{mobileSheet === "config" ? "Налаштування товару" : "Тираж та ціна"}</p>
              <button onClick={() => setMobileSheet(null)} className="size-7 rounded-full flex items-center justify-center hover:bg-muted transition-colors"><X className="size-4" /></button>
            </div>
            <div className="overflow-y-auto px-4 pb-[env(safe-area-inset-bottom,24px)] [&>div]:pb-8">
              {mobileSheet === "config" ? <LeftPanel {...leftPanelProps} /> : rightPanel}
            </div>
          </div>
        </div>
      )}
      {addingToCart && (
        <div className="fixed inset-0 z-[10001] bg-background/60 backdrop-blur-sm flex items-center justify-center">
          <div className="flex items-center gap-2.5 rounded-2xl border border-border bg-card px-5 py-3.5 shadow-xl text-sm font-semibold">
            <Loader2 className="size-4 animate-spin text-primary" /> Додаємо...
          </div>
        </div>
      )}
    </div>
  );

  return mounted ? createPortal(content, document.body) : null;
}
