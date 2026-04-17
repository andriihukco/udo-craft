"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import type { Product, Material, ProductColorVariant } from "@udo-craft/shared";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft, ArrowRight, ChevronLeft, ChevronRight, Minus, Plus, Loader2, Paintbrush, ShoppingBag } from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface ProductWithMeta extends Product {
  category_id?: string | null;
  size_chart_id?: string | null;
  discount_grid?: { qty: number; discount_pct: number }[];
  description?: string;
}

const SESSION_KEY = "client-order-draft";

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtPrice(cents: number) {
  return `₴${(cents / 100).toFixed(0)}`;
}

function getDiscount(grid: { qty: number; discount_pct: number }[] | undefined, qty: number) {
  if (!grid?.length) return 0;
  return [...grid].sort((a, b) => b.qty - a.qty).find((t) => qty >= t.qty)?.discount_pct ?? 0;
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const supabase = createClient();

  const [product, setProduct] = useState<ProductWithMeta | null>(null);
  const [variants, setVariants] = useState<ProductColorVariant[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Selection state
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [activeImageKey, setActiveImageKey] = useState<string>("front");
  const [imageKeys, setImageKeys] = useState<string[]>([]);
  const [added, setAdded] = useState(false);

  // Load product
  useEffect(() => {
    const load = async () => {
      const [{ data: prods }, { data: vars }, { data: mats }] = await Promise.all([
        supabase.from("products").select("*, discount_grid, category_id, size_chart_id").eq("is_active", true),
        supabase.from("product_color_variants").select("*").eq("is_active", true).order("sort_order"),
        supabase.from("materials").select("*").eq("is_active", true),
      ]);

      const prod = (prods ?? []).find((p: ProductWithMeta) => p.slug === slug || p.id === slug) as ProductWithMeta | undefined;
      if (!prod) { setNotFound(true); setLoading(false); return; }

      const prodVariants = (vars ?? []).filter((v: ProductColorVariant) => v.product_id === prod.id);
      setProduct(prod);
      setVariants(prodVariants);
      setMaterials((mats ?? []) as Material[]);

      const firstVariant = prodVariants[0] ?? null;
      setSelectedVariantId(firstVariant?.id ?? null);

      const imgs = firstVariant?.images && Object.keys(firstVariant.images).length > 0
        ? firstVariant.images as Record<string, string>
        : (prod.images ?? {}) as Record<string, string>;
      const keys = Object.keys(imgs);
      setImageKeys(keys);
      setActiveImageKey(keys[0] ?? "front");

      setLoading(false);
    };
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  const selectedVariant = variants.find((v) => v.id === selectedVariantId) ?? null;
  const currentImages = (
    selectedVariant?.images && Object.keys(selectedVariant.images).length > 0
      ? selectedVariant.images
      : product?.images ?? {}
  ) as Record<string, string>;

  const activeImageUrl = currentImages[activeImageKey] ?? Object.values(currentImages)[0] ?? "";

  const colorDots = variants.map((v) => {
    const mat = materials.find((m) => m.id === v.material_id);
    return { id: v.id, name: mat?.name ?? "—", hex: mat?.hex_code ?? "#ccc" };
  });

  const sizes = product?.available_sizes ?? [];
  const discountPct = getDiscount(product?.discount_grid, quantity);
  const unitCents = product?.base_price_cents ?? 0;
  const discountedCents = Math.round(unitCents * (1 - discountPct / 100));
  const totalCents = discountedCents * quantity;

  // Navigate images
  const prevImage = () => {
    const idx = imageKeys.indexOf(activeImageKey);
    setActiveImageKey(imageKeys[(idx - 1 + imageKeys.length) % imageKeys.length]);
  };
  const nextImage = () => {
    const idx = imageKeys.indexOf(activeImageKey);
    setActiveImageKey(imageKeys[(idx + 1) % imageKeys.length]);
  };

  // Add to cart (no print)
  const handleAddToCart = useCallback(() => {
    if (!product) return;
    const size = selectedSize ?? sizes[Math.floor(sizes.length / 2)] ?? "";
    const color = materials.find((m) => m.id === selectedVariant?.material_id)?.name ?? "Стандарт";
    const variantImages = selectedVariant?.images && Object.keys(selectedVariant.images).length > 0
      ? selectedVariant.images as Record<string, string> : null;
    const productImage = variantImages?.front ?? (variantImages ? Object.values(variantImages)[0] : null)
      ?? (product.images as Record<string, string>)?.front ?? Object.values(product.images ?? {})[0] ?? "";

    const cartItem = {
      productId: product.id, productName: product.name, productImage,
      productPrice: product.base_price_cents, unitPriceCents: discountedCents,
      printCostCents: 0, quantity, size, color, layers: [],
    };

    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      const draft = raw ? JSON.parse(raw) : { step: "select", contact: {}, cart: [] };
      draft.cart = [...(draft.cart ?? []), cartItem];
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(draft));
    } catch { /* quota */ }

    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }, [product, selectedSize, selectedVariant, materials, quantity, discountedCents, sizes]);

  // Go to customizer
  const handleCustomize = useCallback(() => {
    if (!product) return;
    const size = selectedSize ?? sizes[Math.floor(sizes.length / 2)] ?? "";
    const color = materials.find((m) => m.id === selectedVariant?.material_id)?.name ?? "";
    const params = new URLSearchParams({ product: product.slug || product.id, customize: "1" });
    if (size) params.set("size", size);
    if (color) params.set("color", color);
    if (selectedVariant?.id) params.set("variant", selectedVariant.id);
    router.push(`/order?${params.toString()}`);
  }, [product, selectedSize, selectedVariant, materials, sizes, router]);

  // ── Render ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  if (notFound || !product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-center px-4">
        <p className="text-2xl font-bold">Товар не знайдено</p>
        <Link href="/#collections" className="text-primary underline text-sm">← Повернутись до каталогу</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Breadcrumb */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 pb-2">
        <nav className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Link href="/" className="hover:text-foreground transition-colors">Головна</Link>
          <span>/</span>
          <Link href="/#collections" className="hover:text-foreground transition-colors">Каталог</Link>
          <span>/</span>
          <span className="text-foreground font-medium truncate">{product.name}</span>
        </nav>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 lg:py-10">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-start">

          {/* ── Left: Image gallery ─────────────────────────────────────── */}
          <div className="flex flex-col gap-3">
            {/* Main image */}
            <div className="relative aspect-square bg-[#f5f5f5] rounded-2xl overflow-hidden group">
              <AnimatePresence mode="wait">
                <motion.img
                  key={activeImageKey + selectedVariantId}
                  src={activeImageUrl}
                  alt={product.name}
                  className="absolute inset-0 w-full h-full object-contain p-6"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                />
              </AnimatePresence>

              {imageKeys.length > 1 && (
                <>
                  <button onClick={prevImage}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:bg-white">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button onClick={nextImage}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:bg-white">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>

            {/* Thumbnails */}
            {imageKeys.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {imageKeys.map((key) => (
                  <button key={key} onClick={() => setActiveImageKey(key)}
                    className={`shrink-0 w-16 h-16 rounded-xl overflow-hidden bg-[#f5f5f5] border-2 transition-colors ${
                      activeImageKey === key ? "border-primary" : "border-transparent hover:border-gray-200"
                    }`}>
                    <img src={currentImages[key]} alt={key} className="w-full h-full object-contain p-1" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── Right: Product info ─────────────────────────────────────── */}
          <div className="flex flex-col gap-5">
            {/* Name + price */}
            <div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight">{product.name}</h1>
              <div className="flex items-baseline gap-3 mt-2">
                <span className="text-2xl font-bold text-primary">{fmtPrice(discountedCents)}</span>
                {discountPct > 0 && (
                  <>
                    <span className="text-sm text-muted-foreground line-through">{fmtPrice(unitCents)}</span>
                    <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">-{discountPct}%</span>
                  </>
                )}
              </div>
              {quantity > 1 && (
                <p className="text-xs text-muted-foreground mt-1">Разом: {fmtPrice(totalCents)} за {quantity} шт</p>
              )}
            </div>

            {/* Color */}
            {colorDots.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">
                  Колір: <span className="text-muted-foreground font-normal">
                    {materials.find((m) => m.id === selectedVariant?.material_id)?.name ?? "—"}
                  </span>
                </p>
                <div className="flex gap-2 flex-wrap">
                  {colorDots.map((c) => (
                    <button key={c.id} onClick={() => {
                      setSelectedVariantId(c.id);
                      const v = variants.find((v) => v.id === c.id);
                      const imgs = v?.images && Object.keys(v.images).length > 0
                        ? v.images as Record<string, string>
                        : (product.images ?? {}) as Record<string, string>;
                      const keys = Object.keys(imgs);
                      setImageKeys(keys);
                      setActiveImageKey(keys[0] ?? "front");
                    }}
                      title={c.name}
                      className={`w-8 h-8 rounded-full border-2 transition-all ${
                        selectedVariantId === c.id ? "border-primary scale-110 shadow-md" : "border-transparent hover:border-gray-300"
                      }`}
                      style={{ backgroundColor: c.hex }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Size */}
            {sizes.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Розмір</p>
                <div className="flex gap-2 flex-wrap">
                  {sizes.map((s) => (
                    <button key={s} onClick={() => setSelectedSize(s === selectedSize ? null : s)}
                      className={`min-w-[44px] h-10 px-3 rounded-lg border text-sm font-medium transition-all ${
                        selectedSize === s
                          ? "border-primary bg-primary text-white"
                          : "border-border hover:border-primary/50 text-foreground"
                      }`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div className="space-y-2">
              <p className="text-sm font-medium">Кількість</p>
              <div className="flex items-center gap-3">
                <button onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="w-10 h-10 rounded-lg border border-border flex items-center justify-center hover:bg-muted transition-colors">
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-10 text-center font-semibold text-lg">{quantity}</span>
                <button onClick={() => setQuantity((q) => q + 1)}
                  className="w-10 h-10 rounded-lg border border-border flex items-center justify-center hover:bg-muted transition-colors">
                  <Plus className="w-4 h-4" />
                </button>
                {quantity >= 10 && (
                  <span className="text-xs text-muted-foreground">від 10 шт — знижки</span>
                )}
              </div>
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3 pt-1">
              <button onClick={handleCustomize}
                className="flex-1 inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white font-bold text-sm px-6 py-3.5 rounded-full active:scale-95 transition-all duration-200">
                <Paintbrush className="w-4 h-4" />
                Кастомізувати
                <ArrowRight className="w-4 h-4" />
              </button>
              <button onClick={handleAddToCart}
                className="flex-1 inline-flex items-center justify-center gap-2 border-2 border-primary text-primary hover:bg-primary/5 font-bold text-sm px-6 py-3.5 rounded-full active:scale-95 transition-all duration-200">
                <AnimatePresence mode="wait" initial={false}>
                  {added ? (
                    <motion.span key="added" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }}
                      className="flex items-center gap-2">
                      ✓ Додано
                    </motion.span>
                  ) : (
                    <motion.span key="add" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                      className="flex items-center gap-2">
                      <ShoppingBag className="w-4 h-4" />
                      Без принту
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>
            </div>

            {/* Description */}
            {product.description && (
              <div className="pt-2 border-t border-border">
                <p className="text-sm text-muted-foreground leading-relaxed">{product.description}</p>
              </div>
            )}

            {/* Discount tiers */}
            {product.discount_grid && product.discount_grid.length > 0 && (
              <div className="rounded-xl bg-muted/50 p-4 space-y-1.5">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Оптові знижки</p>
                {product.discount_grid.map((tier) => (
                  <div key={tier.qty} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">від {tier.qty} шт</span>
                    <span className="font-semibold text-emerald-600">-{tier.discount_pct}%</span>
                  </div>
                ))}
              </div>
            )}

            {/* Back link */}
            <Link href="/#collections"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mt-2">
              <ArrowLeft className="w-3.5 h-3.5" />
              Повернутись до каталогу
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
