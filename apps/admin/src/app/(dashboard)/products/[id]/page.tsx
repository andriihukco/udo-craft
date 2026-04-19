"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { Loader2, ArrowLeft, Trash2, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink,
  BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ProductForm, type ProductFormData } from "../_components/ProductForm";
import type { ProductImage } from "@udo-craft/shared";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Product {
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
  product_images?: ProductImage[];
}

interface Category { id: string; name: string; slug: string; is_active: boolean; sort_order: number; }
interface SizeChart { id: string; name: string; rows: Record<string, string>[]; }
interface PrintArea { id: string; name: string; label: string; }

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ProductDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [sizeCharts, setSizeCharts] = useState<SizeChart[]>([]);
  const [printAreas, setPrintAreas] = useState<PrintArea[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  // ── Fetch data ─────────────────────────────────────────────────────────────

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [productRes, categoriesRes, sizeChartsRes, printAreasRes] = await Promise.all([
        fetch(`/api/products/${id}`),
        fetch("/api/categories"),
        fetch("/api/size-charts"),
        fetch("/api/print-areas"),
      ]);

      if (!productRes.ok) {
        toast.error("Товар не знайдено");
        router.push("/products");
        return;
      }

      const [productData, categoriesData, sizeChartsData, printAreasData] = await Promise.all([
        productRes.json(),
        categoriesRes.ok ? categoriesRes.json() : [],
        sizeChartsRes.ok ? sizeChartsRes.json() : [],
        printAreasRes.ok ? printAreasRes.json() : [],
      ]);

      setProduct(productData);
      setCategories(categoriesData);
      setSizeCharts(sizeChartsData);
      setPrintAreas(printAreasData);
    } catch {
      toast.error("Помилка завантаження");
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Unsaved changes — browser unload ──────────────────────────────────────

  useEffect(() => {
    if (!isDirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  // ── Save ───────────────────────────────────────────────────────────────────

  const handleSave = async (data: ProductFormData) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Помилка збереження");
      }
      const updated = await res.json();
      setProduct(updated);
      setIsDirty(false);
      toast.success("Товар збережено");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Помилка збереження");
    } finally {
      setSaving(false);
    }
  };

  // ── Delete ─────────────────────────────────────────────────────────────────

  const handleDeleteConfirm = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Помилка видалення");
      toast.success("Товар видалено");
      setIsDirty(false);
      router.push("/products");
    } catch {
      toast.error("Помилка видалення");
      setDeleting(false);
    }
  };

  // ── Trigger form submit ────────────────────────────────────────────────────

  const triggerSave = () => {
    document.getElementById("product-form-submit")?.click();
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!product) return null;

  return (
    <div className="flex flex-col flex-1 h-0 overflow-hidden">
      {/* Header */}
      <div className="shrink-0 px-4 md:px-6 py-3 border-b border-border bg-background">
        <div className="flex items-center justify-between gap-4">
          {/* Left: back + breadcrumb */}
          <div className="flex items-center gap-3 min-w-0">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={() => router.push("/catalog?tab=products")}
              aria-label="Назад"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink
                    render={<button onClick={() => router.push("/catalog?tab=products")} />}
                    className="text-xs"
                  >
                    Каталог
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage className="text-xs truncate max-w-[200px]">
                    {product.name}
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>

          {/* Right: actions */}
          <div className="flex items-center gap-2 shrink-0">
            {isDirty && (
              <span className="text-xs text-amber-600 font-medium hidden sm:block">Незбережені зміни</span>
            )}
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
              onClick={() => setShowDeleteDialog(true)}
              disabled={deleting}
            >
              {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline ml-1">Видалити</span>
            </Button>
            <Button size="sm" className="h-8 text-xs" onClick={triggerSave} disabled={saving}>
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              <span className="ml-1">Зберегти</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Title */}
      <div className="shrink-0 px-4 md:px-6 pt-5 pb-3">
        <h1 className="text-2xl font-bold tracking-tight">{product.name}</h1>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-4 md:px-6 pb-8">
        <ProductForm
          product={product}
          categories={categories}
          sizeCharts={sizeCharts}
          printAreas={printAreas}
          onSave={handleSave}
          onChange={() => setIsDirty(true)}
          saving={saving}
        />
      </div>

      {/* Delete confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Видалити товар?</AlertDialogTitle>
            <AlertDialogDescription>
              Ця дія незворотна. Товар «{product.name}» буде видалено разом із усіма варіантами кольорів.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Скасувати</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
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
