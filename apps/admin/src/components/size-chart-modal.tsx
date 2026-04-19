"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface SizeChartRow { [col: string]: string; }
interface SizeChart { id: string; name: string; rows: SizeChartRow[]; }

interface Props {
  chartId: string | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  /** If provided, allows editing */
  editable?: boolean;
  onSaved?: () => void;
}

export function SizeChartModal({ chartId, open, onOpenChange, editable = false, onSaved }: Props) {
  const [chart, setChart] = useState<SizeChart | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [rows, setRows] = useState<SizeChartRow[]>([]);
  const [columns, setColumns] = useState<string[]>(["Розмір", "Груди (см)", "Талія (см)", "Стегна (см)"]);
  const [newCol, setNewCol] = useState("");

  useEffect(() => {
    if (!open || !chartId) return;
    setLoading(true);
    fetch(`/api/size-charts`)
      .then(r => r.json())
      .then((charts: SizeChart[]) => {
        const found = charts.find(c => c.id === chartId);
        if (found) {
          setChart(found);
          setName(found.name);
          const r = found.rows ?? [];
          setRows(r);
          if (r.length > 0) setColumns(Object.keys(r[0]));
        }
      })
      .finally(() => setLoading(false));
  }, [open, chartId]);

  const addColumn = () => {
    const col = newCol.trim();
    if (!col || columns.includes(col)) return;
    setColumns(prev => [...prev, col]);
    setRows(prev => prev.map(r => ({ ...r, [col]: "" })));
    setNewCol("");
  };

  const removeColumn = (col: string) => {
    setColumns(prev => prev.filter(c => c !== col));
    setRows(prev => prev.map(r => { const next = { ...r }; delete next[col]; return next; }));
  };

  const addRow = () => {
    const empty: SizeChartRow = {};
    columns.forEach(c => { empty[c] = ""; });
    setRows(prev => [...prev, empty]);
  };

  const updateCell = (rowIdx: number, col: string, val: string) => {
    setRows(prev => prev.map((r, i) => i === rowIdx ? { ...r, [col]: val } : r));
  };

  const removeRow = (idx: number) => setRows(prev => prev.filter((_, i) => i !== idx));

  const handleSave = async () => {
    if (!chartId) return;
    setSaving(true);
    await fetch(`/api/size-charts/${chartId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, rows }),
    });
    setSaving(false);
    onSaved?.();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {editable ? (
              <Input value={name} onChange={e => setName(e.target.value)} className="text-base font-semibold h-8 w-64" />
            ) : (
              chart?.name ?? "Таблиця розмірів"
            )}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex-1 flex items-center justify-center py-12">
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="flex-1 overflow-auto space-y-4">
            {/* Column manager (edit mode only) */}
            {editable && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-muted-foreground font-medium">Колонки:</span>
                {columns.map(col => (
                  <span key={col} className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-muted text-xs font-medium">
                    {col}
                    {columns.length > 1 && (
                      <button onClick={() => removeColumn(col)} className="text-muted-foreground hover:text-destructive">
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </span>
                ))}
                <div className="flex gap-1">
                  <Input value={newCol} onChange={e => setNewCol(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && addColumn()}
                    placeholder="Нова колонка" className="h-6 text-xs w-32" />
                  <Button size="sm" variant="outline" className="h-6 text-xs px-2" onClick={addColumn}>
                    <Plus className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            )}

            {/* Table */}
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50 border-b border-border">
                    {columns.map(col => (
                      <th key={col} className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground whitespace-nowrap">
                        {col}
                      </th>
                    ))}
                    {editable && <th className="w-8" />}
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 ? (
                    <tr>
                      <td colSpan={columns.length + (editable ? 1 : 0)} className="px-3 py-8 text-center text-sm text-muted-foreground">
                        Рядків ще немає
                      </td>
                    </tr>
                  ) : rows.map((row, i) => (
                    <tr key={i} className="border-b border-border last:border-0 hover:bg-muted/30">
                      {columns.map(col => (
                        <td key={col} className="px-3 py-2">
                          {editable ? (
                            <Input value={row[col] ?? ""} onChange={e => updateCell(i, col, e.target.value)}
                              className="h-7 text-xs border-0 bg-transparent p-0 focus-visible:ring-0 focus-visible:border-b focus-visible:border-primary rounded-none" />
                          ) : (
                            <span className="font-medium">{row[col] ?? "—"}</span>
                          )}
                        </td>
                      ))}
                      {editable && (
                        <td className="px-1">
                          <button onClick={() => removeRow(i)} className="text-muted-foreground hover:text-destructive p-1">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {editable && (
              <Button variant="outline" size="sm" onClick={addRow} className="h-7 text-xs">
                <Plus className="w-3 h-3 mr-1" /> Додати рядок
              </Button>
            )}
          </div>
        )}

        {editable && (
          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Скасувати</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Збереження..." : "Зберегти"}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
