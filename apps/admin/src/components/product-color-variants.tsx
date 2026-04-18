"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Pencil, X, Check, RefreshCw, Palette, ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { Material, ProductColorVariant } from "@udo-craft/shared";
import type { ProductImage } from "@udo-craft/shared";
import { ProductImageManager } from "@udo-craft/ui";

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
  const [variantImages, setVariantImages] = useState<ProductImage[]>(() => {
    // Load variant_images; fall back to legacy images Record
    const vi = (variant as any).variant_images as ProductImage[] | undefined;
    if (vi && vi.length > 0) return vi;
    const imgs = variant.images || {};
    return Object.entries(imgs).map(([key, url], i) => ({
      key, url, label: key, is_customizable: true, sort_order: i,
    }));
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!form.material_id) { toast.error("Оберіть колір (матеріал)"); return; }
    setSaving(true);
    // Build legacy images map from customizable entries (backward compat for canvas)
    const images: Record<string, string> = {};
    for (const img of variantImages) if (img.is_customizable && img.key && img.url) images[img.key] = img.url;

    try {
      const url = variant.id ? `/api/product-color-variants/${variant.id}` : "/api/product-color-variants";
      const payload = { ...form, images, variant_images: variantImages, product_id: productId };
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
        </div>
        <p className="text-xs text-muted-foreground">
          Позначте «Канвас» для фото, які використовуються як сторони в редакторі принтів.
        </p>
        <ProductImageManager
          images={variantImages}
          onChange={setVariantImages}
          uploadUrl="/api/upload"
          uploadTagPrefix="variant"
        />
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
            const vi = (v as any).variant_images as ProductImage[] | undefined;
            const previewUrl = vi?.find(i => i.key === "front")?.url
              ?? vi?.[0]?.url
              ?? (v.images as Record<string, string>)?.front
              ?? Object.values(v.images || {})[0];
            
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
                    {(((v as any).variant_images as ProductImage[] | undefined)?.length ?? Object.keys(v.images || {}).length)} фотографій
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
