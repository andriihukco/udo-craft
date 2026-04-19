"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { Plus, Trash2, Loader2, Save, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const PRINT_TYPES = [
  { id: "dtf",         label: "DTF",        color: "#6366f1" },
  { id: "embroidery",  label: "Вишивка",    color: "#ec4899" },
  { id: "screen",      label: "Шовкодрук",  color: "#f59e0b" },
  { id: "sublimation", label: "Сублімація", color: "#06b6d4" },
  { id: "patch",       label: "Нашивка",    color: "#10b981" },
];

interface QtyTier { min_qty: number; price_cents: number; }
interface PricingRow {
  id: string; print_type: string; size_label: string;
  size_min_cm: number; size_max_cm: number;
  qty_tiers: QtyTier[]; sort_order: number; is_active: boolean;
}

function formatTiers(tiers: QtyTier[]) {
  return tiers.map(t => `${t.min_qty} шт → ${(t.price_cents / 100).toFixed(0)} ₴`).join(", ");
}

function QtyTiersEditor({ tiers, onChange }: { tiers: QtyTier[]; onChange: (t: QtyTier[]) => void }) {
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-[1fr_1fr_auto] gap-2 text-xs text-muted-foreground font-medium">
        <span>Від (шт)</span><span>Ціна (грн)</span><span />
      </div>
      {tiers.map((tier, i) => (
        <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-2 items-center">
          <Input type="number" min={1} value={tier.min_qty}
            onChange={e => { const n = parseInt(e.target.value); if (!isNaN(n)) onChange(tiers.map((t, idx) => idx === i ? { ...t, min_qty: n } : t)); }}
            className="h-8 text-xs" />
          <Input type="number" min={0} value={Math.round(tier.price_cents / 100)}
            onChange={e => { const n = parseFloat(e.target.value); if (!isNaN(n)) onChange(tiers.map((t, idx) => idx === i ? { ...t, price_cents: Math.round(n * 100) } : t)); }}
            className="h-8 text-xs" />
          <button type="button" onClick={() => onChange(tiers.filter((_, idx) => idx !== i))}
            className="size-8 flex items-center justify-center rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
            <Trash2 className="size-3.5" />
          </button>
        </div>
      ))}
      <button type="button" onClick={() => onChange([...tiers, { min_qty: 1, price_cents: 10000 }])}
        className="flex items-center gap-1 text-xs text-primary hover:underline mt-1">
        <Plus className="size-3" /> Додати тир
      </button>
    </div>
  );
}

export default function PrintSizesTab() {
  const [activeType, setActiveType] = useState("dtf");
  const [rows, setRows] = useState<PricingRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingRow, setEditingRow] = useState<PricingRow | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<PricingRow | null>(null);
  const [draft, setDraft] = useState<PricingRow | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchRows = useCallback(async (type: string) => {
    setLoading(true);
    const res = await fetch(`/api/print-type-pricing?print_type=${type}`);
    const data = await res.json();
    setRows(Array.isArray(data) ? data : []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchRows(activeType); }, [activeType, fetchRows]);

  const handleSave = async () => {
    if (!draft) return;
    setSaving(true);
    const res = await fetch(`/api/print-type-pricing/${draft.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(draft),
    });
    setSaving(false);
    if (!res.ok) { toast.error("Помилка збереження"); return; }
    toast.success("Збережено");
    setEditDialogOpen(false);
    fetchRows(activeType);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const res = await fetch(`/api/print-type-pricing/${deleteTarget.id}`, { method: "DELETE" });
    if (!res.ok) { toast.error("Помилка видалення"); return; }
    toast.success("Видалено");
    setDeleteTarget(null);
    fetchRows(activeType);
  };

  const handleToggle = async (row: PricingRow) => {
    const res = await fetch(`/api/print-type-pricing/${row.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...row, is_active: !row.is_active }),
    });
    if (!res.ok) { toast.error("Помилка"); return; }
    setRows(prev => prev.map(r => r.id === row.id ? { ...r, is_active: !r.is_active } : r));
  };

  const handleAdd = async () => {
    const label = prompt("Назва розміру (напр. 8-10см):");
    if (!label) return;
    const res = await fetch("/api/print-type-pricing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ print_type: activeType, size_label: label, size_min_cm: 0, size_max_cm: 0, qty_tiers: [{ min_qty: 1, price_cents: 10000 }], sort_order: rows.length }),
    });
    if (!res.ok) { toast.error("Помилка створення"); return; }
    toast.success("Додано");
    fetchRows(activeType);
  };

  const currentType = PRINT_TYPES.find(t => t.id === activeType)!;

  return (
    <div className="p-4 md:p-6 space-y-4">
      {/* Type selector */}
      <div className="flex gap-1.5 flex-wrap">
        {PRINT_TYPES.map(t => (
          <button key={t.id} onClick={() => setActiveType(t.id)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${activeType === t.id ? "text-white border-transparent" : "border-border text-muted-foreground hover:border-foreground/30"}`}
            style={activeType === t.id ? { backgroundColor: t.color } : {}}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold">Розміри друку</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Сітка цін для <span className="font-medium" style={{ color: currentType.color }}>{currentType.label}</span>
          </p>
        </div>
        <Button size="sm" onClick={handleAdd} className="h-8 text-xs">
          <Plus className="w-3.5 h-3.5 mr-1.5" /> Додати розмір
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="size-5 animate-spin text-muted-foreground" /></div>
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">Немає записів для цього типу</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-10"><span className="sr-only">Активний</span></TableHead>
              <TableHead>Розмір</TableHead>
              <TableHead>Діапазон (см)</TableHead>
              <TableHead>Тири кількості</TableHead>
              <TableHead className="w-20"><span className="sr-only">Дії</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map(row => (
              <TableRow key={row.id} className="group hover:bg-muted/40">
                <TableCell>
                  <Switch checked={row.is_active} onCheckedChange={() => handleToggle(row)} />
                </TableCell>
                <TableCell className="cursor-pointer font-medium text-sm" onClick={() => { setEditingRow(row); setDraft({ ...row }); setEditDialogOpen(true); }}>
                  {row.size_label}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">{row.size_min_cm}–{row.size_max_cm} см</TableCell>
                <TableCell className="text-xs text-muted-foreground">{formatTiers(row.qty_tiers)}</TableCell>
                <TableCell>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditingRow(row); setDraft({ ...row }); setEditDialogOpen(true); }}>
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDeleteTarget(row)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={o => { setEditDialogOpen(o); if (!o) setDraft(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Редагувати розмір</DialogTitle></DialogHeader>
          {draft && (
            <div className="space-y-3 py-2">
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">Назва</Label>
                  <Input value={draft.size_label} onChange={e => setDraft({ ...draft, size_label: e.target.value })} className="h-8 text-xs" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Мін. см</Label>
                  <Input type="number" value={draft.size_min_cm} onChange={e => setDraft({ ...draft, size_min_cm: parseFloat(e.target.value) || 0 })} className="h-8 text-xs" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Макс. см</Label>
                  <Input type="number" value={draft.size_max_cm} onChange={e => setDraft({ ...draft, size_max_cm: parseFloat(e.target.value) || 0 })} className="h-8 text-xs" />
                </div>
              </div>
              <div>
                <Label className="text-xs mb-1.5 block">Тири кількості</Label>
                <QtyTiersEditor tiers={draft.qty_tiers} onChange={t => setDraft({ ...draft, qty_tiers: t })} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Скасувати</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="size-3 animate-spin mr-1" /> : <Save className="size-3 mr-1" />}
              Зберегти
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={o => { if (!o) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Видалити розмір?</AlertDialogTitle>
            <AlertDialogDescription>«{deleteTarget?.size_label}» буде видалено назавжди.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Скасувати</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Видалити</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
