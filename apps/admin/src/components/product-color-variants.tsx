"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Pencil, X, Check, RefreshCw, Palette, ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { Material, ProductColorVariant } from "@udo-craft/shared";

// ── Color Variant Editor ─────────────────────────────────────────────────────

function ProductColorVariantEditor({
  variant,
  materials,
  productId,
  onSave,
  onCancel,
}: {
  variant: Partial<ProductColorVariant>;
  materials: Material[];
  productId: string;
  onSave: () => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({
    material_id: variant.material_id || "",
    sort_order: variant.sort_order || 0,
    is_active: variant.is_active ?? true,
  });
  const [imageSlots, setImageSlots] = useState<{ tag: string; url: string }[]>(() => {
    const imgs = variant.images || {};
    return Object.entries(imgs).map(([tag, url]) => ({ tag, url }));
  });
  const [uploading, setUploading] = useState<Record<number, boolean>>({});
  const [saving, setSaving] = useState(false);
  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleFileUpload = async (index: number, file: File) => {
    setUploading((prev) => ({ ...prev, [index]: true }));
    try {
      const fd = new FormData();
      fd.append("files", file);
      fd.append("tags", imageSlots[index].tag || "front");
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      const url = data.results?.[0]?.url ?? data.urls?.[0];
      if (url) {
        setImageSlots((prev) => prev.map((s, i) => (i === index ? { ...s, url } : s)));
        toast.success("Зображення завантажено");
      } else {
        throw new Error("URL не отримано від сервера");
      }
    } catch (err) {
      console.error("Upload error:", err);
      toast.error(`Помилка завантаження: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setUploading((prev) => ({ ...prev, [index]: false }));
    }
  };

  const handleSave = async () => {
    if (!form.material_id) { toast.error("Оберіть колір (матеріал)"); return; }
    
    setSaving(true);
    const images: Record<string, string> = {};
    for (const slot of imageSlots) {
      if (slot.tag && slot.url) images[slot.tag] = slot.url;
    }

    try {
      const url = variant.id ? `/api/product-color-variants/${variant.id}` : "/api/product-color-variants";
      const payload = { ...form, images, product_id: productId };
      const res = await fetch(url, {
        method: variant.id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error();
      toast.success(variant.id ? "Варіант оновлено" : "Варіант додано");
      onSave();
    } catch {
      toast.error("Помилка збереження. Можливо, цей колір вже додано до товару.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="border border-border bg-muted/30 rounded-lg p-3 space-y-3 mb-3">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="space-y-1.5">
          <Label>Колір (Матеріал) *</Label>
          <select
            value={form.material_id}
            onChange={(e) => setForm((f) => ({ ...f, material_id: e.target.value }))}
            className="w-full h-9"
          >
            <option value="">— Оберіть колір —</option>
            {materials.map((m) => (
              <option key={m.id} value={m.id}>{m.name} ({m.hex_code})</option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label>Порядок</Label>
          <Input
            type="number" min="0" placeholder="0"
            value={form.sort_order}
            onChange={(e) => setForm((f) => ({ ...f, sort_order: parseInt(e.target.value) || 0 }))}
          />
        </div>
        <div className="flex items-end pb-1.5">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox" checked={form.is_active}
              onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
              className="rounded"
            />
            <span className="text-sm">Активний</span>
          </label>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs text-muted-foreground">Фото для цього кольору</Label>
          <Button type="button" variant="outline" size="sm" className="h-6 text-xs"
            onClick={() => setImageSlots((prev) => [...prev, { tag: "", url: "" }])}>
            <Plus className="w-3 h-3 mr-1" /> Ракурс
          </Button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {imageSlots.map((slot, index) => (
            <div key={index} className="border border-border rounded-md p-2 space-y-1.5 bg-background">
              <div className="flex items-center gap-1">
                <Input
                  value={slot.tag}
                  onChange={(e) =>
                    setImageSlots((prev) => prev.map((s, i) => (i === index ? { ...s, tag: e.target.value } : s)))
                  }
                  placeholder="груди / спина..."
                  className="h-6 text-[10px] flex-1"
                />
                <button
                  onClick={() => setImageSlots((prev) => prev.filter((_, i) => i !== index))}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
              <div
                className="relative border-2 border-dashed border-border rounded overflow-hidden cursor-pointer hover:border-primary transition-colors"
                style={{ aspectRatio: "1 / 1", maxHeight: 80 }}
                onClick={() => fileInputRefs.current[index]?.click()}
              >
                {slot.url ? (
                  <img src={slot.url} alt={slot.tag} className="w-full h-full object-contain p-0.5" />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-0.5">
                    <ImageIcon className="w-4 h-4 opacity-40" />
                    <span className="text-[9px]">Клікніть</span>
                  </div>
                )}
                {uploading[index] && (
                  <div className="absolute inset-0 bg-background/70 flex items-center justify-center">
                    <RefreshCw className="w-4 h-4 animate-spin text-primary" />
                  </div>
                )}
              </div>
              <input
                ref={(el) => { fileInputRefs.current[index] = el; }}
                type="file" accept="image/*" className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileUpload(index, f); }}
              />
              <Input
                value={slot.url}
                onChange={(e) =>
                  setImageSlots((prev) => prev.map((s, i) => (i === index ? { ...s, url: e.target.value } : s)))
                }
                placeholder="URL..."
                className="h-5 text-[9px]"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-2 pt-1">
        <Button size="sm" onClick={handleSave} disabled={saving}>
          <Check className="w-3.5 h-3.5 mr-1" /> {saving ? "Збереження..." : "Зберегти"}
        </Button>
        <Button size="sm" variant="outline" onClick={onCancel}>Скасувати</Button>
      </div>
    </div>
  );
}

// ── Main List ────────────────────────────────────────────────────────────────

export function ProductColorVariantsList({ productId }: { productId: string }) {
  const [variants, setVariants] = useState<ProductColorVariant[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [editing, setEditing] = useState<Partial<ProductColorVariant> | null>(null);

  const fetchData = useCallback(async () => {
    const [varRes, matRes] = await Promise.all([
      fetch(`/api/product-color-variants?product_id=${productId}`),
      fetch("/api/materials"),
    ]);
    if (varRes.ok) setVariants(await varRes.json());
    if (matRes.ok) setMaterials(await matRes.json());
  }, [productId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleDelete = async (id: string) => {
    if (!confirm("Видалити варіант кольору?")) return;
    const res = await fetch(`/api/product-color-variants/${id}`, { method: "DELETE" });
    if (res.ok) { toast.success("Видалено"); fetchData(); }
    else toast.error("Помилка видалення");
  };

  return (
    <div className="space-y-2 mt-3 pt-3 border-t border-border">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
          <Palette className="w-3.5 h-3.5" /> Кольори та Фото ({variants.length})
        </p>
        {!editing && (
          <Button size="sm" variant="outline" className="h-7 text-xs"
            onClick={() => setEditing({})}>
            <Plus className="w-3 h-3 mr-1" /> Додати колір
          </Button>
        )}
      </div>

      {editing && (
        <ProductColorVariantEditor
          variant={editing}
          materials={materials}
          productId={productId}
          onSave={() => { setEditing(null); fetchData(); }}
          onCancel={() => setEditing(null)}
        />
      )}

      {variants.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
          {variants.map((v) => {
            const material = materials.find((m) => m.id === v.material_id);
            const previewUrl = v.images?.front || Object.values(v.images || {})[0];
            
            return (
              <div key={v.id} className="flex items-center gap-3 p-2 rounded-lg border border-border bg-background hover:border-primary/30 transition-colors">
                {previewUrl ? (
                  <img src={previewUrl} alt={material?.name} className="w-10 h-10 rounded-md border object-contain bg-white" />
                ) : (
                  <div className="w-10 h-10 rounded-md border flex items-center justify-center bg-muted">
                    <ImageIcon className="w-4 h-4 text-muted-foreground/50" />
                  </div>
                )}
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span
                      className="w-3 h-3 rounded-full border shadow-sm flex-shrink-0 block"
                      style={{ backgroundColor: material?.hex_code || "#ccc" }}
                      title={material?.hex_code}
                    />
                    <span className="text-sm font-medium truncate">{material?.name || "Невідомий колір"}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {Object.keys(v.images || {}).length} фотографій
                    {!v.is_active && " · Неактивний"}
                  </p>
                </div>

                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0"
                    onClick={() => setEditing(v)}>
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                    onClick={() => handleDelete(v.id)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
