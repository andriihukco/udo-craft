"use client";

import React, { useRef, useState } from "react";
import type { ProductImage } from "@udo-craft/shared";

// ── Icons (inline SVG to avoid lucide dep in packages/ui) ────────────────────

const GripIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
    <circle cx="5" cy="4" r="1" fill="currentColor"/>
    <circle cx="9" cy="4" r="1" fill="currentColor"/>
    <circle cx="5" cy="7" r="1" fill="currentColor"/>
    <circle cx="9" cy="7" r="1" fill="currentColor"/>
    <circle cx="5" cy="10" r="1" fill="currentColor"/>
    <circle cx="9" cy="10" r="1" fill="currentColor"/>
  </svg>
);

const CanvasIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
    <polyline points="21 15 16 10 5 21"/>
  </svg>
);

const PhotoIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/>
    <circle cx="12" cy="13" r="3"/>
  </svg>
);

const UploadIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
  </svg>
);

const XIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

const PlusIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ProductImageManagerProps {
  images: ProductImage[];
  onChange: (images: ProductImage[]) => void;
  uploadUrl: string;
  uploadTagPrefix?: string;
  disabled?: boolean;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function slugKey(label: string): string {
  return label
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "")
    .slice(0, 32) || `img_${Date.now()}`;
}

function reorder<T>(arr: T[], from: number, to: number): T[] {
  const next = [...arr];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next.map((x, i) => ({ ...(x as object), sort_order: i } as T));
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ProductImageManager({
  images,
  onChange,
  uploadUrl,
  uploadTagPrefix = "product",
  disabled = false,
}: ProductImageManagerProps) {
  const [uploading, setUploading] = useState<Record<number, boolean>>({});
  const fileRefs = useRef<(HTMLInputElement | null)[]>([]);
  const dragFrom = useRef<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);

  // ── Mutations ──────────────────────────────────────────────────────────────

  const update = (index: number, patch: Partial<ProductImage>) => {
    onChange(images.map((img, i) => (i === index ? { ...img, ...patch } : img)));
  };

  const add = () => {
    const next: ProductImage = {
      key: `img_${Date.now()}`,
      url: "",
      label: "",
      is_customizable: false,
      sort_order: images.length,
    };
    onChange([...images, next]);
  };

  const remove = (index: number) => {
    onChange(images.filter((_, i) => i !== index).map((img, i) => ({ ...img, sort_order: i })));
  };

  // ── Upload ─────────────────────────────────────────────────────────────────

  const handleUpload = async (index: number, file: File) => {
    setUploading((p) => ({ ...p, [index]: true }));
    try {
      const fd = new FormData();
      fd.append("files", file);
      fd.append("tags", `${uploadTagPrefix},${images[index]?.key || "image"}`);
      const res = await fetch(uploadUrl, { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      const url = data.results?.[0]?.url ?? data.urls?.[0];
      if (!url) throw new Error("No URL returned");
      update(index, { url });
    } catch (err) {
      console.error("Upload error:", err);
    } finally {
      setUploading((p) => ({ ...p, [index]: false }));
    }
  };

  // ── Drag reorder ───────────────────────────────────────────────────────────

  const onDragStart = (i: number) => { dragFrom.current = i; };
  const onDragOver = (e: React.DragEvent, i: number) => { e.preventDefault(); setDragOver(i); };
  const onDrop = (toIndex: number) => {
    if (dragFrom.current !== null && dragFrom.current !== toIndex) {
      onChange(reorder(images, dragFrom.current, toIndex));
    }
    dragFrom.current = null;
    setDragOver(null);
  };
  const onDragEnd = () => { dragFrom.current = null; setDragOver(null); };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-2">
      {images.length === 0 && (
        <p className="text-xs text-muted-foreground py-3 text-center border border-dashed border-border rounded-lg">
          Немає фотографій. Натисніть «Додати фото».
        </p>
      )}

      {images.map((img, index) => (
        <div
          key={index}
          draggable={!disabled}
          onDragStart={() => onDragStart(index)}
          onDragOver={(e) => onDragOver(e, index)}
          onDrop={() => onDrop(index)}
          onDragEnd={onDragEnd}
          className={`flex items-center gap-2 p-2 rounded-lg border bg-background transition-colors ${
            dragOver === index ? "border-primary bg-primary/5" : "border-border"
          }`}
        >
          {/* Drag handle */}
          <span className="text-muted-foreground cursor-grab shrink-0 touch-none">
            <GripIcon />
          </span>

          {/* Thumbnail */}
          <div
            className="relative shrink-0 w-12 h-12 rounded-md border border-border bg-muted overflow-hidden cursor-pointer hover:border-primary transition-colors"
            onClick={() => !disabled && fileRefs.current[index]?.click()}
            title="Клікніть для завантаження"
          >
            {img.url ? (
              <img src={img.url} alt={img.label || img.key} className="w-full h-full object-contain p-0.5" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground/40">
                <UploadIcon />
              </div>
            )}
            {uploading[index] && (
              <div className="absolute inset-0 bg-background/70 flex items-center justify-center">
                <svg className="w-4 h-4 animate-spin text-primary" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
              </div>
            )}
          </div>
          <input
            ref={(el) => { fileRefs.current[index] = el; }}
            type="file"
            accept="image/*"
            className="hidden"
            disabled={disabled}
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(index, f); e.target.value = ""; }}
          />

          {/* Label */}
          <input
            type="text"
            value={img.label}
            placeholder="Назва (напр. «На моделі»)"
            disabled={disabled}
            onChange={(e) => {
              const label = e.target.value;
              // Auto-update key only if it looks auto-generated
              const autoKey = img.key.startsWith("img_") || img.key === slugKey(img.label);
              update(index, { label, ...(autoKey ? { key: slugKey(label) } : {}) });
            }}
            className="flex-1 min-w-0 h-8 px-2 text-xs rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
          />

          {/* is_customizable toggle */}
          <button
            type="button"
            disabled={disabled}
            onClick={() => update(index, { is_customizable: !img.is_customizable })}
            title={img.is_customizable ? "Сторона для кастомізації (натисніть щоб змінити)" : "Тільки галерея (натисніть щоб змінити)"}
            className={`shrink-0 flex items-center gap-1 px-2 h-8 rounded-md text-[10px] font-semibold border transition-colors ${
              img.is_customizable
                ? "bg-primary/10 border-primary/30 text-primary"
                : "bg-muted border-border text-muted-foreground hover:border-primary/30"
            }`}
          >
            {img.is_customizable ? <CanvasIcon /> : <PhotoIcon />}
            <span className="hidden sm:inline">{img.is_customizable ? "Канвас" : "Галерея"}</span>
          </button>

          {/* Delete */}
          <button
            type="button"
            disabled={disabled}
            onClick={() => remove(index)}
            className="shrink-0 w-7 h-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
            title="Видалити"
          >
            <XIcon />
          </button>
        </div>
      ))}

      <button
        type="button"
        disabled={disabled}
        onClick={add}
        className="w-full flex items-center justify-center gap-1.5 h-8 rounded-lg border border-dashed border-border text-xs text-muted-foreground hover:border-primary hover:text-primary transition-colors disabled:opacity-50"
      >
        <PlusIcon />
        Додати фото
      </button>
    </div>
  );
}
