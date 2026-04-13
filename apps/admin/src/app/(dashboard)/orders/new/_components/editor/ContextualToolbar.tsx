"use client";

/**
 * ContextualToolbar — appears above the canvas when a layer is selected.
 * Shows layer-type-specific controls + generic actions.
 * Desktop: horizontal bar. Mobile: bottom sheet.
 */

import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlignCenter as AlignCenterIcon,
  AlignLeft as AlignLeftIcon,
  AlignRight as AlignRightIcon,
  Bold,
  BringToFront,
  Copy,
  FlipHorizontal,
  Italic,
  MoveHorizontal,
  Pencil,
  SendToBack,
  Trash2,
  X,
} from "lucide-react";
import { TEXT_FONTS, type PrintLayer, type TextFontId } from "@udo-craft/shared";
import type { TextLayerPatch } from "./TextPanel";
import type { PrintTypePricingRow } from "@udo-craft/shared";

// ── Types ─────────────────────────────────────────────────────────────────

interface ContextualToolbarProps {
  layer: PrintLayer | null;
  layers: PrintLayer[];
  activeSide: string;
  fabricCanvasRef: React.RefObject<import("fabric").fabric.Canvas | null>;
  onTextChange: (id: string, patch: TextLayerPatch) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onLayerReorder: (layers: PrintLayer[]) => void;
  onRemoveBg?: (id: string, newUrl: string) => void;
  onOpenDrawingStudio?: (layerId: string) => void;
  printPricing: PrintTypePricingRow[];
  quantity: number;
}

type LayerKind = "text" | "svg" | "raster" | "drawing-hand" | "drawing-ai";

function getLayerType(layer: PrintLayer): LayerKind {
  if (layer.kind === "text") return "text";
  if (layer.kind === "drawing") return "drawing-hand";
  const isSvg =
    layer.file?.type === "image/svg+xml" ||
    layer.url?.includes(".svg") ||
    layer.uploadedUrl?.includes(".svg") ||
    layer.svgFillColor !== undefined;
  if (isSvg) return "svg";
  return "raster";
}

// ── Small helpers ─────────────────────────────────────────────────────────

function ToolBtn({
  onClick,
  title,
  active,
  danger,
  children,
}: {
  onClick: () => void;
  title: string;
  active?: boolean;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={[
        "size-8 flex items-center justify-center rounded-lg border transition-all shrink-0",
        active
          ? "bg-primary text-primary-foreground border-primary"
          : danger
          ? "border-border text-muted-foreground hover:text-destructive hover:border-destructive/40 hover:bg-destructive/5"
          : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 hover:bg-muted/60",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <div className="w-px h-6 bg-border shrink-0" />;
}

function OpacityControl({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center gap-1.5 shrink-0">
      <span className="text-[10px] text-muted-foreground whitespace-nowrap">Прозорість</span>
      <input
        type="range"
        min={0}
        max={100}
        value={Math.round(value * 100)}
        onChange={(e) => onChange(Number(e.target.value) / 100)}
        className="w-20 h-1.5 accent-primary"
      />
      <span className="text-[10px] text-muted-foreground w-7 text-right">{Math.round(value * 100)}%</span>
    </div>
  );
}

function ColorSwatch({
  value,
  onChange,
  title,
}: {
  value: string;
  onChange: (v: string) => void;
  title: string;
}) {
  const [open, setOpen] = useState(false);
  const SWATCHES = [
    "#000000", "#ffffff", "#ef4444", "#f97316",
    "#eab308", "#22c55e", "#3b82f6", "#8b5cf6",
    "#ec4899", "#06b6d4", "#6366f1", "#6b7280",
  ];
  return (
    <div className="relative shrink-0">
      <button
        type="button"
        title={title}
        onClick={() => setOpen((v) => !v)}
        className="size-8 rounded-lg border-2 border-border hover:border-primary/50 transition-all"
        style={{ backgroundColor: value }}
      />
      {open && (
        <div className="absolute top-full left-0 mt-1 z-50 bg-card border border-border rounded-xl shadow-lg p-2 w-44">
          <div className="flex items-center gap-1.5 mb-2">
            <input
              type="color"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className="w-7 h-7 rounded border border-input cursor-pointer p-0.5 bg-background"
            />
            <input
              type="text"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className="flex-1 text-xs rounded border border-input bg-background px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary font-mono"
            />
            <button type="button" onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
              <X className="size-3.5" />
            </button>
          </div>
          <div className="flex gap-1 flex-wrap">
            {SWATCHES.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => { onChange(s); setOpen(false); }}
                style={{ backgroundColor: s }}
                className={[
                  "w-5 h-5 rounded border transition-all",
                  value === s ? "border-primary ring-1 ring-primary" : "border-border",
                  s === "#ffffff" ? "border-border" : "",
                ].join(" ")}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function FontSelect({
  value,
  onChange,
}: {
  value: TextFontId;
  onChange: (v: TextFontId) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const filtered = TEXT_FONTS.filter((f) =>
    !search || f.label.toLowerCase().includes(search.toLowerCase())
  );
  const current = TEXT_FONTS.find((f) => f.id === value) ?? TEXT_FONTS[0];

  return (
    <div className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="h-8 px-2.5 rounded-lg border border-border bg-background hover:border-primary/50 transition-colors text-xs font-medium flex items-center gap-1.5 max-w-[120px]"
        style={{ fontFamily: current.id }}
      >
        <span className="truncate">{current.label}</span>
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 z-50 bg-card border border-border rounded-xl shadow-lg w-48 overflow-hidden">
          <div className="p-2 border-b border-border">
            <input
              type="text"
              placeholder="Пошук…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
              className="w-full text-xs rounded-lg border border-input bg-background px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div className="max-h-48 overflow-y-auto">
            {filtered.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => { onChange(f.id as TextFontId); setOpen(false); setSearch(""); }}
                style={{ fontFamily: f.id }}
                className={[
                  "w-full text-left px-3 py-1.5 text-sm hover:bg-muted/60 transition-colors",
                  value === f.id ? "bg-primary/5 text-primary" : "",
                ].join(" ")}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Type-specific controls ────────────────────────────────────────────────

function TextControls({
  layer,
  fabricCanvasRef,
  onTextChange,
}: {
  layer: PrintLayer;
  fabricCanvasRef: React.RefObject<import("fabric").fabric.Canvas | null>;
  onTextChange: (id: string, patch: TextLayerPatch) => void;
}) {
  const patch = (p: TextLayerPatch) => onTextChange(layer.id, p);
  const canvas = fabricCanvasRef.current;
  const currentSize = layer.textFontSize ?? 36;

  return (
    <>
      <FontSelect
        value={(layer.textFont ?? "Montserrat") as TextFontId}
        onChange={(v) => patch({ textFont: v })}
      />
      <div className="flex items-center gap-0.5 shrink-0">
        <button type="button" onClick={() => patch({ textFontSize: Math.max(8, currentSize - 2) })}
          className="size-6 flex items-center justify-center rounded border border-border text-muted-foreground hover:text-foreground hover:bg-muted/60 text-xs font-bold transition-all">−</button>
        <input
          type="number"
          min={8}
          max={200}
          value={currentSize}
          onChange={(e) => patch({ textFontSize: Number(e.target.value) })}
          className="w-12 text-xs text-center rounded border border-input bg-background px-1 py-1 focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <button type="button" onClick={() => patch({ textFontSize: Math.min(200, currentSize + 2) })}
          className="size-6 flex items-center justify-center rounded border border-border text-muted-foreground hover:text-foreground hover:bg-muted/60 text-xs font-bold transition-all">+</button>
      </div>
      <ToolBtn title="Жирний" active={!!layer.textBold} onClick={() => patch({ textBold: !layer.textBold })}>
        <Bold className="size-3.5" />
      </ToolBtn>
      <ToolBtn title="Курсив" active={!!layer.textItalic} onClick={() => patch({ textItalic: !layer.textItalic })}>
        <Italic className="size-3.5" />
      </ToolBtn>
      <ColorSwatch
        value={layer.textColor ?? "#000000"}
        onChange={(v) => patch({ textColor: v })}
        title="Колір тексту"
      />
      <ToolBtn title="Ліво" active={(layer.textAlign ?? "center") === "left"} onClick={() => patch({ textAlign: "left" })}>
        <AlignLeftIcon className="size-3.5" />
      </ToolBtn>
      <ToolBtn title="Центр" active={(layer.textAlign ?? "center") === "center"} onClick={() => patch({ textAlign: "center" })}>
        <AlignCenterIcon className="size-3.5" />
      </ToolBtn>
      <ToolBtn title="Право" active={(layer.textAlign ?? "center") === "right"} onClick={() => patch({ textAlign: "right" })}>
        <AlignRightIcon className="size-3.5" />
      </ToolBtn>
      <div className="flex items-center gap-1.5 shrink-0">
        <span className="text-[10px] text-muted-foreground whitespace-nowrap">Дуга</span>
        <input
          type="range"
          min={-180}
          max={180}
          value={layer.textCurve ?? 0}
          onChange={(e) => patch({ textCurve: Number(e.target.value) })}
          className="w-20 h-1.5 accent-primary"
        />
        <span className="text-[10px] text-muted-foreground w-8 text-right">{layer.textCurve ?? 0}°</span>
      </div>
      <OpacityControl
        value={layer.opacity ?? 1}
        onChange={(v) => {
          patch({ opacity: v } as TextLayerPatch);
          const obj = canvas?.getActiveObject();
          if (obj) { obj.set("opacity", v); canvas?.renderAll(); }
        }}
      />
    </>
  );
}

function SvgControls({
  layer,
  fabricCanvasRef,
  onTextChange,
}: {
  layer: PrintLayer;
  fabricCanvasRef: React.RefObject<import("fabric").fabric.Canvas | null>;
  onTextChange: (id: string, patch: TextLayerPatch) => void;
}) {
  const canvas = fabricCanvasRef.current;
  return (
    <>
      <span className="text-[10px] text-muted-foreground whitespace-nowrap">Заливка</span>
      <ColorSwatch
        value={layer.svgFillColor ?? "#000000"}
        onChange={(v) => onTextChange(layer.id, { svgFillColor: v } as TextLayerPatch)}
        title="Колір заливки"
      />
      <span className="text-[10px] text-muted-foreground whitespace-nowrap">Обводка</span>
      <ColorSwatch
        value={layer.svgStrokeColor ?? "#000000"}
        onChange={(v) => onTextChange(layer.id, { svgStrokeColor: v } as TextLayerPatch)}
        title="Колір обводки"
      />
      <OpacityControl
        value={layer.opacity ?? 1}
        onChange={(v) => {
          onTextChange(layer.id, { opacity: v } as TextLayerPatch);
          const obj = canvas?.getActiveObject();
          if (obj) { obj.set("opacity", v); canvas?.renderAll(); }
        }}
      />
    </>
  );
}

function RasterControls({
  layer,
  fabricCanvasRef,
  onTextChange,
  onRemoveBg,
}: {
  layer: PrintLayer;
  fabricCanvasRef: React.RefObject<import("fabric").fabric.Canvas | null>;
  onTextChange: (id: string, patch: TextLayerPatch) => void;
  onRemoveBg?: (id: string, newUrl: string) => void;
}) {
  const canvas = fabricCanvasRef.current;
  return (
    <>
      <OpacityControl
        value={layer.opacity ?? 1}
        onChange={(v) => {
          onTextChange(layer.id, { opacity: v } as TextLayerPatch);
          const obj = canvas?.getActiveObject();
          if (obj) { obj.set("opacity", v); canvas?.renderAll(); }
        }}
      />
      {onRemoveBg && (
        <button
          type="button"
          onClick={() => onRemoveBg(layer.id, layer.url)}
          className="h-8 px-3 rounded-lg border border-border text-xs font-medium text-muted-foreground hover:text-foreground hover:border-foreground/30 hover:bg-muted/60 transition-all whitespace-nowrap shrink-0"
        >
          Видалити фон
        </button>
      )}
    </>
  );
}

function DrawingControls({
  layer,
  fabricCanvasRef,
  onTextChange,
  onOpenDrawingStudio,
}: {
  layer: PrintLayer;
  fabricCanvasRef: React.RefObject<import("fabric").fabric.Canvas | null>;
  onTextChange: (id: string, patch: TextLayerPatch) => void;
  onOpenDrawingStudio?: (layerId: string) => void;
}) {
  const canvas = fabricCanvasRef.current;
  return (
    <>
      {onOpenDrawingStudio && (
        <button
          type="button"
          onClick={() => onOpenDrawingStudio(layer.id)}
          className="h-8 px-3 rounded-lg border border-border text-xs font-medium text-muted-foreground hover:text-foreground hover:border-foreground/30 hover:bg-muted/60 transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0"
        >
          <Pencil className="size-3.5" />
          Редагувати малюнок
        </button>
      )}
      <OpacityControl
        value={layer.opacity ?? 1}
        onChange={(v) => {
          onTextChange(layer.id, { opacity: v } as TextLayerPatch);
          const obj = canvas?.getActiveObject();
          if (obj) { obj.set("opacity", v); canvas?.renderAll(); }
        }}
      />
    </>
  );
}

// ── Main component ────────────────────────────────────────────────────────

export default function ContextualToolbar({
  layer,
  layers,
  activeSide,
  fabricCanvasRef,
  onTextChange,
  onDelete,
  onDuplicate,
  onLayerReorder,
  onRemoveBg,
  onOpenDrawingStudio,
}: ContextualToolbarProps) {
  const canvas = fabricCanvasRef.current;

  const handleCenter = () => {
    const obj = canvas?.getActiveObject();
    if (obj) { obj.center(); canvas?.renderAll(); }
  };

  const handleFlipH = () => {
    const obj = canvas?.getActiveObject();
    if (obj) { obj.set("flipX", !obj.flipX); canvas?.renderAll(); }
  };

  const handleBringForward = () => {
    const obj = canvas?.getActiveObject();
    if (obj && layer) {
      canvas?.bringForward(obj);
      canvas?.renderAll();
      const sideLayers = layers.filter((l) => l.side === activeSide);
      const otherLayers = layers.filter((l) => l.side !== activeSide);
      const idx = sideLayers.findIndex((l) => l.id === layer.id);
      if (idx < sideLayers.length - 1) {
        const next = [...sideLayers];
        [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
        onLayerReorder([...otherLayers, ...next]);
      }
    }
  };

  const handleSendBackward = () => {
    const obj = canvas?.getActiveObject();
    if (obj && layer) {
      canvas?.sendBackwards(obj);
      canvas?.renderAll();
      const sideLayers = layers.filter((l) => l.side === activeSide);
      const otherLayers = layers.filter((l) => l.side !== activeSide);
      const idx = sideLayers.findIndex((l) => l.id === layer.id);
      if (idx > 0) {
        const next = [...sideLayers];
        [next[idx], next[idx - 1]] = [next[idx - 1], next[idx]];
        onLayerReorder([...otherLayers, ...next]);
      }
    }
  };

  const layerType = layer ? getLayerType(layer) : null;

  const typeControls = layer && layerType ? (
    <>
      <Divider />
      {layerType === "text" && (
        <TextControls layer={layer} fabricCanvasRef={fabricCanvasRef} onTextChange={onTextChange} />
      )}
      {layerType === "svg" && (
        <SvgControls layer={layer} fabricCanvasRef={fabricCanvasRef} onTextChange={onTextChange} />
      )}
      {layerType === "raster" && (
        <RasterControls layer={layer} fabricCanvasRef={fabricCanvasRef} onTextChange={onTextChange} onRemoveBg={onRemoveBg} />
      )}
      {(layerType === "drawing-hand" || layerType === "drawing-ai") && (
        <DrawingControls layer={layer} fabricCanvasRef={fabricCanvasRef} onTextChange={onTextChange} onOpenDrawingStudio={onOpenDrawingStudio} />
      )}
    </>
  ) : null;

  const desktopBar = (
    <AnimatePresence>
      {layer && (
        <motion.div
          key="toolbar"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.15 }}
          className="hidden md:flex items-center gap-1 px-3 py-2 bg-card border border-border rounded-2xl shadow-sm overflow-x-auto max-w-full mb-2"
        >
          <ToolBtn title="Центрувати" onClick={handleCenter}>
            <MoveHorizontal className="size-3.5" />
          </ToolBtn>
          <ToolBtn title="Відзеркалити" onClick={handleFlipH}>
            <FlipHorizontal className="size-3.5" />
          </ToolBtn>
          <ToolBtn title="Дублювати" onClick={() => onDuplicate(layer.id)}>
            <Copy className="size-3.5" />
          </ToolBtn>
          <ToolBtn title="Видалити" danger onClick={() => onDelete(layer.id)}>
            <Trash2 className="size-3.5" />
          </ToolBtn>
          {typeControls}
        </motion.div>
      )}
    </AnimatePresence>
  );

  const mobileSheet = (
    <AnimatePresence>
      {layer && (
        <motion.div
          key="mobile-toolbar"
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="md:hidden fixed bottom-0 left-0 right-0 z-[9996] bg-card border-t border-border pb-[env(safe-area-inset-bottom)]"
        >
          <div className="flex justify-center pt-2 pb-1">
            <div className="w-8 h-1 rounded-full bg-border" />
          </div>
          <div className="flex items-center gap-1.5 px-3 pb-3 overflow-x-auto">
            <ToolBtn title="Центрувати" onClick={handleCenter}>
              <MoveHorizontal className="size-3.5" />
            </ToolBtn>
            <ToolBtn title="Відзеркалити" onClick={handleFlipH}>
              <FlipHorizontal className="size-3.5" />
            </ToolBtn>
            <ToolBtn title="Дублювати" onClick={() => onDuplicate(layer.id)}>
              <Copy className="size-3.5" />
            </ToolBtn>
            <ToolBtn title="Видалити" danger onClick={() => onDelete(layer.id)}>
              <Trash2 className="size-3.5" />
            </ToolBtn>
            {typeControls}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <>
      {desktopBar}
      {mobileSheet}
    </>
  );
}
