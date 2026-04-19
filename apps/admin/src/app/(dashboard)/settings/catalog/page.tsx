"use client";

import { useState, useCallback, useRef } from "react";
import { Palette, Layers, ImageIcon, Plus, Pencil, Trash2, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/page-header";
import PrintTypePricingManager from "@/components/print-type-pricing-manager";
import PrintPresetsTab from "@/components/print-presets-tab";
import { toast } from "sonner";
import { useEffect } from "react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Material { id: string; name: string; hex_code: string; is_active: boolean; }

type CatalogTab = "colors" | "print_pricing" | "prints";

const TABS: { key: CatalogTab; icon: React.ElementType; label: string }[] = [
  { key: "colors",         icon: Palette,    label: "Кольори" },
  { key: "print_pricing",  icon: Layers,     label: "Ціни друку" },
  { key: "prints",         icon: ImageIcon,  label: "Принти" },
];

// ── Page ──────────────────────────────────────────────────────────────────────

export default function CatalogSettingsPage() {
  const [tab, setTab] = useState<CatalogTab>("colors");

  return (
    <div className="flex flex-1 h-0 flex-col overflow-hidden">
      <div className="p-4 md:p-6 pb-0 shrink-0">
        <PageHeader title="Налаштування каталогу" />
      </div>

      <div className="flex flex-1 h-0 overflow-hidden">
        {/* Left vertical nav */}
        <nav className="w-48 shrink-0 border-r border-border p-2 space-y-0.5 overflow-y-auto">
          {TABS.map(({ key, icon: Icon, label }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                tab === key
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
              {label}
            </button>
          ))}
        </nav>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {tab === "colors" && <MaterialsSection />}
          {tab === "print_pricing" && (
            <div className="p-4 md:p-6">
              <PrintTypePricingManager />
            </div>
          )}
          {tab === "prints" && <PrintPresetsTab />}
        </div>
      </div>
    </div>
  );
}

// ── MaterialsSection ──────────────────────────────────────────────────────────

function MaterialsSection() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [form, setForm] = useState({ name: "", hex_code: "#000000", is_active: true });
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Material | null>(null);

  const dragItem = useRef<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  const fetchMaterials = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/materials");
      if (r.ok) setMaterials(await r.json());
    } catch { toast.error("Помилка завантаження"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchMaterials(); }, [fetchMaterials]);

  const openCreate = () => {
    setEditingMaterial(null);
    setForm({ name: "", hex_code: "#000000", is_active: true });
    setModalOpen(true);
  };

  const openEdit = (m: Material) => {
    setEditingMaterial(m);
    setForm({ name: m.name, hex_code: m.hex_code, is_active: m.is_active });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name) { toast.error("Назва обов'язкова"); return; }
    setSaving(true);
    try {
      const url = editingMaterial ? `/api/materials/${editingMaterial.id}` : "/api/materials";
      const r = await fetch(url, {
        method: editingMaterial ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!r.ok) throw new Error();
      toast.success(editingMaterial ? "Матеріал оновлено" : "Матеріал створено");
      setModalOpen(false);
      fetchMaterials();
    } catch { toast.error("Помилка збереження"); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const r = await fetch(`/api/materials/${deleteTarget.id}`, { method: "DELETE" });
      if (!r.ok) throw new Error();
      toast.success("Видалено");
      setDeleteTarget(null);
      fetchMaterials();
    } catch { toast.error("Помилка видалення"); }
  };

  const handleToggle = async (m: Material) => {
    try {
      const r = await fetch(`/api/materials/${m.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !m.is_active }),
      });
      if (!r.ok) throw new Error();
      setMaterials(prev => prev.map(x => x.id === m.id ? { ...x, is_active: !x.is_active } : x));
    } catch { toast.error("Помилка"); }
  };

  const reorder = <T extends { id: string }>(items: T[], fromId: string, toId: string): T[] => {
    const from = items.findIndex(i => i.id === fromId);
    const to = items.findIndex(i => i.id === toId);
    if (from === -1 || to === -1 || from === to) return items;
    const next = [...items];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    return next;
  };

  const persistOrder = async (ids: string[]) => {
    await Promise.all(ids.map((id, i) =>
      fetch(`/api/materials/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sort_order: i }),
      })
    ));
  };

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold">Кольори матеріалів</p>
          <p className="text-xs text-muted-foreground mt-0.5">Словник кольорів для варіантів товарів</p>
        </div>
        <Button size="sm" onClick={openCreate} className="h-8 text-xs">
          <Plus className="w-3.5 h-3.5 mr-1.5" /> Додати колір
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-6"><span className="sr-only">Перетягнути</span></TableHead>
            <TableHead className="w-10"><span className="sr-only">Активний</span></TableHead>
            <TableHead className="w-10"><span className="sr-only">Колір</span></TableHead>
            <TableHead>Назва</TableHead>
            <TableHead>HEX</TableHead>
            <TableHead className="w-20"><span className="sr-only">Дії</span></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                {[6, 10, 10, 32, 16, 8].map((w, j) => (
                  <TableCell key={j}>
                    <div className={`h-4 w-${w} bg-muted rounded animate-pulse`} />
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : materials.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                Кольорів ще немає
              </TableCell>
            </TableRow>
          ) : materials.map(m => (
            <TableRow
              key={m.id}
              draggable
              onDragStart={() => { dragItem.current = m.id; }}
              onDragOver={e => { e.preventDefault(); setDragOverId(m.id); }}
              onDragEnd={() => setDragOverId(null)}
              onDrop={() => {
                if (dragItem.current && dragItem.current !== m.id) {
                  const next = reorder(materials, dragItem.current, m.id);
                  setMaterials(next);
                  persistOrder(next.map(x => x.id));
                }
                dragItem.current = null;
                setDragOverId(null);
              }}
              className={`group hover:bg-muted/40 ${dragOverId === m.id ? "border-t-2 border-t-primary" : ""}`}
            >
              <TableCell className="text-muted-foreground cursor-grab pr-0">
                <GripVertical className="w-4 h-4" aria-hidden="true" />
              </TableCell>
              <TableCell>
                <Switch checked={m.is_active} onCheckedChange={() => handleToggle(m)} aria-label={`Активний: ${m.name}`} />
              </TableCell>
              <TableCell>
                <div className="w-6 h-6 rounded-full border border-border" style={{ background: m.hex_code }} />
              </TableCell>
              <TableCell className="cursor-pointer" onClick={() => openEdit(m)}>
                <p className="font-medium text-sm">{m.name}</p>
              </TableCell>
              <TableCell className="text-xs text-muted-foreground font-mono">{m.hex_code}</TableCell>
              <TableCell>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(m)} aria-label={`Редагувати ${m.name}`}>
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDeleteTarget(m)} aria-label={`Видалити ${m.name}`}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Material Dialog */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{editingMaterial ? "Редагувати матеріал" : "Новий матеріал"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="mat-name">Назва *</Label>
              <Input
                id="mat-name"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Чорний"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Колір</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={form.hex_code}
                  onChange={e => setForm(f => ({ ...f, hex_code: e.target.value }))}
                  className="w-10 h-9 rounded border border-border cursor-pointer p-0.5"
                  aria-label="Вибрати колір"
                />
                <Input
                  value={form.hex_code}
                  onChange={e => setForm(f => ({ ...f, hex_code: e.target.value }))}
                  placeholder="#000000"
                  className="font-mono"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="mat-active"
                checked={form.is_active}
                onCheckedChange={v => setForm(f => ({ ...f, is_active: v }))}
              />
              <Label htmlFor="mat-active">Активний</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Скасувати</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Збереження..." : "Зберегти"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete AlertDialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={o => { if (!o) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Видалити матеріал?</AlertDialogTitle>
            <AlertDialogDescription>
              «{deleteTarget?.name}» буде видалено назавжди. Варіанти товарів, що використовують цей колір, можуть бути порушені.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Скасувати</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Видалити
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
