"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Shirt, Palette, Layers, FolderTree, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useProductsData } from "../products/_components/useProductsData";
import { ProductsTab } from "../products/_components/ProductsTab";
import { CategoriesTab } from "../products/_components/CategoriesTab";
import ColorsTab from "./_components/ColorsTab";
import SizesTab from "./_components/SizesTab";

import { DashboardHeader } from "@/components/dashboard-header";

type CatalogTab = "products" | "categories" | "colors" | "sizes";

const TABS = [
  { key: "products", label: "Товари", icon: Shirt },
  { key: "categories", label: "Категорії", icon: FolderTree },
  { key: "colors", label: "Кольори", icon: Palette },
  { key: "sizes", label: "Розміри", icon: Layers },
] as const;

export default function CatalogPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tab = (searchParams.get("tab") || "products") as CatalogTab;

  const { products, categories, loading, refresh, refreshProducts } = useProductsData();

  const handleToggleActive = async (product: { id: string; is_active: boolean }) => {
    await fetch(`/api/products/${product.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !product.is_active }),
    });
    refreshProducts();
  };

  return (
    <div className="flex flex-1 h-0 flex-col overflow-hidden">
      <DashboardHeader
        title="Каталог"
        subtitle={
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <Shirt className="size-3.5" /> {products.length} товарів
            </span>
            <span className="flex items-center gap-1 text-muted-foreground/60">
              <FolderTree className="size-3.5" /> {categories.length} категорій
            </span>
          </div>
        }
        actions={
          tab === "products" ? (
            <Button
              size="sm"
              className="gap-1.5 shadow-sm hover:shadow-md transition-all active:scale-[0.98]"
              onClick={() => router.push("/products/new")}
            >
              <Plus className="size-4" />
              <span>Додати товар</span>
            </Button>
          ) : undefined
        }
      />



      <div className="flex-1 overflow-y-auto selection:bg-primary/10">
        <div className="mx-auto max-w-full">
          {tab === "products" && (
            <ProductsTab
              products={products}
              categories={categories}
              loading={loading}
              onRefresh={refreshProducts}
              onToggleActive={handleToggleActive}
            />
          )}
          {tab === "categories" && (
            <CategoriesTab categories={categories} onRefresh={refresh} loading={loading} />
          )}
          {tab === "colors" && <ColorsTab />}
          {tab === "sizes" && <SizesTab />}
        </div>
      </div>
    </div>
  );
}
