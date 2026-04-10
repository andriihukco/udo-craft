"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  X, ChevronLeft,
  Shirt, Scissors, Palette, Brush, Sparkles, Star, Wand2,
  Layers, PenTool, Printer, Zap, Gem, Crown, Heart,
  Package, Tag, Ruler, Paintbrush,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAIGeneration } from "./useAIGeneration";
import { dataUrlToFile } from "../_lib/dataUrlToFile";

import type { PrintLayer } from "@udo-craft/shared";
import type { PrintTypePricingRow } from "@udo-craft/shared";

const MAX_GENERATIONS = 3;

const ALL_PRESETS = [
  "команда ІТ-компанії в сучасному офісі",
  "бариста у затишній кав'ярні",
  "учасники масштабного бізнес-івенту",
  "персонал ресторану у фірмовому одязі",
  "спікер на технологічній конференції",
  "колеги на корпоративній вечірці",
  "працівники стартапу в коворкінгу",
  "студент-розробник на кампусі",
];

const PROGRESS_PHRASES = [
  "Аналізуємо запит...",
  "Підбираємо матеріали...",
  "Генеруємо дизайн...",
];

const MATRIX_ICONS = [
  Shirt, Scissors, Palette, Brush, Sparkles, Star, Wand2,
  Layers, PenTool, Printer, Zap, Gem, Crown, Heart,
  Package, Tag, Ruler, Paintbrush,
];

const GRID_SIZE = 16;

// ── Matrix icon grid ──────────────────────────────────────────────────────────
function MatrixIconGrid() {
  const [cells, setCells] = useState<number[]>(() =>
    Array.from({ length: GRID_SIZE }, (_, i) => i % MATRIX_ICONS.length)
  );
  const [active, setActive] = useState<Set<number>>(new Set());

  useEffect(() => {
    const id = setInterval(() => {
      const count = 2 + Math.floor(Math.random() * 3);
      const newActive = new Set<number>();
      setCells((prev) => {
        const next = [...prev];
        for (let i = 0; i < count; i++) {
          const idx = Math.floor(Math.random() * GRID_SIZE);
          next[idx] = Math.floor(Math.random() * MATRIX_ICONS.length);
          newActive.add(idx);
        }
        return next;
      });
      setActive(newActive);
      setTimeout(() => setActive(new Set()), 150);
    }, 120);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="grid grid-cols-4 gap-2 p-2">
      {cells.map((iconIdx, cellIdx) => {
        const Icon = MATRIX_ICONS[iconIdx];
        const isActive = active.has(cellIdx);
        return (
          <div
            key={cellIdx}
            className={`flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-100 ${
              isActive ? "bg-primary/20 text-primary scale-110" : "bg-muted/60 text-muted-foreground/40"
            }`}
          >
            <Icon className="size-5" />
          </div>
        );
      })}
    </div>
  );
}

// ── Rotating presets (all 3 swap at once every 3s) ───────────────────────────
function RotatingPresets({ onSelect }: { onSelect: (text: string) => void }) {
  const [visible, setVisible] = useState<string[]>(() =>
    [...ALL_PRESETS].sort(() => Math.random() - 0.5).slice(0, 3)
  );
  const visibleRef = useRef(visible);
  visibleRef.current = visible;

  useEffect(() => {
    const id = setInterval(() => {
      const current = visibleRef.current;
      const others = ALL_PRESETS.filter((p) => !current.includes(p));
      const pool = others.length >= 3 ? others : ALL_PRESETS;
      setVisible([...pool].sort(() => Math.random() - 0.5).slice(0, 3));
    }, 3000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex gap-1.5 flex-wrap">
      <AnimatePresence mode="popLayout">
        {visible.map((preset) => (
          <motion.button
            key={preset}
            type="button"
            layout
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.85 }}
            transition={{ duration: 0.25 }}
            onClick={() => onSelect(preset)}
            className="rounded-full border border-border/60 bg-muted/50 px-2.5 py-1 text-xs text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {preset}
          </motion.button>
        ))}
      </AnimatePresence>
    </div>
  );
}

// ── In-progress thumbnail shown on step 1 while generation runs ───────────────
function GeneratingThumbnail({ onClick }: { onClick: () => void }) {
  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.2 }}
      onClick={onClick}
      className="w-full flex items-center gap-3 rounded-xl border border-primary/30 bg-primary/5 px-3 py-2.5 text-left hover:bg-primary/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      <div className="shrink-0 w-10 h-10 rounded-lg bg-muted border border-border overflow-hidden flex items-center justify-center">
        <motion.div
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ repeat: Infinity, duration: 1.4 }}
        >
          <Sparkles className="size-4 text-primary" />
        </motion.div>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-primary">Генерація в процесі…</p>
        <p className="text-xs text-muted-foreground truncate">Натисніть, щоб переглянути</p>
      </div>
    </motion.button>
  );
}

// ── Props ─────────────────────────────────────────────────────────────────────
export interface GenerationDrawerProps {
  open: boolean;
  onClose: () => void;
  addLayer: (file: File, side: string, pricing: PrintTypePricingRow[]) => void;
  activeSide: string;
  printPricing: PrintTypePricingRow[];
  captureRef: React.MutableRefObject<(() => string) | null>;
  layers: PrintLayer[];
  mockups: Record<string, string>;
  selectedColor: string;
  productImages: Record<string, string>;
  productName: string;
}

export function GenerationDrawer({
  open, onClose, addLayer, activeSide, printPricing,
  captureRef, layers, mockups, selectedColor, productImages, productName,
}: GenerationDrawerProps) {
  const [prompt, setPrompt] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [step, setStep] = useState<1 | 2>(1);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [progressIndex, setProgressIndex] = useState(0);

  const handleSuccess = useCallback((dataUrl: string) => {
    setPreviewImage(dataUrl);
    setHistory((prev) => [...prev, dataUrl]);
  }, []);

  const { generate, loading, error, clearError } = useAIGeneration({
    activeSide, captureRef, layers, mockups, selectedColor,
    productImages, productName, onSuccess: handleSuccess,
  });

  useEffect(() => {
    if (!loading) return;
    const id = setInterval(() => {
      setProgressIndex((prev) => (prev + 1) % PROGRESS_PHRASES.length);
    }, 2000);
    return () => clearInterval(id);
  }, [loading]);

  useEffect(() => {
    if (!open) { clearError(); setPrompt(""); setStep(1); setPreviewImage(null); }
  }, [open, clearError]);

  const activeSideLayers = layers.filter((l) => l.side === activeSide);
  const otherSideWithLayers = layers.find((l) => l.side !== activeSide);
  const showHint = activeSideLayers.length === 0 && !!otherSideWithLayers && step === 1;
  const remaining = MAX_GENERATIONS - history.length;
  const limitReached = history.length >= MAX_GENERATIONS;

  const handleGenerateClick = async () => {
    setStep(2);
    setProgressIndex(0);
    setPreviewImage(null);
    clearError();
    await generate(prompt);
  };

  const handleAddToCanvas = () => {
    if (!previewImage) return;
    addLayer(dataUrlToFile(previewImage), activeSide, printPricing);
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="backdrop"
            className="fixed inset-0 z-40 bg-black/40"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            key="drawer"
            className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pointer-events-none"
            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
          >
            <div className="max-w-sm w-full mx-auto rounded-t-2xl bg-background shadow-xl pointer-events-auto overflow-hidden">
              <div className="flex justify-center pt-3 pb-1">
                <div className="h-1 w-10 rounded-full bg-muted-foreground/30" />
              </div>

              <div className="px-4 pb-5 min-h-[300px]">
                <AnimatePresence mode="wait">

                  {/* ── Step 1 ── */}
                  {step === 1 && (
                    <motion.div
                      key="step-1"
                      initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}
                      className="space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <h2 className="text-base font-semibold">AI Генерація</h2>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${limitReached ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground"}`}>
                            {remaining}/{MAX_GENERATIONS}
                          </span>
                          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Закрити" className="h-8 w-8 -mr-2">
                            <X className="h-5 w-5" />
                          </Button>
                        </div>
                      </div>

                      {/* In-progress banner */}
                      <AnimatePresence>
                        {loading && <GeneratingThumbnail onClick={() => setStep(2)} />}
                      </AnimatePresence>

                      {/* Completed history */}
                      {history.length > 0 && (
                        <div className="flex gap-2 overflow-x-auto pb-0.5">
                          {history.map((dataUrl, i) => (
                            <button
                              key={i}
                              type="button"
                              onClick={() => { setPreviewImage(dataUrl); setStep(2); }}
                              className="shrink-0 w-14 h-14 rounded-lg border border-border overflow-hidden hover:ring-2 hover:ring-primary transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={dataUrl} alt={`Генерація ${i + 1}`} className="w-full h-full object-cover" />
                            </button>
                          ))}
                        </div>
                      )}

                      <textarea
                        aria-label="Опис сцени для генерації"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="Опишіть сцену або оберіть пресет…"
                        rows={3}
                        className="w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      />

                      <RotatingPresets onSelect={setPrompt} />

                      {showHint && (
                        <p className="text-xs text-muted-foreground">
                          Активна сторона порожня. Натхнення буде братись зі сторони «{otherSideWithLayers!.side}».
                        </p>
                      )}

                      <Button
                        className="w-full"
                        disabled={!prompt.trim() || limitReached || loading}
                        onClick={handleGenerateClick}
                      >
                        {limitReached ? "Ліміт вичерпано (3/3)" : loading ? "Генерація в процесі…" : "Згенерувати"}
                      </Button>
                    </motion.div>
                  )}

                  {/* ── Step 2 ── */}
                  {step === 2 && (
                    <motion.div
                      key="step-2"
                      initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.2 }}
                      className="space-y-4"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 -ml-2">
                          {/* Back always enabled — user can go back while generating */}
                          <Button variant="ghost" size="icon" onClick={() => setStep(1)} aria-label="Назад" className="h-8 w-8">
                            <ChevronLeft className="h-5 w-5" />
                          </Button>
                          <span className="font-semibold text-base">
                            {loading ? "Генеруємо…" : "Результат"}
                          </span>
                        </div>
                        <Button variant="ghost" size="icon" onClick={onClose} aria-label="Закрити" className="h-8 w-8 -mr-2">
                          <X className="h-5 w-5" />
                        </Button>
                      </div>

                      <div className="w-full aspect-square rounded-xl border border-border bg-muted flex flex-col items-center justify-center overflow-hidden">
                        {loading ? (
                          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                            className="flex flex-col items-center justify-center gap-4 p-4 w-full"
                          >
                            <MatrixIconGrid />
                            <AnimatePresence mode="wait">
                              <motion.p
                                key={progressIndex}
                                initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                                exit={progressIndex < PROGRESS_PHRASES.length - 1 ? { opacity: 0, y: -5 } : undefined}
                                className="text-sm font-medium text-muted-foreground"
                              >
                                {progressIndex < PROGRESS_PHRASES.length - 1
                                  ? PROGRESS_PHRASES[progressIndex]
                                  : "Фінальні штрихи..."}
                              </motion.p>
                            </AnimatePresence>
                          </motion.div>
                        ) : previewImage ? (
                          <motion.img initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                            src={previewImage} alt="Generated Design" className="w-full h-full object-cover"
                          />
                        ) : error ? (
                          <div className="p-4 text-center text-sm text-destructive bg-destructive/10 rounded-md m-4">
                            {error}
                            <Button variant="outline" size="sm" className="mt-3 w-full" onClick={() => setStep(1)}>
                              Спробувати знову
                            </Button>
                          </div>
                        ) : null}
                      </div>

                      {!loading && previewImage && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                          <Button className="w-full" onClick={handleAddToCanvas}>
                            Додати на полотно
                          </Button>
                        </motion.div>
                      )}
                    </motion.div>
                  )}

                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
