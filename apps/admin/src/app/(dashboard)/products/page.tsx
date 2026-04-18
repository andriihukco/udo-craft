"use client";

import { useEffect, useState, useCallback, useRef } from "react";import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2, RefreshCw, Shirt, Palette, Ruler, Layers, FolderTree, ChevronDown, ChevronRight, ImageIcon, X, Percent, GripVertical } from "lucide-react";
import { toast } from "sonner";
import { ProductColorVariantsList } from "@/components/product-color-variants";
import PrintTypePricingManager from "@/components/print-type-pricing-manager";
import PrintPresetsTab from "@/components/print-presets-tab";
import { ProductImageManager } from "@udo-craft/ui";
import type { ProductImage } from "@udo-craft/shared";


// ── Types ─────────────────────────────────────────────────────────────────────

interface SizeChart { id: string; name: string; rows: Record<string, string>[]; }
interface PrintArea {
  id: string; name: string; label: string; width_mm: number; height_mm: number;
  price_add_cents: number; description?: string; is_active?: boolean;
  allowed_print_types?: string[];
  pricing_grid?: Array<{
    print_type: string; size_label: string; size_min_cm: number; size_max_cm: number;
    qty_tiers: Array<{ min_qty: number; price_cents: number }>;
  }>;
}
interface Category { id: string; name: string; slug: string; is_active: boolean; sort_order: number; image_url?: string; }
interface Material { id: string; name: string; hex_code: string; is_active: boolean; }
interface ProductImageSlot { tag: string; url: string; }

interface Product {
  id: string; name: string; slug: string; description: string; base_price_cents: number;
  images: Record<string, string>; is_active: boolean; is_customizable: boolean;
  available_sizes: string[]; size_chart_id?: string | null;
  print_area_ids?: string[]; category_id?: string | null;
  discount_grid?: { qty: number; discount_pct: number }[];
}

type Tab = "products" | "categories" | "materials" | "print_pricing" | "prints";

const TABS: { key: Tab; icon: React.ElementType; label: string }[] = [
  { key: "products",      icon: Shirt,      label: "Товари" },
  { key: "categories",   icon: FolderTree, label: "Категорії" },
  { key: "materials",    icon: Palette,    label: "Кольори" },
  { key: "print_pricing", icon: Layers,    label: "Ціни друку" },
  { key: "prints",        icon: ImageIcon,  label: "Принти" },
];

const EMPTY_PRODUCT = {
  name: "", slug: "", description: "", base_price_cents: 0, is_active: true, is_customizable: false,
  available_sizes: [] as string[], size_chart_id: null as string | null,
  print_area_ids: [] as string[], category_id: null as string | null,
  discount_grid: [] as { qty: number; discount_pct: number }[],
};

const UA_MAP: Record<string, string> = {
  а:"a",б:"b",в:"v",г:"h",ґ:"g",д:"d",е:"e",є:"ye",ж:"zh",з:"z",и:"y",і:"i",ї:"yi",й:"y",
  к:"k",л:"l",м:"m",н:"n",о:"o",п:"p",р:"r",с:"s",т:"t",у:"u",ф:"f",х:"kh",ц:"ts",ч:"ch",
  ш:"sh",щ:"shch",ь:"",ю:"yu",я:"ya",
};
const slugify = (s: string) =>
  s.toLowerCase().split("").map(c => UA_MAP[c] ?? c).join("")
    .replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "").replace(/-+/g, "-").replace(/^-|-$/g, "");

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function ProductsPage() {
  const [tab, setTab] = useState<Tab>("products");

  // Products state
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [productModal, setProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [expandedProduct, setExpandedProduct] = useState<string | null>(null);
  const [productForm, setProductForm] = useState(EMPTY_PRODUCT);
  const [productImages, setProductImages] = useState<ProductImage[]>([]);
  const [uploading, setUploading] = useState<Record<number, boolean>>({});
  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [savingProduct, setSavingProduct] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string; type: string } | null>(null);
  const [productVariantCounts, setProductVariantCounts] = useState<Record<string, number>>({});
  const [variantModal, setVariantModal] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>("");

  // Shared lookup data
  const [sizeCharts, setSizeCharts] = useState<SizeChart[]>([]);
  const [printAreas, setPrintAreas] = useState<PrintArea[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);

  // Categories state
  const [categoryModal, setCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryForm, setCategoryForm] = useState({ name: "", slug: "", sort_order: 0, is_active: true, image_url: "" });
  const [savingCategory, setSavingCategory] = useState(false);

  // Materials state
  const [materialModal, setMaterialModal] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [materialForm, setMaterialForm] = useState({ name: "", hex_code: "#000000", is_active: true });
  const [savingMaterial, setSavingMaterial] = useState(false);

  // Size charts state
  const [sizeModal, setSizeModal] = useState(false);
  const [editingSize, setEditingSize] = useState<SizeChart | null>(null);
  const [sizeForm, setSizeForm] = useState({ name: "", rows: [] as Record<string, string>[] });
  const [savingSize, setSavingSize] = useState(false);

  // Print areas state
  const [printModal, setPrintModal] = useState(false);
  const [editingPrint, setEditingPrint] = useState<PrintArea | null>(null);
  const [printForm, setPrintForm] = useState<{
    name: string; label: string; width_mm: number; height_mm: number;
    price_add_cents: number; description: string;
    allowed_print_types: string[];
    pricing_grid: Array<{ print_type: string; size_label: string; size_min_cm: number; size_max_cm: number; qty_tiers: Array<{ min_qty: number; price_cents: number }> }>;
  }>({ name: "", label: "", width_mm: 200, height_mm: 300, price_add_cents: 0, description: "", allowed_print_types: ["dtf"], pricing_grid: [] });
  const [savingPrint, setSavingPrint] = useState(false);

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchProducts = useCallback(async () => {
    setLoadingProducts(true);
    try {
      const r = await fetch("/api/products");
      if (r.ok) setProducts(await r.json());
      else toast.error("Помилка завантаження продуктів");
    }
    catch { toast.error("Помилка завантаження продуктів"); }
    finally { setLoadingProducts(false); }
  }, []);

  const fetchLookups = useCallback(async () => {
    const [sc, pa, cat, mat] = await Promise.all([
      fetch("/api/size-charts").then(r => r.ok ? r.json() : []),
      fetch("/api/print-areas").then(r => r.ok ? r.json() : []),
      fetch("/api/categories").then(r => r.ok ? r.json() : []),
      fetch("/api/materials").then(r => r.ok ? r.json() : []),
    ]);
    setSizeCharts(sc); setPrintAreas(pa); setCategories(cat); setMaterials(mat);
  }, []);

  useEffect(() => { fetchProducts(); fetchLookups(); }, [fetchProducts, fetchLookups]);

  // ── Product handlers ───────────────────────────────────────────────────────

  const openCreateProduct = () => {
    setEditingProduct(null);
    setProductForm(EMPTY_PRODUCT);
    setProductImages([]);
    setProductModal(true);
  };

  const openEditProduct = (p: Product) => {
    setEditingProduct(p);
    setProductForm({
      name: p.name, slug: p.slug, description: p.description || "", base_price_cents: p.base_price_cents,
      is_active: p.is_active, is_customizable: p.is_customizable,
      available_sizes: p.available_sizes || [],
      size_chart_id: p.size_chart_id || null, print_area_ids: p.print_area_ids || [],
      category_id: p.category_id || null,
      discount_grid: p.discount_grid || [],
    });
    // Load product_images; fall back to legacy images Record
    const pi = (p as any).product_images as ProductImage[] | undefined;
    if (pi && pi.length > 0) {
      setProductImages(pi);
    } else {
      const imgs = p.images || {};
      setProductImages(
        Object.entries(imgs).map(([key, url], i) => ({
          key, url, label: key, is_customizable: true, sort_order: i,
        }))
      );
    }
    if (p.size_chart_id) {
      const chart = sizeCharts.find(c => c.id === p.size_chart_id);
      if (chart) setSizeForm({ name: chart.name, rows: chart.rows?.length ? chart.rows : [] });
      else setSizeForm({ name: "", rows: [] });
    } else {
      setSizeForm({ name: "", rows: [] });
    }
    setProductModal(true);
  };

  // handleFileUpload removed — ProductImageManager handles uploads internally

  const handleSaveProduct = async () => {
    if (!productForm.name || !productForm.slug) { toast.error("Назва та slug обов'язкові"); return; }
    // Build legacy images map from customizable entries (backward compat for canvas)
    const images: Record<string, string> = {};
    for (const img of productImages) if (img.is_customizable && img.key && img.url) images[img.key] = img.url;
    setSavingProduct(true);
    try {
      // Save size chart if rows exist
      let sizeChartId = productForm.size_chart_id;
      if (sizeForm.rows.length > 0) {
        const chartName = sizeForm.name.trim() || productForm.name || "Таблиця розмірів";
        const scUrl = sizeChartId ? `/api/size-charts/${sizeChartId}` : "/api/size-charts";
        const scRes = await fetch(scUrl, { method: sizeChartId ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: chartName, rows: sizeForm.rows }) });
        if (scRes.ok) { const sc = await scRes.json(); sizeChartId = sc.id; }
      }
      const derivedSizes = sizeForm.rows.map(r => r.size?.trim()).filter(Boolean) as string[];
      const url = editingProduct ? `/api/products/${editingProduct.id}` : "/api/products";
      const r = await fetch(url, { method: editingProduct ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...productForm, available_sizes: derivedSizes.length > 0 ? derivedSizes : productForm.available_sizes, size_chart_id: sizeChartId, images, product_images: productImages }) });
      if (!r.ok) throw new Error((await r.json()).error || "Failed");
      toast.success(editingProduct ? "Продукт оновлено" : "Продукт створено");
      setProductModal(false); fetchProducts(); fetchLookups();
    } catch (e: unknown) { toast.error(e instanceof Error ? e.message : "Помилка"); }
    finally { setSavingProduct(false); }
  };

  const handleToggleActive = async (p: Product) => {
    try {
      const r = await fetch(`/api/products/${p.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ is_active: !p.is_active }) });
      if (!r.ok) throw new Error();
      setProducts(prev => prev.map(x => x.id === p.id ? { ...x, is_active: !x.is_active } : x));
    } catch { toast.error("Помилка"); }
  };

  const handleToggleCategory = async (c: Category) => {
    try {
      const r = await fetch(`/api/categories/${c.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ is_active: !c.is_active }) });
      if (!r.ok) throw new Error();
      setCategories(prev => prev.map(x => x.id === c.id ? { ...x, is_active: !x.is_active } : x));
    } catch { toast.error("Помилка"); }
  };

  const handleToggleMaterial = async (m: Material) => {
    try {
      const r = await fetch(`/api/materials/${m.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ is_active: !m.is_active }) });
      if (!r.ok) throw new Error();
      setMaterials(prev => prev.map(x => x.id === m.id ? { ...x, is_active: !x.is_active } : x));
    } catch { toast.error("Помилка"); }
  };

  const handleTogglePrint = async (a: PrintArea) => {
    try {
      const r = await fetch(`/api/print-areas/${a.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ is_active: !a.is_active }) });
      if (!r.ok) throw new Error();
      setPrintAreas(prev => prev.map(x => x.id === a.id ? { ...x, is_active: !x.is_active } : x));
    } catch { toast.error("Помилка"); }
  };

  // ── Drag-to-reorder ────────────────────────────────────────────────────────
  const dragItem = useRef<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  const reorder = <T extends { id: string }>(items: T[], fromId: string, toId: string): T[] => {
    const from = items.findIndex(i => i.id === fromId);
    const to = items.findIndex(i => i.id === toId);
    if (from === -1 || to === -1 || from === to) return items;
    const next = [...items];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    return next;
  };

  const persistOrder = async (url: string, ids: string[]) => {
    await Promise.all(ids.map((id, i) =>
      fetch(`${url}/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sort_order: i }) })
    ));
  };

  // ── Category handlers ──────────────────────────────────────────────────────

  const openCreateCategory = () => { setEditingCategory(null); setCategoryForm({ name: "", slug: "", sort_order: 0, is_active: true, image_url: "" }); setCategoryModal(true); };
  const openEditCategory = (c: Category) => { setEditingCategory(c); setCategoryForm({ name: c.name, slug: c.slug, sort_order: c.sort_order, is_active: c.is_active, image_url: c.image_url || "" }); setCategoryModal(true); };

  const handleSaveCategory = async () => {
    if (!categoryForm.name || !categoryForm.slug) { toast.error("Назва та slug обов'язкові"); return; }
    setSavingCategory(true);
    try {
      const url = editingCategory ? `/api/categories/${editingCategory.id}` : "/api/categories";
      const r = await fetch(url, { method: editingCategory ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(categoryForm) });
      if (!r.ok) throw new Error();
      toast.success(editingCategory ? "Категорію оновлено" : "Категорію створено");
      setCategoryModal(false); fetchLookups();
    } catch { toast.error("Помилка"); }
    finally { setSavingCategory(false); }
  };

  // ── Material handlers ──────────────────────────────────────────────────────

  const openCreateMaterial = () => { setEditingMaterial(null); setMaterialForm({ name: "", hex_code: "#000000", is_active: true }); setMaterialModal(true); };
  const openEditMaterial = (m: Material) => { setEditingMaterial(m); setMaterialForm({ name: m.name, hex_code: m.hex_code, is_active: m.is_active }); setMaterialModal(true); };

  const handleSaveMaterial = async () => {
    if (!materialForm.name) { toast.error("Назва обов'язкова"); return; }
    setSavingMaterial(true);
    try {
      const url = editingMaterial ? `/api/materials/${editingMaterial.id}` : "/api/materials";
      const r = await fetch(url, { method: editingMaterial ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(materialForm) });
      if (!r.ok) throw new Error();
      toast.success(editingMaterial ? "Матеріал оновлено" : "Матеріал створено");
      setMaterialModal(false); fetchLookups();
    } catch { toast.error("Помилка"); }
    finally { setSavingMaterial(false); }
  };

  // ── Size chart handlers ────────────────────────────────────────────────────

  const openCreateSize = () => { setEditingSize(null); setSizeForm({ name: "", rows: [] }); setSizeModal(true); };
  const openEditSize = (s: SizeChart) => { setEditingSize(s); setSizeForm({ name: s.name, rows: s.rows?.length ? s.rows : [{ size: "S" }] }); setSizeModal(true); };

  const handleSaveSize = async () => {
    if (!sizeForm.name) { toast.error("Назва обов'язкова"); return; }
    setSavingSize(true);
    try {
      const url = editingSize ? `/api/size-charts/${editingSize.id}` : "/api/size-charts";
      const r = await fetch(url, { method: editingSize ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(sizeForm) });
      if (!r.ok) throw new Error();
      toast.success(editingSize ? "Таблицю оновлено" : "Таблицю створено");
      setSizeModal(false); fetchLookups();
    } catch { toast.error("Помилка"); }
    finally { setSavingSize(false); }
  };

  // ── Print area handlers ────────────────────────────────────────────────────

  const openCreatePrint = () => { setEditingPrint(null); setPrintForm({ name: "", label: "", width_mm: 200, height_mm: 300, price_add_cents: 0, description: "", allowed_print_types: ["dtf"], pricing_grid: [] }); setPrintModal(true); };
  const openEditPrint = (p: PrintArea) => { setEditingPrint(p); setPrintForm({ name: p.name, label: p.label, width_mm: p.width_mm, height_mm: p.height_mm, price_add_cents: p.price_add_cents, description: p.description || "", allowed_print_types: p.allowed_print_types || ["dtf"], pricing_grid: p.pricing_grid || [] }); setPrintModal(true); };

  const handleSavePrint = async () => {
    if (!printForm.name) { toast.error("Назва обов'язкова"); return; }
    setSavingPrint(true);
    try {
      const url = editingPrint ? `/api/print-areas/${editingPrint.id}` : "/api/print-areas";
      const r = await fetch(url, { method: editingPrint ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(printForm) });
      if (!r.ok) throw new Error();
      toast.success(editingPrint ? "Зону оновлено" : "Зону створено");
      setPrintModal(false); fetchLookups();
    } catch { toast.error("Помилка"); }
    finally { setSavingPrint(false); }
  };

  // ── Delete handler ─────────────────────────────────────────────────────────

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const urls: Record<string, string> = { product: `/api/products/${deleteTarget.id}`, category: `/api/categories/${deleteTarget.id}`, material: `/api/materials/${deleteTarget.id}`, size: `/api/size-charts/${deleteTarget.id}`, print: `/api/print-areas/${deleteTarget.id}` };
    try {
      const r = await fetch(urls[deleteTarget.type], { method: "DELETE" });
      if (!r.ok) throw new Error();
      toast.success("Видалено");
      setDeleteTarget(null);
      if (deleteTarget.type === "product") fetchProducts(); else fetchLookups();
    } catch { toast.error("Помилка видалення"); }
  };

  // ── Add button per tab ─────────────────────────────────────────────────────

  const addActions: Record<Tab, () => void> = {
    products: openCreateProduct, categories: openCreateCategory,
    materials: openCreateMaterial, print_pricing: () => {}, prints: () => {},
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-1 h-0 flex-col overflow-hidden">
      {/* Header + tabs */}
      <div className="h-12 px-4 border-b border-border shrink-0 flex items-center gap-1">
        <p className="font-semibold text-base mr-4 shrink-0">Каталог</p>
        <nav className="flex h-full">
          {TABS.map(({ key, icon: Icon, label }) => (
            <button key={key} onClick={() => setTab(key)}
              className={`flex items-center gap-1.5 px-3 h-full text-sm font-medium border-b-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset ${tab === key ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
              <Icon className="w-3.5 h-3.5" />{label}
            </button>
          ))}
        </nav>
        <Button size="sm" className="ml-auto h-7 text-xs" onClick={addActions[tab]} style={{ visibility: tab === "print_pricing" || tab === "prints" ? "hidden" : undefined }}>
          <Plus className="w-3.5 h-3.5 mr-1" /> Додати
        </Button>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">

        {/* ── Products ── */}
        {tab === "products" && (
          <>
            {/* Filter bar */}
            {categories.length > 0 && (
              <div className="flex items-center gap-2 px-4 py-2 border-b border-border flex-wrap">
                <button
                  onClick={() => setCategoryFilter("")}
                  className={`text-xs px-3 py-1 rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${!categoryFilter ? "bg-foreground/10 border-foreground/30 text-foreground font-medium" : "border-border text-muted-foreground hover:border-foreground/30"}`}
                >
                  Всі
                </button>
                {categories.map(c => (
                  <button
                    key={c.id}
                    onClick={() => setCategoryFilter(categoryFilter === c.id ? "" : c.id)}
                    className={`text-xs px-3 py-1 rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${categoryFilter === c.id ? "bg-foreground/10 border-foreground/30 text-foreground font-medium" : "border-border text-muted-foreground hover:border-foreground/30"}`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            )}
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-6" />
                <TableHead className="w-10" />
                <TableHead className="w-10" />
                <TableHead>Назва</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Ціна</TableHead>
                <TableHead>Категорія</TableHead>
                <TableHead className="w-20" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {loadingProducts ? (
                <TableRow><TableCell colSpan={8} className="text-center py-12 text-muted-foreground">Завантаження...</TableCell></TableRow>
              ) : products.filter(p => !categoryFilter || p.category_id === categoryFilter).length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center py-12 text-muted-foreground">Продуктів не знайдено</TableCell></TableRow>
              ) : products.filter(p => !categoryFilter || p.category_id === categoryFilter).map(p => {
                const cat = categories.find(c => c.id === p.category_id);
                const isExpanded = expandedProduct === p.id;
                return (
                  <>
                  <TableRow key={p.id}
                    draggable
                    onDragStart={() => { dragItem.current = p.id; }}
                    onDragOver={e => { e.preventDefault(); setDragOverId(p.id); }}
                    onDragEnd={() => setDragOverId(null)}
                    onDrop={() => { if (dragItem.current && dragItem.current !== p.id) { const next = reorder(products, dragItem.current, p.id); setProducts(next); persistOrder("/api/products", next.map(x => x.id)); } dragItem.current = null; setDragOverId(null); }}
                    className={`group hover:bg-muted/40 ${dragOverId === p.id ? "border-t-2 border-t-primary" : ""}`}>
                    <TableCell className="text-muted-foreground cursor-grab pr-0"><GripVertical className="w-4 h-4" /></TableCell>
                    <TableCell><Switch checked={p.is_active} onCheckedChange={() => handleToggleActive(p)} /></TableCell>
                    <TableCell>
                      <button onClick={() => setExpandedProduct(isExpanded ? null : p.id)} className="text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded" aria-label={isExpanded ? "Згорнути варіанти" : "Розгорнути варіанти"} aria-expanded={isExpanded}>
                        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </button>
                    </TableCell>
                    <TableCell className="cursor-pointer" onClick={() => openEditProduct(p)}>
                      <p className="font-medium text-sm">{p.name}</p>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground font-mono">{p.slug}</TableCell>
                    <TableCell className="text-sm">₴{(p.base_price_cents / 100).toFixed(0)}{p.discount_grid?.length ? <span className="text-xs text-muted-foreground ml-1">({p.discount_grid.length} рівнів)</span> : null}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{cat?.name || "—"}</TableCell>
                    <TableCell>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditProduct(p)}><Pencil className="w-3.5 h-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDeleteTarget({ id: p.id, name: p.name, type: "product" })}><Trash2 className="w-3.5 h-3.5" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                  {isExpanded && (
                    <TableRow key={`${p.id}-variants`} className="bg-muted/20 hover:bg-muted/20">
                      <TableCell colSpan={8} className="px-8 py-3">
                        <ProductColorVariantsList productId={p.id} />
                      </TableCell>
                    </TableRow>
                  )}
                  </>
                );
              })}
              {/* Sentinel — drop zone after last item */}
              <TableRow key="__sentinel__"
                onDragOver={e => { e.preventDefault(); setDragOverId("__end__"); }}
                onDragEnd={() => setDragOverId(null)}
                onDrop={() => { if (dragItem.current) { const filtered = products.filter(p => !categoryFilter || p.category_id === categoryFilter); const last = filtered[filtered.length - 1]; if (last && dragItem.current !== last.id) { const next = reorder(products, dragItem.current, last.id); setProducts(next); persistOrder("/api/products", next.map(x => x.id)); } } dragItem.current = null; setDragOverId(null); }}
                className={`h-4 ${dragOverId === "__end__" ? "border-t-2 border-t-primary" : ""}`}>
                <TableCell colSpan={8} />
              </TableRow>
            </TableBody>
          </Table>
          </>
        )}

        {/* ── Categories ── */}
        {tab === "categories" && (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-6" />
                <TableHead className="w-10" />
                <TableHead>Назва</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead className="w-20" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-12 text-muted-foreground">Категорій не знайдено</TableCell></TableRow>
              ) : categories.map(c => (
                <TableRow key={c.id}
                  draggable
                  onDragStart={() => { dragItem.current = c.id; }}
                  onDragOver={e => { e.preventDefault(); setDragOverId(c.id); }}
                  onDragEnd={() => setDragOverId(null)}
                  onDrop={() => { if (dragItem.current && dragItem.current !== c.id) { const next = reorder(categories, dragItem.current, c.id); setCategories(next); persistOrder("/api/categories", next.map(x => x.id)); } dragItem.current = null; setDragOverId(null); }}
                  className={`group hover:bg-muted/40 ${dragOverId === c.id ? "border-t-2 border-t-primary" : ""}`}>
                  <TableCell className="text-muted-foreground cursor-grab pr-0"><GripVertical className="w-4 h-4" /></TableCell>
                  <TableCell><Switch checked={c.is_active} onCheckedChange={() => handleToggleCategory(c)} /></TableCell>
                  <TableCell className="cursor-pointer" onClick={() => openEditCategory(c)}>
                    <p className="font-medium text-sm">{c.name}</p>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{c.slug}</TableCell>
                  <TableCell>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditCategory(c)}><Pencil className="w-3.5 h-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDeleteTarget({ id: c.id, name: c.name, type: "category" })}><Trash2 className="w-3.5 h-3.5" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              <TableRow key="__sentinel__"
                onDragOver={e => { e.preventDefault(); setDragOverId("__end__"); }}
                onDragEnd={() => setDragOverId(null)}
                onDrop={() => { if (dragItem.current) { const last = categories[categories.length - 1]; if (last && dragItem.current !== last.id) { const next = reorder(categories, dragItem.current, last.id); setCategories(next); persistOrder("/api/categories", next.map(x => x.id)); } } dragItem.current = null; setDragOverId(null); }}
                className={`h-4 ${dragOverId === "__end__" ? "border-t-2 border-t-primary" : ""}`}>
                <TableCell colSpan={5} />
              </TableRow>
            </TableBody>
          </Table>
        )}

        {/* ── Materials ── */}
        {tab === "materials" && (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-6" />
                <TableHead className="w-10" />
                <TableHead className="w-10" />
                <TableHead>Назва</TableHead>
                <TableHead>HEX</TableHead>
                <TableHead className="w-20" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {materials.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-12 text-muted-foreground">Матеріалів не знайдено</TableCell></TableRow>
              ) : materials.map(m => (
                <TableRow key={m.id}
                  draggable
                  onDragStart={() => { dragItem.current = m.id; }}
                  onDragOver={e => { e.preventDefault(); setDragOverId(m.id); }}
                  onDragEnd={() => setDragOverId(null)}
                  onDrop={() => { if (dragItem.current && dragItem.current !== m.id) { const next = reorder(materials, dragItem.current, m.id); setMaterials(next); persistOrder("/api/materials", next.map(x => x.id)); } dragItem.current = null; setDragOverId(null); }}
                  className={`group hover:bg-muted/40 ${dragOverId === m.id ? "border-t-2 border-t-primary" : ""}`}>
                  <TableCell className="text-muted-foreground cursor-grab pr-0"><GripVertical className="w-4 h-4" /></TableCell>
                  <TableCell><Switch checked={m.is_active} onCheckedChange={() => handleToggleMaterial(m)} /></TableCell>
                  <TableCell><div className="w-6 h-6 rounded-full border border-border" style={{ background: m.hex_code }} /></TableCell>
                  <TableCell className="cursor-pointer" onClick={() => openEditMaterial(m)}>
                    <p className="font-medium text-sm">{m.name}</p>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground font-mono">{m.hex_code}</TableCell>
                  <TableCell>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditMaterial(m)}><Pencil className="w-3.5 h-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDeleteTarget({ id: m.id, name: m.name, type: "material" })}><Trash2 className="w-3.5 h-3.5" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              <TableRow key="__sentinel__"
                onDragOver={e => { e.preventDefault(); setDragOverId("__end__"); }}
                onDragEnd={() => setDragOverId(null)}
                onDrop={() => { if (dragItem.current) { const last = materials[materials.length - 1]; if (last && dragItem.current !== last.id) { const next = reorder(materials, dragItem.current, last.id); setMaterials(next); persistOrder("/api/materials", next.map(x => x.id)); } } dragItem.current = null; setDragOverId(null); }}
                className={`h-4 ${dragOverId === "__end__" ? "border-t-2 border-t-primary" : ""}`}>
                <TableCell colSpan={6} />
              </TableRow>
            </TableBody>
          </Table>
        )}        {/* ── Print Areas ── */}
        {tab === "print_pricing" && (
          <div className="p-4 md:p-6">
            <PrintTypePricingManager />
          </div>
        )}

        {/* ── Print Presets ── */}
        {tab === "prints" && <PrintPresetsTab />}
      </div>

      {/* ── Product Modal ── */}
      <Dialog open={productModal} onOpenChange={setProductModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingProduct ? "Редагувати продукт" : "Новий продукт"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-1">

            {/* Basic info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="p-name">Назва *</Label>
                <Input id="p-name" value={productForm.name} onChange={e => { const name = e.target.value; setProductForm(f => ({ ...f, name, slug: slugify(name) })); }} placeholder="Футболка базова" />
                <p className="text-xs text-muted-foreground font-mono">{productForm.slug || "—"}</p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="p-price">Ціна (₴) *</Label>
                <Input id="p-price" type="number" value={productForm.base_price_cents / 100} onChange={e => setProductForm(f => ({ ...f, base_price_cents: Math.round(parseFloat(e.target.value || "0") * 100) }))} placeholder="299" min="0" step="1" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="p-description">Опис для картки товару</Label>
              <Textarea
                id="p-description"
                value={productForm.description}
                onChange={e => setProductForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Короткий опис, який побачить клієнт на картці товару"
                rows={3}
                className="resize-none"
              />
            </div>

            {/* Category + status — single row */}
            <div className="grid grid-cols-[1fr_auto] gap-4 items-end">
              <div className="space-y-1.5">
                <Label>Категорія</Label>
                <Select value={productForm.category_id || ""} onValueChange={v => setProductForm(f => ({ ...f, category_id: v || null }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="— Не призначено —">
                      {productForm.category_id ? (categories.find(c => c.id === productForm.category_id)?.name ?? "— Не призначено —") : "— Не призначено —"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">— Не призначено —</SelectItem>
                    {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-4 pb-0.5">
                <div className="flex items-center gap-2">
                  <Switch checked={productForm.is_active} onCheckedChange={v => setProductForm(f => ({ ...f, is_active: v }))} />
                  <Label className="font-normal cursor-pointer whitespace-nowrap">Активний</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={productForm.is_customizable} onCheckedChange={v => setProductForm(f => ({ ...f, is_customizable: v }))} />
                  <Label className="font-normal cursor-pointer whitespace-nowrap">Кастомізація</Label>
                </div>
              </div>
            </div>

            {/* Print areas */}
            {printAreas.length > 0 && (
              <div className="space-y-2">
                <Label>Зони друку</Label>
                <div className="flex flex-wrap gap-2">
                  {printAreas.map(a => {
                    const sel = productForm.print_area_ids.includes(a.id);
                    return (
                      <button key={a.id} type="button"
                        onClick={() => setProductForm(f => ({ ...f, print_area_ids: sel ? f.print_area_ids.filter(id => id !== a.id) : [...f.print_area_ids, a.id] }))}
                        className={`text-sm px-3 py-1.5 rounded-full border transition-all ${sel ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground"}`}>
                        {a.label || a.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Size chart */}
            <div className="space-y-3 border-t pt-4">
              <div className="flex items-center justify-between">
                <Label>Таблиця розмірів</Label>
                {sizeCharts.length > 0 && (
                  <Select value={productForm.size_chart_id || ""} onValueChange={v => {
                    setProductForm(f => ({ ...f, size_chart_id: v || null }));
                    if (v) { const chart = sizeCharts.find(c => c.id === v); if (chart) setSizeForm({ name: chart.name, rows: chart.rows?.length ? chart.rows : [{ size: "S" }] }); }
                  }}>
                    <SelectTrigger className="h-8 text-xs w-44"><SelectValue placeholder="Завантажити існуючу" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">— Нова таблиця —</SelectItem>
                      {sizeCharts.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}
              </div>
              <Input value={sizeForm.name} onChange={e => setSizeForm(f => ({ ...f, name: e.target.value }))} placeholder="Назва таблиці (напр. Футболки унісекс)" />              <div className="rounded-lg border overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/60 border-b">
                      <th className="w-7" />
                      {sizeForm.rows[0] && Object.keys(sizeForm.rows[0]).map(col => (
                        <th key={col} className="px-3 py-2 text-left font-medium text-muted-foreground whitespace-nowrap">
                          <div className="flex items-center gap-1">{col}
                            {col !== "size" && <button type="button" onClick={() => { const cols = Object.keys(sizeForm.rows[0]).filter(c => c !== col); setSizeForm(f => ({ ...f, rows: f.rows.map(r => { const n: Record<string, string> = { size: r.size || "" }; cols.forEach(c => { n[c] = r[c] || ""; }); return n; }) })); }} className="text-muted-foreground/50 hover:text-destructive transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded" aria-label={`Видалити колонку ${col}`}><X className="w-3 h-3" /></button>}
                          </div>
                        </th>
                      ))}
                      <th className="w-8" />
                    </tr>
                  </thead>
                  <tbody>
                    {sizeForm.rows.map((row, ri) => (
                      <tr key={ri} className="border-t group"
                        draggable
                        onDragStart={e => { e.dataTransfer.setData("sizeRowIdx", String(ri)); e.dataTransfer.effectAllowed = "move"; }}
                        onDragOver={e => e.preventDefault()}
                        onDrop={e => {
                          const from = parseInt(e.dataTransfer.getData("sizeRowIdx"));
                          if (isNaN(from) || from === ri) return;
                          setSizeForm(f => {
                            const rows = [...f.rows];
                            const [moved] = rows.splice(from, 1);
                            rows.splice(ri, 0, moved);
                            return { ...f, rows };
                          });
                        }}
                      >
                        <td className="px-1 py-1.5 cursor-grab text-muted-foreground/30 group-hover:text-muted-foreground/60 transition-colors">
                          <GripVertical className="w-3.5 h-3.5" />
                        </td>
                        {Object.keys(row).map(col => (
                          <td key={col} className="px-2 py-1.5">
                            <Input value={row[col] || ""} onChange={e => setSizeForm(f => ({ ...f, rows: f.rows.map((r, i) => i === ri ? { ...r, [col]: e.target.value } : r) }))} className="h-7 text-xs min-w-[56px]" placeholder={col === "size" ? "S" : "—"} />
                          </td>
                        ))}
                        <td className="px-2 py-1.5">
                          <button type="button" onClick={() => setSizeForm(f => ({ ...f, rows: f.rows.filter((_, i) => i !== ri) }))} className="text-muted-foreground/50 hover:text-destructive transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded" aria-label="Видалити рядок"><X className="w-3.5 h-3.5" /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setSizeForm(f => ({ ...f, rows: [...f.rows, { size: "" }] }))}><Plus className="w-3.5 h-3.5 mr-1" /> Рядок</Button>
                <Button type="button" variant="outline" size="sm" onClick={() => { const col = `col_${Date.now()}`; setSizeForm(f => ({ ...f, rows: f.rows.map(r => ({ ...r, [col]: "" })) })); }}><Plus className="w-3.5 h-3.5 mr-1" /> Колонка</Button>
              </div>
            </div>

            {/* Discount grid */}
            <div className="space-y-3 border-t pt-4">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-1.5"><Percent className="w-3.5 h-3.5" /> Знижки за кількість</Label>
                <Button type="button" variant="outline" size="sm" onClick={() => setProductForm(f => ({ ...f, discount_grid: [...f.discount_grid, { qty: 10, discount_pct: 5 }] }))}><Plus className="w-3.5 h-3.5 mr-1" /> Рівень</Button>
              </div>
              {productForm.discount_grid.length === 0 ? (
                <p className="text-sm text-muted-foreground">Немає знижок — клієнти платять базову ціну</p>
              ) : (
                <div className="space-y-2">
                  {productForm.discount_grid.map((row, i) => (
                    <div key={i}
                      draggable
                      onDragStart={e => { e.dataTransfer.setData("discountIdx", String(i)); e.dataTransfer.effectAllowed = "move"; }}
                      onDragOver={e => e.preventDefault()}
                      onDrop={e => {
                        const from = parseInt(e.dataTransfer.getData("discountIdx"));
                        if (isNaN(from) || from === i) return;
                        setProductForm(f => {
                          const grid = [...f.discount_grid];
                          const [moved] = grid.splice(from, 1);
                          grid.splice(i, 0, moved);
                          return { ...f, discount_grid: grid };
                        });
                      }}
                      className="flex items-center gap-2 bg-muted/40 rounded-lg px-2 py-2 group cursor-grab active:cursor-grabbing"
                    >
                      <GripVertical className="w-3.5 h-3.5 text-muted-foreground/30 group-hover:text-muted-foreground/60 transition-colors shrink-0" />
                      <span className="text-xs text-muted-foreground shrink-0">від</span>
                      <Input type="number" min="1" value={row.qty} onChange={e => setProductForm(f => ({ ...f, discount_grid: f.discount_grid.map((r, idx) => idx === i ? { ...r, qty: parseInt(e.target.value) || 1 } : r) }))} className="h-7 w-20 text-sm text-center" placeholder="10" />
                      <span className="text-xs text-muted-foreground shrink-0">шт. →</span>
                      <Input type="number" min="1" max="99" value={row.discount_pct} onChange={e => setProductForm(f => ({ ...f, discount_grid: f.discount_grid.map((r, idx) => idx === i ? { ...r, discount_pct: parseInt(e.target.value) || 0 } : r) }))} className="h-7 w-16 text-sm text-center" placeholder="5" />
                      <span className="text-xs text-muted-foreground shrink-0">%</span>
                      <button type="button" onClick={() => setProductForm(f => ({ ...f, discount_grid: f.discount_grid.filter((_, idx) => idx !== i) }))} className="ml-auto text-muted-foreground/50 hover:text-destructive transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded" aria-label="Видалити рівень знижки"><X className="w-3.5 h-3.5" /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Images */}
            <div className="space-y-3 border-t pt-4">
              <Label>Фотографії товару</Label>
              <p className="text-xs text-muted-foreground -mt-1">
                Позначте «Канвас» для фото, які використовуються як сторони в редакторі принтів. Решта — галерея на сторінці товару.
              </p>
              <ProductImageManager
                images={productImages}
                onChange={setProductImages}
                uploadUrl="/api/upload"
                uploadTagPrefix="product"
              />
            </div>

            {/* Colors */}
            <div className="border-t pt-4">
              {editingProduct ? (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Кольори та фото</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Варіанти кольорів та зображення</p>
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={() => { setProductModal(false); setVariantModal(true); }}>Керувати кольорами</Button>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-1">Кольори можна додати після збереження продукту</p>
              )}
            </div>

          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setProductModal(false)}>Скасувати</Button>
            <Button onClick={handleSaveProduct} disabled={savingProduct}>{savingProduct ? "Збереження..." : "Зберегти"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Variant Modal ── */}
      <Dialog open={variantModal} onOpenChange={o => { setVariantModal(o); if (!o && editingProduct) setProductModal(true); }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Кольори та фото — {editingProduct?.name}</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            {editingProduct && <ProductColorVariantsList productId={editingProduct.id} />}
          </div>
          <DialogFooter>
            <Button onClick={() => { setVariantModal(false); setProductModal(true); }}>Готово</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Category Modal ── */}
      <Dialog open={categoryModal} onOpenChange={setCategoryModal}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editingCategory ? "Редагувати категорію" : "Нова категорія"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Назва *</Label>
              <Input value={categoryForm.name} onChange={e => { const name = e.target.value; setCategoryForm(f => ({ ...f, name, slug: slugify(name) })); }} placeholder="Футболки" />
              <p className="text-xs text-muted-foreground">slug: {categoryForm.slug || "—"}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Порядок</Label><Input type="number" value={categoryForm.sort_order} onChange={e => setCategoryForm(f => ({ ...f, sort_order: parseInt(e.target.value) || 0 }))} /></div>
              <div className="space-y-1.5"><Label>URL зображення</Label><Input value={categoryForm.image_url} onChange={e => setCategoryForm(f => ({ ...f, image_url: e.target.value }))} placeholder="https://..." /></div>
            </div>
            <div className="flex items-center gap-2"><Switch checked={categoryForm.is_active} onCheckedChange={v => setCategoryForm(f => ({ ...f, is_active: v }))} /><Label>Активна</Label></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCategoryModal(false)}>Скасувати</Button>
            <Button onClick={handleSaveCategory} disabled={savingCategory}>{savingCategory ? "Збереження..." : "Зберегти"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Material Modal ── */}
      <Dialog open={materialModal} onOpenChange={setMaterialModal}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>{editingMaterial ? "Редагувати матеріал" : "Новий матеріал"}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5"><Label>Назва *</Label><Input value={materialForm.name} onChange={e => setMaterialForm(f => ({ ...f, name: e.target.value }))} placeholder="Чорний" /></div>
            <div className="space-y-1.5">
              <Label>Колір</Label>
              <div className="flex items-center gap-2">
                <input type="color" value={materialForm.hex_code} onChange={e => setMaterialForm(f => ({ ...f, hex_code: e.target.value }))} className="w-10 h-9 rounded border border-border cursor-pointer p-0.5" />
                <Input value={materialForm.hex_code} onChange={e => setMaterialForm(f => ({ ...f, hex_code: e.target.value }))} placeholder="#000000" className="font-mono" />
              </div>
            </div>
            <div className="flex items-center gap-2"><Switch checked={materialForm.is_active} onCheckedChange={v => setMaterialForm(f => ({ ...f, is_active: v }))} /><Label>Активний</Label></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMaterialModal(false)}>Скасувати</Button>
            <Button onClick={handleSaveMaterial} disabled={savingMaterial}>{savingMaterial ? "Збереження..." : "Зберегти"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Print Area Modal ── */}
      <Dialog open={printModal} onOpenChange={setPrintModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingPrint ? "Редагувати зону друку" : "Нова зона друку"}</DialogTitle></DialogHeader>
          <div className="space-y-5 py-2">

            {/* Basic info */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Назва *</Label><Input value={printForm.name} onChange={e => setPrintForm(f => ({ ...f, name: e.target.value }))} placeholder="Передня частина" /></div>
              <div className="space-y-1.5"><Label>Мітка (для клієнта)</Label><Input value={printForm.label} onChange={e => setPrintForm(f => ({ ...f, label: e.target.value }))} placeholder="Груди, Спина..." /></div>
              <div className="space-y-1.5"><Label>Ширина (мм)</Label><Input type="number" value={printForm.width_mm} onChange={e => setPrintForm(f => ({ ...f, width_mm: parseInt(e.target.value) || 0 }))} /></div>
              <div className="space-y-1.5"><Label>Висота (мм)</Label><Input type="number" value={printForm.height_mm} onChange={e => setPrintForm(f => ({ ...f, height_mm: parseInt(e.target.value) || 0 }))} /></div>
            </div>

            {/* Allowed print types */}
            <div className="space-y-2 border-t pt-4">
              <Label>Дозволені типи нанесення</Label>
              <div className="flex flex-wrap gap-2">
                {([
                  { id: "dtf",         label: "DTF / Принт",  selCls: "bg-primary text-primary-foreground border-primary" },
                  { id: "embroidery",  label: "Вишивка",       selCls: "bg-pink-500 text-white border-pink-500" },
                  { id: "screen",      label: "Шовкодрук",     selCls: "bg-amber-500 text-white border-amber-500" },
                  { id: "sublimation", label: "Сублімація",    selCls: "bg-cyan-500 text-white border-cyan-500" },
                  { id: "patch",       label: "Нашивка",       selCls: "bg-emerald-500 text-white border-emerald-500" },
                ] as const).map(t => {
                  const sel = printForm.allowed_print_types.includes(t.id);
                  return (
                    <button key={t.id} type="button"
                      onClick={() => setPrintForm(f => ({ ...f, allowed_print_types: sel ? f.allowed_print_types.filter(x => x !== t.id) : [...f.allowed_print_types, t.id] }))}
                      className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 ${sel ? t.selCls : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground"}`}
                    >{t.label}</button>
                  );
                })}
              </div>
            </div>

            {/* Pricing grid */}
            <div className="space-y-3 border-t pt-4">
              <div className="flex items-center justify-between">
                <Label>Цінова сітка</Label>
                <Button type="button" variant="outline" size="sm" onClick={() => setPrintForm(f => ({
                  ...f,
                  pricing_grid: [...f.pricing_grid, { print_type: f.allowed_print_types[0] || "dtf", size_label: "", size_min_cm: 0, size_max_cm: 0, qty_tiers: [{ min_qty: 1, price_cents: 10000 }] }]
                }))}><Plus className="w-3.5 h-3.5 mr-1" /> Розмір</Button>
              </div>
              {printForm.pricing_grid.length === 0 ? (
                <p className="text-xs text-muted-foreground">Додайте рядки з цінами за розміром нанесення</p>
              ) : (
                <div className="space-y-3">
                  {printForm.pricing_grid.map((row, ri) => (
                    <div key={ri} className="rounded-lg border border-border p-3 space-y-2.5 bg-muted/20">
                      <div className="grid grid-cols-[1fr_80px_80px_auto] gap-2 items-end">
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Тип / Розмір</Label>
                          <div className="flex gap-1.5">
                            <Select
                              value={row.print_type}
                              onValueChange={v => setPrintForm(f => ({ ...f, pricing_grid: f.pricing_grid.map((r, i) => i === ri ? { ...r, print_type: v } : r) }))}
                            >
                              <SelectTrigger className="h-7 text-xs flex-1">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {printForm.allowed_print_types.map(pt => (
                                  <SelectItem key={pt} value={pt} className="text-xs">
                                    {pt === "dtf" ? "DTF" : pt === "embroidery" ? "Вишивка" : pt === "screen" ? "Шовкодрук" : pt === "sublimation" ? "Сублімація" : "Нашивка"}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Input value={row.size_label} onChange={e => setPrintForm(f => ({ ...f, pricing_grid: f.pricing_grid.map((r, i) => i === ri ? { ...r, size_label: e.target.value } : r) }))} placeholder="8-10см" className="h-7 text-xs w-20" />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Мін. см</Label>
                          <Input type="number" value={row.size_min_cm} onChange={e => setPrintForm(f => ({ ...f, pricing_grid: f.pricing_grid.map((r, i) => i === ri ? { ...r, size_min_cm: parseFloat(e.target.value) || 0 } : r) }))} className="h-7 text-xs" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Макс. см</Label>
                          <Input type="number" value={row.size_max_cm} onChange={e => setPrintForm(f => ({ ...f, pricing_grid: f.pricing_grid.map((r, i) => i === ri ? { ...r, size_max_cm: parseFloat(e.target.value) || 0 } : r) }))} className="h-7 text-xs" />
                        </div>
                        <button type="button" onClick={() => setPrintForm(f => ({ ...f, pricing_grid: f.pricing_grid.filter((_, i) => i !== ri) }))} className="mb-0.5 text-muted-foreground/50 hover:text-destructive transition-colors self-end focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded" aria-label="Видалити рядок ціни"><X className="w-3.5 h-3.5" /></button>
                      </div>

                      {/* Qty tiers */}
                      <div className="space-y-1.5 pl-1">
                        <div className="grid grid-cols-[1fr_1fr_auto] gap-1.5 text-[10px] text-muted-foreground font-medium">
                          <span>Від (шт)</span><span>Ціна (грн)</span><span />
                        </div>
                        {row.qty_tiers.map((tier, ti) => (
                          <div key={ti} className="grid grid-cols-[1fr_1fr_auto] gap-1.5 items-center">
                            <Input type="number" min={1} value={tier.min_qty}
                              onChange={e => setPrintForm(f => ({ ...f, pricing_grid: f.pricing_grid.map((r, i) => i === ri ? { ...r, qty_tiers: r.qty_tiers.map((t, j) => j === ti ? { ...t, min_qty: parseInt(e.target.value) || 1 } : t) } : r) }))}
                              className="h-7 text-xs" />
                            <Input type="number" min={0} value={Math.round(tier.price_cents / 100)}
                              onChange={e => setPrintForm(f => ({ ...f, pricing_grid: f.pricing_grid.map((r, i) => i === ri ? { ...r, qty_tiers: r.qty_tiers.map((t, j) => j === ti ? { ...t, price_cents: Math.round((parseFloat(e.target.value) || 0) * 100) } : t) } : r) }))}
                              className="h-7 text-xs" />
                            <button type="button" onClick={() => setPrintForm(f => ({ ...f, pricing_grid: f.pricing_grid.map((r, i) => i === ri ? { ...r, qty_tiers: r.qty_tiers.filter((_, j) => j !== ti) } : r) }))} className="size-7 flex items-center justify-center text-muted-foreground/50 hover:text-destructive transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded" aria-label="Видалити ціновий рівень"><X className="w-3 h-3" /></button>
                          </div>
                        ))}
                        <button type="button"
                          onClick={() => setPrintForm(f => ({ ...f, pricing_grid: f.pricing_grid.map((r, i) => i === ri ? { ...r, qty_tiers: [...r.qty_tiers, { min_qty: 1, price_cents: 10000 }] } : r) }))}
                          className="flex items-center gap-1 text-xs text-primary hover:underline">
                          <Plus className="w-3 h-3" /> Тир
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPrintModal(false)}>Скасувати</Button>
            <Button onClick={handleSavePrint} disabled={savingPrint}>{savingPrint ? "Збереження..." : "Зберегти"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirm ── */}
      <AlertDialog open={!!deleteTarget} onOpenChange={o => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Видалити?</AlertDialogTitle>
            <AlertDialogDescription>&ldquo;{deleteTarget?.name}&rdquo; буде видалено назавжди.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Скасувати</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={handleDelete}>Видалити</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
