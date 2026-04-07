"use client";

import { useEffect } from "react";

export function ClarityInit() {
  useEffect(() => {
    // Use dynamic import to avoid SSR issues
    import("@microsoft/clarity").then((clarity) => {
      clarity.default.init("w6t8md9b3l");
    }).catch(() => {
      // Fallback: inject script tag directly
      if (typeof window !== "undefined" && !(window as any).clarity) {
        const s = document.createElement("script");
        s.async = true;
        s.src = "https://www.clarity.ms/tag/w6t8md9b3l";
        document.head.appendChild(s);
      }
    });
  }, []);

  return null;
}
