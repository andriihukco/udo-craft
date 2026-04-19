"use client";

import { useState, useEffect, useCallback } from "react";
import { X, Plus, Ruler } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProductColorVariantsList } from "@/components/product-color-variants";
import { SizeChartModal } from "@/components/size-chart-modal";

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
  images: Record<string, string>;
  px_to_mm_ratio: number;
  collar_y_px: number;
  available_sizes: string[];
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
    available_sizes?: string[];
  };
  categories: Category[];
  sizeCharts: SizeChart[];
  printAreas: PrintArea[];
  onSave: (data: ProductFormData) => Promise<void>;
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

// Default sizes from catalog settings (localStorage)
function getDefaultSizes(): string[] {
  if (typeof window === "undefined") return ["S", "M", "L", "XL"];
  try {
    const stored = localStorage.getItem("catalog_available_sizes");
    return stored ? JSON.parse(stored) : ["S", "M", "L", "XL"];
  } catch { return ["S", "M", "L", "XL"]; }
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ProductForm({ product, categories, sizeCharts, printAreas, onSave, onChange, saving = false }: ProductFormProps) {
  const [name, setName] = useState(product?.name ?? "");
  const [slug, setSlug] = useState(product?.slug ?? "");
  const [slugManual, setSlugManual] = useState(false);
  const [description, setDescription] = useState(product?.description ?? "");
  const [priceStr, setPriceStr] = useState(product ? String(product.base_price_cents / 100) : "");
  const [isActive, setIsActive] = useState(product?.is_active ?? true);
  const [isCustomizable, setIsCustomizable] = useState(product?.is_customizable ?? false);
  const [categoryId, setCategoryId] = useState<string>(product?.category_id ?? "");
  const [sizeChartId, setSizeChartId] = useState<string>(product?.size_chart_id ?? "");
  const [printAreaIds, setPrintAreaIds] = useState<string[]>(product?.print_area_ids ?? []);
  const [availableSizes, setAvailableSizes] = useState<string[]>(
    product?.available_sizes?.length ? product.available_sizes : getDefaultSizes()
  );
  const [customSizeInput, setCustomSizeInput] = useState("");
  const [nameError, setNameError] = useState("");
  const [dirty, setDirty] = useState(false);
  const [sizeChartModalOpen, setSizeChartModalOpen] = useState(false);

  const markDirty = useCallback(() => { if (!dirty) { setDirty(true); onChange?.(); } }, [dirty, onChange]);

  useEffect(() => { if (!slugManual && name) setSlug(slugify(name)); }, [name, slugManual]);

  const toggleSize = (size: string) => {
    setAvailableSizes(prev => prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size]);
    markDirty();
  };

  const addCustomSize = () => {
    const v = customSizeInput.trim().toUpperCase();
    if (!v || availableSizes.includes(v)) return;
    setAvailableSizes(prev => [...prev, v]);
    setCustomSizeInput("");
    markDirty();
  };

  const handleSubmit = async () => {
    if (!name.trim()) { setNameError("Назва обов'язкова"); return; }
    await onSave({
      name: name.trim(),
      slug: slug || slugify(name.trim()),
      description,
      base_price_cents: Math.round(parseFloat(priceStr || "0") * 100),
      is_active: isActive,
      is_customizable: isCustomizable,
      category_id: categoryId || null,
      size_chart_id: sizeChartId || null,
      print_area_ids: printAreaIds,
      images: {},
      px_to_mm_ratio: 0.5,
      collar_y_px: 0,
      available_sizes: availableSizes,
    });
  };

  // All catalog sizes for the size picker
  const allCatalogSizes = getDefaultSizes();
  // Sizes not in catalog but added to this product
  const extraSizes = availableSizes.filter(s => !allCatalogSizes.includes(s));

  return (
    <div className="space-y-5">

      {/* ── Basic Info ─────────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Основна інформація</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Row 1: Name + Price */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 space-y-1.5">
              <Label htmlFor="product-name">Назва *</Label>
              <Input
                id="product-name"
                value={name}
                onChange={e => { setName(e.target.value); setNameError(""); markDirty(); }}
                placeholder="Назва товару"
                className={nameError ? "border-destructive" : ""}
              />
              {nameError && <p className="text-xs text-destructive">{nameError}</p>}
              <p className="text-xs text-muted-foreground font-mono">
                slug: <span className="cursor-pointer hover:text-foreground" onClick={() => setSlugManual(true)}>{slug || "—"}</span>
              </p>
              {slugManual && (
                <Input value={slug} onChange={e => { setSlug(e.target.value); setSlugManual(true); markDirty(); }}
                  placeholder="product-slug" className="font-mono text-sm h-8" />
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="product-price">Ціна (₴)</Label>
              <Input
                id="product-price"
                type="number" min="0" step="1"
                value={priceStr}
                onChange={e => { setPriceStr(e.target.value); markDirty(); }}
                placeholder="0"
              />
            </div>
          </div>

          {/* Row 2: Description */}
          <div className="space-y-1.5">
            <Label htmlFor="product-description">Опис</Label>
            <Textarea
              id="product-description"
              value={description}
              onChange={e => { setDescription(e.target.value); markDirty(); }}
              placeholder="Опис товару"
              rows={3}
            />
          </div>

          {/* Row 3: Category + Size chart */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Категорія</Label>
              <Select value={categoryId || "none"} onValueChange={v => { setCategoryId(v === "none" ? "" : v); markDirty(); }}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="— Без категорії —" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— Без категорії —</SelectItem>
                  {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Таблиця розмірів</Label>
              <Select value={sizeChartId || "none"} onValueChange={v => { setSizeChartId(v === "none" ? "" : v); markDirty(); }}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="— Без таблиці —" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— Без таблиці —</SelectItem>
                  {sizeCharts.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Row 4: Toggles */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
              <div>
                <p className="text-sm font-medium">Активний</p>
                <p className="text-xs text-muted-foreground">Відображається на сайті</p>
              </div>
              <Switch checked={isActive} onCheckedChange={v => { setIsActive(v); markDirty(); }} />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
              <div>
                <p className="text-sm font-medium">Кастомізація</p>
                <p className="text-xs text-muted-foreground">Дозволяє нанесення принтів</p>
              </div>
              <Switch checked={isCustomizable} onCheckedChange={v => { setIsCustomizable(v); markDirty(); }} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Sizes ──────────────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-semibold">Розміри</CardTitle>
          {sizeChartId && sizeChartId !== "none" && (
            <button
              type="button"
              onClick={() => setSizeChartModalOpen(true)}
              className="flex items-center gap-1.5 text-xs text-primary hover:underline"
            >
              <Ruler className="w-3.5 h-3.5" /> Таблиця розмірів
            </button>
          )}
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">Оберіть доступні розміри для цього товару</p>

          {/* Catalog sizes as toggleable chips */}
          <div className="flex flex-wrap gap-2">
            {allCatalogSizes.map(size => {
              const active = availableSizes.includes(size);
              return (
                <button
                  key={size}
                  type="button"
                  onClick={() => toggleSize(size)}
                  className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-all ${
                    active
                      ? "bg-foreground text-background border-foreground"
                      : "bg-background text-muted-foreground border-border hover:border-foreground/40"
                  }`}
                >
                  {size}
                </button>
              );
            })}
            {/* Extra sizes not in catalog */}
            {extraSizes.map(size => (
              <span key={size} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-primary/40 bg-primary/5 text-sm font-medium text-primary">
                {size}
                <button type="button" onClick={() => toggleSize(size)} className="hover:text-destructive transition-colors">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>

          {/* Add custom size */}
          <div className="flex gap-2 pt-1">
            <Input
              value={customSizeInput}
              onChange={e => setCustomSizeInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && addCustomSize()}
              placeholder="Додати розмір (напр. 4XL)"
              className="h-8 text-sm max-w-[200px]"
            />
            <button
              type="button"
              onClick={addCustomSize}
              className="flex items-center gap-1 text-xs text-primary hover:underline"
            >
              <Plus className="w-3 h-3" /> Додати
            </button>
          </div>
        </CardContent>
      </Card>

      {/* ── Print Zones (only if customizable) ─────────────────────────── */}
      {isCustomizable && printAreas.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Зони друку</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {printAreas.map(pa => (
                <label key={pa.id} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  printAreaIds.includes(pa.id) ? "border-primary bg-primary/5" : "border-border hover:border-foreground/30"
                }`}>
                  <input
                    type="checkbox"
                    checked={printAreaIds.includes(pa.id)}
                    onChange={e => {
                      setPrintAreaIds(prev => e.target.checked ? [...prev, pa.id] : prev.filter(id => id !== pa.id));
                      markDirty();
                    }}
                    className="rounded"
                  />
                  <span className="text-sm font-medium">{pa.label || pa.name}</span>
                </label>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Color Variants ─────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Кольори та фото</CardTitle>
        </CardHeader>
        <CardContent>
          {product?.id ? (
            <ProductColorVariantsList productId={product.id} />
          ) : (
            <p className="text-sm text-muted-foreground">Кольори можна додати після збереження товару.</p>
          )}
        </CardContent>
      </Card>

      {/* Hidden submit trigger */}
      <button id="product-form-submit" type="button" onClick={handleSubmit} disabled={saving} className="hidden" aria-hidden="true" />

      {/* Size chart viewer */}
      <SizeChartModal
        chartId={sizeChartId || null}
        open={sizeChartModalOpen}
        onOpenChange={setSizeChartModalOpen}
      />
    </div>
  );
}
