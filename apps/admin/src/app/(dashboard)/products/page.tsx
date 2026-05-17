"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Shirt, FolderTree, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DashboardPage } from "@/components/dashboard-page";
import { useProductsData } from "./_components/useProductsData";
import { ProductsTab } from "./_components/ProductsTab";
import { CategoriesTab } from "./_components/CategoriesTab";

// ── Types ─────────────────────────────────────────────────────────────────────

type Tab = "products" | "categories";

const TABS: { key: Tab; icon: React.ElementType; label: string }[] = [
  { key: "products",   icon: Shirt,      label: "Товари" },
  { key: "categories", icon: FolderTree, label: "Категорії" },
];

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ProductsPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("products");

  const {
    products,
    categories,
    loading,
    refresh,
    refreshProducts,
  } = useProductsData();

  const handleToggleActive = async (product: { id: string; is_active: boolean }) => {
    await fetch(`/api/products/${product.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !product.is_active }),
    });
    refreshProducts();
  };

  const tabs = (
    <nav className="flex h-full">
      {TABS.map(({ key, icon: Icon, label }) => (
        <button
          key={key}
          onClick={() => setTab(key)}
          className={`flex items-center gap-1.5 px-3 h-full text-sm font-medium border-b-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset ${
            tab === key
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Icon className="w-3.5 h-3.5" />
          {label}
        </button>
      ))}
    </nav>
  );

  return (
    <DashboardPage
      title="Товари"
      tabs={tabs}
      actions={
        tab === "products" ? (
          <Button size="sm" onClick={() => router.push("/products/new")}>
            <Plus className="w-3.5 h-3.5 mr-1" /> Додати товар
          </Button>
        ) : undefined
      }
    >
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
          <CategoriesTab
            categories={categories}
            onRefresh={refresh}
          />
        )}
    </DashboardPage>
  );
}
