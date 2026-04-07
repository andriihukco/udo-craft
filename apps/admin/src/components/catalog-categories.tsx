"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Pencil, Check, ImageIcon, RefreshCw, Layers } from "lucide-react";
import { toast } from "sonner";
import { Category } from "@udo-craft/shared";

const slugify = (name: string) =>
  name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-zа-яіїєґ0-9-]/g, "");

// ── Category Editor ──────────────────────────────────────────────────────────

function CategoryEditor({
  category,
  onSave,
  onCancel,
}: {
  category: Partial<Category>;
  onSave: () => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({
    name: category.name || "",
    slug: category.slug || "",
    sort_order: category.sort_order || 0,
    is_active: category.is_active ?? true,
    image_url: category.image_url || "",
  });
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleImageUpload = async (file: File) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("files", file);
      fd.append("tags", "category");
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      if (!res.ok) throw new Error();
      const { results } = await res.json();
      if (results?.[0]?.url) {
        setForm((f) => ({ ...f, image_url: results[0].url }));
        toast.success("Зображення завантажено");
      }
    } catch {
      toast.error("Помилка завантаження");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!form.name || !form.slug) { toast.error("Назва та slug обов'язкові"); return; }
    setSaving(true);
    try {
      const url = category.id ? `/api/categories/${category.id}` : "/api/categories";
      const res = await fetch(url, {
        method: category.id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      toast.success(category.id ? "Категорію оновлено" : "Категорію створено");
      onSave();
    } catch {
      toast.error("Помилка збереження");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="border border-blue-200 bg-blue-50/30 rounded-lg p-4 space-y-3">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="space-y-1.5">
          <Label>Назва *</Label>
          <Input
            value={form.name}
            onChange={(e) => {
              const name = e.target.value;
              setForm((f) => ({ ...f, name, slug: f.slug || slugify(name) }));
            }}
            placeholder="Футболка"
          />
        </div>
        <div className="space-y-1.5">
          <Label>Slug *</Label>
          <Input
            value={form.slug}
            onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
            placeholder="futbolka"
          />
        </div>
        <div className="space-y-1.5">
          <Label>Порядок</Label>
          <Input
            type="number" min="0"
            value={form.sort_order}
            onChange={(e) => setForm((f) => ({ ...f, sort_order: parseInt(e.target.value) || 0 }))}
          />
        </div>
        <div className="flex items-end pb-1">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox" checked={form.is_active}
              onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
              className="rounded"
            />
            <span className="text-sm">Активна</span>
          </label>
        </div>
      </div>

      {/* Image upload */}
      <div className="flex items-center gap-3">
        <div
          className="relative w-16 h-16 border-2 border-dashed border-border rounded-lg overflow-hidden cursor-pointer hover:border-primary transition-colors flex-shrink-0"
          onClick={() => fileInputRef.current?.click()}
        >
          {form.image_url ? (
            <img src={form.image_url} alt="Category" className="w-full h-full object-contain p-1" />
          ) : (
            <div className="flex items-center justify-center h-full">
              <ImageIcon className="w-5 h-5 text-muted-foreground opacity-40" />
            </div>
          )}
          {uploading && (
            <div className="absolute inset-0 bg-background/70 flex items-center justify-center">
              <RefreshCw className="w-4 h-4 animate-spin text-primary" />
            </div>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file" accept="image/*" className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageUpload(f); }}
        />
        <Input
          value={form.image_url || ""}
          onChange={(e) => setForm((f) => ({ ...f, image_url: e.target.value }))}
          placeholder="URL зображення категорії..."
          className="flex-1 text-xs h-8"
        />
      </div>

      <div className="flex gap-2 mt-4">
        <Button size="sm" onClick={handleSave} disabled={saving}>
          <Check className="w-3.5 h-3.5 mr-1" />
          {saving ? "Збереження..." : "Зберегти"}
        </Button>
        <Button size="sm" variant="outline" onClick={onCancel}>Скасувати</Button>
      </div>
    </div>
  );
}

// ── Main Categories Panel ────────────────────────────────────────────────────

export function CategoriesPanel() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [editing, setEditing] = useState<Partial<Category> | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/categories");
      if (res.ok) setCategories(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  const handleDelete = async (id: string) => {
    if (!confirm("Видалити категорію? Товари більше не будуть прив'язані до неї.")) return;
    const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });
    if (res.ok) { toast.success("Видалено"); fetchCategories(); }
    else toast.error("Помилка видалення");
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Layers className="w-5 h-5" /> Категорії
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Створюйте групи товарів (напр. Футболка, Худі, Шоппер).<br />
              Призначати товари до категорій можна у вкладці "Продукти".
            </p>
          </div>
          {!editing && (
            <Button size="sm" variant="outline" onClick={() => setEditing({})}>
              <Plus className="w-3.5 h-3.5 mr-1" /> Нова категорія
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {editing && (
          <CategoryEditor
            category={editing}
            onSave={() => { setEditing(null); fetchCategories(); }}
            onCancel={() => setEditing(null)}
          />
        )}

        {loading && categories.length === 0 && (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-14 bg-muted rounded-lg animate-pulse" />
            ))}
          </div>
        )}

        {!loading && categories.length === 0 && !editing && (
          <p className="text-sm text-muted-foreground text-center py-8 border border-dashed rounded-xl bg-muted/20">
            Категорій ще немає. Натисніть «Нова категорія» щоб додати.
          </p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((cat) => (
            <div key={cat.id} className="border border-border rounded-xl p-4 bg-card flex flex-col justify-between hover:border-primary/50 transition-colors">
              <div className="flex items-start justify-between gap-3 mb-4">
                {cat.image_url ? (
                  <img src={cat.image_url} alt={cat.name} className="w-12 h-12 rounded object-contain bg-muted" />
                ) : (
                  <div className="w-12 h-12 rounded bg-muted flex items-center justify-center">
                    <ImageIcon className="w-5 h-5 text-muted-foreground opacity-50" />
                  </div>
                )}
                <Badge variant={cat.is_active ? "default" : "secondary"} className="text-[10px]">
                  {cat.is_active ? "Активна" : "Неактивна"}
                </Badge>
              </div>
              
              <div className="space-y-1 mb-4">
                <p className="font-semibold">{cat.name}</p>
                <div className="flex items-center text-xs text-muted-foreground gap-3">
                  <span>URL: /{cat.slug}</span>
                  <span>Сорт: {cat.sort_order}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-3 border-t">
                <Button variant="ghost" size="sm" className="flex-1 h-8 text-blue-600 bg-blue-50 hover:bg-blue-100" onClick={() => setEditing(cat)}>
                  <Pencil className="w-3.5 h-3.5 mr-1.5" /> Редагувати
                </Button>
                <Button variant="ghost" size="sm" className="h-8 px-2 text-destructive bg-red-50 hover:bg-red-100" onClick={() => handleDelete(cat.id)}>
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
