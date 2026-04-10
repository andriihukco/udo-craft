"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef, useCallback } from "react";
import { Product, Material, ProductColorVariant } from "@udo-craft/shared";
import { ContactForm } from "@/components/ContactForm";
import { ProductCardDetailed } from "@/components/ProductCardDetailed";
import { MockupViewer } from "@/components/MockupViewer";
import { BrandLogoFull } from "@/components/brand-logo";
import { createClient } from "@/lib/supabase/client";
import { Loader2, User, ShoppingBag, ArrowRight, ChevronDown, Instagram, Send, X } from "lucide-react";

// Fade-in-up on scroll
function useFadeIn() {
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.12 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return { ref, visible };
}

interface Category {
  id: string;
  name: string;
  slug: string;
  sort_order: number;
  is_active: boolean;
  image_url?: string | null;
}

// Extended product type that includes category_id from DB
interface ProductWithCategory extends Product {
  category_id?: string | null;
}

export default function HomePage() {
  const router = useRouter();
  const [products, setProducts]     = useState<ProductWithCategory[]>([]);
  const [loading, setLoading]       = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [menuOpen, setMenuOpen]     = useState(false);
  const [scrolled, setScrolled]     = useState(false);
  const [cartOpen, setCartOpen]     = useState(false);
  const supabase = createClient();

  const fadeStats        = useFadeIn();
  const fadeCollections  = useFadeIn();
  const fadeServices     = useFadeIn();
  const fadeHow          = useFadeIn();
  const fadeWhyUs        = useFadeIn();
  const fadeTestimonials = useFadeIn();
  const fadeContact      = useFadeIn();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const [categories, setCategories]       = useState<Category[]>([]);
  const [materials, setMaterials]         = useState<Material[]>([]);
  const [colorVariants, setColorVariants] = useState<ProductColorVariant[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  useEffect(() => {
    void supabase.auth.getSession().then((r: { data: { session: unknown } }) => setIsLoggedIn(!!r.data.session));
  }, []);

  useEffect(() => {
    Promise.all([
      supabase.from("products").select("*").order("created_at", { ascending: true }),
      supabase.from("categories").select("*").eq("is_active", true).order("sort_order", { ascending: true }),
      supabase.from("materials").select("*").eq("is_active", true),
      supabase.from("product_color_variants").select("*").eq("is_active", true).order("sort_order", { ascending: true }),
    ]).then(([prodRes, catRes, matRes, varRes]) => {
      const prods = (prodRes.data || []) as ProductWithCategory[];
      const cats  = (catRes.data  || []) as Category[];
      const mats  = (matRes.data  || []) as Material[];
      const vars  = (varRes.data  || []) as ProductColorVariant[];
      
      setProducts(prods);
      setCategories(cats);
      setMaterials(mats);
      setColorVariants(vars);
      
      // Find the first category that has products
      const categoryWithProducts = cats.find(cat => 
        prods.some(prod => prod.category_id === cat.id && prod.is_active)
      );
      
      if (categoryWithProducts) {
        setActiveCategory(categoryWithProducts.id);
      } else if (cats.length > 0) {
        setActiveCategory(cats[0].id);
      }
      
      setLoading(false);
    }).catch(error => {
      console.error("Database error:", error);
      setLoading(false);
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const activeCategoryItems = products.filter((p) => p.category_id === activeCategory && p.is_active);
  const hasCatalog = categories.length > 0;

  // Read cart count from session storage
  const [cartCount, setCartCount] = useState(0);
  const [cart, setCart] = useState<any[]>([]);
  const [totalCents, setTotalCents] = useState(0);
  
  useEffect(() => {
    const readCart = () => {
      try {
        const raw = sessionStorage.getItem("client-order-draft");
        if (!raw) { setCartCount(0); setCart([]); setTotalCents(0); return; }
        const draft = JSON.parse(raw);
        const cartItems = Array.isArray(draft.cart) ? draft.cart : [];
        setCart(cartItems);
        setCartCount(cartItems.length);
        
        // Calculate total
        const total = cartItems.reduce((sum: number, item: any) => {
          const lineTotal = (item.unitPriceCents + item.printCostCents) * item.quantity;
          return sum + lineTotal;
        }, 0);
        setTotalCents(total);
      } catch { setCartCount(0); setCart([]); setTotalCents(0); }
    };
    readCart();
    window.addEventListener("storage", readCart);
    // Poll every 2s to catch same-tab updates
    const interval = setInterval(readCart, 2000);
    return () => { window.removeEventListener("storage", readCart); clearInterval(interval); };
  }, []);

  const kw = ["футболк","худі","лонгслів","shirt","hoodie","longsleeve","tee","polo"];
  const clothing    = products.filter((p) => kw.some((k) => p.name.toLowerCase().includes(k)));
  const accessories = products.filter((p) => !kw.some((k) => p.name.toLowerCase().includes(k)));
  const clothingList = clothing.length > 0 ? clothing : products;

  const navLinks = [
    { href: "#collections", label: "Колекції" },
    { href: "#how",         label: "Як це працює" },
    { href: "#contact",     label: "Контакти" },
  ];

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Loader2 className="size-8 animate-spin text-primary" />
    </div>
  );

  return (
    <div className="min-h-screen bg-white text-gray-900 overflow-x-hidden scroll-smooth">

      {/* Cart sidebar */}
      {cartOpen && (
        <div className="fixed inset-0 z-[60] flex justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setCartOpen(false)} />
          <div className="relative bg-white w-80 max-w-full h-full flex flex-col shadow-2xl">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <span className="font-semibold text-sm">Кошик {cartCount > 0 ? `(${cartCount})` : ""}</span>
              <button onClick={() => setCartOpen(false)} className="size-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
                <X className="size-4" />
              </button>
            </div>
            {cartCount === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center px-6">
                <ShoppingBag className="size-10 text-gray-200" />
                <p className="text-sm text-gray-400 font-medium">Кошик порожній</p>
                <p className="text-xs text-gray-300">Оберіть товар та налаштуйте принт</p>
                <Link href="/order" onClick={() => setCartOpen(false)}
                  className="mt-2 inline-flex items-center gap-1.5 bg-primary text-white text-sm font-semibold px-5 py-2.5 rounded-full hover:bg-primary/90 transition-colors">
                  Перейти до каталогу <ArrowRight className="size-3.5" />
                </Link>
              </div>
            ) : (
              <div className="flex-1 flex flex-col">
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                  {cart.map((item, i) => {
                    const lineTotal = (item.unitPriceCents + item.printCostCents) * item.quantity / 100;
                    return (
                      <div key={i} className="flex items-center gap-2.5 p-2.5 bg-muted/50 rounded-lg">
                        <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 bg-card border border-border">
                          <MockupViewer images={item.mockupsMap} frontUrl={item.mockupDataUrl} backUrl={item.mockupBackDataUrl} fallbackUrl={item.productImage} alt={item.productName} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-foreground truncate">{item.productName}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">{item.quantity} шт · {item.size}</p>
                          <p className="text-xs font-bold text-primary mt-0.5">{lineTotal.toFixed(0)} ₴</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="p-4 border-t border-gray-100 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Разом:</span>
                    <span className="font-bold text-foreground">{(totalCents / 100).toFixed(0)} ₴</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* NAV */}
      <nav className={`fixed top-0 inset-x-0 z-50 bg-white border-b border-gray-100 transition-all duration-300 ${scrolled ? "shadow-md" : ""}`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" aria-label="U:DO CRAFT">
            <BrandLogoFull className="h-10 w-auto" color="var(--color-primary, #1B18AC)" />
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((l) => (
              <Link key={l.href} href={l.href} className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 rounded-full hover:bg-gray-50 transition-colors duration-200">
                {l.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Link href={isLoggedIn ? "/cabinet" : "/cabinet/login"} aria-label="Кабінет"
              className="flex items-center justify-center w-9 h-9 rounded-full text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors duration-200">
              <User className="w-5 h-5" />
            </Link>
            <button
              onClick={() => setCartOpen(true)}
              aria-label="Кошик"
              className="relative flex items-center justify-center w-9 h-9 rounded-full text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors duration-200">
              <ShoppingBag className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-primary text-white text-[9px] font-black rounded-full w-4 h-4 flex items-center justify-center leading-none">
                  {cartCount}
                </span>
              )}
            </button>
            <Link href="/order"
              className="hidden sm:flex items-center gap-1.5 bg-primary text-primary-foreground text-sm font-semibold px-4 py-2 rounded-full hover:bg-primary/90 active:scale-95 transition-all duration-200">
              Почати проєкт <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <button onClick={() => setMenuOpen(!menuOpen)} aria-label={menuOpen ? "Закрити меню" : "Відкрити меню"} aria-expanded={menuOpen}
              className="md:hidden flex items-center justify-center w-9 h-9 rounded-full hover:bg-gray-100 transition-colors duration-200">
              <div className="flex flex-col gap-1.5 w-5">
                <span className={`block h-0.5 bg-gray-700 transition-all duration-300 origin-center ${menuOpen ? "rotate-45 translate-y-2" : ""}`} />
                <span className={`block h-0.5 bg-gray-700 transition-all duration-300 ${menuOpen ? "opacity-0 scale-x-0" : ""}`} />
                <span className={`block h-0.5 bg-gray-700 transition-all duration-300 origin-center ${menuOpen ? "-rotate-45 -translate-y-2" : ""}`} />
              </div>
            </button>
          </div>
        </div>

        <div className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${menuOpen ? "max-h-64 opacity-100" : "max-h-0 opacity-0"}`}>
          <div className="bg-white border-t border-gray-100 px-6 py-4 space-y-1">
            {navLinks.map((l) => (
              <Link key={l.href} href={l.href} onClick={() => setMenuOpen(false)}
                className="block px-4 py-2.5 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-full transition-colors duration-200">
                {l.label}
              </Link>
            ))}
            <Link href="/order" onClick={() => setMenuOpen(false)}
              className="block mt-2 text-center bg-primary text-primary-foreground text-sm font-semibold px-4 py-2.5 rounded-full hover:bg-primary/90 transition-colors duration-200">
              Почати проєкт
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative overflow-hidden bg-primary">
        <div className="absolute inset-0 bg-cover bg-center opacity-80" style={{ backgroundImage: "url('/hero-bg.jpg')"}} />
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: "linear-gradient(rgba(255,255,255,1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,1) 1px,transparent 1px)", backgroundSize: "40px 40px" }} />

        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 pt-32 sm:pt-48 pb-16 text-center animate-in fade-in slide-in-from-bottom-8 duration-700 fill-mode-both">
          <div className="inline-flex items-center gap-2 bg-white/10 text-white/80 text-xs font-semibold px-3 py-1.5 rounded-full mb-7 tracking-wide uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            B2B Мерч-платформа
          </div>
          <h1 className="text-white text-4xl sm:text-5xl lg:text-[3.5rem] font-black leading-[1.05] tracking-tight">
            Одяг, який стає частиною <span className="text-white/70">вашої корпоративної ДНК</span>
          </h1>
          <p className="text-white/80 mt-5 text-base sm:text-lg leading-relaxed max-w-xl mx-auto">
            Ринок перенасичений дешевим трендовим одягом. Ми створюємо речі, які стають улюбленими в гардеробі. Ваш мерч — це інструмент стратегічної комунікації.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="#collections"
              className="inline-flex items-center gap-2 bg-white text-primary font-bold text-sm px-6 py-3 rounded-full hover:bg-white/90 active:scale-95 transition-all duration-200">
              Переглянути каталог
            </Link>
            <Link href="#contact"
              className="inline-flex items-center gap-2 border border-white/30 text-white font-semibold text-sm px-6 py-3 rounded-full hover:bg-white/10 active:scale-95 transition-all duration-200">
              Зв&apos;язатись
            </Link>
          </div>
          <div className="mt-8 flex flex-wrap justify-center gap-x-5 gap-y-1 text-white/70 text-xs font-medium">
            <span>Від 10 одиниць</span>
            <span className="text-white/40">•</span>
            <span>Гарантія якості</span>
            <span className="text-white/40">•</span>
            <span>7–14 днів на виготовлення</span>
          </div>
        </div>
        <div className="flex justify-center pb-8">
          <a href="#collections" className="text-white/50 hover:text-white/80 transition-colors duration-200" aria-label="Прокрутити вниз">
            <ChevronDown className="w-5 h-5 animate-bounce" />
          </a>
        </div>
      </section>

      {/* STATS */}
      <section className="border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-gray-100">
            {[
              { value: "500+",  label: "Задоволених клієнтів" },
              { value: "15%",   label: "Знижка від 100 шт" },
              { value: "14 дн", label: "Середній термін" },
              { value: "100%",  label: "Контроль якості" },
            ].map((s) => (
              <div key={s.label} className="py-6 px-4 sm:px-6 text-center">
                <p className="text-2xl font-black text-primary">{s.value}</p>
                <p className="text-xs text-gray-500 mt-1 font-medium">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* COLLECTIONS */}
      <section id="collections" className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest mb-2 text-primary">Каталог</p>
            <h2 className="text-3xl font-black tracking-tight">Колекції</h2>
          </div>
          <Link href="/order" className="hidden sm:flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline transition-all duration-200">
            Всі товари <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {hasCatalog && (
          <div className="flex gap-2 overflow-x-auto pb-6 -mx-1 px-1 scrollbar-hide">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex items-center gap-2 whitespace-nowrap px-5 py-2.5 rounded-full text-sm font-semibold transition-all border ${
                  activeCategory === cat.id
                    ? "bg-primary text-primary-foreground border-primary shadow-md"
                    : "bg-white text-gray-700 border-gray-200 hover:border-gray-400 hover:shadow-sm"
                }`}
              >
                {cat.image_url && <img src={cat.image_url} alt="" className="w-5 h-5 rounded-full object-cover" />}
                {cat.name}
              </button>
            ))}
          </div>
        )}

        {hasCatalog ? (
          activeCategoryItems.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-3xl mb-3">🧺</p>
              <p className="text-gray-500 text-sm font-medium">У цій категорії поки немає товарів</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {activeCategoryItems.map((item) => (
                <ProductCardDetailed
                  key={item.id}
                  product={item}
                  colorVariants={colorVariants.filter((v) => v.product_id === item.id)}
                  materials={materials}
                  onAddWithoutPrint={(product, size, color, variant) => {
                    const params = new URLSearchParams({ product: product.slug || product.id, add: "1" });
                    if (size) params.set("size", size);
                    if (color) params.set("color", color);
                    if (variant?.id) params.set("variant", variant.id);
                    router.push(`/order?${params.toString()}`);
                  }}
                />
              ))}
            </div>
          )
        ) : clothingList.length === 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => <div key={i} className="aspect-square bg-gray-100 rounded-2xl animate-pulse" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {clothingList.map((p) => (
              <ProductCardDetailed
                key={p.id}
                product={p}
                onAddWithoutPrint={(product) => {
                  const params = new URLSearchParams({ product: product.slug || product.id, add: "1" });
                  router.push(`/order?${params.toString()}`);
                }}
              />
            ))}
          </div>
        )}
      </section>

      {/* SERVICES */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
        <div className="mb-10">
          <p className="text-xs font-bold uppercase tracking-widest mb-2 text-primary">Додаткові послуги</p>
          <h2 className="text-3xl font-black tracking-tight">Більше, ніж просто мерч</h2>
        </div>
        <div className="grid md:grid-cols-2 gap-5">
          <div className="relative bg-gray-900 rounded-2xl p-8 overflow-hidden flex flex-col justify-between min-h-[280px] hover:shadow-xl transition-shadow duration-300">
            <div>
              <span className="inline-block text-xs font-bold uppercase tracking-widest text-white/50 mb-4">Семпли</span>
              <h3 className="text-white text-2xl font-black mb-3">Box of Touch</h3>
              <p className="text-gray-400 text-sm leading-relaxed max-w-xs">Замов набір зразків тканин, кольорів та виробів — відчуй якість до того, як зробити тираж.</p>
            </div>
            <Link href="#contact" className="mt-6 inline-flex items-center gap-2 bg-white text-gray-900 text-sm font-bold px-5 py-2.5 rounded-full hover:bg-gray-100 active:scale-95 transition-all duration-200 w-fit">
              Замовити зразки <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="relative rounded-2xl p-8 overflow-hidden flex flex-col justify-between min-h-[280px] border border-gray-200 hover:shadow-xl transition-shadow duration-300">
            <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('/designer-bg.jpg')" }} />
            <div className="absolute inset-0 bg-black/60" />
            <div className="relative z-10">
              <span className="inline-block text-xs font-bold uppercase tracking-widest mb-4 text-white/80">Дизайн</span>
              <h3 className="text-2xl font-black mb-3 text-white">Найми дизайнера</h3>
              <p className="text-white/90 text-sm leading-relaxed max-w-xs">Немає готового логотипу? Наш дизайнер допоможе створити фірмовий стиль або адаптує логотип для нанесення.</p>
            </div>
            <Link href="#contact" className="relative z-10 mt-6 inline-flex items-center gap-2 bg-primary text-primary-foreground text-sm font-bold px-5 py-2.5 rounded-full hover:bg-primary/90 active:scale-95 transition-all duration-200 w-fit">
              Обговорити проєкт <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="py-20 sm:py-24 bg-primary">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="mb-14">
            <p className="text-xs font-bold text-white/60 uppercase tracking-widest mb-3">Процес</p>
            <h2 className="text-white text-3xl sm:text-4xl font-black tracking-tight">Кастомуй під свої цілі</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { step: "01", title: "Обери товари", desc: "Переглядай каталог, фільтруй за категоріями. Обирай базу для свого мерчу — худі, футболки, аксесуари.", cta: "До каталогу", href: "#collections" },
              { step: "02", title: "Кастомуй одяг", desc: "Завантаж логотип, обери зону нанесення, розмір та колір. Переглянь попередній вигляд у реальному часі.", cta: "Спробувати", href: "/order" },
              { step: "03", title: "Отримай пропозицію", desc: "Заповни форму замовлення. Менеджер зв'яжеться з тобою для узгодження деталей та надішле рахунок.", cta: "Замовити", href: "#contact" },
            ].map((item) => (
              <div key={item.step} className="bg-white/[0.08] hover:bg-white/[0.12] border border-white/15 rounded-2xl p-7 flex flex-col gap-5 transition-all duration-200">
                <span className="text-white/40 text-5xl font-black leading-none select-none">{item.step}</span>
                <div className="flex-1">
                  <h3 className="text-white font-bold text-lg mb-2">{item.title}</h3>
                  <p className="text-white/75 text-sm leading-relaxed">{item.desc}</p>
                </div>
                <Link href={item.href} className="inline-flex items-center gap-1.5 text-white font-semibold text-sm hover:gap-2.5 transition-all duration-200 underline-offset-2 hover:underline">
                  {item.cta} <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHY US */}
      <section className="bg-gray-50 py-16 sm:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="mb-12 text-center">
            <p className="text-xs font-bold uppercase tracking-widest mb-3 text-primary">Чому ми</p>
            <h2 className="text-3xl font-black tracking-tight">Якість, яку відчуваєш</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: "🎨", title: "Онлайн-редактор",   desc: "Завантажуй логотип, розміщуй на виробі та одразу бачиш результат. Без зайвих листів і погоджень." },
              { icon: "📦", title: "Від 10 одиниць",     desc: "Не потрібно замовляти сотні. Починай з малого тиражу — ідеально для стартапів і команд." },
              { icon: "💳", title: "Прозора ціна",       desc: "Рахунок-фактура одразу після замовлення. Ніяких прихованих доплат — тільки чесна ціна." },
              { icon: "⚡", title: "Швидке виробництво", desc: "7–14 робочих днів від підтвердження до доставки. Дедлайн — це не проблема." },
              { icon: "🔒", title: "Контроль якості",    desc: "Кожна партія проходить перевірку перед відправкою. Ми відповідаємо за результат." },
              { icon: "💬", title: "Особистий менеджер", desc: "Ваш менеджер на зв'язку від першого запиту до отримання замовлення." },
            ].map((f) => (
              <div key={f.title} className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
                <span className="text-2xl mb-4 block" aria-hidden="true">{f.icon}</span>
                <h3 className="font-bold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="bg-gray-50 py-16 sm:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="mb-12">
            <p className="text-xs font-bold uppercase tracking-widest mb-2 text-primary">Відгуки</p>
            <h2 className="text-3xl font-black tracking-tight">Що кажуть клієнти</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {[
              { name: "Олена Коваль",      role: "HR Director, TechCorp",      avatar: "ОК", text: "Замовляли корпоративні худі для команди 80 осіб. Якість перевершила очікування — люди носять їх не лише на роботі. Менеджер був на зв'язку на кожному етапі.", rating: 5 },
              { name: "Максим Бондаренко", role: "Co-founder, StartupUA",      avatar: "МБ", text: "Спочатку замовили Box of Touch — це вирішило всі сумніви щодо якості. Потім зробили тираж 200 футболок для конференції. Все вчасно і без нервів.", rating: 5 },
              { name: "Аліна Мороз",       role: "Brand Manager, RetailGroup", avatar: "АМ", text: "Зверталися за допомогою дизайнера — адаптували логотип під вишивку. Результат виглядає дуже преміально. Клієнти постійно питають, де ми це замовляли.", rating: 5 },
            ].map((t) => (
              <div key={t.name} className="bg-white rounded-2xl p-6 border border-gray-100 flex flex-col gap-4 hover:shadow-md transition-shadow duration-200">
                <div className="flex gap-0.5" aria-label={`Оцінка: ${t.rating} з 5`}>
                  {[...Array(t.rating)].map((_, i) => (
                    <svg key={i} className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20" aria-hidden="true">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-gray-700 text-sm leading-relaxed flex-1">&ldquo;{t.text}&rdquo;</p>
                <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
                  <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-primary-foreground shrink-0" aria-hidden="true">
                    {t.avatar}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{t.name}</p>
                    <p className="text-xs text-gray-500">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <section id="contact" className="bg-gray-900 py-20 sm:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-start">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest mb-4 text-primary">Контакти</p>
              <h2 className="text-white text-3xl sm:text-4xl font-black tracking-tight mb-5">Зв&apos;яжіться з нами</h2>
              <p className="text-gray-400 text-base leading-relaxed mb-8">
                Розкажіть про ваш проєкт — ми підберемо оптимальне рішення та надішлемо комерційну пропозицію протягом 24 годин.
              </p>
              <div className="space-y-4">
                {[
                  { label: "Email",   value: "info@udocraft.com" },
                  { label: "Телефон", value: "+380 63 070 33 072" },
                  { label: "Адреса",  value: "м. Львів, вул. Джерельна, 69 (Офіс 10)" },
                ].map((c) => (
                  <div key={c.label} className="flex items-start gap-3">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider w-16 pt-0.5 shrink-0">{c.label}</span>
                    <span className="text-gray-300 text-sm">{c.value}</span>
                  </div>
                ))}
              </div>
            </div>
            <ContactForm />
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-gray-950 py-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-6">
          <Link href="/" aria-label="U:DO CRAFT">
            <BrandLogoFull className="h-6 w-auto" color="#4B4B8F" />
          </Link>
          <p className="text-gray-600 text-xs text-center">© {new Date().getFullYear()} U:DO CRAFT. Всі права захищені.</p>
          <div className="flex items-center gap-4">
            <a href="https://www.instagram.com/u.do.craft/" target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 text-gray-500 hover:text-gray-200 transition-colors duration-200">
              <Instagram className="w-4 h-4" aria-hidden="true" />
              <span className="text-xs font-medium">Instagram</span>
            </a>
            <a href="https://t.me/udostore" target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 text-gray-500 hover:text-gray-200 transition-colors duration-200">
              <Send className="w-4 h-4" aria-hidden="true" />
              <span className="text-xs font-medium">Telegram</span>
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
