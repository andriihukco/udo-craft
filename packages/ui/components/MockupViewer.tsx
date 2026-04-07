"use client";

import { useState } from "react";

interface MockupViewerProps {
  /** Map of image key → url. Keys are the actual tag names (e.g. "front", "back", "left", custom) */
  images?: Record<string, string>;
  /** Legacy: single front URL */
  frontUrl?: string;
  /** Legacy: single back URL */
  backUrl?: string;
  fallbackUrl?: string;
  alt?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

const KEY_LABELS_SHORT: Record<string, string> = {
  front: "П", back: "З", left: "Л", right: "Пр",
};
const KEY_LABELS_FULL: Record<string, string> = {
  front: "Перед", back: "Зад", left: "Ліво", right: "Право",
};

function keyLabelShort(key: string): string {
  return KEY_LABELS_SHORT[key] ?? key.slice(0, 2).toUpperCase();
}
function keyLabelFull(key: string): string {
  return KEY_LABELS_FULL[key] ?? key;
}

export function MockupViewer({
  images: imagesProp,
  frontUrl, backUrl, fallbackUrl,
  alt = "mockup",
  className = "w-full h-full object-contain",
  size = "md",
}: MockupViewerProps) {
  // Build a unified images map
  const images: Record<string, string> = imagesProp
    ? Object.fromEntries(Object.entries(imagesProp).filter(([, v]) => !!v))
    : {
        ...(frontUrl ? { front: frontUrl } : {}),
        ...(backUrl  ? { back:  backUrl  } : {}),
      };

  const keys = Object.keys(images);
  const [activeKey, setActiveKey] = useState<string>(keys[0] ?? "front");

  if (keys.length === 0) {
    if (!fallbackUrl) return <div className="w-full h-full flex items-center justify-center bg-muted text-muted-foreground text-xs">—</div>;
    return <img src={fallbackUrl} alt={alt} className={className} />;
  }

  // Large: show all images side by side (each in equal column)
  if (size === "lg" && keys.length > 1) {
    return (
      <div className="w-full h-full flex gap-0.5">
        {keys.map((key) => (
          <div key={key} className="flex-1 relative min-w-0 overflow-hidden">
            <img src={images[key]} alt={`${alt} ${key}`} className="w-full h-full object-contain" />
            <span className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[9px] font-semibold bg-black/55 text-white px-1.5 py-0.5 rounded-full whitespace-nowrap pointer-events-none">
              {keyLabelFull(key)}
            </span>
          </div>
        ))}
      </div>
    );
  }

  // Single image (lg with 1 key, or sm/md)
  if (keys.length === 1) {
    return <img src={images[keys[0]]} alt={alt} className={className} />;
  }

  // Small/medium: toggle buttons
  const currentKey = images[activeKey] ? activeKey : keys[0];
  const src = images[currentKey];
  return (
    <div className="relative w-full h-full">
      <img src={src} alt={alt} className={className} />
      <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 flex gap-0.5">
        {keys.map((key) => (
          <button
            key={key}
            type="button"
            onClick={(e) => { e.stopPropagation(); setActiveKey(key); }}
            title={keyLabelFull(key)}
            className={`text-[8px] px-1 py-0.5 rounded font-bold leading-none transition-colors ${
              currentKey === key ? "bg-primary text-white" : "bg-black/40 text-white hover:bg-black/60"
            }`}
          >
            {keyLabelShort(key)}
          </button>
        ))}
      </div>
    </div>
  );
}
