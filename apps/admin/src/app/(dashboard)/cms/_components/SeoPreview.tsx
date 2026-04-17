"use client";

interface SeoPreviewProps {
  title: string;
  description: string;
  url?: string;
}

export function SeoPreview({ title, description, url = "u-do-craft.store" }: SeoPreviewProps) {
  const displayTitle = title || "Заголовок сторінки";
  const displayDesc  = description || "Опис сторінки для пошукових систем...";

  return (
    <div className="space-y-3">
      {/* Google SERP preview */}
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Google — попередній перегляд</p>
      <div className="rounded-xl border border-border bg-card p-4 max-w-[600px]">
        {/* URL breadcrumb */}
        <div className="flex items-center gap-1.5 mb-1">
          <div className="w-4 h-4 rounded-full bg-muted flex items-center justify-center shrink-0">
            <span className="text-[8px]">G</span>
          </div>
          <span className="text-xs text-muted-foreground truncate">{url}</span>
        </div>
        {/* Title — Google SERP blue (#1a0dab light / #8ab4f8 dark) is intentional brand mimicry */}
        <p
          className="text-[#1a0dab] dark:text-[#8ab4f8] text-lg leading-snug font-normal truncate"
          style={{ fontFamily: "arial, sans-serif" }}
        >
          {displayTitle.length > 60
            ? displayTitle.slice(0, 57) + "..."
            : displayTitle}
        </p>
        {/* Description — Google SERP grey (#4d5156 light / #bdc1c6 dark) is intentional brand mimicry */}
        <p
          className="text-[#4d5156] dark:text-[#bdc1c6] text-sm leading-relaxed mt-1"
          style={{ fontFamily: "arial, sans-serif" }}
        >
          {displayDesc.length > 160
            ? displayDesc.slice(0, 157) + "..."
            : displayDesc}
        </p>
      </div>

      {/* Character counters */}
      <div className="flex gap-6 text-xs text-muted-foreground">
        <span>
          Title:{" "}
          <span className={title.length > 60 ? "text-destructive font-semibold" : title.length > 50 ? "text-amber-600 font-semibold" : "text-green-600 font-semibold"}>
            {title.length}/60
          </span>
        </span>
        <span>
          Description:{" "}
          <span className={description.length > 160 ? "text-destructive font-semibold" : description.length > 140 ? "text-amber-600 font-semibold" : "text-green-600 font-semibold"}>
            {description.length}/160
          </span>
        </span>
      </div>

      {/* OG / Social preview */}
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pt-2">Соціальні мережі — OG картка</p>
      <div className="rounded-xl border border-border overflow-hidden max-w-[500px]">
        <div className="bg-muted h-[200px] flex items-center justify-center text-muted-foreground text-sm">
          OG Image
        </div>
        <div className="bg-card px-4 py-3 border-t border-border">
          <p className="text-[11px] text-muted-foreground uppercase tracking-wide">{url}</p>
          <p className="text-sm font-semibold text-foreground mt-0.5 truncate">{displayTitle}</p>
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{displayDesc}</p>
        </div>
      </div>
    </div>
  );
}
