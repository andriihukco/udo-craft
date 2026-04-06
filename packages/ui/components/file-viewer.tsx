"use client";

import { useEffect, useCallback } from "react";
import { X, Download, FileText, ExternalLink, Film, Archive, FileCode } from "lucide-react";

export interface FileViewerProps {
  url: string;
  onClose: () => void;
}

export function isImage(url: string) {
  return /\.(jpe?g|png|gif|webp|svg|bmp|ico|tiff?)(\?|$)/i.test(url);
}

export function isVideo(url: string) {
  return /\.(mp4|webm|ogg|mov|avi|mkv)(\?|$)/i.test(url);
}

function isPdf(url: string) {
  return /\.pdf(\?|$)/i.test(url);
}

export function fileName(url: string) {
  try {
    return decodeURIComponent(url.split("/").pop()?.split("?")[0] || "file");
  } catch {
    return url.split("/").pop() || "file";
  }
}

function fileIcon(url: string) {
  if (isVideo(url)) return Film;
  if (/\.(zip|rar|7z|tar|gz|bz2)(\?|$)/i.test(url)) return Archive;
  if (/\.(ai|eps|psd|sketch|fig)(\?|$)/i.test(url)) return FileCode;
  return FileText;
}

export function FileViewer({ url, onClose }: FileViewerProps) {
  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [handleKey]);

  const name = fileName(url);
  const Icon = fileIcon(url);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative flex flex-col bg-background rounded-2xl shadow-2xl overflow-hidden max-w-4xl w-full mx-4 max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <Icon className="w-4 h-4 shrink-0 text-muted-foreground" />
            <span className="text-sm font-medium truncate">{name}</span>
          </div>
          <div className="flex items-center gap-1 shrink-0 ml-3">
            <a
              href={url}
              download={name}
              target="_blank"
              rel="noopener noreferrer"
              className="h-8 w-8 flex items-center justify-center rounded-md text-muted-foreground hover:bg-muted transition-colors"
              title="Завантажити"
            >
              <Download className="w-4 h-4" />
            </a>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="h-8 w-8 flex items-center justify-center rounded-md text-muted-foreground hover:bg-muted transition-colors"
              title="Відкрити в новій вкладці"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
            <button
              onClick={onClose}
              className="h-8 w-8 flex items-center justify-center rounded-md text-muted-foreground hover:bg-destructive hover:text-white transition-colors"
              aria-label="Закрити"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto flex items-center justify-center bg-muted/30 min-h-0">
          {isImage(url) ? (
            <img
              src={url}
              alt={name}
              className="max-w-full max-h-[calc(90vh-57px)] object-contain p-4"
            />
          ) : isVideo(url) ? (
            <video
              src={url}
              controls
              className="max-w-full max-h-[calc(90vh-57px)]"
            />
          ) : isPdf(url) ? (
            <iframe
              src={url}
              className="w-full border-0 h-[calc(90vh-57px)]"
              title={name}
            />
          ) : (
            <div className="flex flex-col items-center justify-center gap-4 py-16 px-8 text-center">
              <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
                <Icon className="w-8 h-8 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium">{name}</p>
                <p className="text-sm text-muted-foreground mt-1">Попередній перегляд недоступний</p>
              </div>
              <a
                href={url}
                download={name}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                <Download className="w-4 h-4" />
                Завантажити
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
