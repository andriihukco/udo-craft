"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Ruler, Layers, Plus, Trash2, Pencil, X, Check } from "lucide-react";
import { toast } from "sonner";

// ── Types ──────────────────────────────────────────────────────────────────

export interface SizeRow {
  size: string;
  [key: string]: string | undefined;
}

export interface SizeChart {
  id: string;
  name: string;
  rows: SizeRow[];
}

export interface PrintArea {
  id: string;
  name: string;
  label: string;
  width_mm: number;
  height_mm: number;
  price_add_cents: number;
  description: string;
}

const EMPTY_CHART: Omit<SizeChart, "id"> = { name: "", rows: [] };
const EMPTY_AREA: Omit<PrintArea, "id"> = {
  name: "", label: "", width_mm: 0, height_mm: 0, price_add_cents: 0, description: "",
};
const DEFAULT_COLUMNS = ["size", "chest_cm", "waist_cm", "length_cm"];
export const COLUMN_LABELS: Record<string, string> = {
  size: "Розмір", chest_cm: "Груди (см)", waist_cm: "Талія (см)", length_cm: "Довжина (см)",
};

// ── Size Chart Editor ──────────────────────────────────────────────────────

function SizeChartEditor({
  chart,
  onSave,
  onCancel,
}: {
  chart: Partial<SizeChart>;
  onSave: (c: Partial<SizeChart>) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(chart.name || "");
  const [rows, setRows] = useState<SizeRow[]>(
    chart.rows?.length ? chart.rows : [{ size: "S" }, { size: "M" }, { size: "L" }, { size: "XL" }]
  );
  const [columns, setColumns] = useState<string[]>(
    chart.rows?.[0] ? Object.keys(chart.rows[0]) : DEFAULT_COLUMNS
  );
  const [newCol, setNewCol] = useState("");

  const updateCell = (ri: number, col: string, val: string) =>
    setRows((prev) => prev.map((r, i) => (i === ri ? { ...r, [col]: val } : r)));

  const addRow = () => setRows((prev) => [...prev, { size: "" }]);
  const removeRow = (i: number) => setRows((prev) => prev.filter((_, idx) => idx !== i));

  const addColumn = () => {
    const col = newCol.trim().toLowerCase().replace(/\s+/g, "_");
    if (!col || columns.includes(col)) return;
    setColumns((prev) => [...prev, col]);
    setRows((prev) => prev.map((r) => ({ ...r, [col]: "" })));
    setNewCol("");
  };

  const removeColumn = (col: string) => {
    if (col === "size") return;
    setColumns((prev) => prev.filter((c) => c !== col));
    setRows((prev) => prev.map((r) => { const { [col]: _, ...rest } = r; return rest as SizeRow; }));
  };

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label>Назва таблиці *</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Футболки унісекс" />
      </div>

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50">
              {columns.map((col) => (
                <th key={col} className="px-3 py-2 text-left font-medium text-muted-foreground whitespace-nowrap">
                  <div className="flex items-center gap-1">
                    {COLUMN_LABELS[col] || col}
                    {col !== "size" && (
                      <button onClick={() => removeColumn(col)} className="text-muted-foreground hover:text-destructive ml-1">
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </th>
              ))}
              <th className="px-3 py-2 w-8" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row, ri) => (
              <tr key={ri} className="border-t border-border">
                {columns.map((col) => (
                  <td key={col} className="px-2 py-1">
                    <Input
                      value={row[col] || ""}
                      onChange={(e) => updateCell(ri, col, e.target.value)}
                      className="h-7 text-xs min-w-[60px]"
                      placeholder={col === "size" ? "S" : "—"}
                    />
                  </td>
                ))}
                <td className="px-2 py-1">
                  <button onClick={() => removeRow(ri)} className="text-muted-foreground hover:text-destructive">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" size="sm" onClick={addRow}>
          <Plus className="w-3.5 h-3.5 mr-1" /> Рядок
        </Button>
        <div className="flex gap-1">
          <Input
            value={newCol}
            onChange={(e) => setNewCol(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addColumn()}
            placeholder="нова колонка..."
            className="h-8 text-xs w-36"
          />
          <Button type="button" variant="outline" size="sm" onClick={addColumn}>
            <Plus className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      <div className="flex gap-2">
        <Button size="sm" onClick={() => onSave({ name, rows })}>
          <Check className="w-3.5 h-3.5 mr-1" /> Зберегти
        </Button>
        <Button size="sm" variant="outline" onClick={onCancel}>Скасувати</Button>
      </div>
    </div>
  );
}

// ── Size Charts Panel ──────────────────────────────────────────────────────

export function SizeChartsPanel() {
  const [charts, setCharts] = useState<SizeChart[]>([]);
  const [editing, setEditing] = useState<Partial<SizeChart> | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const fetch_ = useCallback(async () => {
    const res = await fetch("/api/size-charts");
    if (res.ok) setCharts(await res.json());
  }, []);

  useEffect(() => { fetch_(); }, [fetch_]);

  const handleSave = async (data: Partial<SizeChart>) => {
    if (!data.name) { toast.error("Назва обов'язкова"); return; }
    const url = editingId ? `/api/size-charts/${editingId}` : "/api/size-charts";
    const res = await fetch(url, {
      method: editingId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) { toast.error("Помилка збереження"); return; }
    toast.success(editingId ? "Таблицю оновлено" : "Таблицю створено");
    setEditing(null);
    setEditingId(null);
    fetch_();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Видалити таблицю розмірів?")) return;
    const res = await fetch(`/api/size-charts/${id}`, { method: "DELETE" });
    if (res.ok) { toast.success("Видалено"); fetch_(); }
    else toast.error("Помилка видалення");
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <Ruler className="size-4" /> Таблиці розмірів
            </CardTitle>
            <CardDescription>Глобальні таблиці — призначайте до конкретних продуктів</CardDescription>
          </div>
          {!editing && (
            <Button size="sm" variant="outline" onClick={() => { setEditing(EMPTY_CHART); setEditingId(null); }}>
              <Plus className="w-3.5 h-3.5 mr-1" /> Нова таблиця
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {editing && (
          <div className="border border-blue-200 bg-blue-50/30 rounded-lg p-4">
            <SizeChartEditor
              chart={editing}
              onSave={handleSave}
              onCancel={() => { setEditing(null); setEditingId(null); }}
            />
          </div>
        )}

        {charts.length === 0 && !editing && (
          <p className="text-sm text-muted-foreground text-center py-6">Таблиць ще немає</p>
        )}

        <div className="space-y-2">
          {charts.map((chart) => (
            <div key={chart.id} className="border border-border rounded-lg overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2.5 bg-muted/30">
                <p className="text-sm font-medium">{chart.name}</p>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0"
                    onClick={() => { setEditing(chart); setEditingId(chart.id); }}>
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                    onClick={() => handleDelete(chart.id)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
              {chart.rows?.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-t border-border bg-muted/10">
                        {Object.keys(chart.rows[0]).map((col) => (
                          <th key={col} className="px-3 py-1.5 text-left text-muted-foreground font-medium">
                            {COLUMN_LABELS[col] || col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {chart.rows.map((row, i) => (
                        <tr key={i} className="border-t border-border">
                          {Object.values(row).map((val, j) => (
                            <td key={j} className="px-3 py-1.5 text-foreground">{val || "—"}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ── Print Areas Panel ──────────────────────────────────────────────────────

export function PrintAreasPanel() {
  const [areas, setAreas] = useState<PrintArea[]>([]);
  const [editing, setEditing] = useState<Partial<PrintArea> | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const fetch_ = useCallback(async () => {
    const res = await fetch("/api/print-areas");
    if (res.ok) setAreas(await res.json());
  }, []);

  useEffect(() => { fetch_(); }, [fetch_]);

  const handleSave = async () => {
    if (!editing?.name) { toast.error("Назва обов'язкова"); return; }
    setSaving(true);
    const url = editingId ? `/api/print-areas/${editingId}` : "/api/print-areas";
    const res = await fetch(url, {
      method: editingId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editing),
    });
    if (!res.ok) { toast.error("Помилка збереження"); setSaving(false); return; }
    toast.success(editingId ? "Зону оновлено" : "Зону створено");
    setEditing(null);
    setEditingId(null);
    fetch_();
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Видалити зону друку?")) return;
    const res = await fetch(`/api/print-areas/${id}`, { method: "DELETE" });
    if (res.ok) { toast.success("Видалено"); fetch_(); }
    else toast.error("Помилка видалення");
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <Layers className="size-4" /> Зони друку
            </CardTitle>
            <CardDescription>Визначте зони та їх вартість — призначайте до продуктів</CardDescription>
          </div>
          {!editing && (
            <Button size="sm" variant="outline" onClick={() => { setEditing(EMPTY_AREA); setEditingId(null); }}>
              <Plus className="w-3.5 h-3.5 mr-1" /> Нова зона
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {editing && (
          <div className="border border-blue-200 bg-blue-50/30 rounded-lg p-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Назва *", key: "name", placeholder: "front-chest" },
                { label: "Підпис (для клієнта)", key: "label", placeholder: "Груди (спереду)" },
                { label: "Опис", key: "description", placeholder: "Максимальний розмір принту..." },
              ].map(({ label, key, placeholder }) => (
                <div key={key} className="space-y-1.5">
                  <Label>{label}</Label>
                  <Input
                    value={(editing as any)[key] || ""}
                    onChange={(e) => setEditing((a) => ({ ...a, [key]: e.target.value }))}
                    placeholder={placeholder}
                  />
                </div>
              ))}
              <div className="space-y-1.5">
                <Label>Ширина (мм)</Label>
                <Input type="number" min="0"
                  value={editing.width_mm || ""}
                  onChange={(e) => setEditing((a) => ({ ...a, width_mm: parseFloat(e.target.value) || 0 }))}
                  placeholder="300" />
              </div>
              <div className="space-y-1.5">
                <Label>Висота (мм)</Label>
                <Input type="number" min="0"
                  value={editing.height_mm || ""}
                  onChange={(e) => setEditing((a) => ({ ...a, height_mm: parseFloat(e.target.value) || 0 }))}
                  placeholder="400" />
              </div>
              <div className="space-y-1.5">
                <Label>Доплата (грн)</Label>
                <Input type="number" min="0" step="0.01"
                  value={(editing.price_add_cents || 0) / 100}
                  onChange={(e) => setEditing((a) => ({ ...a, price_add_cents: Math.round(parseFloat(e.target.value || "0") * 100) }))}
                  placeholder="50" />
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSave} disabled={saving}>
                <Check className="w-3.5 h-3.5 mr-1" />
                {saving ? "Збереження..." : "Зберегти"}
              </Button>
              <Button size="sm" variant="outline" onClick={() => { setEditing(null); setEditingId(null); }}>
                Скасувати
              </Button>
            </div>
          </div>
        )}

        {areas.length === 0 && !editing && (
          <p className="text-sm text-muted-foreground text-center py-6">Зон друку ще немає</p>
        )}

        <div className="space-y-2">
          {areas.map((area) => (
            <div key={area.id} className="flex items-center justify-between border border-border rounded-lg px-4 py-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium">{area.label || area.name}</p>
                  <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{area.name}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {area.width_mm}×{area.height_mm} мм
                  {area.price_add_cents > 0 && ` · +₴${(area.price_add_cents / 100).toFixed(0)}`}
                  {area.description && ` · ${area.description}`}
                </p>
              </div>
              <div className="flex gap-1 flex-shrink-0">
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0"
                  onClick={() => { setEditing(area); setEditingId(area.id); }}>
                  <Pencil className="w-3.5 h-3.5" />
                </Button>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                  onClick={() => handleDelete(area.id)}>
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
