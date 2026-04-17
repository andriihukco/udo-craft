"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { fabric } from "fabric";
import { Product, PrintZone } from "@udo-craft/shared";
import { AlignCenter, AlignLeft, AlignRight, Bold, BringToFront, Copy, Eraser, FlipHorizontal, Focus, Italic, Loader2, Pencil, RotateCcw, RotateCw, SendToBack, Shirt, Trash2 } from "lucide-react";
import { removeBgClient } from "@/lib/remove-bg-client";
import { toast } from "sonner";
import { PRINT_TYPES, TEXT_FONTS, type PrintTypeId, type PrintLayer, type TextFontId } from "./print-types";

export { PRINT_TYPES, TEXT_FONTS, type PrintTypeId, type PrintLayer, type TextFontId };

// Load Google Fonts and wait for them to be ready
const loadedFonts = new Set<string>();
function ensureFont(fontFamily: string): Promise<void> {
  if (typeof document === "undefined") return Promise.resolve();
  if (!loadedFonts.has(fontFamily)) {
    loadedFonts.add(fontFamily);
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontFamily).replace(/%20/g, "+")}:wght@400;700&subset=cyrillic,latin&display=swap`;
    document.head.appendChild(link);
  }
  // Force the browser to actually fetch and decode the font by measuring a hidden element
  return new Promise<void>((resolve) => {
    // Try document.fonts.load first (fast path)
    document.fonts.load(`700 48px '${fontFamily}'`).then(() => {
      // Double-check with a hidden span — ensures glyphs are decoded, not just parsed
      const span = document.createElement("span");
      span.style.cssText = `position:absolute;visibility:hidden;font-family:'${fontFamily}',monospace;font-size:48px;font-weight:700;`;
      span.textContent = "Тест Test";
      document.body.appendChild(span);
      // Use microtask instead of rAF — resolves faster so Fabric renders sooner
      Promise.resolve().then(() => {
        document.body.removeChild(span);
        resolve();
      });
    }).catch(() => resolve());
  });
}

interface ProductCanvasProps {
  product: Product;
  printZones: { front?: PrintZone | null; back?: PrintZone | null };
  layers: PrintLayer[];
  activeSide: string;
  onSideChange?: (side: string) => void;
  variantImages?: Record<string, string>;
  color?: string;
  onSave: (dataUrl: string, side: string, offsetTopMm: number) => void;
  onOffsetChange?: (mm: number) => void;
  saveRef?: React.MutableRefObject<(() => void) | null>;
  fabricCanvasRef?: React.MutableRefObject<import("fabric").fabric.Canvas | null>;
  captureRef?: React.MutableRefObject<(() => string) | null>;
  /** Captures all sides that have layers and returns a map of side → dataUrl */
  captureAllRef?: React.MutableRefObject<((sides: string[]) => Promise<Record<string, string>>) | null>;
  activeLayerId?: string | null;
  onLayerSelect?: (layerId: string | null) => void;
  onRemoveBg?: (layerId: string, newUrl: string) => void;
  onLayerDelete?: (layerId: string) => void;
  onLayerDuplicate?: (layer: PrintLayer) => void;
  onLayerTransformChange?: (layerId: string, transform: NonNullable<PrintLayer["transform"]>) => void;
  onTextChange?: (layerId: string, textContent: string) => void;
  onLayerPatch?: (layerId: string, patch: Partial<PrintLayer>) => void;
  onAIGenerate?: () => void;
  onOpenDrawingStudio?: (layerId: string) => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
}

const CANVAS_SIZE = 520;

export default function ProductCanvas({
  product, printZones, layers, activeSide, onSideChange,
  variantImages, onSave, saveRef, fabricCanvasRef, captureRef, captureAllRef, activeLayerId, onLayerSelect, onRemoveBg, onLayerDelete, onLayerDuplicate, onLayerTransformChange, onTextChange, onLayerPatch, onAIGenerate, onOpenDrawingStudio, onUndo, onRedo, canUndo, canRedo,
}: ProductCanvasProps) {
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fabricRef    = useRef<fabric.Canvas | null>(null);
  const overlayRef   = useRef<fabric.Rect | null>(null);
  const [canvasSize, setCanvasSize] = useState(CANVAS_SIZE);
  const [hasObjects, setHasObjects] = useState(false);
  const [removingBg, setRemovingBg] = useState(false);
  const [canvasReady, setCanvasReady] = useState(false);
  const [backgroundLoaded, setBackgroundLoaded] = useState(false);
  const [isCentered, setIsCentered] = useState(false);
  const loadingIds = useRef<Set<string>>(new Set());
  const backgroundUrlRef = useRef<string | null>(null);
  const layerSizeSignatureRef = useRef<Record<string, string>>({});

  // Persist transforms across side switches — pre-populate from layer.transform on mount
  const layerTransforms = useRef<Record<string, { left: number; top: number; scaleX: number; scaleY: number; angle: number; flipX: boolean }>>({});
  // Initialize from layers prop (restores transforms when editing from cart)
  if (Object.keys(layerTransforms.current).length === 0) {
    for (const l of layers) {
      if (l.transform) {
        layerTransforms.current[l.id] = { left: l.transform.left, top: l.transform.top, scaleX: l.transform.scaleX, scaleY: l.transform.scaleY, angle: l.transform.angle ?? 0, flipX: l.transform.flipX };
      }
    }
  }
  const activeLayerIdRef = useRef<string | null>(activeLayerId ?? null);
  useEffect(() => { activeLayerIdRef.current = activeLayerId ?? null; }, [activeLayerId]);
  const layersRef = useRef<PrintLayer[]>(layers);
  useEffect(() => { layersRef.current = layers; }, [layers]);
  
  // Stable refs for callbacks — avoids canvas reinit when parent re-renders
  const onLayerSelectRef = useRef(onLayerSelect);
  useEffect(() => { onLayerSelectRef.current = onLayerSelect; }, [onLayerSelect]);
  const onLayerTransformChangeRef = useRef(onLayerTransformChange);
  useEffect(() => { onLayerTransformChangeRef.current = onLayerTransformChange; }, [onLayerTransformChange]);
  const onLayerDeleteRef = useRef(onLayerDelete);
  useEffect(() => { onLayerDeleteRef.current = onLayerDelete; }, [onLayerDelete]);
  const onLayerDuplicateRef = useRef(onLayerDuplicate);
  useEffect(() => { onLayerDuplicateRef.current = onLayerDuplicate; }, [onLayerDuplicate]);
  const onTextChangeRef = useRef(onTextChange);
  useEffect(() => { onTextChangeRef.current = onTextChange; }, [onTextChange]);

  // ── Responsive resize ────────────────────────────────────────────────────
  useEffect(() => {
    const update = () => {
      const el = containerRef.current;
      if (!el) return;
      const size = Math.min(el.clientWidth, CANVAS_SIZE);
      if (size > 0) {
        setCanvasSize(size);
        const canvas = fabricRef.current;
        if (canvas) {
          canvas.setDimensions({ width: size, height: size });
          canvas.setZoom(size / CANVAS_SIZE);
          canvas.renderAll();
        }
      }
    };
    const timer = setTimeout(update, 0);
    const ro = new ResizeObserver(update);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => { clearTimeout(timer); ro.disconnect(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Init Fabric canvas once ──────────────────────────────────────────────
  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = new fabric.Canvas(canvasRef.current, {
      width: CANVAS_SIZE, height: CANVAS_SIZE,
      preserveObjectStacking: true, selection: false,
    });
    // Fabric.js does not read CSS variables natively — read at runtime
    const primary = typeof document !== "undefined" ? getComputedStyle(document.documentElement).getPropertyValue("--color-primary").trim() || "#1B3BFF" : "#1B3BFF";
    fabric.Object.prototype.set({
      cornerColor: "#ffffff", cornerStrokeColor: primary, cornerSize: 10,
      cornerStyle: "circle", borderColor: primary, borderScaleFactor: 1.5,
      transparentCorners: false, padding: 6, lockUniScaling: true,
      centeredRotation: true,
    });
    fabric.Object.prototype.setControlsVisibility({ ml: false, mr: false, mt: false, mb: false });
    canvas.on("selection:created", (e) => onLayerSelect?.((e as any).selected?.[0]?._layerId ?? null));
    canvas.on("selection:updated", (e) => onLayerSelect?.((e as any).selected?.[0]?._layerId ?? null));
    canvas.on("selection:cleared",  ()  => onLayerSelect?.(null));
    const saveTransform = (e: any) => {
      const obj = e.target;
      if (!obj || !(obj as any)._isLayer) return;
      const id = (obj as any)._layerId as string;
      const t = {
        left: obj.left ?? 0, top: obj.top ?? 0,
        scaleX: obj.scaleX ?? 1, scaleY: obj.scaleY ?? 1,
        angle: obj.angle ?? 0, flipX: obj.flipX ?? false,
      };
      layerTransforms.current[id] = t;
      // Notify parent so transform survives Customizer remount
      onLayerTransformChange?.(id, t);
    };
    canvas.on("object:modified", saveTransform);
    canvas.on("object:scaling",  saveTransform);

    // ── Snap-to-center guide lines ───────────────────────────────────────
    const vLine = new fabric.Line([CANVAS_SIZE / 2, 0, CANVAS_SIZE / 2, CANVAS_SIZE], {
      stroke: "#ef4444", strokeWidth: 1, selectable: false, evented: false,
      visible: false, strokeDashArray: [4, 4],
    });
    const hLine = new fabric.Line([0, CANVAS_SIZE / 2, CANVAS_SIZE, CANVAS_SIZE / 2], {
      stroke: "#ef4444", strokeWidth: 1, selectable: false, evented: false,
      visible: false, strokeDashArray: [4, 4],
    });
    canvas.add(vLine);
    canvas.add(hLine);
    const vLineRef = { current: vLine };
    const hLineRef = { current: hLine };

    canvas.on("object:moving", (e) => {
      // Save transform
      saveTransform(e);
      // Snap logic
      const obj = e.target;
      if (!obj || !(obj as any)._isLayer) return;
      const SNAP = 10;
      const cx = CANVAS_SIZE / 2;
      const cy = CANVAS_SIZE / 2;
      const objCx = (obj.left ?? 0) + obj.getScaledWidth() / 2;
      const objCy = (obj.top ?? 0) + obj.getScaledHeight() / 2;
      const snapH = Math.abs(objCx - cx) < SNAP;
      const snapV = Math.abs(objCy - cy) < SNAP;
      if (snapH) obj.set({ left: cx - obj.getScaledWidth() / 2 });
      if (snapV) obj.set({ top: cy - obj.getScaledHeight() / 2 });
      vLineRef.current.set({ visible: snapH });
      hLineRef.current.set({ visible: snapV });
      setIsCentered(snapH && snapV);
      canvas.renderAll();
    });

    canvas.on("object:modified", () => {
      vLineRef.current.set({ visible: false });
      hLineRef.current.set({ visible: false });
      const obj = canvas.getActiveObject();
      if (obj) {
        const cx = CANVAS_SIZE / 2;
        const cy = CANVAS_SIZE / 2;
        const centeredH = Math.abs((obj.left ?? 0) + obj.getScaledWidth() / 2 - cx) < 2;
        const centeredV = Math.abs((obj.top ?? 0) + obj.getScaledHeight() / 2 - cy) < 2;
        setIsCentered(centeredH && centeredV);
      }
      canvas.renderAll();
    });

    // ── 90° rotation snap ────────────────────────────────────────────────
    canvas.on("object:rotating", (e) => {
      const obj = e.target;
      if (!obj || !(obj as any)._isLayer) return;
      const raw = obj.angle ?? 0;
      const normalized = ((raw % 360) + 360) % 360;
      const nearest = Math.round(normalized / 90) * 90;
      if (Math.abs(normalized - nearest) < 8) {
        obj.set({ angle: nearest % 360 });
        obj.setCoords();
      }
    });

    // ── Double-click / double-tap to enter IText editing ─────────────────
    canvas.on("mouse:dblclick", (e) => {
      const obj = e.target;
      if (!obj || !(obj as any)._isText) return;
      const textObj = obj as fabric.IText;
      if (typeof textObj.enterEditing === "function") {
        textObj.enterEditing();
        canvas.renderAll();
      }
    });

    // IText text:changed → sync back to React state
    canvas.on("text:changed", (e: any) => {
      const obj = e.target;
      if (!obj || !(obj as any)._isText) return;
      const layerId = (obj as any)._layerId as string;
      if (!layerId) return;
      onTextChangeRef.current?.(layerId, (obj as fabric.IText).text ?? "");
    });

    // Mobile double-tap
    let lastTap = 0;
    let lastTapTarget: fabric.Object | null = null;
    const canvasEl = canvas.getElement();
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      const now = Date.now();
      const obj = canvas.getActiveObject();
      if (now - lastTap < 300 && obj && obj === lastTapTarget && (obj as any)._isText) {
        e.preventDefault();
        const textObj = obj as fabric.IText;
        if (typeof textObj.enterEditing === "function") {
          textObj.enterEditing();
          canvas.renderAll();
        }
      }
      lastTap = now;
      lastTapTarget = obj ?? null;
    };
    canvasEl.addEventListener("touchstart", handleTouchStart, { passive: false });

    fabricRef.current = canvas;
    if (fabricCanvasRef) fabricCanvasRef.current = canvas;
    backgroundUrlRef.current = null;
    setCanvasReady(true);
    return () => {
      canvasEl.removeEventListener("touchstart", handleTouchStart);
      canvas.dispose();
      fabricRef.current = null;
      if (fabricCanvasRef) fabricCanvasRef.current = null;
      setCanvasReady(false);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Preload all text fonts eagerly on mount ───────────────────────────────
  useEffect(() => {
    TEXT_FONTS.forEach((f) => ensureFont(f.id));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Load product background image ────────────────────────────────────────
  useEffect(() => {
    if (!canvasReady) return;
    const canvas = fabricRef.current;
    if (!canvas) return;
    const images = variantImages && Object.keys(variantImages).length > 0
      ? variantImages : (product.images ?? {});
    const imgUrl = images[activeSide] ?? (activeSide !== "front" ? images.front : null) ?? Object.values(images)[0];
    if (!imgUrl) return;
    let cancelled = false;
    const proxy = imgUrl.startsWith("http") ? `/api/proxy-image?url=${encodeURIComponent(imgUrl)}` : imgUrl;
    if (backgroundUrlRef.current === proxy) return;
    setBackgroundLoaded(false);
    const htmlImage = new Image();
    htmlImage.crossOrigin = "anonymous";
    htmlImage.decoding = "async";
    htmlImage.onload = () => {
      if (cancelled || !fabricRef.current) return;
      const fi = new fabric.Image(htmlImage);
      const scale = Math.min(CANVAS_SIZE / (fi.width || CANVAS_SIZE), CANVAS_SIZE / (fi.height || CANVAS_SIZE));
      fi.set({ left: 0, top: 0, selectable: false, evented: false, scaleX: scale, scaleY: scale });
      backgroundUrlRef.current = proxy;
      fabricRef.current.setBackgroundImage(fi, () => {
        if (!cancelled && fabricRef.current) {
          try { fabricRef.current.renderAll(); } catch { /* disposed */ }
          setBackgroundLoaded(true);
        }
      });
    };
    htmlImage.onerror = () => { cancelled = true; setBackgroundLoaded(true); };
    htmlImage.src = proxy;
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvasReady, product, activeSide, variantImages]);

  const getLayerSizeSignature = (layer: PrintLayer) => `${layer.sizeLabel ?? ""}:${layer.sizeMinCm ?? ""}:${layer.sizeMaxCm ?? ""}`;

  const getPrintZone = (side: string) => {
    if (side === "back") return printZones.back ?? printZones.front ?? null;
    return printZones.front ?? printZones.back ?? null;
  };

  const syncLayerSizing = (obj: fabric.Object, layer: PrintLayer) => {
    const signature = getLayerSizeSignature(layer);
    if (!layer.sizeLabel) {
      delete layerSizeSignatureRef.current[layer.id];
      return;
    }
    if (layerSizeSignatureRef.current[layer.id] === signature) return;
    const zone = getPrintZone(layer.side);
    const ratio = product.px_to_mm_ratio || 0;
    const targetCm = layer.sizeMinCm != null && layer.sizeMaxCm != null
      ? (layer.sizeMinCm + layer.sizeMaxCm) / 2
      : (layer.sizeMaxCm ?? layer.sizeMinCm ?? null);
    if (!zone || !ratio || !targetCm) {
      layerSizeSignatureRef.current[layer.id] = signature;
      return;
    }
    const baseWidth = obj.width || (obj.getScaledWidth() / Math.max(obj.scaleX || 1, 0.001));
    const baseHeight = obj.height || (obj.getScaledHeight() / Math.max(obj.scaleY || 1, 0.001));
    if (!baseWidth || !baseHeight) {
      layerSizeSignatureRef.current[layer.id] = signature;
      return;
    }
    const targetPx = Math.max(24, targetCm * 10 * ratio);
    const zoneLimit = Math.max(24, Math.min(zone.width, zone.height));
    const boundedTargetPx = Math.min(targetPx, zoneLimit);
    const nextScale = Math.max(0.05, Math.min(boundedTargetPx / baseWidth, boundedTargetPx / baseHeight));
    // Preserve current center position when resizing
    const currentCx = (obj.left ?? 0) + (obj.getScaledWidth() / 2);
    const currentCy = (obj.top ?? 0) + (obj.getScaledHeight() / 2);
    const newW = baseWidth * nextScale;
    const newH = baseHeight * nextScale;
    const newLeft = currentCx - newW / 2;
    const newTop = currentCy - newH / 2;
    obj.set({
      scaleX: nextScale,
      scaleY: nextScale,
      left: newLeft,
      top: newTop,
    });
    obj.setCoords();
    layerSizeSignatureRef.current[layer.id] = signature;
    // Notify parent so layerScales stays in sync with the new canvas scale
    const t = { left: newLeft, top: newTop, scaleX: nextScale, scaleY: nextScale, angle: (obj as any).angle ?? 0, flipX: obj.flipX ?? false };
    layerTransforms.current[layer.id] = t;
    onLayerTransformChangeRef.current?.(layer.id, t);
  };

  // ── Sync layers → canvas ─────────────────────────────────────────────────
  const placeNewLayer = (canvas: fabric.Canvas, img: fabric.Image, layer: PrintLayer) => {
    const iw = img.width  || CANVAS_SIZE;
    const ih = img.height || CANVAS_SIZE;
    const saved = layerTransforms.current[layer.id];
    if (saved) {
      img.set({ left: saved.left, top: saved.top, scaleX: saved.scaleX, scaleY: saved.scaleY, angle: (saved as any).angle ?? 0, flipX: saved.flipX, hasControls: true, hasBorders: true, lockUniScaling: true });
    } else {
      const s = Math.min((CANVAS_SIZE * 0.4) / iw, (CANVAS_SIZE * 0.4) / ih);
      img.scale(s);
      img.set({
        left: (CANVAS_SIZE - img.getScaledWidth())  / 2,
        top:  (CANVAS_SIZE - img.getScaledHeight()) / 2,
        hasControls: true, hasBorders: true, lockUniScaling: true,
      });
    }
    (img as any)._isLayer  = true;
    (img as any)._layerId  = layer.id;
    (img as any)._layerUrl = layer.url;
    syncLayerSizing(img, layer);
    canvas.add(img); canvas.setActiveObject(img);
    if (overlayRef.current) canvas.bringToFront(overlayRef.current);
    try { canvas.renderAll(); } catch { /* disposed */ }
    setHasObjects(true);
  };

  // Build a curved text fabric object using an arc path
  const buildTextObject = (layer: PrintLayer, saved?: { left: number; top: number; scaleX: number; scaleY: number; flipX: boolean }) => {
    const fontFamily = layer.textFont ?? "Montserrat";
    const fontSize = layer.textFontSize ?? 48;
    const fill = layer.textColor ?? "#000000";
    const content = layer.textContent ?? "Текст";
    const align = layer.textAlign ?? "center";
    const curve = layer.textCurve ?? 0;

    const baseLeft = saved?.left ?? CANVAS_SIZE / 2 - 80;
    const baseTop  = saved?.top  ?? CANVAS_SIZE / 2 - 30;
    const scaleX   = saved?.scaleX ?? 1;
    const scaleY   = saved?.scaleY ?? 1;
    const angle    = (saved as any)?.angle ?? 0;

    if (curve !== 0) {
      // Arc path: radius derived from curve value (degrees of arc)
      const radius = Math.max(50, Math.abs(5000 / curve));
      const arcDeg = Math.min(Math.abs(curve), 340);
      const arcRad = (arcDeg * Math.PI) / 180;
      const startAngle = -Math.PI / 2 - arcRad / 2;
      const endAngle   = -Math.PI / 2 + arcRad / 2;
      const x1 = radius * Math.cos(startAngle);
      const y1 = radius * Math.sin(startAngle);
      const x2 = radius * Math.cos(endAngle);
      const y2 = radius * Math.sin(endAngle);
      const largeArc = arcDeg > 180 ? 1 : 0;
      const sweep = curve > 0 ? 1 : 0;
      const pathStr = `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} ${sweep} ${x2} ${y2}`;
      const path = new fabric.Path(pathStr, { visible: false });
      const text = new fabric.IText(content, {
        fontFamily, fontSize, fill, textAlign: align,
        path, pathStartOffset: 0, pathSide: "left",
        hasControls: true, hasBorders: true,
        left: baseLeft, top: baseTop, scaleX, scaleY, angle,
        editable: true,
      } as any);
      return text;
    }

    return new fabric.IText(content, {
      fontFamily, fontSize, fill, textAlign: align,
      hasControls: true, hasBorders: true,
      left: baseLeft, top: baseTop, scaleX, scaleY, angle,
      width: 400, editable: true,
    });
  };

  const placeTextLayer = (canvas: fabric.Canvas, layer: PrintLayer) => {
    const fontFamily = layer.textFont ?? "Montserrat";
    ensureFont(fontFamily).then(() => {
      if (!fabricRef.current) return;
      const saved = layerTransforms.current[layer.id];
      const text = buildTextObject(layer, saved);
      (text as any)._isLayer = true;
      (text as any)._layerId = layer.id;
      (text as any)._isText  = true;
      syncLayerSizing(text, layer);
      canvas.add(text); canvas.setActiveObject(text);
      if (overlayRef.current) canvas.bringToFront(overlayRef.current);
      try { canvas.renderAll(); } catch { /* disposed */ }
      setHasObjects(true);
    });
  };

  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const sideLayers = layers.filter((l) => l.side === activeSide);
    const wantedIds  = new Set(sideLayers.map((l) => l.id));

    // Snapshot current positions BEFORE removing objects (side switch persistence)
    canvas.getObjects()
      .filter((o) => (o as any)._isLayer && !wantedIds.has((o as any)._layerId))
      .forEach((o) => {
        const id = (o as any)._layerId as string;
        if (id) {
          layerTransforms.current[id] = {
            left: o.left ?? 0,
            top: o.top ?? 0,
            scaleX: o.scaleX ?? 1,
            scaleY: o.scaleY ?? 1,
            angle: (o as any).angle ?? 0,
            flipX: o.flipX ?? false,
          };
        }
        canvas.remove(o);
      });

    const existingIds = new Set(
      canvas.getObjects().filter((o) => (o as any)._isLayer).map((o) => (o as any)._layerId as string)
    );

    const layerSrc = (url: string, uploadedUrl?: string): string => {
      if (url.startsWith("blob:")) return url;
      if (url.startsWith("http")) return `/api/proxy-image?url=${encodeURIComponent(url)}`;
      return url;
    };

    sideLayers.forEach((layer) => {
      const existing = canvas.getObjects().find((o) => (o as any)._layerId === layer.id);

      // Text layer — update or create
      if (layer.kind === "text") {
        if (existing && (existing as any)._isText) {
          const fontFamily = layer.textFont ?? "Montserrat";
          ensureFont(fontFamily).then(() => {
            if (!fabricRef.current) return;
            // For curve changes, replace the object entirely; otherwise update in-place
            const needsReplace = (existing as any)._textCurve !== (layer.textCurve ?? 0);
            if (needsReplace) {
              const { left, top, scaleX, scaleY } = existing;
              const savedT = { left: left ?? 0, top: top ?? 0, scaleX: scaleX ?? 1, scaleY: scaleY ?? 1, flipX: existing.flipX ?? false };
              canvas.remove(existing);
              const newText = buildTextObject(layer, savedT);
              (newText as any)._isLayer = true;
              (newText as any)._layerId = layer.id;
              (newText as any)._isText  = true;
              (newText as any)._textCurve = layer.textCurve ?? 0;
              syncLayerSizing(newText, layer);
              canvas.add(newText); canvas.setActiveObject(newText);
            } else {
              const textObj = existing as fabric.IText;
              // Don't overwrite text while user is editing inline on canvas
              if ((textObj as any).isEditing) {
                syncLayerSizing(textObj, layer);
              } else {
                textObj.set({
                  text: layer.textContent ?? "Текст",
                  fill: layer.textColor ?? "#000000",
                  fontFamily,
                  fontSize: layer.textFontSize ?? 48,
                  textAlign: layer.textAlign ?? "center",
                } as any);
                if (typeof (textObj as any).initDimensions === "function") {
                  (textObj as any).initDimensions();
                }
                syncLayerSizing(textObj, layer);
              }
            }
            try { fabricRef.current.renderAll(); } catch { /* disposed */ }
          });
          return;
        }
        if (!existingIds.has(layer.id)) placeTextLayer(canvas, layer);
        return;
      }

      // URL changed (bg removal) — reload preserving position
      if (existing && (existing as any)._layerUrl !== layer.url) {
        const { left, top, scaleX, scaleY } = existing;
        canvas.remove(existing);
        const src = layerSrc(layer.url);
        const opts = layer.url.startsWith("blob:") ? {} : { crossOrigin: "anonymous" };
        fabric.Image.fromURL(src, (img) => {
          img.set({ left, top, scaleX, scaleY, hasControls: true, hasBorders: true, lockUniScaling: true });
          (img as any)._isLayer  = true;
          (img as any)._layerId  = layer.id;
          (img as any)._layerUrl = layer.url;
          syncLayerSizing(img, layer);
          if (!fabricRef.current) return;
          canvas.add(img); canvas.setActiveObject(img);
          if (overlayRef.current) canvas.bringToFront(overlayRef.current);
          canvas.renderAll();
        }, opts as any);
        return;
      }

      if (existingIds.has(layer.id)) return;
      if (loadingIds.current.has(layer.id)) return;

      // Use uploadedUrl as fallback if blob URL is no longer valid (e.g. editing from cart)
      const src = layerSrc(layer.url);
      const opts = layer.url.startsWith("blob:") ? {} : { crossOrigin: "anonymous" };
      loadingIds.current.add(layer.id);
      fabric.Image.fromURL(src, (img) => {
        // If blob load failed (img has no dimensions), try uploadedUrl
        if ((img.width === 0 || img.height === 0) && layer.uploadedUrl) {
          const fallbackSrc = `/api/proxy-image?url=${encodeURIComponent(layer.uploadedUrl)}`;
          fabric.Image.fromURL(fallbackSrc, (img2) => {
            loadingIds.current.delete(layer.id);
            if (!fabricRef.current) return;
            if (canvas.getObjects().some((o) => (o as any)._layerId === layer.id)) return;
            placeNewLayer(canvas, img2, layer);
          }, { crossOrigin: "anonymous" });
          return;
        }
        loadingIds.current.delete(layer.id);
        if (!fabricRef.current) return;
        if (canvas.getObjects().some((o) => (o as any)._layerId === layer.id)) return;
        placeNewLayer(canvas, img, layer);
      }, opts as any);
    });

    setHasObjects(sideLayers.length > 0);
    const total = canvas.getObjects().filter((o) => (o as any)._isLayer).length;
    sideLayers.forEach((layer, idx) => {
      const obj = canvas.getObjects().find((o) => (o as any)._layerId === layer.id);
      if (obj) canvas.moveTo(obj, total - 1 - idx);
    });
    if (overlayRef.current) canvas.bringToFront(overlayRef.current);
    canvas.renderAll();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layers, activeSide]);

  // ── Sync activeLayerId → canvas selection ────────────────────────────────
  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    if (!activeLayerId) { canvas.discardActiveObject(); canvas.renderAll(); return; }
    const obj = canvas.getObjects().find((o) => (o as any)._layerId === activeLayerId);
    if (obj) { canvas.setActiveObject(obj); canvas.renderAll(); }
  }, [activeLayerId]);

  // ── Controls ─────────────────────────────────────────────────────────────
  const deleteSelected = useCallback(() => {
    const canvas = fabricRef.current; if (!canvas) return;
    const obj = canvas.getActiveObject();
    if (obj && (obj as any)._isLayer) {
      canvas.remove(obj); canvas.renderAll();
      onLayerDelete?.((obj as any)._layerId);
    }
    setHasObjects(canvas.getObjects().some((o) => (o as any)._isLayer));
  }, [onLayerDelete]);

  const flipSelected = useCallback(() => {
    const canvas = fabricRef.current; if (!canvas) return;
    const obj = canvas.getActiveObject();
    if (obj) {
      obj.set("flipX", !obj.flipX); canvas.renderAll();
      if ((obj as any)._isLayer)
        layerTransforms.current[(obj as any)._layerId] = {
          left: obj.left ?? 0, top: obj.top ?? 0,
          scaleX: obj.scaleX ?? 1, scaleY: obj.scaleY ?? 1, angle: (obj as any).angle ?? 0, flipX: obj.flipX ?? false,
        };
    }
  }, []);

  const centerSelected = useCallback(() => {
    const canvas = fabricRef.current; if (!canvas) return;
    const obj = canvas.getActiveObject(); if (!obj) return;
    obj.set({ left: (CANVAS_SIZE - obj.getScaledWidth()) / 2, top: (CANVAS_SIZE - obj.getScaledHeight()) / 2 });
    obj.setCoords(); canvas.renderAll();
  }, []);

  const handleZoom = useCallback((delta: number) => {
    const canvas = fabricRef.current; if (!canvas) return;
    const obj = canvas.getActiveObject(); if (!obj) return;
    obj.scale(Math.max(0.05, (obj.scaleX ?? 1) + delta));
    obj.setCoords(); canvas.renderAll();
  }, []);

  // ── Export — canvas pixels ARE the mockup ────────────────────────────────
  const captureNow = useCallback((): string => {
    const canvas = fabricRef.current;
    if (!canvas) return "";
    const active = canvas.getActiveObject();
    if (active) active.set({ hasControls: false, hasBorders: false });
    if (overlayRef.current) overlayRef.current.set("visible", false);
    canvas.renderAll();
    const multiplier = CANVAS_SIZE / canvas.getWidth();
    let dataUrl = "";
    try {
      dataUrl = canvas.toDataURL({ format: "png", quality: 1, multiplier });
    } catch (err) { console.error("[AdminCanvas] toDataURL failed:", err); }
    if (active) active.set({ hasControls: true, hasBorders: true });
    if (overlayRef.current) overlayRef.current.set("visible", true);
    canvas.renderAll();
    return dataUrl;
  }, []);

  useEffect(() => { if (captureRef) captureRef.current = captureNow; }, [captureNow, captureRef]);

  const handleSave = useCallback(() => {
    const dataUrl = captureNow();
    onSave(dataUrl, activeSide, 0);
  }, [captureNow, onSave, activeSide]);

  useEffect(() => { if (saveRef) saveRef.current = handleSave; }, [handleSave, saveRef]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Never intercept when user is typing in an input, textarea, or contenteditable
      const tag = (document.activeElement as HTMLElement)?.tagName?.toLowerCase();
      const isEditable = tag === "input" || tag === "textarea" || (document.activeElement as HTMLElement)?.isContentEditable;
      if (isEditable) return;

      const canvas = fabricRef.current;
      if (!canvas) return;
      
      const activeObj = canvas.getActiveObject();
      if (!activeObj || !(activeObj as any)._isLayer) return;

      // Delete key (works on Mac and Windows)
      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        const layerId = (activeObj as any)._layerId;
        canvas.remove(activeObj);
        canvas.renderAll();
        // Update layers state
        if (onLayerDeleteRef.current) onLayerDeleteRef.current(layerId);
        return;
      }

      // Ctrl+C / Cmd+C - Copy
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "c") {
        e.preventDefault();
        const layerId = (activeObj as any)._layerId;
        const layer = layersRef.current.find((l) => l.id === layerId);
        if (layer) {
          (canvas as any)._clipboard = { layer, fabricObj: fabric.util.object.clone(activeObj.toObject()) };
        }
        return;
      }

      // Ctrl+V / Cmd+V - Paste
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "v") {
        e.preventDefault();
        const clipboard = (canvas as any)._clipboard;
        if (!clipboard) return;
        
        const { layer, fabricObj } = clipboard;
        if (!layer) return;

        // Create new layer with duplicated data
        const newId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
        const newLayer: PrintLayer = {
          ...layer,
          id: newId,
          file: new File([], layer.file?.name || "layer", { type: "application/octet-stream" }),
        };

        // Notify parent to add layer to state
        if (onLayerDuplicateRef.current) {
          onLayerDuplicateRef.current(newLayer);
        }

        // Add to canvas with offset
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (fabric.util.enlivenObjects as any)([fabricObj], (objects: fabric.Object[]) => {
          objects.forEach((obj) => {
            obj.set({ 
              left: (obj.left || 0) + 10, 
              top: (obj.top || 0) + 10,
              evented: true,
              selectable: true,
            });
            (obj as any)._isLayer = true;
            (obj as any)._layerId = newId;
            (obj as any)._layerUrl = newLayer.url;
            if ((obj as any)._isText) {
              (obj as any)._textCurve = layer.textCurve ?? 0;
            }
            canvas.add(obj);
          });
          canvas.setActiveObject(objects[0]);
          canvas.renderAll();
        });
        
        // Select the new layer
        onLayerSelectRef.current?.(newId);
        return;
      }

      // Ctrl+Z / Cmd+Z - Undo
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === "z") {
        e.preventDefault();
        onUndo?.();
        return;
      }

      // Ctrl+Shift+Z / Cmd+Shift+Z - Redo
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === "z") {
        e.preventDefault();
        onRedo?.();
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col items-center gap-3 w-full">
      {/* ── Dynamic contextual toolbar — only shown when a layer is selected ── */}
      {activeLayerId && (() => {
        const activeLayer = layers.find(l => l.id === activeLayerId) ?? null;
        if (!activeLayer) return null;

        const isText = activeLayer.kind === "text";
        const isDrawing = activeLayer.kind === "drawing";
        const isSvg = !isText && !isDrawing && (
          activeLayer.file?.type === "image/svg+xml" ||
          activeLayer.url?.includes(".svg") ||
          activeLayer.uploadedUrl?.includes(".svg") ||
          (activeLayer as any).svgFillColor !== undefined
        );
        const isRaster = !isText && !isDrawing && !isSvg;

        const canRemoveBg = isRaster && !removingBg && (() => {
          const url = activeLayer.url ?? "";
          const mime = activeLayer.file?.type ?? "";
          const ext = url.split("?")[0].split(".").pop()?.toLowerCase() ?? "";
          const allowed = ["jpg", "jpeg", "png", "webp"];
          const allowedMime = ["image/jpeg", "image/png", "image/webp"];
          if (mime && !allowedMime.includes(mime)) return false;
          if (!mime && !allowed.includes(ext)) return false;
          return true;
        })();

        const patch = (p: Partial<PrintLayer>) => onLayerPatch?.(activeLayerId, p);

        return (
          <div className="flex items-center gap-1 bg-card border border-border rounded-xl px-2 py-1.5 shadow-sm overflow-x-auto max-w-full">
            {/* Undo / Redo */}
            <ToolBtn onClick={() => onUndo?.()} title="Скасувати (Ctrl+Z)" label="Скасувати" disabled={!canUndo}>
              <RotateCcw className="size-3.5" />
            </ToolBtn>
            <ToolBtn onClick={() => onRedo?.()} title="Повторити (Ctrl+Shift+Z)" label="Повторити" disabled={!canRedo}>
              <RotateCw className="size-3.5" />
            </ToolBtn>
            <div className="w-px h-4 bg-border mx-1 shrink-0" />
            {/* Generic */}
            <ToolBtn onClick={centerSelected} title="По центру" label="Центр" disabled={isCentered}>
              <Focus className="size-3.5" />
            </ToolBtn>
            {onLayerDuplicate && (
              <ToolBtn onClick={() => onLayerDuplicate(activeLayer)} title="Дублювати" label="Копія">
                <Copy className="size-3.5" />
              </ToolBtn>
            )}
            <div className="w-px h-4 bg-border mx-1 shrink-0" />
            {/* Text controls */}
            {isText && (
              <>
                <select value={(activeLayer as any).textFont ?? "Montserrat"}
                  onChange={(e) => patch({ textFont: e.target.value as any })}
                  className="h-8 px-1.5 text-xs rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary max-w-[110px] shrink-0"
                  style={{ fontFamily: (activeLayer as any).textFont ?? "Montserrat" }}>
                  {TEXT_FONTS.map(f => <option key={f.id} value={f.id} style={{ fontFamily: f.id }}>{f.label}</option>)}
                </select>
                <div className="flex items-center gap-0.5 shrink-0">
                  <button type="button" onClick={() => patch({ textFontSize: Math.max(8, ((activeLayer as any).textFontSize ?? 36) - 2) })} className="size-6 flex items-center justify-center rounded border border-border text-muted-foreground hover:bg-muted text-xs font-bold">−</button>
                  <span className="w-8 text-center text-xs tabular-nums">{(activeLayer as any).textFontSize ?? 36}</span>
                  <button type="button" onClick={() => patch({ textFontSize: Math.min(200, ((activeLayer as any).textFontSize ?? 36) + 2) })} className="size-6 flex items-center justify-center rounded border border-border text-muted-foreground hover:bg-muted text-xs font-bold">+</button>
                </div>
                <ToolBtn title="Жирний" label="Ж" active={!!(activeLayer as any).textBold} onClick={() => patch({ textBold: !(activeLayer as any).textBold })}><Bold className="size-3.5" /></ToolBtn>
                <ToolBtn title="Курсив" label="К" active={!!(activeLayer as any).textItalic} onClick={() => patch({ textItalic: !(activeLayer as any).textItalic })}><Italic className="size-3.5" /></ToolBtn>
                <div className="flex flex-col items-center gap-0.5 shrink-0 min-w-[44px] min-h-[48px] justify-center">
                  <input type="color" value={(activeLayer as any).textColor ?? "#000000"} onChange={(e) => patch({ textColor: e.target.value })} className="w-6 h-6 rounded border border-border cursor-pointer p-0.5 bg-background" />
                  <span className="text-[9px] leading-none text-muted-foreground">Колір</span>
                </div>
                <ToolBtn title="Ліво" label="←" active={((activeLayer as any).textAlign ?? "center") === "left"} onClick={() => patch({ textAlign: "left" })}><AlignLeft className="size-3.5" /></ToolBtn>
                <ToolBtn title="Центр" label="↔" active={((activeLayer as any).textAlign ?? "center") === "center"} onClick={() => patch({ textAlign: "center" })}><AlignCenter className="size-3.5" /></ToolBtn>
                <ToolBtn title="Право" label="→" active={((activeLayer as any).textAlign ?? "center") === "right"} onClick={() => patch({ textAlign: "right" })}><AlignRight className="size-3.5" /></ToolBtn>
                <div className="w-px h-4 bg-border mx-1 shrink-0" />
              </>
            )}
            {/* SVG controls */}
            {isSvg && (
              <>
                <div className="flex flex-col items-center gap-0.5 shrink-0 min-w-[44px] min-h-[48px] justify-center">
                  <input type="color" value={(activeLayer as any).svgFillColor ?? "#000000"} onChange={(e) => patch({ svgFillColor: e.target.value } as any)} className="w-6 h-6 rounded border border-border cursor-pointer p-0.5 bg-background" />
                  <span className="text-[9px] leading-none text-muted-foreground">Заливка</span>
                </div>
                <div className="flex flex-col items-center gap-0.5 shrink-0 min-w-[44px] min-h-[48px] justify-center">
                  <input type="color" value={(activeLayer as any).svgStrokeColor ?? "#000000"} onChange={(e) => patch({ svgStrokeColor: e.target.value } as any)} className="w-6 h-6 rounded border border-border cursor-pointer p-0.5 bg-background" />
                  <span className="text-[9px] leading-none text-muted-foreground">Обводка</span>
                </div>
                <div className="w-px h-4 bg-border mx-1 shrink-0" />
              </>
            )}
            {/* Raster: remove BG */}
            {isRaster && (
              <>
                <ToolBtn onClick={async () => { if (!canRemoveBg || !onRemoveBg) return; setRemovingBg(true); try { const objectUrl = await removeBgClient(activeLayer.url); onRemoveBg(activeLayerId, objectUrl); } catch (err) { toast.error(`Помилка видалення фону: ${err instanceof Error ? err.message : String(err)}`); } finally { setRemovingBg(false); } }} title="Видалити фон" label="Фон" disabled={!canRemoveBg}>
                  {removingBg ? <Loader2 className="size-3.5 animate-spin" /> : <Eraser className="size-3.5" />}
                </ToolBtn>
                <div className="w-px h-4 bg-border mx-1 shrink-0" />
              </>
            )}
            {/* Drawing: edit */}
            {isDrawing && onOpenDrawingStudio && (
              <>
                <ToolBtn onClick={() => onOpenDrawingStudio(activeLayerId)} title="Редагувати малюнок" label="Редагувати"><Pencil className="size-3.5" /></ToolBtn>
                <div className="w-px h-4 bg-border mx-1 shrink-0" />
              </>
            )}
            {/* Opacity */}
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-[9px] text-muted-foreground">Прозорість</span>
              <input type="range" min={0} max={100} value={Math.round(((activeLayer as any).opacity ?? 1) * 100)}
                onChange={(e) => { const v = Number(e.target.value) / 100; const obj = fabricRef.current?.getActiveObject(); if (obj) { obj.set("opacity", v); fabricRef.current?.renderAll(); } patch({ opacity: v } as any); }}
                className="w-20 h-1.5 accent-primary" />
              <span className="text-[9px] text-muted-foreground w-7 text-right tabular-nums">{Math.round(((activeLayer as any).opacity ?? 1) * 100)}%</span>
            </div>
            <div className="w-px h-4 bg-border mx-1 shrink-0" />
            <ToolBtn onClick={deleteSelected} title="Видалити шар" label="Видалити" danger><Trash2 className="size-3.5" /></ToolBtn>
          </div>
        );
      })()}

      <div ref={containerRef} className="w-full" style={{ height: canvasSize }}>
        <div className="relative mx-auto" style={{ width: canvasSize, height: canvasSize }}>
          <div className="rounded-2xl overflow-hidden shadow-lg border border-border/60 w-full h-full">
            <canvas ref={canvasRef} />
          </div>
          {/* Skeleton overlay — shown until background image is loaded */}
          {!backgroundLoaded && (
            <div className="absolute inset-0 rounded-2xl overflow-hidden z-10 pointer-events-none bg-muted/60">
              <div className="w-full h-full flex flex-col items-center justify-center gap-3">
                <Shirt className="w-12 h-12 opacity-15 text-foreground" aria-hidden="true" />
                <span className="text-[11px] font-medium text-muted-foreground/60 tracking-wide select-none">Завантаження зображення...</span>
              </div>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                style={{ animation: "shimmer 1.4s ease-in-out infinite", backgroundSize: "200% 100%" }}
              />
            </div>
          )}
          {removingBg && (
            <div className="absolute inset-0 rounded-2xl bg-background/60 backdrop-blur-sm flex items-center justify-center z-10">
              <div className="flex items-center gap-2.5 rounded-2xl border border-border bg-card px-5 py-3.5 shadow-xl text-sm font-semibold">
                <Loader2 className="size-4 animate-spin text-primary" />
                Видаляємо фон...
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Side switcher — outside canvas so Fabric's upper-canvas can't block it */}
      {onSideChange && (() => {
        const images = variantImages && Object.keys(variantImages).length > 0
          ? variantImages : (product.images ?? {});
        const keys = Object.keys(images).filter((k) => images[k]);
        if (keys.length <= 1) return null;
        const labelMap: Record<string, string> = { front: "Перед", back: "Зад", left: "Ліво", right: "Право" };
        return (
          <div className="flex items-center gap-2 justify-center flex-wrap overflow-x-auto max-w-full pb-0.5">
            {keys.map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => onSideChange(key as "front" | "back")}
                className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                  activeSide === key
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background text-muted-foreground border-border hover:border-primary/50"
                }`}
              >
                {labelMap[key] ?? key}
              </button>
            ))}
          </div>
        );
      })()}
    </div>
  );
}

function ToolBtn({ children, onClick, onMouseDown, title, label, disabled, danger, active }: {
  children: React.ReactNode; onClick: () => void;
  onMouseDown?: (e: React.MouseEvent) => void;
  title: string; label: string; disabled?: boolean; danger?: boolean; active?: boolean;
}) {
  return (
    <button onClick={onClick} onMouseDown={onMouseDown} title={title} disabled={disabled}
      className={`min-w-[44px] min-h-[48px] flex flex-col items-center justify-center gap-0.5 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed px-1 ${
        active ? "bg-primary/10 text-primary"
        : danger ? "hover:bg-red-50 hover:text-red-500 text-muted-foreground"
               : "hover:bg-muted text-muted-foreground hover:text-foreground"}`}>
      {children}
      <span className="text-[9px] leading-none mt-0.5">{label}</span>
    </button>
  );
}
