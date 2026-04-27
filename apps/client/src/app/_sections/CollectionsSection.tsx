"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Product, Material, ProductColorVariant } from "@udo-craft/shared";
import { ProductCardDetailed } from "@/components/ProductCardDetailed";

interface Category {
  id: string;
  name: string;
  slug: string;
  sort_order: number;
  is_active: boolean;
  image_url?: string | null;
}

interface ProductWithCategory extends Product {
  category_id?: string | null;
}

interface CollectionsSectionProps {
  products: ProductWithCategory[];
  categories: Category[];
  materials: Material[];
  colorVariants: ProductColorVariant[];
}

export function CollectionsSection({
  products,
  categories,
  materials,
  colorVariants,
}: CollectionsSectionProps) {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [collPage, setCollPage] = useState(0);
  const [collPerPage, setCollPerPage] = useState(2);

  useEffect(() => {
    const update = () => setCollPerPage(window.innerWidth >= 1024 ? 4 : 2);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  useEffect(() => {
    setCollPage(0);
  }, [activeCategory, collPerPage]);

  const hasCatalog = categories.length > 0;
  const activeItems =
    activeCategory === null
      ? products.filter((p) => p.is_active)
      : products.filter((p) => p.category_id === activeCategory && p.is_active);

  const kw = ["футболк", "худі", "лонгслів", "shirt", "hoodie", "longsleeve", "tee", "polo"];
  const clothingList =
    products.filter((p) => kw.some((k) => p.name.toLowerCase().includes(k))).length > 0
      ? products.filter((p) => kw.some((k) => p.name.toLowerCase().includes(k)))
      : products;

  const totalPages = Math.ceil(activeItems.length / collPerPage);
  const pageItems = activeItems.slice(collPage * collPerPage, (collPage + 1) * collPerPage);

  return (
    <section id="collections" className="py-20 sm:py-28 bg-background">
      {/* Sticky header */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b border-border/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between py-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary mb-0.5">
                Каталог
              </p>
              <h2 className="text-2xl font-black tracking-tight">Колекції</h2>
            </div>
            <Link
              href="/order"
              className="flex items-center gap-1.5 text-sm font-semibold text-primary hover:gap-2.5 transition-all duration-200"
            >
              Всі товари <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {hasCatalog && (
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-4">
              <button
                onClick={() => { setActiveCategory(null); setCollPage(0); }}
                className={`flex items-center whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-semibold transition-all border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  activeCategory === null
                    ? "bg-primary text-white border-primary"
                    : "bg-background text-muted-foreground border-border hover:border-foreground/30"
                }`}
              >
                Всі
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => { setActiveCategory(cat.id); setCollPage(0); }}
                  className={`flex items-center gap-1.5 whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-semibold transition-all border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                    activeCategory === cat.id
                      ? "bg-primary text-white border-primary"
                      : "bg-background text-muted-foreground border-border hover:border-foreground/30"
                  }`}
                >
                  {cat.image_url && (
                    <img src={cat.image_url} alt="" className="w-4 h-4 rounded-full object-cover" />
                  )}
                  {cat.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-8">
        {hasCatalog ? (
          activeItems.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-4xl mb-4">🧺</p>
              <p className="text-muted-foreground text-sm font-medium">
                У цій категорії поки немає товарів
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
                {pageItems.map((item) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <ProductCardDetailed
                      product={item}
                      colorVariants={colorVariants.filter((v) => v.product_id === item.id)}
                      materials={materials}
                      onAddWithoutPrint={(product, size, color, variant) => {
                        const params = new URLSearchParams({
                          product: product.slug || product.id,
                          add: "1",
                        });
                        if (size) params.set("size", size);
                        if (color) params.set("color", color);
                        if (variant?.id) params.set("variant", variant.id);
                        router.push(`/order?${params.toString()}`);
                      }}
                    />
                  </motion.div>
                ))}
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-4 mt-12">
                  <button
                    onClick={() => setCollPage((p) => Math.max(0, p - 1))}
                    disabled={collPage === 0}
                    className="w-9 h-9 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground/40 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    aria-label="Попередня сторінка"
                  >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M9 11L5 7l4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                  <div className="flex items-center gap-2">
                    {Array.from({ length: totalPages }).map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setCollPage(i)}
                        aria-label={`Сторінка ${i + 1}`}
                        className="transition-all duration-300 rounded-full"
                        style={{
                          width: i === collPage ? 24 : 8,
                          height: 8,
                          backgroundColor:
                            i === collPage
                              ? "var(--color-primary)"
                              : "var(--color-border)",
                        }}
                      />
                    ))}
                  </div>
                  <button
                    onClick={() => setCollPage((p) => Math.min(totalPages - 1, p + 1))}
                    disabled={collPage === totalPages - 1}
                    className="w-9 h-9 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground/40 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    aria-label="Наступна сторінка"
                  >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </div>
              )}
            </>
          )
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {clothingList.slice(0, collPerPage).map((p) => (
              <ProductCardDetailed
                key={p.id}
                product={p}
                onAddWithoutPrint={(product) => {
                  const params = new URLSearchParams({
                    product: product.slug || product.id,
                    add: "1",
                  });
                  router.push(`/order?${params.toString()}`);
                }}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
