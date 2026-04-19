"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, X, Pencil, Trash2, Ruler } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { SizeChartModal } from "@/components/size-chart-modal";
import { toast } from "sonner";

// ── Available sizes (global defaults) ────────────────────────────────────────

const STORAGE_KEY = "catalog_available_sizes";
const SIZE_PRESETS = [
  { label: "Одяг (XS–3XL)", sizes: ["XS", "S", "M", "L", "XL", "2XL", "3XL"] },
  { label: "Взуття (36–46)", sizes: ["36", "37", "38", "39", "40", "41", "42", "43", "44", "45", "46"] },
  { label: "Дитячий (92–164)", sizes: ["92", "104", "116", "128", "140", "152", "164"] },
  { label: "Один розмір", sizes: ["One Size"] },
];

function loadSizes(): string[] {
  if (typeof window === "undefined") return ["XS", "S", "M", "L", "XL", "2XL", "3XL"];
  try { const s = localStorage.getItem(STORAGE_KEY); return s ? JSON.parse(s) : ["XS", "S", "M", "L", "XL", "2XL", "3XL"]; }
  catch { return ["XS", "S", "M", "L", "XL", "2XL", "3XL"]; }
}
function saveSizes(sizes: string[]) {
  if (typeof window !== "undefined") localStorage.setItem(STORAGE_KEY, JSON.stringify(sizes));
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface SizeChart { id: string; name: string; rows: Record<string, string>[]; }

// ── Component ─────────────────────────────────────────────────────────────────

export default function SizesTab() {
  // Available sizes
  const [sizes, setSizes] = useState<string[]>(loadSizes);
  const [newSize, setNewSize] = useState("");

  // Size charts
  const [charts, setCharts] = useState<SizeChart[]>([]);
  const [chartsLoading, setChartsLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newChartName, setNewChartName] = useState("");
  const [editChartId, setEditChartId] = useState<string | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<SizeChart | null>(null);

  const fetchCharts = useCallback(async () => {
    setChartsLoading(true);
    try {
      const r = await fetch("/api/size-charts");
      if (r.ok) setCharts(await r.json());
    } finally { setChartsLoading(false); }
  }, []);

  useEffect(() => { fetchCharts(); }, [fetchCharts]);

  // ── Available sizes handlers ──────────────────────────────────────────────

  const updateSizes = (next: string[]) => { setSizes(next); saveSizes(next); };
  const addSize = () => {
    const v = newSize.trim().toUpperCase();
    if (!v || sizes.includes(v)) return;
    updateSizes([...sizes, v]);
    setNewSize("");
  };
  const removeSize = (s: string) => updateSizes(sizes.filter(x => x !== s));
  const applyPreset = (preset: string[]) => {
    const merged = [...sizes];
    preset.forEach(s => { if (!merged.includes(s)) merged.push(s); });
    updateSizes(merged);
  };

  // ── Size chart handlers ───────────────────────────────────────────────────

  const handleCreateChart = async () => {
    if (!newChartName.trim()) return;
    const r = await fetch("/api/size-charts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newChartName.trim(), rows: [] }),
    });
    if (!r.ok) { toast.error("Помилка створення"); return; }
    toast.success("Таблицю створено");
    setCreateDialogOpen(false);
    setNewChartName("");
    fetchCharts();
  };

  const handleDeleteChart = async () => {
    if (!deleteTarget) return;
    const r = await fetch(`/api/size-charts/${deleteTarget.id}`, { method: "DELETE" });
    if (!r.ok) { toast.error("Помилка видалення"); return; }
    toast.success("Видалено");
    setDeleteTarget(null);
    fetchCharts();
  };

  return (
    <div className="p-4 md:p-6 space-y-6">

      {/* ── Available sizes ─────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Доступні розміри за замовчуванням</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-muted-foreground">Ці розміри підставляються при створенні нового товару.</p>

          <div className="flex flex-wrap gap-2 min-h-[44px] p-3 rounded-lg border border-border bg-muted/30">
            {sizes.length === 0 ? (
              <p className="text-xs text-muted-foreground self-center">Розмірів ще немає</p>
            ) : sizes.map(s => (
              <span key={s} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-background border border-border text-sm font-medium">
                {s}
                <button onClick={() => removeSize(s)} className="text-muted-foreground hover:text-destructive transition-colors">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>

          <div className="flex gap-2">
            <Input value={newSize} onChange={e => setNewSize(e.target.value)}
              onKeyDown={e => e.key === "Enter" && addSize()}
              placeholder="Новий розмір (напр. 4XL)" className="h-8 text-sm max-w-xs" />
            <Button size="sm" onClick={addSize} className="h-8 text-xs">
              <Plus className="w-3.5 h-3.5 mr-1" /> Додати
            </Button>
          </div>

          {/* Presets */}
          <div className="space-y-2 pt-1">
            <p className="text-xs font-medium text-muted-foreground">Пресети:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {SIZE_PRESETS.map(preset => (
                <div key={preset.label} className="flex items-center justify-between gap-2 p-2.5 rounded-lg border border-border">
                  <div className="min-w-0">
                    <p className="text-xs font-medium">{preset.label}</p>
                    <p className="text-[10px] text-muted-foreground font-mono truncate">{preset.sizes.join(", ")}</p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button variant="outline" size="sm" className="h-6 text-[10px] px-2" onClick={() => applyPreset(preset.sizes)}>Додати</Button>
                    <Button variant="outline" size="sm" className="h-6 text-[10px] px-2" onClick={() => updateSizes([...preset.sizes])}>Замінити</Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Size charts ─────────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-semibold">Таблиці розмірів</CardTitle>
          <Button size="sm" className="h-7 text-xs" onClick={() => setCreateDialogOpen(true)}>
            <Plus className="w-3.5 h-3.5 mr-1" /> Нова таблиця
          </Button>
        </CardHeader>
        <CardContent>
          {chartsLoading ? (
            <div className="space-y-2">
              {[1, 2].map(i => <div key={i} className="h-12 bg-muted rounded-lg animate-pulse" />)}
            </div>
          ) : charts.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">
              <Ruler className="w-8 h-8 mx-auto mb-2 opacity-30" />
              Таблиць розмірів ще немає
            </div>
          ) : (
            <div className="space-y-2">
              {charts.map(chart => (
                <div key={chart.id} className="flex items-center justify-between gap-3 p-3 rounded-lg border border-border hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Ruler className="w-4 h-4 text-muted-foreground shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{chart.name}</p>
                      <p className="text-xs text-muted-foreground">{chart.rows?.length ?? 0} рядків</p>
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button variant="ghost" size="icon" className="h-7 w-7"
                      onClick={() => { setEditChartId(chart.id); setEditModalOpen(true); }}>
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={() => setDeleteTarget(chart)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Нова таблиця розмірів</DialogTitle></DialogHeader>
          <div className="py-2">
            <Input value={newChartName} onChange={e => setNewChartName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleCreateChart()}
              placeholder="Назва таблиці (напр. Футболки)" autoFocus />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>Скасувати</Button>
            <Button onClick={handleCreateChart} disabled={!newChartName.trim()}>Створити</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit modal */}
      <SizeChartModal
        chartId={editChartId}
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        editable
        onSaved={() => { fetchCharts(); toast.success("Збережено"); }}
      />

      {/* Delete confirm */}
      <AlertDialog open={!!deleteTarget} onOpenChange={o => { if (!o) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Видалити таблицю?</AlertDialogTitle>
            <AlertDialogDescription>«{deleteTarget?.name}» буде видалено назавжди.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Скасувати</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteChart} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Видалити
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
