"use client";

import React from "react";
import { ImagePlus, Type } from "lucide-react";
import { PRINT_TYPES, type PrintLayer, type PrintTypeId } from "./print-types";
import LayersList from "./layers-list";
import type { LayersListProps } from "./layers-list";

export function PrintTypeBadge({ typeId, small }: { typeId: string; small?: boolean }) {
  const t = PRINT_TYPES.find((x) => x.id === typeId) ?? PRINT_TYPES[0];
  return (
    <span className={`inline-flex items-center font-semibold rounded-full ${small ? "text-[10px] px-1.5 py-0.5" : "text-xs px-2 py-0.5"}`}
      style={{ color: t.color, backgroundColor: t.bg }}>{t.label}</span>
  );
}

interface LayersPanelProps extends LayersListProps {
  onAddClick: () => void;
  onAddText?: () => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  onFileChange: (file: File) => void;
}

export default function LayersPanel({
  onAddClick, onAddText, fileInputRef, onFileChange,
  ...listProps
}: LayersPanelProps) {
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <button type="button" onClick={onAddClick}
          className="flex flex-col items-center justify-center gap-1.5 h-24 rounded-xl border-2 border-dashed border-border bg-card hover:border-primary/60 hover:bg-primary/5 transition-all group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
          <div className="size-8 rounded-lg bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors">
            <ImagePlus className="size-4 text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
          <span className="text-[11px] font-semibold text-muted-foreground group-hover:text-primary transition-colors">Зображення</span>
        </button>
        {onAddText ? (
          <button type="button" onClick={onAddText}
            className="flex flex-col items-center justify-center gap-1.5 h-24 rounded-xl border-2 border-dashed border-border bg-card hover:border-primary/60 hover:bg-primary/5 transition-all group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
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

      <LayersList {...listProps} />
    </div>
  );
}
