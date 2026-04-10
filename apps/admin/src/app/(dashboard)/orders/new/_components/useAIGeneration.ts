"use client";

import { useState, useCallback } from "react";
import type { PrintLayer } from "@udo-craft/shared";
import { buildCanvasContext } from "../_lib/buildCanvasContext";
import type { PrintTypePricingRow } from "@udo-craft/shared";

export interface UseAIGenerationOptions {
  activeSide: string;
  captureRef: React.MutableRefObject<(() => string) | null>;
  layers: PrintLayer[];
  mockups: Record<string, string>;
  selectedColor: string;
  productImages: Record<string, string>;
  productName: string;
  onSuccess?: (dataUrl: string) => void;
  selfieDataUrl?: string;
}

export interface UseAIGenerationReturn {
  generate: (prompt: string) => Promise<void>;
  loading: boolean;
  error: string | null;
  clearError: () => void;
}

export function useAIGeneration({
  activeSide,
  captureRef,
  layers,
  mockups,
  selectedColor,
  productImages,
  productName,
  onSuccess,
  selfieDataUrl,
}: UseAIGenerationOptions): UseAIGenerationReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  const generate = useCallback(
    async (prompt: string) => {
      setLoading(true);
      setError(null);

      try {
        // 1. Resolve canvas image per priority chain
        // Selfie takes highest priority when provided
        const activeSideLayers = layers.filter((l) => l.side === activeSide);
        let imageDataUrl: string | undefined;

        if (selfieDataUrl) {
          imageDataUrl = selfieDataUrl;
        } else if (activeSideLayers.length >= 1 && typeof captureRef.current === "function") {
          imageDataUrl = captureRef.current();
        }

        if (!imageDataUrl && mockups[activeSide]) {
          imageDataUrl = mockups[activeSide];
        }

        if (!imageDataUrl && productImages[activeSide]) {
          imageDataUrl = productImages[activeSide];
        }

        if (!imageDataUrl) {
          const firstAvailable = Object.values(productImages).find(Boolean);
          if (firstAvailable) imageDataUrl = firstAvailable;
        }

        // 2. Build canvas context description
        const allSides = Array.from(
          new Set([activeSide, ...layers.map((l) => l.side), ...Object.keys(productImages)])
        );
        const contextDescription = buildCanvasContext({
          activeSide,
          layers,
          selectedColor,
          productName,
          allSides,
        });

        // 3. POST to /api/ai/generate with 60s timeout
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 60_000);

        let res: Response;
        try {
          res = await fetch("/api/ai/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              prompt,
              contextDescription,
              imageDataUrl: imageDataUrl ?? "",
            }),
            signal: controller.signal,
          });
        } finally {
          clearTimeout(timeout);
        }

        if (!res.ok) {
          const body = await res.json().catch(() => ({})) as { error?: string };
          throw new Error(body.error ?? `HTTP ${res.status}`);
        }

        const data = await res.json() as { dataUrl?: string; error?: string };

        if (!data.dataUrl) {
          throw new Error(data.error ?? "Відповідь не містить зображення");
        }

        // 4. Return dataUrl via callback — caller handles addLayer
        onSuccess?.(data.dataUrl);
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") {
          setError("Час очікування вичерпано. Спробуйте ще раз.");
        } else if (err instanceof Error) {
          setError(`Помилка генерації: ${err.message}`);
        } else {
          setError("Невідома помилка під час генерації зображення.");
        }
      } finally {
        setLoading(false);
      }
    },
    [activeSide, captureRef, layers, mockups, selectedColor, productImages, productName, onSuccess, selfieDataUrl]
  );

  return { generate, loading, error, clearError };
}
