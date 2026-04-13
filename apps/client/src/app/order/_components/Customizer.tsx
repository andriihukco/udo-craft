"use client";

import React, { useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import type { PrintLayer, SidebarTabId } from "@udo-craft/shared";
import type { Product, PrintZone, Material, ProductColorVariant } from "@udo-craft/shared";
import { QtyPriceContent } from "./QtyPriceContent";
import { CustomizerLayout } from "./CustomizerLayout";
import { CustomizerCanvas } from "./CustomizerCanvas";
import { Button } from "@/components/ui/button";
import { Layers, LayoutList, Loader2, MirrorRound, Pencil, Ruler, Shapes, Type, Upload, X } from "lucide-react";
import { useCustomizerState } from "./useCustomizerState";
import { GenerationDrawer } from "./GenerationDrawer";
import EditorSidebar from "./editor/EditorSidebar";
import PrintsPanel from "./editor/PrintsPanel";
import DrawPanel from "./editor/DrawPanel";
import TextPanel from "./editor/TextPanel";
import UploadPanel from "./editor/UploadPanel";
import MobileSheet from "./editor/MobileSheet";
import type { TextLayerPatch } from "./editor/TextPanel";
import LayersList from "@/components/LayersList";
import ShapesPanel from "./editor/ShapesPanel";
import type { TextComposition } from "@udo-craft/shared";

interface ProductWithConfig extends Product {
  size_chart_id?: string | null;
  print_area_ids?: string[];
}

interface SizeChart {
  id: string;
  name: string;
  rows: Record<string, string>[];
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
  printZone?: PrintZone | null;
}

export interface CustomizerProps {
  product: ProductWithConfig;
  printZones: { front?: PrintZone | null; back?: PrintZone | null };
  sizeChart?: SizeChart | null;
  materials: Material[];
  variants: ProductColorVariant[];
  onAdd: (item: CartItem) => void;
  onClose: () => void;
  initialSize?: string;
  initialColor?: string;
  initialLayers?: PrintLayer[];
  autoOpenCanvas?: boolean;
  existingMockupUploadedUrl?: string;
}

// ── Mobile tab config ─────────────────────────────────────────────────────

const MOBILE_TABS: { id: SidebarTabId; label: string; Icon: React.ElementType }[] = [
  { id: "prints",  label: "Принти",  Icon: Layers      },
  { id: "shapes",  label: "Фігури",  Icon: Shapes      },
  { id: "draw",    label: "Малюнок", Icon: Pencil      },
  { id: "text",    label: "Текст",   Icon: Type        },
  { id: "upload",  label: "Файл",    Icon: Upload      },
  { id: "layers",  label: "Шари",    Icon: LayoutList  },
];

// ── Component ─────────────────────────────────────────────────────────────

export function Customizer({
  product,
  printZones,
  materials,
  variants,
  onAdd,
  onClose,
  initialSize,
  initialColor,
  initialLayers,
  existingMockupUploadedUrl,
}: CustomizerProps) {
  const s = useCustomizerState({
    product, printZones, materials, variants, onAdd,
    initialSize, initialColor, initialLayers, existingMockupUploadedUrl,
  });

  const [aiDrawerOpen, setAiDrawerOpen] = useState(false);
  const [mobilePriceOpen, setMobilePriceOpen] = useState(false);

  const productImages: Record<string, string> =
    (s.selectedVariant?.images && Object.keys(s.selectedVariant.images).length > 0
      ? s.selectedVariant.images
      : product.images ?? {}) as Record<string, string>;

  if (!s.mounted) return null;

  const addLayer = (file: File) => s.addLayer(file);
  const addTextLayer = () => s.addTextLayer();

  const handleAddComposition = (composition: TextComposition) => {
    const now = Date.now();
    const placeholder = new File([], "text-layer.txt", { type: "text/plain" });
    const minSizeRow = s.printPricing
      .filter((r) => r.print_type === "dtf")
      .sort((a, b) => (a.size_min_cm + a.size_max_cm) / 2 - (b.size_min_cm + b.size_max_cm) / 2)[0];
    const base = {
      file: placeholder, url: "", type: "dtf" as const, side: s.activeSide,
      kind: "text" as const,
      sizeLabel: minSizeRow?.size_label, sizeMinCm: minSizeRow?.size_min_cm, sizeMaxCm: minSizeRow?.size_max_cm,
    };
    const newLayers = composition.layers.map((cl, i) => ({
      ...base,
      id: `text-${now}-${i}`,
      textContent: cl.textContent,
      textFont: cl.textFont,
      textFontSize: cl.textFontSize,
      textColor: cl.textColor,
      textAlign: cl.textAlign,
      textBold: cl.textBold,
      textItalic: cl.textItalic,
      textCurve: cl.textCurve,
      transform: cl.offsetY
        ? { left: 0, top: 260 + (cl.offsetY ?? 0), scaleX: 1, scaleY: 1, angle: 0, flipX: false }
        : undefined,
    }));
    s.setLayersWithRef((prev) => [...prev, ...newLayers]);
    s.setActiveLayerId(newLayers[0].id);
  };

  const selectedLayer = s.layers.find((l) => l.id === s.activeLayerId) ?? null;

  // ── Shared layer handler props ────────────────────────────────────────

  const layerHandlerProps = {
    layers: s.layers,
    activeSide: s.activeSide,
    activeLayerId: s.activeLayerId,
    onSelect: s.setActiveLayerId,
    onDelete: s.handleDelete,
    onDuplicate: s.duplicateLayer,
    onReorder: (layers: PrintLayer[]) => s.setLayersWithRef(layers),
    onTypeChange: s.handleTypeChange,
    onSizeLabelChange: s.handleSizeLabelChange,
    onTextChange: (id: string, patch: TextLayerPatch) => s.handleTextChange(id, patch),
    pricing: s.printPricing,
    quantity: s.quantity,
    layerScales: s.layerScales,
    pxToMmRatio: product.px_to_mm_ratio || 0,
  };

  // ── Panel content helper ──────────────────────────────────────────────

  const panelContent = (tab: SidebarTabId | null) => {
    if (!tab) return null;
    if (tab === "prints") return <PrintsPanel activeSide={s.activeSide} printPricing={s.printPricing} onAddLayer={addLayer} />;
    if (tab === "shapes") return <ShapesPanel onAddLayer={addLayer} />;
    if (tab === "draw") return (
      <DrawPanel
        fabricCanvasRef={s.fabricCanvasRef}
        layers={s.layers} activeSide={s.activeSide} activeLayerId={s.activeLayerId}
        onAddLayer={addLayer}
        onReplaceDrawLayer={(id, file) => s.setLayersWithRef((prev) => prev.map((l) => {
          if (l.id !== id) return l;
          return { ...l, file, url: URL.createObjectURL(file), uploadedUrl: undefined };
        }))}
        setLayersWithRef={s.setLayersWithRef}
        printZoneBounds={{ left: 0, top: 0, width: 0, height: 0 }}
      />
    );
    if (tab === "text") return (
      <TextPanel
        onAddTextLayer={addTextLayer}
        onAddComposition={handleAddComposition}
      />
    );
    if (tab === "upload") return <UploadPanel activeSide={s.activeSide} onFileAdd={addLayer} />;
    if (tab === "layers") return (
      <div className="p-3">
        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-3">Шари</p>
        {s.layers.filter((l) => l.side === s.activeSide).length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-8">Немає шарів. Додайте зображення або текст.</p>
        ) : (
          <LayersList {...layerHandlerProps} />
        )}
      </div>
    );
    return null;
  };

  const tabLabel = (tab: SidebarTabId | null) => {
    if (tab === "prints") return "Принти";
    if (tab === "shapes") return "Фігури";
    if (tab === "draw") return "Малюнок";
    if (tab === "text") return "Текст";
    if (tab === "upload") return "Завантажити";
    if (tab === "layers") return "Шари";
    return "";
  };

  // ── Sidebar (desktop icon strip) ─────────────────────────────────────

  const sidebar = <EditorSidebar activeTab={s.activeTab} onTabChange={s.setActiveTab} onBack={onClose} />;

  // ── Animated panel column (desktop) ──────────────────────────────────

  const panel = (
    <motion.div
      animate={{ width: s.activeTab ? 280 : 0, opacity: s.activeTab ? 1 : 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="overflow-hidden border-r border-border bg-card h-full"
      style={{ minWidth: 0 }}
    >
      <div className="w-[280px] h-full overflow-y-auto">
        {panelContent(s.activeTab)}
      </div>
    </motion.div>
  );

  // ── Right panel ───────────────────────────────────────────────────────

  // Product thumbnail for the info card
  const productThumb = (s.selectedVariant?.images && Object.keys(s.selectedVariant.images).length > 0
    ? Object.values(s.selectedVariant.images as Record<string, string>)[0]
    : Object.values(product.images ?? {})[0]) ?? "";

  const productInfoCard = (
    <div className="flex items-center gap-3 pb-3 mb-3 border-b border-border">
      {productThumb && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={productThumb} alt={product.name}
          className="size-14 rounded-xl object-cover border border-border shrink-0 bg-muted" />
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold leading-tight truncate">{product.name}</p>
        <p className="text-xs text-muted-foreground mt-0.5">від {(product.base_price_cents / 100).toFixed(0)} ₴</p>
      </div>
      <button
        type="button"
        onClick={onClose}
        className="shrink-0 text-xs font-medium text-primary hover:underline focus-visible:outline-none whitespace-nowrap"
      >
        Змінити
      </button>
    </div>
  );

  const rightPanel = (
    <>
      {productInfoCard}
      {/* Color picker */}
      {variants.length > 0 && (
        <div className="space-y-1.5 pb-3 mb-1">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Колір</p>
          <div className="flex gap-2 flex-wrap">
            {variants.map((v) => {
              const mat = materials.find((m) => m.id === v.material_id);
              if (!mat) return null;
              const isSelected = s.selectedVariant?.id === v.id;
              const isWhite = mat.hex_code.toLowerCase() === "#ffffff" || mat.hex_code.toLowerCase() === "#f5f5f5";
              return (
                <button key={v.id} onClick={() => { s.setSelectedColor(mat.name); s.setSelectedVariant(v); }}
                  title={mat.name} aria-label={mat.name} aria-pressed={isSelected}
                  className={`relative size-7 rounded-full transition-all flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${isSelected ? "ring-2 ring-primary ring-offset-2 scale-110" : "hover:scale-105"} ${isWhite ? "border border-border" : ""}`}
                  style={{ backgroundColor: mat.hex_code }}>
                  {isSelected && <span className="absolute inset-0 flex items-center justify-center text-xs" style={{ color: isWhite ? "var(--foreground)" : "var(--primary-foreground)" }}>✓</span>}
                </button>
              );
            })}
          </div>
          {s.selectedColor && <p className="text-xs text-muted-foreground">{s.selectedColor}</p>}
        </div>
      )}
      {/* Size picker */}
      {Array.isArray(product.available_sizes) && (product.available_sizes as string[]).length > 0 && (
        <div className="space-y-1.5 pb-3 mb-3 border-b border-border">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Розмір</p>
          <div className="flex gap-1.5 flex-wrap">
            {(product.available_sizes as string[]).map((size) => (
              <button key={size} onClick={() => s.setSelectedSize(size)} aria-pressed={s.selectedSize === size}
                className={`min-w-[36px] h-9 px-2 rounded-lg text-sm font-semibold border transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${s.selectedSize === size ? "bg-foreground text-background border-foreground shadow-sm" : "border-border hover:border-foreground/40 hover:bg-muted/50"}`}>
                {size}
              </button>
            ))}
          </div>
        </div>
      )}
      <QtyPriceContent
      product={product as any}
      quantity={s.quantity}
      qtyStr={s.qtyStr}
      setQuantity={s.setQuantity}
      setQtyStr={s.setQtyStr}
      discountPct={s.discountPct}
      unitPrice={s.unitPrice}
      discounted={s.discounted}
      printCostPerUnit={s.printCostPerUnit}
      total={s.total}
      layers={s.layers}
      pricing={s.printPricing}
      itemNote={s.itemNote}
      setItemNote={s.setItemNote}
      onAddToCart={() => void s.handleAddToCart()}
      loading={s.addingToCart || s.removingBg}
      showTitle={false}
      addDisabled={!!s.addDisabledReason || s.removingBg}
      addDisabledReason={s.addDisabledReason || (s.removingBg ? "Видаляємо фон..." : null)}
      disabled={s.removingBg}
      hideButton
    />
    </>
  );

  const stickyButton = (
    <div className="space-y-2">
      {/* AI try-on button */}
      <button
        type="button"
        disabled={s.layers.length === 0}
        onClick={() => setAiDrawerOpen(true)}
        className="w-full flex items-center gap-3 h-12 px-4 rounded-full border border-border bg-muted/40 hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-muted/40"
      >
        <MirrorRound className="size-5 text-primary shrink-0" />
        <div className="text-left">
          <p className="text-sm font-medium text-foreground leading-tight">Приміряти на людину</p>
          <p className="text-[10px] text-muted-foreground leading-tight">З допомогою AI</p>
        </div>
      </button>

      {(s.addDisabledReason && !s.addingToCart && !s.removingBg) && (
        <p className="text-xs text-amber-600 text-center">{s.addDisabledReason}</p>
      )}
      <Button
        className="w-full h-11 text-sm font-semibold"
        disabled={s.addingToCart || s.removingBg || !!s.addDisabledReason}
        onClick={() => void s.handleAddToCart()}
      >
        {(s.addingToCart || s.removingBg)
          ? <><Loader2 className="size-3.5 animate-spin mr-1.5" />{s.removingBg ? "Видаляємо фон..." : "Додаємо..."}</>
          : "Додати до замовлення"}
      </Button>
    </div>
  );

  // ── Canvas ────────────────────────────────────────────────────────────

  const canvas = (
    <CustomizerCanvas
      product={product}
      printZones={printZones}
      layers={s.layers}
      activeSide={s.activeSide}
      activeLayerId={s.activeLayerId}
      selectedVariantImages={
        s.selectedVariant?.images && Object.keys(s.selectedVariant.images).length > 0
          ? s.selectedVariant.images as Record<string, string>
          : undefined
      }
      canvasSaveRef={s.canvasSaveRef}
      captureRef={s.captureRef}
      fabricCanvasRef={s.fabricCanvasRef}
      onSideChange={(side) => {
        const imgs = s.selectedVariant?.images && Object.keys(s.selectedVariant.images).length > 0
          ? s.selectedVariant.images : product.images ?? {};
        if (!(imgs as Record<string, string>)[side]) return;
        s.setActiveSide(side);
      }}
      onSave={(dataUrl, side, mm) => { s.setMockups((prev) => ({ ...prev, [side]: dataUrl })); s.setOffsetTopMm(mm); }}
      onOffsetChange={s.setOffsetTopMm}
      onLayerSelect={s.setActiveLayerId}
      onRemoveBg={s.handleRemoveBg}
      onRemoveBgStateChange={s.setRemovingBg}
      onLayerDelete={s.handleDelete}
      onLayerDuplicate={(layer) => { s.setLayersWithRef((prev) => [...prev, layer]); s.setActiveLayerId(layer.id); }}
      onLayerTransformChange={(id, transform) => {
        s.setLayerScales((prev) => ({ ...prev, [id]: transform.scaleX }));
        s.setLayersWithRef((prev) => prev.map((l) => l.id === id ? { ...l, transform: transform as PrintLayer["transform"] } : l));
      }}
      onTextChange={s.handleTextChange}
      onLayerPatch={(id, patch) => s.handleTextChange(id, patch as any)}
      onUndo={s.handleUndo}
      onRedo={s.handleRedo}
      canUndo={s.canUndo}
      canRedo={s.canRedo}
    />
  );

  return createPortal(
    <>
      <CustomizerLayout
        productName={product.name}
        total={s.total}
        mobileSheet={s.mobileSheet}
        setMobileSheet={s.setMobileSheet}
        addingToCart={s.addingToCart}
        removingBg={s.removingBg}
        sidebar={sidebar}
        panel={panel}
        activeTab={s.activeTab}
        onTabChange={s.setActiveTab}
        onPriceOpen={() => setMobilePriceOpen(true)}
        canvas={canvas}
        rightPanel={rightPanel}
        stickyButton={stickyButton}
        onClose={onClose}
      />

      {/* GenerationDrawer — rendered at portal level so it overlays everything */}
      <GenerationDrawer
        open={aiDrawerOpen}
        onClose={() => setAiDrawerOpen(false)}
        addLayer={(file, side, pricing) => s.addLayerFull(file, side, pricing)}
        activeSide={s.activeSide}
        printPricing={s.printPricing}
        captureRef={s.captureRef}
        layers={s.layers}
        mockups={s.mockups}
        selectedColor={s.selectedColor}
        productImages={productImages}
        productName={product.name}
      />

      {/* Mobile panel sheet — driven by activeTab */}
      <MobileSheet
        open={!!s.activeTab}
        onClose={() => s.setActiveTab(null)}
        title={tabLabel(s.activeTab)}
      >
        <div className="p-4">{panelContent(s.activeTab)}</div>
      </MobileSheet>

      {/* Mobile price sheet */}
      {mobilePriceOpen && (
        <div className="fixed inset-x-0 top-0 bottom-14 z-[9994] flex flex-col justify-end" onClick={() => setMobilePriceOpen(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative bg-background rounded-t-2xl max-h-[85vh] flex flex-col shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-center pt-3 pb-1 shrink-0"><div className="w-10 h-1 rounded-full bg-border" /></div>
            <div className="flex items-center justify-between px-4 pb-3 shrink-0">
              <p className="text-sm font-semibold">Тираж та ціна</p>
              <button onClick={() => setMobilePriceOpen(false)} className="size-7 rounded-full flex items-center justify-center hover:bg-muted transition-colors"><X className="size-4" /></button>
            </div>
            <div className="overflow-y-auto px-4 pb-2">{rightPanel}</div>
            <div className="shrink-0 border-t border-border px-4 py-3 pb-[max(12px,env(safe-area-inset-bottom))]">
              {stickyButton}
            </div>
          </div>
        </div>
      )}
    </>,
    document.body
  );
}
