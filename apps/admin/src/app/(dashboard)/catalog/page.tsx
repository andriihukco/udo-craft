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

const TABS: { key: CatalogTab; icon: React.ElementType; label: string }[] = [
  { key: "products",   icon: Shirt,      label: "Товари" },
  { key: "categories", icon: FolderTree, label: "Категорії" },
  { key: "colors",     icon: Palette,    label: "Кольори" },
  { key: "sizes",      icon: Layers,     label: "Розміри" },
];

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
      <div className="px-4 pt-4 pb-2 shrink-0">
        <PageHeader
          title="Каталог"
          actions={
            tab === "products" ? (
              <Button size="sm" onClick={() => router.push("/products/new")}>
                <Plus className="w-3.5 h-3.5 mr-1" /> Додати товар
              </Button>
            ) : undefined
          }
        />
      </div>

      <div className="h-10 px-4 border-b border-border shrink-0 flex items-center gap-1">
        <nav className="flex h-full">
          {TABS.map(({ key, icon: Icon, label }) => (
            <a
              key={key}
              href={`/catalog?tab=${key}`}
              className={`flex items-center gap-1.5 px-3 h-full text-sm font-medium border-b-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset ${
                tab === key
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </a>
          ))}
        </nav>
      </div>

      <div className="flex-1 overflow-y-auto">
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
          <CategoriesTab categories={categories} onRefresh={refresh} />
        )}
        {tab === "colors" && <ColorsTab />}
        {tab === "sizes" && <SizesTab />}
      </div>
    </div>
  );
}
