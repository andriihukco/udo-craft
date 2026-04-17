"use client";

import { useEffect } from "react";

const BASE_TITLE = "U:DO CRAFT — Кастомізатор";

/**
 * Updates the browser tab title with a layer count badge.
 * e.g. "(3) U:DO CRAFT — Кастомізатор"
 */
export function useLayersBadge(layerCount: number, baseTitle = BASE_TITLE) {
  useEffect(() => {
    document.title = layerCount > 0 ? `(${layerCount}) ${baseTitle}` : baseTitle;
    return () => { document.title = baseTitle; };
  }, [layerCount, baseTitle]);
}
