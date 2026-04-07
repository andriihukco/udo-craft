"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { Plus, Trash2, Loader2, Save, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// ── Types ─────────────────────────────────────────────────────────────────

const PRINT_TYPES = [
  { id: "dtf",         label: "DTF / Принт",   color: "#6366f1" },
  { id: "embroidery",  label: "Вишивка",        color: "#ec4899" },
  { id: "screen",      label: "Шовкодрук",      color: "#f59e0b" },
  { id: "sublimation", label: "Сублімація",     color: "#06b6d4" },
  { id: "patch",       label: "Нашивка",        color: "#10b981" },
] as const;

type PrintTypeId = typeof PRINT_TYPES[number]["id"];

interface QtyTier {
  min_qty: number;
  price_cents: number;
}

interface PricingRow {
  id: string;
  print_type: PrintTypeId;
  size_label: string;
  size_min_cm: number;
  size_max_cm: number;
  qty_tiers: QtyTier[];
  sort_order: number;
  is_active: boolean;
}

// ── Helpers ───────────────────────────────────────────────────────────────

function formatPrice(cents: number) {
  return `${(cents / 100).toFixed(0)} ₴`;
}

// ── QtyTiersEditor ────────────────────────────────────────────────────────

function QtyTiersEditor({ tiers, onChange }: { tiers: QtyTier[]; onChange: (t: QtyTier[]) => void }) {
  const update = (i: number, field: keyof QtyTier, val: string) => {
    const n = parseInt(val);
    if (isNaN(n)) return;
    const next = tiers.map((t, idx) => idx === i ? { ...t, [field]: n } : t);
    onChange(next);
  };

  return (
    <div className="space-y-1.5">
      <div className="grid grid-cols-[1fr_1fr_auto] gap-1.5 text-[10px] text-muted-foreground font-medium px-1">
        <span>Від (шт)</span><span>Ціна (грн)</span><span />
      </div>
      {tiers.map((tier, i) => (
        <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-1.5 items-center">
          <Input
            type="number" min={1} value={tier.min_qty}
            onChange={(e) => update(i, "min_qty", e.target.value)}
            className="h-7 text-xs"
          />
          <Input
            type="number" min={0} value={Math.round(tier.price_cents / 100)}
            onChange={(e) => {
              const n = parseFloat(e.target.value);
              if (!isNaN(n)) {
                const next = tiers.map((t, idx) => idx === i ? { ...t, price_cents: Math.round(n * 100) } : t);
                onChange(next);
              }
            }}
            className="h-7 text-xs"
          />
          <button
            type="button"
            onClick={() => onChange(tiers.filter((_, idx) => idx !== i))}
            className="size-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
          >
            <Trash2 className="size-3" />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...tiers, { min_qty: 1, price_cents: 10000 }])}
        className="flex items-center gap-1 text-xs text-primary hover:underline mt-1"
      >
        <Plus className="size-3" /> Додати тир
      </button>
    </div>
  );
}

// ── SizeRowCard ───────────────────────────────────────────────────────────

function SizeRowCard({
  row,
  onSave,
  onDelete,
}: {
  row: PricingRow;
  onSave: (updated: PricingRow) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [expanded, setExpanded] = useState(false);
  const [draft, setDraft] = useState<PricingRow>(row);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isDirty = JSON.stringify(draft) !== JSON.stringify(row);

  const handleSave = async () => {
    setSaving(true);
    await onSave(draft);
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!confirm(`Видалити "${row.size_label}"?`)) return;
    setDeleting(true);
    await onDelete(row.id);
    setDeleting(false);
  };

  return (
    <div className="border border-border rounded-xl overflow-hidden">
      {/* Header row */}
      <div
        className="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-muted/30 transition-colors"
        onClick={() => setExpanded((v) => !v)}
      >
        <span className="text-sm font-semibold w-24 shrink-0">{row.size_label}</span>
        <span className="text-xs text-muted-foreground">{row.size_min_cm}–{row.size_max_cm} см</span>
        <div className="flex-1 flex gap-1.5 flex-wrap">
          {row.qty_tiers.map((t, i) => (
            <span key={i} className="text-[10px] bg-muted rounded px-1.5 py-0.5">
              від {t.min_qty} шт → {formatPrice(t.price_cents)}
            </span>
          ))}
        </div>
        {expanded ? <ChevronUp className="size-4 text-muted-foreground shrink-0" /> : <ChevronDown className="size-4 text-muted-foreground shrink-0" />}
      </div>

      {/* Expanded editor */}
      {expanded && (
        <div className="border-t border-border bg-muted/20 p-3 space-y-3">
          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">Назва розміру</Label>
              <Input value={draft.size_label} onChange={(e) => setDraft({ ...draft, size_label: e.target.value })} className="h-7 text-xs" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Мін. см</Label>
              <Input type="number" value={draft.size_min_cm} onChange={(e) => setDraft({ ...draft, size_min_cm: parseFloat(e.target.value) || 0 })} className="h-7 text-xs" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Макс. см</Label>
              <Input type="number" value={draft.size_max_cm} onChange={(e) => setDraft({ ...draft, size_max_cm: parseFloat(e.target.value) || 0 })} className="h-7 text-xs" />
            </div>
          </div>

          <div>
            <Label className="text-xs mb-1.5 block">Тири кількості</Label>
            <QtyTiersEditor tiers={draft.qty_tiers} onChange={(t) => setDraft({ ...draft, qty_tiers: t })} />
          </div>

          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="flex items-center gap-1 text-xs text-destructive hover:underline disabled:opacity-50"
            >
              {deleting ? <Loader2 className="size-3 animate-spin" /> : <Trash2 className="size-3" />}
              Видалити
            </button>
            {isDirty && (
              <Button size="sm" onClick={handleSave} disabled={saving} className="h-7 text-xs gap-1">
                {saving ? <Loader2 className="size-3 animate-spin" /> : <Save className="size-3" />}
                Зберегти
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────

export default function PrintTypePricingManager() {
  const [activeType, setActiveType] = useState<PrintTypeId>("dtf");
  const [rows, setRows] = useState<PricingRow[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchRows = useCallback(async (type: PrintTypeId) => {
    setLoading(true);
    const res = await fetch(`/api/print-type-pricing?print_type=${type}`);
    const data = await res.json();
    setRows(Array.isArray(data) ? data : []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchRows(activeType); }, [activeType, fetchRows]);

  const handleSave = async (updated: PricingRow) => {
    const res = await fetch(`/api/print-type-pricing/${updated.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updated),
    });
    if (!res.ok) { toast.error("Помилка збереження"); return; }
    toast.success("Збережено");
    fetchRows(activeType);
  };

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/print-type-pricing/${id}`, { method: "DELETE" });
    if (!res.ok) { toast.error("Помилка видалення"); return; }
    toast.success("Видалено");
    fetchRows(activeType);
  };

  const handleAdd = async () => {
    const label = prompt("Назва розміру (напр. 8-10см):");
    if (!label) return;
    const res = await fetch("/api/print-type-pricing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        print_type: activeType,
        size_label: label,
        size_min_cm: 0,
        size_max_cm: 0,
        qty_tiers: [{ min_qty: 1, price_cents: 10000 }],
        sort_order: rows.length,
      }),
    });
    if (!res.ok) { toast.error("Помилка створення"); return; }
    toast.success("Додано");
    fetchRows(activeType);
  };

  const currentType = PRINT_TYPES.find((t) => t.id === activeType)!;

  return (
    <div className="space-y-4">
      {/* Type tabs */}
      <div className="flex gap-1.5 flex-wrap">
        {PRINT_TYPES.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveType(t.id)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
              activeType === t.id
                ? "text-white border-transparent"
                : "border-border text-muted-foreground hover:border-foreground/30"
            }`}
            style={activeType === t.id ? { backgroundColor: t.color, borderColor: t.color } : {}}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Сітка цін для <span className="font-semibold" style={{ color: currentType.color }}>{currentType.label}</span>
        </p>
        <Button size="sm" onClick={handleAdd} className="h-7 text-xs gap-1">
          <Plus className="size-3" /> Додати розмір
        </Button>
      </div>

      {/* Rows */}
      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">Немає записів для цього типу</p>
      ) : (
        <div className="space-y-2">
          {rows.map((row) => (
            <SizeRowCard key={row.id} row={row} onSave={handleSave} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  );
}
