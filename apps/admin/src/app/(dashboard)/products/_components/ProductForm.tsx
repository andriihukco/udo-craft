"use client";

import { useState, useEffect, useCallback } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProductColorVariantsList } from "@/components/product-color-variants";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Category { id: string; name: string; slug: string; is_active: boolean; sort_order: number; }
interface SizeChart { id: string; name: string; rows: Record<string, string>[]; }
interface PrintArea { id: string; name: string; label: string; }

export interface ProductFormData {
  name: string;
  slug: string;
  description: string;
  base_price_cents: number;
  is_active: boolean;
  is_customizable: boolean;
  category_id: string | null;
  size_chart_id: string | null;
  print_area_ids: string[];
}

interface ProductFormProps {
  product?: {
    id: string;
    name: string;
    slug: string;
    description: string;
    base_price_cents: number;
    is_active: boolean;
    is_customizable: boolean;
    category_id?: string | null;
    size_chart_id?: string | null;
    print_area_ids?: string[];
  };
  categories: Category[];
  sizeCharts: SizeChart[];
  printAreas: PrintArea[];
  onSave: (data: ProductFormData) => Promise<void>;
  onDelete?: () => Promise<void>;
  onChange?: () => void;
  saving?: boolean;
}

// ── Slugify ───────────────────────────────────────────────────────────────────

const UA_MAP: Record<string, string> = {
  а:"a",б:"b",в:"v",г:"h",ґ:"g",д:"d",е:"e",є:"ye",ж:"zh",з:"z",и:"y",і:"i",ї:"yi",й:"y",
  к:"k",л:"l",м:"m",н:"n",о:"o",п:"p",р:"r",с:"s",т:"t",у:"u",ф:"f",х:"kh",ц:"ts",ч:"ch",
  ш:"sh",щ:"shch",ь:"",ю:"yu",я:"ya",
};

export function slugify(s: string) {
  return s.toLowerCase().split("").map(c => UA_MAP[c] ?? c).join("")
    .replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "").replace(/-+/g, "-").replace(/^-|-$/g, "");
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ProductForm({
  product,
  categories,
  sizeCharts,
  printAreas,
  onSave,
  onChange,
  saving = false,
}: ProductFormProps) {
  const [name, setName] = useState(product?.name ?? "");
  const [slug, setSlug] = useState(product?.slug ?? "");
  const [slugManual, setSlugManual] = useState(false);
  const [description, setDescription] = useState(product?.description ?? "");
  const [priceStr, setPriceStr] = useState(
    product ? String(product.base_price_cents / 100) : ""
  );
  const [isActive, setIsActive] = useState(product?.is_active ?? true);
  const [isCustomizable, setIsCustomizable] = useState(product?.is_customizable ?? false);
  const [categoryId, setCategoryId] = useState<string>(product?.category_id ?? "");
  const [sizeChartId, setSizeChartId] = useState<string>(product?.size_chart_id ?? "");
  const [printAreaIds, setPrintAreaIds] = useState<string[]>(product?.print_area_ids ?? []);
  const [nameError, setNameError] = useState("");
  const [dirty, setDirty] = useState(false);

  const markDirty = useCallback(() => {
    if (!dirty) {
      setDirty(true);
      onChange?.();
    }
  }, [dirty, onChange]);

  // Auto-generate slug from name unless manually edited
  useEffect(() => {
    if (!slugManual && name) {
      setSlug(slugify(name));
    }
  }, [name, slugManual]);

  const handleNameChange = (v: string) => {
    setName(v);
    setNameError("");
    markDirty();
  };

  const handleSlugChange = (v: string) => {
    setSlug(v);
    setSlugManual(true);
    markDirty();
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      setNameError("Назва обов'язкова");
      return;
    }
    const data: ProductFormData = {
      name: name.trim(),
      slug: slug || slugify(name.trim()),
      description,
      base_price_cents: Math.round(parseFloat(priceStr || "0") * 100),
      is_active: isActive,
      is_customizable: isCustomizable,
      category_id: categoryId || null,
      size_chart_id: sizeChartId || null,
      print_area_ids: printAreaIds,
    };
    await onSave(data);
  };

  // Expose submit via ref-like pattern — parent calls onSave directly
  // The parent page handles the save button; we expose a validate+collect method
  // by calling onSave from the form's internal submit trigger.
  // Parent can also call handleSubmit via a forwarded ref, but here we keep it simple:
  // the page passes `onSave` and calls it via the PageHeader button.
  // We expose the submit function through a data attribute trick — instead,
  // we'll use a hidden submit button that the parent can trigger.

  return (
    <div className="space-y-6">
      {/* Основна інформація */}
      <Card>
        <CardHeader>
          <CardTitle>Основна інформація</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left column */}
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="product-name">Назва *</Label>
                <Input
                  id="product-name"
                  value={name}
                  onChange={e => handleNameChange(e.target.value)}
                  placeholder="Назва товару"
                  className={nameError ? "border-destructive" : ""}
                />
                {nameError && (
                  <p className="text-xs text-destructive">{nameError}</p>
                )}
                <p className="text-xs text-muted-foreground font-mono">
                  slug:{" "}
                  <span
                    className="cursor-pointer hover:text-foreground transition-colors"
                    title="Натисніть для редагування"
                    onClick={() => setSlugManual(true)}
                  >
                    {slug || "—"}
                  </span>
                </p>
                {slugManual && (
                  <Input
                    value={slug}
                    onChange={e => handleSlugChange(e.target.value)}
                    placeholder="product-slug"
                    className="font-mono text-sm"
                  />
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="product-description">Опис</Label>
                <Textarea
                  id="product-description"
                  value={description}
                  onChange={e => { setDescription(e.target.value); markDirty(); }}
                  placeholder="Опис товару"
                  rows={4}
                />
              </div>

              <div className="space-y-1.5">
                <Label>Категорія</Label>
                <Select
                  value={categoryId || "none"}
                  onValueChange={v => { setCategoryId(v === "none" || v === null ? "" : v); markDirty(); }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Оберіть категорію" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— Без категорії —</SelectItem>
                    {categories.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Right column */}
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="product-price">Ціна</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₴</span>
                  <Input
                    id="product-price"
                    type="number"
                    min="0"
                    step="1"
                    value={priceStr}
                    onChange={e => { setPriceStr(e.target.value); markDirty(); }}
                    placeholder="0"
                    className="pl-7"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <Label htmlFor="product-active" className="cursor-pointer">Активний</Label>
                  <p className="text-xs text-muted-foreground">Відображається на сайті</p>
                </div>
                <Switch
                  checked={isActive}
                  onCheckedChange={v => { setIsActive(v); markDirty(); }}
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <Label htmlFor="product-customizable" className="cursor-pointer">Кастомізація</Label>
                  <p className="text-xs text-muted-foreground">Дозволяє нанесення принтів</p>
                </div>
                <Switch
                  checked={isCustomizable}
                  onCheckedChange={v => { setIsCustomizable(v); markDirty(); }}
                />
              </div>

              {sizeCharts.length > 0 && (
                <div className="space-y-1.5">
                  <Label>Таблиця розмірів</Label>
                  <Select
                    value={sizeChartId || "none"}
                    onValueChange={v => { setSizeChartId(v === "none" || v === null ? "" : v); markDirty(); }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Оберіть таблицю" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">— Без таблиці —</SelectItem>
                      {sizeCharts.map(s => (
                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Фотографії */}
      <Card>
        <CardHeader>
          <CardTitle>Фотографії</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Управління фотографіями буде доступне тут.</p>
        </CardContent>
      </Card>

      {/* Розміри */}
      <Card>
        <CardHeader>
          <CardTitle>Розміри</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Налаштування розмірів буде доступне тут.</p>
        </CardContent>
      </Card>

      {/* Зони друку — тільки якщо is_customizable */}
      {isCustomizable && (
        <Card>
          <CardHeader>
            <CardTitle>Зони друку</CardTitle>
          </CardHeader>
          <CardContent>
            {printAreas.length === 0 ? (
              <p className="text-sm text-muted-foreground">Зони друку не налаштовані.</p>
            ) : (
              <div className="space-y-2">
                {printAreas.map(pa => (
                  <label key={pa.id} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={printAreaIds.includes(pa.id)}
                      onChange={e => {
                        setPrintAreaIds(prev =>
                          e.target.checked ? [...prev, pa.id] : prev.filter(id => id !== pa.id)
                        );
                        markDirty();
                      }}
                      className="rounded"
                    />
                    <span className="text-sm">{pa.label || pa.name}</span>
                  </label>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Знижки */}
      <Card>
        <CardHeader>
          <CardTitle>Знижки за кількість</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Налаштування знижок буде доступне тут.</p>
        </CardContent>
      </Card>

      {/* Кольори та фото */}
      <Card>
        <CardHeader>
          <CardTitle>Кольори та фото</CardTitle>
        </CardHeader>
        <CardContent>
          {product?.id ? (
            <ProductColorVariantsList productId={product.id} />
          ) : (
            <p className="text-sm text-muted-foreground">
              Кольори можна додати після збереження товару.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Hidden submit trigger — parent pages call this via getElementById */}
      <button
        id="product-form-submit"
        type="button"
        onClick={handleSubmit}
        disabled={saving}
        className="hidden"
        aria-hidden="true"
      />
    </div>
  );
}
