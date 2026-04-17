"use client";

import { useEffect } from "react";

const BASE_TITLE = "U:DO CRAFT — Нове замовлення";

export function useLayersBadge(layerCount: number, baseTitle = BASE_TITLE) {
  useEffect(() => {
    document.title = layerCount > 0 ? `(${layerCount}) ${baseTitle}` : baseTitle;
    return () => { document.title = baseTitle; };
  }, [layerCount, baseTitle]);
}
