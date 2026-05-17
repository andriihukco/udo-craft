"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState } from "react";
import { Shirt, Palette, Layers, FolderTree, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { useProductsData } from "../products/_components/useProductsData";
import { ProductsTab } from "../products/_components/ProductsTab";
import { CategoriesTab } from "../products/_components/CategoriesTab";
import ColorsTab from "./_components/ColorsTab";
import SizesTab from "./_components/SizesTab";

type CatalogTab = "products" | "categories" | "colors" | "sizes";

import { DashboardHeader } from "@/components/dashboard-header";

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
    <div className="flex flex-1 h-0 flex-col overflow-hidden bg-muted/20">
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

      {/* Modern Tabs */}
      <div className="h-14 px-6 border-b border-border/40 shrink-0 flex items-center bg-background/30 backdrop-blur-md">
        <nav className="flex gap-1 bg-muted/50 p-1 rounded-xl border border-border/50">
          {TABS.map(({ key, icon: Icon, label }) => {
            const isActive = tab === key;
            return (
              <button
                key={key}
                onClick={() => router.push(`/catalog?tab=${key}`)}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                  isActive
                    ? "bg-background text-primary shadow-sm border border-border/50"
                    : "text-muted-foreground hover:text-foreground hover:bg-background/40"
                }`}
              >
                <Icon className={`size-3.5 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
                {label}
              </button>
            );
          })}
        </nav>
      </div>

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

