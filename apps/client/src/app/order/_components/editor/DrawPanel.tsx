"use client";

import React, { useCallback, useState } from "react";
import { Palette } from "lucide-react";
import type { PrintLayer } from "@udo-craft/shared";
import type { AiQuotaState } from "@/hooks/useAiQuota";
import DrawingModal from "./DrawingModal";

export interface DrawPanelProps {
  fabricCanvasRef: React.RefObject<import("fabric").fabric.Canvas | null>;
  layers: PrintLayer[];
  activeSide: string;
  activeLayerId: string | null;
  onAddLayer: (file: File) => void;
  onReplaceDrawLayer: (id: string, file: File) => void;
  setLayersWithRef: (updater: PrintLayer[] | ((prev: PrintLayer[]) => PrintLayer[])) => void;
  printZoneBounds: { left: number; top: number; width: number; height: number };
  isAuthenticated: boolean;
  aiQuota: AiQuotaState;
  onPaywall: () => void;
}

export default function DrawPanel({ onAddLayer, isAuthenticated, aiQuota, onPaywall }: DrawPanelProps) {
  const [modalOpen, setModalOpen] = useState(false);

  const handlePaste = useCallback((file: File) => {
    onAddLayer(file);
  }, [onAddLayer]);

  return (
    <>
      <div className="flex flex-col items-center gap-3 px-4 py-10 text-center">
        <Palette className="size-8 text-muted-foreground/40" />
        <div>
          <p className="text-sm font-medium text-foreground mb-1">Студія малювання</p>
          <p className="text-xs text-muted-foreground">Намалюйте ілюстрацію у повноекранному редакторі та вставте як шар на полотно.</p>
        </div>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="px-5 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-colors"
        >
          Відкрити студію
        </button>
      </div>

      <DrawingModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onPaste={handlePaste}
        isAuthenticated={isAuthenticated}
        aiQuota={aiQuota}
        onPaywall={onPaywall}
      />
    </>
  );
}
