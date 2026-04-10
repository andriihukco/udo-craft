"use client";

import React, { useState } from "react";
import { createPortal } from "react-dom";
import type { PrintLayer } from "@udo-craft/shared";
import type { Product, PrintZone, Material, ProductColorVariant } from "@udo-craft/shared";
import { QtyPriceContent } from "./QtyPriceContent";
import { CustomizerLeftPanel } from "./CustomizerLeftPanel";
import { CustomizerLayout } from "./CustomizerLayout";
import { CustomizerCanvas } from "./CustomizerCanvas";
import { useCustomizerState } from "./useCustomizerState";
import { GenerationDrawer } from "./GenerationDrawer";

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

  const productImages: Record<string, string> =
    (s.selectedVariant?.images && Object.keys(s.selectedVariant.images).length > 0
      ? s.selectedVariant.images
      : product.images ?? {}) as Record<string, string>;

  if (!s.mounted) return null;

  const leftPanel = (
    <CustomizerLeftPanel
      product={product}
      unitPrice={s.unitPrice}
      variants={variants}
      materials={materials}
      selectedVariant={s.selectedVariant}
      selectedColor={s.selectedColor}
      selectedSize={s.selectedSize}
      layers={s.layers}
      activeSide={s.activeSide}
      activeLayerId={s.activeLayerId}
      printPricing={s.printPricing}
      quantity={s.quantity}
      layerScales={s.layerScales}
      removingBg={s.removingBg}
      fileInputRef={s.fileInputRef}
      onClose={onClose}
      onColorSelect={(color, variant) => { s.setSelectedColor(color); s.setSelectedVariant(variant); }}
      onSizeSelect={s.setSelectedSize}
      onLayerSelect={s.setActiveLayerId}
      onLayerDelete={s.handleDelete}
      onLayerDuplicate={s.duplicateLayer}
      onLayerRemoveBg={s.handleRemoveBg}
      onLayerTypeChange={s.handleTypeChange}
      onLayerSizeLabelChange={s.handleSizeLabelChange}
      onLayerReorder={(layers) => s.setLayersWithRef(layers)}
      onAddClick={() => s.fileInputRef.current?.click()}
      onAddText={s.addTextLayer}
      onTextChange={s.handleTextChange}
      onFileChange={s.addLayer}
    />
  );

  const rightPanel = (
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
    />
  );

  const canvas = (
    <>
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
        onLayerTextChange={(id, newText) => {
          s.setLayersWithRef((prev) => prev.map((l) => l.id === id ? { ...l, textContent: newText } : l));
        }}
        onAIGenerate={() => setAiDrawerOpen(true)}
      />
    </>
  );

  return createPortal(
    <CustomizerLayout
      productName={product.name}
      total={s.total}
      mobileSheet={s.mobileSheet}
      setMobileSheet={s.setMobileSheet}
      addingToCart={s.addingToCart}
      leftPanel={leftPanel}
      canvas={canvas}
      rightPanel={rightPanel}
      onClose={onClose}
    />,
    document.body
  );
}
