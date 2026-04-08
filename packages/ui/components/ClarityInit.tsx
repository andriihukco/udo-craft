"use client";

import { useEffect } from "react";

interface ClarityInitProps {
  clarityId: string;
}

export function ClarityInit({ clarityId }: ClarityInitProps) {
  useEffect(() => {
    import("@microsoft/clarity").then((clarity) => {
      clarity.default.init(clarityId);
    }).catch(() => {
      if (typeof window !== "undefined" && !(window as any).clarity) {
        const s = document.createElement("script");
        s.async = true;
        s.src = "https://www.clarity.ms/tag/" + clarityId;
        document.head.appendChild(s);
      }
    });
  }, [clarityId]);

  return null;
}
