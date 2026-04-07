"use client";

import { useState, useEffect, useRef } from "react";
import { useCustomizer, type PrintLayer } from "@udo-craft/shared";
import type { Product, PrintZone, Material, ProductColorVariant } from "@udo-craft/shared";
import { type PrintTypePricingRow } from "@/components/LayersPanel";
import { toast } from "sonner";
import { useLayerHandlers } from "./useLayerHandlers";
import type { CartItem } from "./Customizer";

interface ProductWithConfig extends Product {
  size_chart_id?: string | null;
  print_area_ids?: string[];
}

interface UseCustomizerStateProps {
  product: ProductWithConfig;
  printZones: { front?: PrintZone | null; back?: PrintZone | null };
  materials: Material[];
  variants: ProductColorVariant[];
  onAdd: (item: CartItem) => void;
  initialSize?: string;
  initialColor?: string;
  initialLayers?: PrintLayer[];
}

export function useCustomizerState({
  product,
  printZones,
  materials,
  variants,
  onAdd,
  initialSize,
  initialColor,
  initialLayers,
}: UseCustomizerStateProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasSaveRef = useRef<(() => string) | null>(null);
  const [mobileSheet, setMobileSheet] = useState<"config" | "price" | null>(null);
  const [mounted, setMounted] = useState(false);

  const {
    layers,
    setLayers,
    activeLayerId,
    setActiveLayerId,
    mockups,
    setMockups,
    layersRef,
    captureRef,
    setLayersWithRef,
    addLayer: addLayerFromHook,
    addTextLayer: addTextLayerFromHook,
    resolveLayerPrice: resolveLayerPriceFromHook,
    handleAddToCart: handleAddToCartFromHook,
  } = useCustomizer({ uploadUrl: "/api/upload", uploadResponseKey: "urls[0]" });

  void setLayers;

  const defaultColor = variants[0]
    ? (materials.find((m) => m.id === variants[0].material_id)?.name ?? "black")
    : "black";
  const [selectedSize, setSelectedSize] = useState(initialSize ?? "");
  const [selectedColor, setSelectedColor] = useState(initialColor ?? defaultColor);
  const initialVariant = initialColor
    ? (variants.find((v) => materials.find((m) => m.id === v.material_id)?.name === initialColor) ?? variants[0] ?? null)
    : (variants[0] ?? null);
  const [selectedVariant, setSelectedVariant] = useState(initialVariant);
  const [quantity, setQuantity] = useState(1);
  const [qtyStr, setQtyStr] = useState("1");
  const [activeSide, setActiveSide] = useState<string>(() => {
    const imgs = (variants[0]?.images && Object.keys(variants[0].images).length > 0
      ? variants[0].images : product.images) as Record<string, string> ?? {};
    return (Object.keys(imgs)[0] ?? "front") as string;
  });
  const [offsetTopMm, setOffsetTopMm] = useState(0);
  const [itemNote, setItemNote] = useState("");
  const [printPricing, setPrintPricing] = useState<PrintTypePricingRow[]>([]);
  const [layerScales, setLayerScales] = useState<Record<string, number>>({});
  const [removingBg, setRemovingBg] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);

  useEffect(() => {
    fetch("/api/print-type-pricing")
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d)) setPrintPricing(d); })
      .catch(() => {});
  }, []);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (initialLayers && initialLayers.length > 0) setLayersWithRef(initialLayers);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialLayers]);

  useEffect(() => {
    if (!mounted) return;
    const prev = document.body.style.overflow;
    window.scrollTo({ top: 0, behavior: "auto" });
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [mounted]);

  useEffect(() => {
    const images = selectedVariant?.images && Object.keys(selectedVariant.images).length > 0
      ? selectedVariant.images : product.images ?? {};
    const keys = Object.keys(images).filter((key) => (images as Record<string, string>)[key]);
    if (keys.length > 0 && !(images as Record<string, string>)[activeSide]) setActiveSide(keys[0]);
  }, [selectedVariant, product.images, activeSide]);

  // Derived pricing values
  const discountPct = (() => {
    const grid = (product as any).discount_grid as { qty: number; discount_pct: number }[] | undefined;
    if (!grid?.length) return 0;
    const sorted = [...grid].sort((a, b) => b.qty - a.qty);
    return sorted.find((t) => quantity >= t.qty)?.discount_pct ?? 0;
  })();
  const unitPrice = product.base_price_cents / 100;
  const discounted = unitPrice * (1 - discountPct / 100);
  const resolveLayerPrice = (layer: PrintLayer): number =>
    resolveLayerPriceFromHook(layer, quantity, printPricing);
  const printCostPerUnit = layers.reduce((sum, layer) => sum + resolveLayerPrice(layer) / 100, 0);
  const total = (discounted + printCostPerUnit) * quantity;
  const requiresGarmentSize = Array.isArray(product.available_sizes) && product.available_sizes.length > 0;
  const hasIncompletePrintSizes = layers.some((layer) => !layer.sizeLabel);
  const addDisabledReason = requiresGarmentSize && !selectedSize
    ? "Оберіть розмір товару."
    : hasIncompletePrintSizes ? "Оберіть розмір для кожного нанесення." : null;

  const addLayer = (file: File) => addLayerFromHook(file, activeSide, printPricing);
  const addTextLayer = () => addTextLayerFromHook(activeSide, printPricing);

  const layerHandlers = useLayerHandlers({
    activeLayerId, printPricing, quantity, setActiveLayerId, setLayersWithRef, layersRef,
  });

  // Paste handler
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of Array.from(items)) {
        if (item.type.startsWith("image/")) { const f = item.getAsFile(); if (f) { addLayer(f); return; } }
      }
      const text = e.clipboardData?.getData("text/plain") ?? "";
      const svgMatch = text.match(/<svg[\s\S]*<\/svg>/i);
      if (svgMatch) {
        const blob = new Blob([svgMatch[0]], { type: "image/svg+xml" });
        addLayer(new File([blob], "pasted.svg", { type: "image/svg+xml" }));
      }
    };
    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSide]);

  // Auto-capture mockup on side change
  useEffect(() => {
    const timer = setTimeout(() => {
      const dataUrl = captureRef.current?.() ?? "";
      if (dataUrl.startsWith("data:image")) setMockups((prev) => ({ ...prev, [activeSide]: dataUrl }));
    }, 300);
    return () => clearTimeout(timer);
  }, [activeSide]);

  const handleAddToCart = async () => {
    if (addingToCart) return;
    if (requiresGarmentSize && !selectedSize) { toast.error("Оберіть розмір товару"); return; }
    if (hasIncompletePrintSizes) { toast.error("Оберіть розмір для кожного нанесення"); return; }
    setAddingToCart(true);
    try {
      const item = await handleAddToCartFromHook({
        activeSide, mockups, captureRef, layersRef, printPricing, quantity,
        discounted, printCostPerUnit, product, selectedSize, selectedColor,
        itemNote, offsetTopMm,
        printZone: printZones.front ?? printZones.back ?? null,
        requiresGarmentSize, hasIncompletePrintSizes,
      });
      onAdd(item);
    } finally {
      setAddingToCart(false);
    }
  };

  return {
    // refs
    fileInputRef, canvasSaveRef, captureRef, layersRef,
    // state
    mounted, layers, activeLayerId, setActiveLayerId, mockups, setMockups,
    setLayersWithRef, mobileSheet, setMobileSheet,
    selectedSize, setSelectedSize, selectedColor, setSelectedColor,
    selectedVariant, setSelectedVariant,
    quantity, setQuantity, qtyStr, setQtyStr,
    activeSide, setActiveSide, offsetTopMm, setOffsetTopMm,
    itemNote, setItemNote, printPricing, layerScales, setLayerScales,
    removingBg, setRemovingBg, addingToCart,
    // derived
    discountPct, unitPrice, discounted, printCostPerUnit, total,
    requiresGarmentSize, hasIncompletePrintSizes, addDisabledReason,
    // actions
    addLayer, addTextLayer, handleAddToCart, ...layerHandlers,
  };
}
