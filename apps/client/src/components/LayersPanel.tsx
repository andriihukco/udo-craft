"use client";

import React, { useRef, useState, useMemo, useEffect } from "react";
import { GripVertical, Trash2, ImagePlus, Type, Copy, Search, X, ChevronDown } from "lucide-react";
import { PRINT_TYPES, TEXT_FONTS, type PrintLayer, type PrintTypeId, type TextFontId } from "@udo-craft/shared";

export interface PrintTypePricingRow {
  id: string; print_type: string; size_label: string;
  size_min_cm: number; size_max_cm: number;
  qty_tiers: { min_qty: number; price_cents: number }[];
}

function calcPrice(tiers: { min_qty: number; price_cents: number }[], qty: number): number | null {
  if (!tiers.length) return null;
  const sorted = [...tiers].sort((a, b) => b.min_qty - a.min_qty);
  return (sorted.find((t) => qty >= t.min_qty) ?? sorted[sorted.length - 1]).price_cents;
}

function PrintTypeBadge({ typeId, small }: { typeId: string; small?: boolean }) {
  const t = PRINT_TYPES.find((x) => x.id === typeId) ?? PRINT_TYPES[0];
  return (
    <span className={`inline-flex items-center font-semibold rounded-full ${small ? "text-[10px] px-1.5 py-0.5" : "text-xs px-2 py-0.5"}`}
      style={{ color: t.color, backgroundColor: t.bg }}>{t.label}</span>
  );
}

interface LayersPanelProps {
  layers: PrintLayer[];
  activeSide: string;
  sideLabel?: string;
  activeLayerId: string | null;
  onSelect: (id: string | null) => void;
  onDelete: (id: string) => void;
  onDuplicate?: (id: string) => void;
  onRemoveBg?: (id: string, newUrl: string) => void;
  onTypeChange: (id: string, type: PrintTypeId) => void;
  onSizeLabelChange?: (id: string, sizeLabel: string) => void;
  onReorder: (layers: PrintLayer[]) => void;
  onAddClick: () => void;
  onAddText?: () => void;
  onTextChange?: (id: string, patch: Partial<Pick<PrintLayer, "textContent" | "textFont" | "textColor" | "textFontSize" | "textAlign" | "textCurve">>) => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  onFileChange: (file: File) => void;
  pricing?: PrintTypePricingRow[];
  quantity?: number;
  /** scaleX per layer id — used to show live cm size from canvas */
  layerScales?: Record<string, number>;
  /** px_to_mm_ratio from product — needed to convert scale → cm */
  pxToMmRatio?: number;
  disabled?: boolean;
}

export default function LayersPanel({
  layers, activeSide, activeLayerId,
  onSelect, onDelete, onDuplicate, onTypeChange, onSizeLabelChange, onReorder,
  onAddClick, onAddText, onTextChange, fileInputRef, onFileChange, pricing = [], quantity = 1,
  layerScales = {}, pxToMmRatio = 0, disabled = false,
}: LayersPanelProps) {
  const sideLayers = layers.filter((l) => l.side === activeSide);
  const dragItem = useRef<number | null>(null);
  const [dropTarget, setDropTarget] = useState<number | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [fontSearch, setFontSearch] = useState("");
  const [fontOpen, setFontOpen] = useState<string | null>(null);
  const [typeOpen, setTypeOpen] = useState<string | null>(null);
  const [sizeOpen, setSizeOpen] = useState<string | null>(null);

  // Stable refs so the scale-sync effect only re-runs when layerScales actually changes
  const pricingRef = useRef(pricing);
  pricingRef.current = pricing;
  const sideLayersRef = useRef(sideLayers);
  sideLayersRef.current = sideLayers;
  const onSizeLabelChangeRef = useRef(onSizeLabelChange);
  onSizeLabelChangeRef.current = onSizeLabelChange;
  const pxToMmRatioRef = useRef(pxToMmRatio);
  pxToMmRatioRef.current = pxToMmRatio;

  // Auto-update size label when canvas scale changes (canvas → dropdown)
  useEffect(() => {
    const cb = onSizeLabelChangeRef.current;
    const ratio = pxToMmRatioRef.current;
    if (!cb || !ratio) return;
    const CANVAS_SIZE = 520;
    sideLayersRef.current.forEach((layer) => {
      const scale = layerScales[layer.id];
      if (!scale) return;
      const liveCm = Math.round((scale * CANVAS_SIZE * 0.4) / (ratio * 10) * 10) / 10;
      const sizePriceRows = pricingRef.current.filter((r) => r.print_type === layer.type);
      if (!sizePriceRows.length) return;
      const closest = sizePriceRows.reduce((prev, curr) =>
        Math.abs((curr.size_min_cm + curr.size_max_cm) / 2 - liveCm) <
        Math.abs((prev.size_min_cm + prev.size_max_cm) / 2 - liveCm) ? curr : prev
      );
      if (closest?.size_label && closest.size_label !== layer.sizeLabel) {
        cb(layer.id, closest.size_label);
      }
    });
  // Only re-run when scale values change — everything else is accessed via refs
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layerScales]);

  const filteredFonts = useMemo(() =>
    TEXT_FONTS.filter((f) => f.label.toLowerCase().includes(fontSearch.toLowerCase())),
    [fontSearch]);

  const handleDragStart = (e: React.DragEvent, idx: number, id: string) => {
    dragItem.current = idx; setDraggingId(id); e.dataTransfer.effectAllowed = "move";
  };
  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setDropTarget(e.clientY < rect.top + rect.height / 2 ? idx : idx + 1);
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const from = dragItem.current; const to = dropTarget;
    setDraggingId(null); setDropTarget(null); dragItem.current = null;
    if (from === null || to === null || from === to || from === to - 1) return;
    doReorder(from, to);
  };
  const handleDragEnd = () => { setDraggingId(null); setDropTarget(null); dragItem.current = null; };

  const touchDragIdx = useRef<number | null>(null);
  const touchGhost = useRef<HTMLDivElement | null>(null);
  const touchMoved = useRef(false);

  const onTouchStart = (e: React.TouchEvent, idx: number) => {
    touchDragIdx.current = idx; touchMoved.current = false; setDraggingId(sideLayers[idx].id);
    const ghost = document.createElement("div");
    ghost.style.cssText = `position:fixed;z-index:9999;pointer-events:none;opacity:0.9;background:white;border:2px solid var(--color-primary);border-radius:10px;padding:8px 12px;font-size:12px;font-weight:600;box-shadow:0 8px 24px rgba(0,0,0,0.18);transform:translate(-50%,-50%);left:${e.touches[0].clientX}px;top:${e.touches[0].clientY}px;`;
    const l = sideLayers[idx]; ghost.textContent = l.kind === "text" ? (l.textContent ?? "Текст") : (l.file?.name ?? "Шар");
    document.body.appendChild(ghost); touchGhost.current = ghost;
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (touchDragIdx.current === null) return;
    touchMoved.current = true; e.preventDefault();
    const touch = e.touches[0];
    if (touchGhost.current) { touchGhost.current.style.left = `${touch.clientX}px`; touchGhost.current.style.top = `${touch.clientY}px`; }
    const el = document.elementFromPoint(touch.clientX, touch.clientY);
    const item = el?.closest("[data-layer-idx]");
    if (item) {
      const targetIdx = parseInt(item.getAttribute("data-layer-idx") ?? "0", 10);
      const rect = item.getBoundingClientRect();
      setDropTarget(touch.clientY < rect.top + rect.height / 2 ? targetIdx : targetIdx + 1);
    }
  };
  const onTouchEnd = () => {
    if (touchGhost.current) { document.body.removeChild(touchGhost.current); touchGhost.current = null; }
    const from = touchDragIdx.current; const to = dropTarget;
    touchDragIdx.current = null; setDraggingId(null); setDropTarget(null);
    if (touchMoved.current && from !== null && to !== null && from !== to && from !== to - 1) doReorder(from, to);
  };

  const doReorder = (from: number, to: number) => {
    const ids = sideLayers.map((l) => l.id);
    const reordered = [...ids];
    const [moved] = reordered.splice(from, 1);
    reordered.splice(to > from ? to - 1 : to, 0, moved);
    onReorder([...layers.filter((l) => l.side !== activeSide), ...reordered.map((id) => layers.find((l) => l.id === id)!)]);
  };

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <button type="button" onClick={onAddClick} disabled={disabled}
          className="flex flex-col items-center justify-center gap-1.5 h-24 rounded-xl border-2 border-dashed border-border bg-card hover:border-primary/60 hover:bg-primary/5 transition-all group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-border disabled:hover:bg-card">
          <div className="size-8 rounded-lg bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors">
            <ImagePlus className="size-4 text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
          <span className="text-[11px] font-semibold text-muted-foreground group-hover:text-primary transition-colors">Зображення</span>
        </button>
        {onAddText ? (
          <button type="button" onClick={onAddText} disabled={disabled}
            className="flex flex-col items-center justify-center gap-1.5 h-24 rounded-xl border-2 border-dashed border-border bg-card hover:border-primary/60 hover:bg-primary/5 transition-all group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-border disabled:hover:bg-card">
            <div className="size-8 rounded-lg bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors">
              <Type className="size-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
            <span className="text-[11px] font-semibold text-muted-foreground group-hover:text-primary transition-colors">Текст</span>
          </button>
        ) : (
          <div className="h-24 rounded-xl border-2 border-dashed border-border/30 bg-muted/20" />
        )}
      </div>
      <input ref={fileInputRef} type="file" accept=".png,.svg,.pdf,.jpg,.jpeg" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onFileChange(f); e.target.value = ""; }} />

      {sideLayers.length > 0 && (
        <div onDrop={handleDrop} className="space-y-1">
          {dropTarget === 0 && <div className="h-0.5 bg-primary rounded-full mx-1" />}
          {sideLayers.map((layer, idx) => {
            const isActive = activeLayerId === layer.id;
            const sizeLabel = (layer as any).sizeLabel as string | undefined;
            const sizePriceRows = pricing.filter((r) => r.print_type === layer.type);
            const isText = layer.kind === "text";
            const currentFont = TEXT_FONTS.find((f) => f.id === (layer.textFont ?? "Montserrat")) ?? TEXT_FONTS[0];

            return (
              <div key={layer.id} data-layer-idx={idx}>
                <div
                  draggable onDragStart={(e) => handleDragStart(e, idx, layer.id)}
                  onDragOver={(e) => handleDragOver(e, idx)} onDragEnd={handleDragEnd}
                  onClick={() => onSelect(isActive ? null : layer.id)}
                  role="button" aria-pressed={isActive}
                  className={[
                    "relative rounded-xl border cursor-pointer select-none transition-all",
                    draggingId === layer.id ? "opacity-30 scale-95" : "",
                    isActive
                      ? isText ? "border-violet-400 shadow-sm shadow-violet-100 bg-violet-50/50" : "border-primary shadow-sm bg-primary/5"
                      : "border-border bg-card hover:border-border/60 hover:shadow-sm",
                  ].join(" ")}
                >
                  <div className="flex items-center gap-0 p-2">
                    <div className="flex items-center justify-center w-7 shrink-0 self-stretch text-muted-foreground/25 hover:text-muted-foreground/60 cursor-grab active:cursor-grabbing transition-colors touch-none"
                      onMouseDown={(e) => e.stopPropagation()}
                      onTouchStart={(e) => onTouchStart(e, idx)} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
                      <GripVertical className="size-3.5" />
                    </div>
                    <div className="size-10 rounded-lg overflow-hidden shrink-0 flex items-center justify-center border border-border/40"
                      style={{ background: "repeating-conic-gradient(#e5e7eb 0% 25%, transparent 0% 50%) 0 0 / 8px 8px" }}>
                      {isText ? (
                        <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
                          <text x="50%" y="55%" dominantBaseline="middle" textAnchor="middle"
                            fontFamily={`'${layer.textFont ?? "Montserrat"}', sans-serif`}
                            fontSize="16" fill={layer.textColor ?? "#000000"}>
                            {(layer.textContent ?? "T").replace(/\n/g, " ").slice(0, 3)}
                          </text>
                        </svg>
                      ) : (
                        <img src={layer.url} alt="" className="size-full object-contain" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0 px-2">
                      <p className="text-xs font-medium truncate leading-tight text-foreground">
                        {isText ? (layer.textContent?.replace(/\n/g, " ").slice(0, 24) || "Текст") : layer.file?.name}
                      </p>
                      <div className="flex items-center gap-1 mt-0.5">
                        {isText ? (
                          <span className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-full font-semibold bg-violet-100 text-violet-700">
                            <Type className="size-2.5" /> Текст
                          </span>
                        ) : (
                          <PrintTypeBadge typeId={layer.type} small />
                        )}
                      </div>
                    </div>
                    <div className="flex items-center shrink-0" onPointerDown={(e) => e.stopPropagation()}>
                      {onDuplicate && (
                        <button type="button" onClick={(e) => { e.stopPropagation(); onDuplicate(layer.id); }} title="Дублювати"
                          className="size-8 flex items-center justify-center rounded-lg text-muted-foreground/40 hover:text-primary hover:bg-primary/10 transition-all">
                          <Copy className="size-3.5" />
                        </button>
                      )}
                      <button type="button" onClick={(e) => { e.stopPropagation(); onDelete(layer.id); }} aria-label="Видалити шар"
                        className="size-8 flex items-center justify-center rounded-lg text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 transition-all">
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </div>
                  {isActive && <div className={`absolute left-0 top-2 bottom-2 w-0.5 rounded-full ${isText ? "bg-violet-500" : "bg-primary"}`} />}
                </div>

                {isActive && (
                  <div className="mt-1 rounded-xl border border-border bg-card overflow-visible">
                    {/* ── Type + Size — always first ── */}
                    <div className="p-3 space-y-2 border-b border-border">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Тип нанесення</label>
                          <div className="relative">
                            <button type="button" onClick={() => { setTypeOpen(typeOpen === layer.id ? null : layer.id); setSizeOpen(null); }}
                              className="w-full flex items-center justify-between gap-2 h-9 px-3 rounded-lg border border-border bg-background hover:border-primary/50 transition-colors text-left">
                              <span className="text-sm truncate">{PRINT_TYPES.find(t => t.id === layer.type)?.label ?? layer.type}</span>
                              <ChevronDown className={`size-3.5 text-muted-foreground transition-transform shrink-0 ${typeOpen === layer.id ? "rotate-180" : ""}`} />
                            </button>
                            {typeOpen === layer.id && (
                              <div className="absolute bottom-full left-0 right-0 mb-1 rounded-xl border border-border bg-card shadow-lg overflow-hidden z-50">
                                <div className="max-h-48 overflow-y-auto">
                                  {PRINT_TYPES.map((t) => (
                                    <button key={t.id} type="button"
                                      onClick={() => { onTypeChange(layer.id, t.id as PrintTypeId); setTypeOpen(null); }}
                                      className={`w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-muted/60 transition-colors text-sm ${layer.type === t.id ? "bg-primary/5 text-primary" : ""}`}>
                                      {t.label}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                        {sizePriceRows.length > 0 && onSizeLabelChange && (() => {
                          const selectedRow = sizePriceRows.find(r => r.size_label === sizeLabel);
                          return (
                            <div className="space-y-1">
                              <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Розмір нанесення</label>
                              <div className="relative">
                                <button type="button" onClick={() => { setSizeOpen(sizeOpen === layer.id ? null : layer.id); setTypeOpen(null); }}
                                  className="w-full flex items-center justify-between gap-2 h-9 px-3 rounded-lg border border-border bg-background hover:border-primary/50 transition-colors text-left">
                                  <span className="text-sm truncate">{selectedRow ? selectedRow.size_label : "Розмір"}</span>
                                  <ChevronDown className={`size-3.5 text-muted-foreground transition-transform shrink-0 ${sizeOpen === layer.id ? "rotate-180" : ""}`} />
                                </button>
                                {sizeOpen === layer.id && (
                                  <div className="absolute bottom-full left-0 right-0 mb-1 rounded-xl border border-border bg-card shadow-lg overflow-hidden z-50">
                                    <div className="max-h-48 overflow-y-auto">
                                      {sizePriceRows.map((r) => {
                                        const p = calcPrice(r.qty_tiers, quantity);
                                        return (
                                          <button key={r.size_label} type="button"
                                            onClick={() => { onSizeLabelChange(layer.id, r.size_label ?? ""); setSizeOpen(null); }}
                                            className={`w-full flex items-center justify-between px-3 py-2 text-left hover:bg-muted/60 transition-colors gap-2 ${sizeLabel === r.size_label ? "bg-primary/5 text-primary" : ""}`}>
                                            <span className="text-sm font-medium">{r.size_label}</span>
                                            {p ? <span className="text-xs text-muted-foreground shrink-0">{(p / 100).toFixed(0)} ₴/шт</span> : null}
                                          </button>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    </div>

                    {/* ── Text config (text layers only) ── */}
                    {isText && onTextChange && (
                      <div className="p-3 space-y-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Текст</label>
                          <textarea value={layer.textContent ?? ""} onChange={(e) => onTextChange(layer.id, { textContent: e.target.value })}
                            placeholder="Введіть текст..." rows={3}
                            className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary transition-shadow resize-none" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Шрифт</label>
                          <button type="button" onClick={() => setFontOpen(fontOpen === layer.id ? null : layer.id)}
                            className="w-full flex items-center justify-between gap-2 h-9 px-3 rounded-lg border border-border bg-background hover:border-primary/50 transition-colors text-left">
                            <span className="text-sm truncate" style={{ fontFamily: `'${currentFont.id}', ${currentFont.style}` }}>{currentFont.label}</span>
                            <ChevronDown className={`size-3.5 text-muted-foreground transition-transform shrink-0 ${fontOpen === layer.id ? "rotate-180" : ""}`} />
                          </button>
                          {fontOpen === layer.id && (
                            <div className="rounded-xl border border-border bg-card shadow-lg overflow-hidden">
                              <div className="p-2 border-b border-border">
                                <div className="relative">
                                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                                  <input type="text" value={fontSearch} onChange={(e) => setFontSearch(e.target.value)}
                                    placeholder="Пошук шрифту..."
                                    className="w-full h-8 pl-8 pr-8 text-xs rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                                    autoFocus />
                                  {fontSearch && (
                                    <button type="button" onClick={() => setFontSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                                      <X className="size-3.5" />
                                    </button>
                                  )}
                                </div>
                              </div>
                              <div className="max-h-48 overflow-y-auto">
                                {filteredFonts.length === 0 ? (
                                  <p className="text-xs text-muted-foreground text-center py-4">Нічого не знайдено</p>
                                ) : filteredFonts.map((font) => (
                                  <button key={font.id} type="button"
                                    onClick={() => { onTextChange(layer.id, { textFont: font.id as TextFontId }); setFontOpen(null); setFontSearch(""); }}
                                    className={`w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-muted/60 transition-colors ${(layer.textFont ?? "Montserrat") === font.id ? "bg-primary/5 text-primary" : ""}`}>
                                    <span className="text-sm" style={{ fontFamily: `'${font.id}', ${font.style}` }}>{font.label}</span>
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="space-y-3">
                          <div className="space-y-1">
                            <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Вирівнювання</label>
                            <div className="flex gap-1">
                              {(["left","center","right"] as const).map((a) => (
                                <button key={a} type="button" onClick={() => onTextChange(layer.id, { textAlign: a })}
                                  className={`flex-1 h-8 flex items-center justify-center rounded-lg border transition-all ${(layer.textAlign ?? "center") === a ? "border-primary bg-primary/5 text-primary" : "border-border hover:border-primary/30 text-muted-foreground"}`}>
                                  {a === "left"   && <svg className="size-3.5" viewBox="0 0 16 16" fill="currentColor"><rect x="1" y="2" width="14" height="2" rx="1"/><rect x="1" y="6" width="9" height="2" rx="1"/><rect x="1" y="10" width="12" height="2" rx="1"/><rect x="1" y="14" width="7" height="2" rx="1"/></svg>}
                                  {a === "center" && <svg className="size-3.5" viewBox="0 0 16 16" fill="currentColor"><rect x="1" y="2" width="14" height="2" rx="1"/><rect x="3.5" y="6" width="9" height="2" rx="1"/><rect x="2" y="10" width="12" height="2" rx="1"/><rect x="4.5" y="14" width="7" height="2" rx="1"/></svg>}
                                  {a === "right"  && <svg className="size-3.5" viewBox="0 0 16 16" fill="currentColor"><rect x="1" y="2" width="14" height="2" rx="1"/><rect x="6" y="6" width="9" height="2" rx="1"/><rect x="3" y="10" width="12" height="2" rx="1"/><rect x="8" y="14" width="7" height="2" rx="1"/></svg>}
                                </button>
                              ))}
                            </div>
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Колір</label>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {["#000000","#ffffff","#ef4444","#f97316","#eab308","#22c55e","#3b82f6","#8b5cf6","#ec4899","#06b6d4","#1B3BFF","#6b7280"].map((color) => (
                                <button key={color} type="button" title={color}
                                  onClick={() => onTextChange(layer.id, { textColor: color })}
                                  className={`size-6 rounded-full border-2 transition-all shrink-0 ${(layer.textColor ?? "#000000") === color ? "border-primary scale-110 shadow-sm" : "border-transparent hover:scale-105"} ${color === "#ffffff" ? "ring-1 ring-border" : ""}`}
                                  style={{ backgroundColor: color }} />
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                {dropTarget === idx + 1 && <div className="h-0.5 bg-primary rounded-full mx-1 mt-1" />}
              </div>
            );
          })}
          <div className="h-3" onDragOver={(e) => { e.preventDefault(); setDropTarget(sideLayers.length); }} />
        </div>
      )}
    </div>
  );
}
