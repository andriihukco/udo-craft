"use client";

import React from "react";
import type { Product, PrintZone, PrintLayer } from "@udo-craft/shared";
import dynamic from "next/dynamic";

const ProductCanvas = dynamic(() => import("@/components/ProductCanvas"), { ssr: false });

interface ProductWithConfig extends Product {
  size_chart_id?: string | null;
  print_area_ids?: string[];
}

interface CustomizerCanvasProps {
  product: ProductWithConfig;
  printZones: { front?: PrintZone | null; back?: PrintZone | null };
  layers: PrintLayer[];
  activeSide: string;
  activeLayerId: string | null;
  selectedVariantImages?: Record<string, string>;
  canvasSaveRef: React.MutableRefObject<(() => string) | null>;
  captureRef: React.MutableRefObject<(() => string) | null>;
  onSideChange: (side: string) => void;
  onSave: (dataUrl: string, side: string, mm: number) => void;
  onOffsetChange: (mm: number) => void;
  onLayerSelect: (id: string | null) => void;
  onRemoveBg: (id: string, newUrl: string) => void;
  onRemoveBgStateChange: (removing: boolean) => void;
  onLayerDelete: (id: string) => void;
  onLayerDuplicate: (layer: PrintLayer) => void;
  onLayerTransformChange: (id: string, transform: { left: number; top: number; scaleX: number; scaleY: number; angle: number; flipX: boolean }) => void;
}

export function CustomizerCanvas({
  product, printZones, layers, activeSide, activeLayerId,
  selectedVariantImages, canvasSaveRef, captureRef,
  onSideChange, onSave, onOffsetChange, onLayerSelect,
  onRemoveBg, onRemoveBgStateChange, onLayerDelete, onLayerDuplicate, onLayerTransformChange,
}: CustomizerCanvasProps) {
  return (
    <ProductCanvas
      product={product}
      printZones={printZones}
      layers={layers}
      activeSide={activeSide}
      onSideChange={onSideChange}
      variantImages={selectedVariantImages}
      onSave={onSave}
      onOffsetChange={onOffsetChange}
      saveRef={canvasSaveRef}
      captureRef={captureRef}
      activeLayerId={activeLayerId}
      onLayerSelect={onLayerSelect}
      onRemoveBg={onRemoveBg}
      onRemoveBgStateChange={onRemoveBgStateChange}
      onLayerDelete={onLayerDelete}
      onLayerDuplicate={onLayerDuplicate}
      onLayerTransformChange={onLayerTransformChange}
    />
  );
}
