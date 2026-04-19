"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import type { Product, Material, ProductColorVariant } from "@udo-craft/shared";
import { resolveProductImages, getCustomizableImages, getAllImages } from "@udo-craft/shared";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft, ArrowRight, ChevronLeft, ChevronRight, Minus, Plus, Loader2, Paintbrush, ShoppingBag, Check, Truck, Shield, RotateCcw, Ruler } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { ProductCardDetailed } from "@/components/ProductCardDetailed";
import { SizeChartModal } from "@/components/SizeChartModal";

// ── Types ─────────────────────────────────────────────────────────────────────

interface ProductWithMeta extends Omit<Product, "description"> {
  description?: string;
  category_id?: string | null;
  size_chart_id?: string | null;
  discount_grid?: { qty: number; discount_pct: number }[];
}

const SESSION_KEY = "client-order-draft";

function fmtPrice(cents: number) {
  return `₴${(cents / 100).toFixed(0)}`;
}

function getDiscount(grid: { qty: number; discount_pct: number }[] | undefined, qty: number) {
  if (!grid?.length) return 0;
  return [...grid].sort((a, b) => b.qty - a.qty).find((t) => qty >= t.qty)?.discount_pct ?? 0;
}

// ── Trust badges ──────────────────────────────────────────────────────────────

const TRUST_BADGES = [
  { icon: Truck,      label: "7–14 днів виробництво" },
  { icon: Shield,     label: "Гарантія якості" },
  { icon: RotateCcw,  label: "Від 10 одиниць" },
];

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const supabase = createClient();

  const [product, setProduct]           = useState<ProductWithMeta | null>(null);
  const [allProducts, setAllProducts]   = useState<ProductWithMeta[]>([]);
  const [variants, setVariants]         = useState<ProductColorVariant[]>([]);
  const [allVariants, setAllVariants]   = useState<ProductColorVariant[]>([]);
  const [materials, setMaterials]       = useState<Material[]>([]);
  const [loading, setLoading]           = useState(true);
  const [notFound, setNotFound]         = useState(false);

  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [selectedSize, setSelectedSize]           = useState<string | null>(null);
  const [quantity, setQuantity]                   = useState(1);
  const [activeImageKey, setActiveImageKey]       = useState<string>("front");
  const [imageKeys, setImageKeys]                 = useState<string[]>([]);
  const [added, setAdded]                         = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [{ data: prods }, { data: vars }, { data: mats }] = await Promise.all([
        supabase.from("products").select("*, discount_grid, category_id, size_chart_id").eq("is_active", true),
        supabase.from("product_color_variants").select("*").eq("is_active", true).order("sort_order"),
        supabase.from("materials").select("*").eq("is_active", true),
      ]);

      const prodList = (prods ?? []) as ProductWithMeta[];
      const prod = prodList.find((p) => p.slug === slug || p.id === slug);
      if (!prod) { setNotFound(true); setLoading(false); return; }

      const prodVariants = (vars ?? []).filter((v: ProductColorVariant) => v.product_id === prod.id);
      setProduct(prod);
      setAllProducts(prodList);
      setVariants(prodVariants);
      setAllVariants((vars ?? []) as ProductColorVariant[]);
      setMaterials((mats ?? []) as Material[]);

      const firstVariant = prodVariants[0] ?? null;
      setSelectedVariantId(firstVariant?.id ?? null);
      setSelectedSize(null);
      setQuantity(1);

      const allImgs = resolveProductImages((prod as any).product_images, prod.images as Record<string, string>);
      const keys = allImgs.sort((a, b) => a.sort_order - b.sort_order).map((i) => i.key);
      setImageKeys(keys);
      setActiveImageKey(keys[0] ?? "front");
      setLoading(false);
    };
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  const selectedVariant = variants.find((v) => v.id === selectedVariantId) ?? null;

  const productImgArr = product
    ? resolveProductImages((product as any).product_images, product.images as Record<string, string>)
    : [];
  const variantImgArr = selectedVariant
    ? resolveProductImages((selectedVariant as any).variant_images, selectedVariant.images as Record<string, string>)
    : null;
  const activeImgArr  = variantImgArr?.length ? variantImgArr : productImgArr;
  const currentImages = getAllImages(activeImgArr);
  const activeImageUrl = currentImages[activeImageKey] ?? Object.values(currentImages)[0] ?? "";

  const colorDots = variants.map((v) => {
    const mat = materials.find((m) => m.id === v.material_id);
    return { id: v.id, name: mat?.name ?? "—", hex: mat?.hex_code ?? "#ccc" };
  });

  const sizes          = product?.available_sizes ?? [];
  const discountPct    = getDiscount(product?.discount_grid, quantity);
  const unitCents      = product?.base_price_cents ?? 0;
  const discountedCents = Math.round(unitCents * (1 - discountPct / 100));
  const totalCents     = discountedCents * quantity;

  // Similar products — same category, exclude current
  const similarProducts = allProducts
    .filter((p) => p.id !== product?.id && p.category_id === product?.category_id && p.is_active)
    .slice(0, 4);

  const prevImage = () => {
    const idx = imageKeys.indexOf(activeImageKey);
    setActiveImageKey(imageKeys[(idx - 1 + imageKeys.length) % imageKeys.length]);
  };
  const nextImage = () => {
    const idx = imageKeys.indexOf(activeImageKey);
    setActiveImageKey(imageKeys[(idx + 1) % imageKeys.length]);
  };

  const handleAddToCart = useCallback(() => {
    if (!product) return;
    const size  = selectedSize ?? sizes[Math.floor(sizes.length / 2)] ?? "";
    const color = materials.find((m) => m.id === selectedVariant?.material_id)?.name ?? "Стандарт";
    const vImgs = selectedVariant ? resolveProductImages((selectedVariant as any).variant_images, selectedVariant.images as Record<string, string>) : null;
    const pImgs = resolveProductImages((product as any).product_images, product.images as Record<string, string>);
    const resolvedImgs = getCustomizableImages(vImgs?.length ? vImgs : pImgs);
    const productImage = resolvedImgs.front ?? Object.values(resolvedImgs)[0] ?? "";

    const cartItem = {
      productId: product.id, productName: product.name, productImage,
      productPrice: product.base_price_cents, unitPriceCents: discountedCents,
      printCostCents: 0, quantity, size, color, layers: [],
    };
    try {
      const raw   = sessionStorage.getItem(SESSION_KEY);
      const draft = raw ? JSON.parse(raw) : { step: "select", contact: {}, cart: [] };
      draft.cart  = [...(draft.cart ?? []), cartItem];
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(draft));
    } catch { /* quota */ }
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }, [product, selectedSize, selectedVariant, materials, quantity, discountedCents, sizes]);

  const handleCustomize = useCallback(() => {
    if (!product) return;
    const size  = selectedSize ?? sizes[Math.floor(sizes.length / 2)] ?? "";
    const color = materials.find((m) => m.id === selectedVariant?.material_id)?.name ?? "";
    const params = new URLSearchParams({ product: product.slug || product.id, customize: "1" });
    if (size)                params.set("size", size);
    if (color)               params.set("color", color);
    if (selectedVariant?.id) params.set("variant", selectedVariant.id);
    router.push(`/order?${params.toString()}`);
  }, [product, selectedSize, selectedVariant, materials, sizes, router]);

  // ── Loading / not found ───────────────────────────────────────────────────

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

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SiteHeader />

      {/* Page load fade-in */}
      <motion.div initial={{ opacity: 1 }} animate={{ opacity: 0 }} transition={{ duration: 0.4, delay: 0.1 }}
        className="fixed inset-0 bg-white z-[100] pointer-events-none" />

      <main className="flex-1 pt-24">

        {/* ── Breadcrumb ─────────────────────────────────────────────────── */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-4">
          <nav className="flex items-center gap-1.5 text-xs text-muted-foreground" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-foreground transition-colors">Головна</Link>
            <span aria-hidden="true">/</span>
            <Link href="/#collections" className="hover:text-foreground transition-colors">Каталог</Link>
            <span aria-hidden="true">/</span>
            <span className="text-foreground font-medium truncate">{product.name}</span>
          </nav>
        </div>

        {/* ── Product grid ───────────────────────────────────────────────── */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-16">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-start">

            {/* LEFT — gallery */}
            <div className="flex flex-col gap-3 lg:sticky lg:top-24">
              {/* Main image */}
              <div className="relative aspect-square bg-[#f5f5f5] rounded-3xl overflow-hidden group">
                <AnimatePresence mode="wait">
                  <motion.img
                    key={activeImageKey + selectedVariantId}
                    src={activeImageUrl}
                    alt={product.name}
                    className="absolute inset-0 w-full h-full object-contain p-8"
                    initial={{ opacity: 0, scale: 1.02 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25 }}
                  />
                </AnimatePresence>

                {imageKeys.length > 1 && (
                  <>
                    <button onClick={prevImage} aria-label="Попереднє фото"
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-md hover:bg-white hover:scale-105 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button onClick={nextImage} aria-label="Наступне фото"
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-md hover:bg-white hover:scale-105 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </>
                )}

                {/* Image counter pill */}
                {imageKeys.length > 1 && (
                  <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-full bg-black/30 backdrop-blur-sm text-white text-[10px] font-semibold">
                    {imageKeys.indexOf(activeImageKey) + 1} / {imageKeys.length}
                  </div>
                )}
              </div>

              {/* Thumbnails */}
              {imageKeys.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                  {imageKeys.map((key) => (
                    <button key={key} onClick={() => setActiveImageKey(key)}
                      aria-label={`Фото ${key}`} aria-pressed={activeImageKey === key}
                      className={`shrink-0 w-16 h-16 rounded-xl overflow-hidden bg-[#f5f5f5] border-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                        activeImageKey === key ? "border-primary shadow-sm" : "border-transparent hover:border-border"
                      }`}>
                      <img src={currentImages[key]} alt={key} className="w-full h-full object-contain p-1" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* RIGHT — product info */}
            <div className="flex flex-col gap-6">

              {/* Name + price */}
              <div>
                <h1 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight">{product.name}</h1>
                <div className="flex items-baseline gap-3 mt-3">
                  <span className="text-3xl font-black text-primary">{fmtPrice(discountedCents)}</span>
                  {discountPct > 0 && (
                    <>
                      <span className="text-base text-muted-foreground line-through">{fmtPrice(unitCents)}</span>
                      <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">-{discountPct}%</span>
                    </>
                  )}
                </div>
                {quantity > 1 && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Разом: <span className="font-semibold text-foreground">{fmtPrice(totalCents)}</span> за {quantity} шт
                  </p>
                )}
              </div>

              {/* Color */}
              {colorDots.length > 0 && (
                <div className="space-y-2.5">
                  <p className="text-sm font-semibold">
                    Колір:{" "}
                    <span className="text-muted-foreground font-normal">
                      {materials.find((m) => m.id === selectedVariant?.material_id)?.name ?? "—"}
                    </span>
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    {colorDots.map((c) => (
                      <button key={c.id}
                        onClick={() => {
                          setSelectedVariantId(c.id);
                          const v = variants.find((vv) => vv.id === c.id);
                          const vImgs = resolveProductImages((v as any)?.variant_images, v?.images as Record<string, string>);
                          const pImgs = resolveProductImages((product as any).product_images, product.images as Record<string, string>);
                          const allImgs = getAllImages(vImgs.length ? vImgs : pImgs);
                          const keys = Object.keys(allImgs);
                          setImageKeys(keys);
                          setActiveImageKey(keys[0] ?? "front");
                        }}
                        aria-label={c.name} aria-pressed={selectedVariantId === c.id}
                        title={c.name}
                        className={`w-7 h-7 rounded-full shrink-0 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                          selectedVariantId === c.id
                            ? "ring-2 ring-offset-1 ring-foreground scale-110"
                            : "ring-1 ring-border hover:ring-foreground/40 hover:scale-105"
                        }`}
                        style={{ backgroundColor: c.hex }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Size */}
              {sizes.length > 0 && (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold">Розмір</p>
                    {product.size_chart_id && (
                      <SizeChartModal chartId={product.size_chart_id} />
                    )}
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {sizes.map((s) => (
                      <button key={s}
                        onClick={() => setSelectedSize(s === selectedSize ? null : s)}
                        aria-pressed={selectedSize === s}
                        className={`min-w-[48px] h-10 px-4 rounded-lg border text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                          selectedSize === s
                            ? "bg-foreground text-background border-foreground"
                            : "border-border hover:border-foreground/40 text-foreground hover:bg-muted"
                        }`}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quantity */}
              <div className="space-y-2.5">
                <p className="text-sm font-semibold">Кількість</p>
                <div className="flex items-center gap-2">
                  <button onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    aria-label="Зменшити кількість"
                    className="w-10 h-10 rounded-lg border border-border flex items-center justify-center hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-12 text-center font-bold text-lg" aria-live="polite">{quantity}</span>
                  <button onClick={() => setQuantity((q) => q + 1)}
                    aria-label="Збільшити кількість"
                    className="w-10 h-10 rounded-lg border border-border flex items-center justify-center hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    <Plus className="w-4 h-4" />
                  </button>
                  {quantity >= 10 && (
                    <span className="text-xs text-emerald-600 font-semibold bg-emerald-50 px-2.5 py-1 rounded-lg">
                      Знижка {discountPct > 0 ? `-${discountPct}%` : "доступна"}
                    </span>
                  )}
                </div>
              </div>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button onClick={handleCustomize}
                  className="flex-1 inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white font-bold text-sm px-6 py-3.5 rounded-lg active:scale-95 transition-all duration-200 shadow-md hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <Paintbrush className="w-4 h-4" />
                  Додати принт
                </button>
                <button onClick={handleAddToCart}
                  className="flex-1 inline-flex items-center justify-center gap-2 border-2 border-primary text-primary hover:bg-primary/5 font-bold text-sm px-6 py-3.5 rounded-lg active:scale-95 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <AnimatePresence mode="wait" initial={false}>
                    {added ? (
                      <motion.span key="added" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }}
                        className="flex items-center gap-2">
                        <Check className="w-4 h-4" /> Додано до кошика
                      </motion.span>
                    ) : (
                      <motion.span key="add" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                        className="flex items-center gap-2">
                        <ShoppingBag className="w-4 h-4" /> Без принту
                      </motion.span>
                    )}
                  </AnimatePresence>
                </button>
              </div>

              {/* Trust badges */}
              <div className="grid grid-cols-3 gap-3 pt-1">
                {TRUST_BADGES.map(({ icon: Icon, label }) => (
                  <div key={label} className="flex flex-col items-center gap-1.5 p-3 rounded-lg bg-muted/50 text-center">
                    <Icon className="w-4 h-4 text-primary" strokeWidth={1.5} />
                    <span className="text-[10px] font-medium text-muted-foreground leading-tight">{label}</span>
                  </div>
                ))}
              </div>

              {/* Description */}
              {product.description && (
                <div className="pt-1 border-t border-border">
                  <p className="text-sm text-muted-foreground leading-relaxed">{product.description}</p>
                </div>
              )}

              {/* Discount tiers */}
              {product.discount_grid && product.discount_grid.length > 0 && (
                <div className="rounded-lg bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 p-4 space-y-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">Оптові знижки</p>
                  <div className="space-y-1.5">
                    {product.discount_grid.map((tier) => (
                      <div key={tier.qty} className="flex items-center justify-between text-sm">
                        <span className="text-emerald-800/70">від {tier.qty} шт</span>
                        <span className="font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-lg text-xs">-{tier.discount_pct}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Back link */}
              <Link href="/#collections"
                className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit">
                <ArrowLeft className="w-3.5 h-3.5" />
                Повернутись до каталогу
              </Link>
            </div>
          </div>
        </div>

        {/* ── CTA banner ─────────────────────────────────────────────────── */}
        <div className="bg-primary">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div>
              <p className="text-white font-black text-xl sm:text-2xl">Потрібен корпоративний тираж?</p>
              <p className="text-white/70 text-sm mt-1">Від 10 одиниць · Знижки до 15% · Доставка по Україні</p>
            </div>
            <Link href="/#contact"
              className="shrink-0 inline-flex items-center gap-2 bg-white text-primary font-bold text-sm px-7 py-3.5 rounded-full hover:bg-white/90 active:scale-95 transition-all duration-200 shadow-lg">
              Обговорити проєкт
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* ── Similar products ────────────────────────────────────────────── */}
        {similarProducts.length > 0 && (
          <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-black tracking-tight">Схожі товари</h2>
                <p className="text-sm text-muted-foreground mt-1">Вам також може сподобатись</p>
              </div>
              <Link href="/#collections"
                className="hidden sm:inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary/80 transition-colors">
                Весь каталог <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {similarProducts.map((p) => (
                <ProductCardDetailed
                  key={p.id}
                  product={p as Product}
                  colorVariants={allVariants.filter((v) => v.product_id === p.id)}
                  materials={materials}
                />
              ))}
            </div>
          </section>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
