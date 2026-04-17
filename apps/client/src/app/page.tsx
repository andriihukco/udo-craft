"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef, useCallback } from "react";
import { Product, Material, ProductColorVariant } from "@udo-craft/shared";
import { ContactForm } from "@/components/ContactForm";
import { ProductCardDetailed } from "@/components/ProductCardDetailed";
import { MockupViewer } from "@/components/MockupViewer";
import { BrandLogoFull } from "@/components/brand-logo";
import { LogoLoader } from "@udo-craft/ui";
import { createClient } from "@/lib/supabase/client";
import { User, ShoppingBag, ArrowRight, ChevronDown, Instagram, Send, X, Fullscreen, Shrink } from "lucide-react";
import { motion, useInView, AnimatePresence } from "framer-motion";

// Scroll-triggered fade-up wrapper
function FadeUp({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y: 36 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 36 }}
      transition={{ duration: 0.65, delay, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}

// Staggered children wrapper
function StaggerGrid({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div
      ref={ref}
      className={className}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
    >
      {children}
    </motion.div>
  );
}

const cardVariant = {
  hidden: { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: "easeOut" as const } },
};

function CountUp({ end, suffix = "" }: { end: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  useEffect(() => {
    if (!isInView) return;
    let start = 0;
    const duration = 1400;
    const step = end / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= end) { setCount(end); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [isInView, end]);
  return <span ref={ref}>{count}{suffix}</span>;
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

const POPUP_STEPS = [
  {
    step: "01",
    icon: "🎨",
    title: "Обери пакет",
    desc: "Стікер-паки або пакети принтів — підбери під формат заходу",
    img: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&q=80",
  },
  {
    step: "02",
    icon: "👕",
    title: "Обери товар",
    desc: "Футболки, худі, аксесуари — гості обирають на місці",
    img: "https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=600&q=80",
  },
  {
    step: "03",
    icon: "⚡",
    title: "Ми приїжджаємо",
    desc: "Привозимо обладнання та наносимо принти прямо на заході",
    img: "https://images.unsplash.com/photo-1562157873-818bc0726f68?w=600&q=80",
  },
];

const STEP_DURATION = 5000;

function PopupStepCarousel() {
  const [active, setActive] = useState(0);
  const [direction, setDirection] = useState(1);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const [dragX, setDragX] = useState(0);
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const dragStartX = useRef(0);
  const n = POPUP_STEPS.length;

  const goTo = useCallback((idx: number, dir: number) => {
    setDirection(dir);
    setActive(((idx % n) + n) % n);
    setProgress(0);
  }, [n]);

  const next = useCallback(() => goTo(active + 1, 1),  [active, goTo]);
  const prev = useCallback(() => goTo(active - 1, -1), [active, goTo]);

  // Auto-advance
  useEffect(() => {
    if (paused) return;
    const t = setTimeout(next, STEP_DURATION);
    return () => clearTimeout(t);
  }, [active, paused, next]);

  // Progress ticker
  useEffect(() => {
    if (paused) { if (progressRef.current) clearInterval(progressRef.current); return; }
    setProgress(0);
    const tick = 1000 / 60;
    progressRef.current = setInterval(() => {
      setProgress((p) => Math.min(p + (tick / STEP_DURATION) * 100, 100));
    }, tick);
    return () => { if (progressRef.current) clearInterval(progressRef.current); };
  }, [active, paused]);

  // Touch / mouse drag
  const onPointerDown = (e: React.PointerEvent) => {
    dragStartX.current = e.clientX;
    setDragX(0);
    setPaused(true);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!paused) return;
    setDragX(e.clientX - dragStartX.current);
  };
  const onPointerUp = () => {
    if (Math.abs(dragX) > 50) dragX < 0 ? next() : prev();
    setDragX(0);
    setPaused(false);
  };

  const prevIdx = ((active - 1) + n) % n;
  const nextIdx = (active + 1) % n;

  const variants = {
    enter:  (d: number) => ({ x: d > 0 ? "100%" : "-100%", opacity: 0, scale: 0.88, rotateY: d > 0 ? 12 : -12 }),
    center: { x: 0, opacity: 1, scale: 1, rotateY: 0 },
    exit:   (d: number) => ({ x: d > 0 ? "-100%" : "100%", opacity: 0, scale: 0.88, rotateY: d > 0 ? -12 : 12 }),
  };

  return (
    <div className="flex flex-col gap-3 select-none h-full">
      {/* Progress bars */}
      <div className="flex gap-1.5 shrink-0">
        {POPUP_STEPS.map((_, i) => (
          <button key={i} onClick={() => goTo(i, i > active ? 1 : -1)} aria-label={`Крок ${i + 1}`}
            className="flex-1 h-1 rounded-full bg-white/20 overflow-hidden">
            <div className="h-full rounded-full bg-white transition-none"
              style={{ width: i < active ? "100%" : i === active ? `${progress}%` : "0%" }} />
          </button>
        ))}
      </div>

      {/* Card stack viewport — overflow visible so side cards peek out */}
      <div className="relative flex-1 rounded-2xl" style={{ perspective: "1000px" }}>

        {/* Prev card — scaled down, peeking from left behind active */}
        <div
          className="absolute inset-y-0 left-0 w-[76%] rounded-2xl overflow-hidden z-10 pointer-events-none"
          style={{ transform: "translateX(-30%) scale(0.88)", transformOrigin: "right center", opacity: 0.55 }}
        >
          <img src={POPUP_STEPS[prevIdx].img} alt="" className="absolute inset-0 w-full h-full object-cover" aria-hidden="true" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
          <div className="absolute inset-0 bg-primary/40" />
        </div>

        {/* Next card — scaled down, peeking from right behind active */}
        <div
          className="absolute inset-y-0 right-0 w-[76%] rounded-2xl overflow-hidden z-10 pointer-events-none"
          style={{ transform: "translateX(30%) scale(0.88)", transformOrigin: "left center", opacity: 0.55 }}
        >
          <img src={POPUP_STEPS[nextIdx].img} alt="" className="absolute inset-0 w-full h-full object-cover" aria-hidden="true" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
          <div className="absolute inset-0 bg-primary/40" />
        </div>

        {/* Active card */}
        <AnimatePresence initial={false} custom={direction} mode="popLayout">
          <motion.div
            key={active}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.7, ease: [0.32, 0.72, 0, 1] }}
            style={{ x: dragX, cursor: paused ? "grabbing" : "grab" }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerLeave={onPointerUp}
            className="absolute inset-0 rounded-2xl overflow-hidden z-20 flex flex-col shadow-2xl"
          >
            {/* Full-bleed image */}
            <div className="flex-1 relative overflow-hidden">
              <img
                src={POPUP_STEPS[active].img}
                alt={POPUP_STEPS[active].title}
                className="absolute inset-0 w-full h-full object-cover"
                draggable={false}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
              <div className="absolute top-3 left-3 w-8 h-8 rounded-full bg-black/40 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white text-[11px] font-black">
                {POPUP_STEPS[active].step}
              </div>
            </div>

            {/* Text area */}
            <div className="shrink-0 bg-black/60 border-t border-white/10 px-4 py-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg leading-none" aria-hidden="true">{POPUP_STEPS[active].icon}</span>
                <p className="text-white font-bold text-sm leading-tight">{POPUP_STEPS[active].title}</p>
              </div>
              <p className="text-white/70 text-xs leading-relaxed">{POPUP_STEPS[active].desc}</p>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Nav: arrows flanking the label */}
      <div className="flex items-center justify-center gap-3 shrink-0">
        <button onClick={prev} aria-label="Попередній крок"
          className="w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-colors">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path d="M9 11L5 7l4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <span className="text-white/60 text-xs font-medium tabular-nums">{active + 1} / {n}</span>
        <button onClick={next} aria-label="Наступний крок"
          className="w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-colors">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
    </div>
  );
}

// Animated CTA button — icon slides right on hover
function AnimBtn({ href, children, variant = "primary", className = "" }: {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "outline" | "ghost";
  className?: string;
}) {
  const base = "group inline-flex items-center gap-2 font-bold text-sm px-7 py-3.5 rounded-full transition-all duration-200 active:scale-95 overflow-hidden relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
  const styles = {
    primary: "bg-primary text-white hover:bg-primary/90 shadow-lg hover:shadow-xl hover:shadow-primary/25",
    outline: "border-2 border-primary text-primary hover:bg-primary hover:text-white",
    ghost:   "border-2 border-white text-white hover:bg-white/10",
  };
  return (
    <Link href={href} className={`${base} ${styles[variant]} ${className}`}>
      <span className="relative z-10">{children}</span>
      <motion.span
        className="relative z-10 flex items-center"
        initial={{ x: 0 }}
        whileHover={{ x: 4 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
      >
        <ArrowRight className="w-4 h-4" />
      </motion.span>
    </Link>
  );
}

// White variant for dark backgrounds
function AnimBtnWhite({ href, children, className = "" }: { href: string; children: React.ReactNode; className?: string }) {
  return (
    <Link href={href} className={`group inline-flex items-center gap-2 bg-white text-primary font-bold text-sm px-7 py-3.5 rounded-full hover:bg-gray-50 active:scale-95 transition-all duration-200 shadow-lg hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${className}`}>
      <span>{children}</span>
      <motion.span
        className="flex items-center"
        initial={{ x: 0 }}
        whileHover={{ x: 4 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
      >
        <ArrowRight className="w-4 h-4" />
      </motion.span>
    </Link>
  );
}


function PopupSection() {
  return (
    <div className="rounded-3xl overflow-hidden bg-primary">

      {/* Top: left copy + right carousel */}
      <div className="flex flex-col lg:flex-row items-stretch">

        {/* Left — copy */}
        <div className="flex-1 flex flex-col justify-center px-8 py-12 md:px-12 lg:pr-8">
          <motion.h2
            initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }}
            transition={{ duration:0.6 }}
            className="text-white text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-[1.1] mb-5"
          >
            U:DO Craft Popup
          </motion.h2>
          <motion.p
            initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }}
            transition={{ duration:0.6, delay:0.1 }}
            className="text-white/80 text-base sm:text-lg leading-relaxed max-w-lg mb-8"
          >
            Перетворіть ваш захід на незабутній досвід. Виїзний попап-стенд з живою кастомізацією мерчу — гості створюють унікальний одяг і забирають його одразу.
          </motion.p>
          <motion.div
            initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }}
            transition={{ duration:0.6, delay:0.2 }}
            className="flex flex-wrap gap-3"
          >
            <AnimBtnWhite href="/popup">Дізнатись більше</AnimBtnWhite>
            <Link href="#contact"
              className="group inline-flex items-center gap-2 border-2 border-white/40 text-white font-bold text-sm px-7 py-3.5 rounded-full hover:border-white hover:bg-white/10 active:scale-95 transition-all duration-200">
              <span>Обговорити захід</span>
              <motion.span className="flex items-center" initial={{ x:0 }} whileHover={{ x:4 }} transition={{ duration:0.2 }}>
                <ArrowRight className="w-4 h-4" />
              </motion.span>
            </Link>
          </motion.div>
        </div>

        {/* Right — swipeable step carousel */}
        <div className="flex flex-col px-8 py-10 lg:px-10 lg:w-[420px] lg:border-l border-white/10 lg:self-stretch">
          <p className="text-white/40 text-xs font-bold uppercase tracking-widest mb-4 shrink-0">Як це працює</p>
          <div className="flex-1 flex flex-col min-h-[420px]">
            <PopupStepCarousel />
          </div>
        </div>
      </div>

      {/* Bottom — horizontal feature strip */}
      <div className="bg-white border-t border-gray-100 px-8 py-6 md:px-12">
        <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-gray-100">
          {[
            { icon: "🎪", label: "Виїзд на будь-який захід", desc: "Конференції, фестивалі, корпоративи" },
            { icon: "👕", label: "Кастомізація на місці",    desc: "Живий дизайн за 5 хвилин" },
            { icon: "⚡", label: "Миттєвий результат",       desc: "Готовий мерч у руки гостей" },
            { icon: "🎯", label: "Від 50 учасників",         desc: "Масштабуємо під ваш захід" },
          ].map((f, i) => (
            <motion.div
              key={f.label}
              initial={{ opacity:0, y:16 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }}
              transition={{ duration:0.45, delay: i * 0.08 }}
              className="flex items-start gap-3 px-4 first:pl-0 last:pr-0"
            >
              <span className="text-2xl shrink-0 mt-0.5" aria-hidden="true">{f.icon}</span>
              <div>
                <p className="text-foreground text-xs font-bold leading-tight">{f.label}</p>
                <p className="text-muted-foreground text-xs mt-0.5 leading-snug">{f.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  const router = useRouter();
  const [products, setProducts]     = useState<ProductWithCategory[]>([]);
  const [loading, setLoading]       = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [menuOpen, setMenuOpen]     = useState(false);
  const [scrolled, setScrolled]     = useState(false);
  const [navVisible, setNavVisible]  = useState(true);
  const [cinemaMode, setCinemaMode] = useState(false);
  const lastScrollY = useRef(0);
  const [cartOpen, setCartOpen]     = useState(false);
  const supabase = createClient();

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 60);
      // hide when scrolling down past 120px, show when scrolling up
      if (y < 120) {
        setNavVisible(true);
      } else if (y > lastScrollY.current + 8) {
        setNavVisible(false);
      } else if (y < lastScrollY.current - 8) {
        setNavVisible(true);
      }
      lastScrollY.current = y;
    };
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
    { href: "/popup",       label: "Popup" },
    { href: "#how",         label: "Як це працює" },
    { href: "#contact",     label: "Контакти" },
  ];

  if (loading) return <LogoLoader />;

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden scroll-smooth">
      {/* Page load fade-in overlay — white covers everything, fades out fast */}
      <motion.div
        initial={{ opacity: 1 }}
        animate={{ opacity: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="fixed inset-0 bg-white z-[100] pointer-events-none"
      />

      {/* Cart sidebar */}
      {cartOpen && (
        <div className="fixed inset-0 z-[60] flex justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setCartOpen(false)} aria-hidden="true" />
          <div className="relative bg-background w-80 max-w-full h-full flex flex-col shadow-2xl" role="dialog" aria-modal="true" aria-label="Кошик">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <span className="font-semibold text-sm">Кошик {cartCount > 0 ? `(${cartCount})` : ""}</span>
              <button onClick={() => setCartOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <X className="w-4 h-4" strokeWidth={2} />
              </button>
            </div>
            {cartCount === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center px-6">
                <ShoppingBag className="size-10 text-muted" />
                <p className="text-sm text-muted-foreground font-medium">Кошик порожній</p>
                <p className="text-xs text-muted-foreground/60">Оберіть товар та налаштуйте принт</p>
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
                <div className="p-4 border-t border-border space-y-2">
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

      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{
          y: navVisible && !cinemaMode ? 0 : -80,
          opacity: navVisible && !cinemaMode ? 1 : 0,
        }}
        transition={{ duration: 0.45, ease: [0.32, 0.72, 0, 1], delay: navVisible && !scrolled ? 1.5 : 0 }}
        className="fixed top-4 inset-x-0 z-50 flex justify-center pointer-events-none px-4"
        aria-label="Головна навігація"
      >
        {/* Pill — hugs content, no full width */}
        <div className={`pointer-events-auto inline-flex items-center gap-2 h-12 px-3 rounded-full bg-background border border-border transition-shadow duration-300 ${scrolled ? "shadow-lg" : "shadow-md"}`}>

          {/* Logo */}
          <Link href="/" aria-label="U:DO CRAFT" className="shrink-0 pl-1 pr-2">
            <BrandLogoFull className="h-6 w-auto" color="var(--color-primary, #1B18AC)" />
          </Link>

          {/* Divider */}
          <div className="hidden md:block w-px h-5 bg-border shrink-0" />

          {/* Nav links */}
          <div className="hidden md:flex items-center">
            {navLinks.map((l) => (
              <Link key={l.href} href={l.href}
                className="px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground rounded-full hover:bg-muted transition-all duration-200 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                {l.label}
              </Link>
            ))}
          </div>

          {/* Divider */}
          <div className="hidden md:block w-px h-5 bg-border shrink-0" />

          {/* Actions */}
          <div className="flex items-center gap-0.5">

            {/* User — circle head bobs up on hover */}
            <Link href={isLoggedIn ? "/cabinet" : "/cabinet/login"} aria-label="Кабінет"
              className="flex items-center justify-center w-8 h-8 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <motion.div
                initial={{ y: 2, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.4, delay: 1.7, ease: [0.22, 1, 0.36, 1] }}
              >
                <motion.div whileHover={{ y: -1.5 }} transition={{ duration: 0.2, ease: "easeOut" }}>
                  <User className="w-4 h-4" strokeWidth={2} />
                </motion.div>
              </motion.div>
            </Link>

            {/* Cart — bag bounces down on hover, badge pops in */}
            <button onClick={() => setCartOpen(true)} aria-label="Кошик"
              className="relative flex items-center justify-center w-8 h-8 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <motion.div
                initial={{ y: 2, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.4, delay: 1.8, ease: [0.22, 1, 0.36, 1] }}
              >
                <motion.div whileHover={{ y: 1.5, scale: 1.1 }} transition={{ duration: 0.2, ease: "easeOut" }}>
                  <ShoppingBag className="w-4 h-4" strokeWidth={2} />
                </motion.div>
              </motion.div>
              {cartCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }} animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 500, damping: 20 }}
                  className="absolute -top-0.5 -right-0.5 bg-primary text-white text-[9px] font-black rounded-full w-4 h-4 flex items-center justify-center leading-none"
                >
                  {cartCount}
                </motion.span>
              )}
            </button>

            <Link href="/order"
              className="hidden sm:inline-flex items-center gap-1.5 bg-primary text-white text-xs font-bold px-3.5 py-2 rounded-full hover:bg-primary/90 active:scale-95 transition-all duration-200 whitespace-nowrap ml-1">
              Почати проєкт
              <motion.span className="flex items-center" initial={{ x:0 }} whileHover={{ x:3 }} transition={{ duration:0.18 }}>
                <ArrowRight className="w-3 h-3" />
              </motion.span>
            </Link>

            {/* Burger — 3 lines morph to X, compact 14px */}
            <button onClick={() => setMenuOpen(!menuOpen)}
              aria-label={menuOpen ? "Закрити меню" : "Відкрити меню"}
              aria-expanded={menuOpen}
              className="md:hidden flex items-center justify-center w-8 h-8 rounded-full hover:bg-muted transition-colors duration-200 ml-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <div className="flex flex-col justify-center gap-[4px] w-[14px] h-[14px]">
                <motion.span
                  animate={menuOpen ? { rotate: 45, y: 4 } : { rotate: 0, y: 0 }}
                  transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
                  className="block h-[1.5px] w-full bg-foreground rounded-full origin-center"
                />
                <motion.span
                  animate={menuOpen ? { opacity: 0, scaleX: 0 } : { opacity: 1, scaleX: 1 }}
                  transition={{ duration: 0.2 }}
                  className="block h-[1.5px] w-full bg-foreground rounded-full origin-center"
                />
                <motion.span
                  animate={menuOpen ? { rotate: -45, y: -4 } : { rotate: 0, y: 0 }}
                  transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
                  className="block h-[1.5px] w-full bg-foreground rounded-full origin-center"
                />
              </div>
            </button>
          </div>
        </div>

        {/* Mobile dropdown */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              key="mobile-menu"
              initial={{ opacity: 0, y: -8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.97 }}
              transition={{ duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
              className="absolute top-[calc(100%+8px)] left-4 right-4 rounded-2xl"
            >
              <div className="bg-background border border-border shadow-xl rounded-2xl px-4 py-3 space-y-1">
                {navLinks.map((l) => (
                  <Link key={l.href} href={l.href} onClick={() => setMenuOpen(false)}
                    className="block px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    {l.label}
                  </Link>
                ))}
                <Link href="/order" onClick={() => setMenuOpen(false)}
                  className="block mt-1 text-center bg-primary text-primary-foreground text-sm font-semibold px-4 py-2.5 rounded-full hover:bg-primary/90 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  Почати проєкт
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* HERO */}
      <section className="relative overflow-hidden bg-primary">
        {/* Video loads immediately — no delay */}
        <video
          className="absolute inset-0 w-full h-full object-cover opacity-75"
          src="/hero-video.mp4"
          autoPlay
          loop
          muted
          playsInline
        />
        <motion.div
          animate={{ opacity: cinemaMode ? 0 : 1 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className="relative max-w-3xl mx-auto px-4 sm:px-6 pt-32 sm:pt-48 pb-16 text-center pointer-events-none"
          aria-hidden={cinemaMode}
        >
          <motion.h1
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, delay: 1.65, ease: [0.22, 1, 0.36, 1] }}
            className="text-white text-4xl sm:text-5xl lg:text-[3.5rem] font-black leading-[1.05] tracking-tight"
          >
            Одяг, який стає частиною <span className="text-white/70">вашої корпоративної ДНК</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.85 }}
            className="text-white/80 mt-5 text-base sm:text-lg leading-relaxed max-w-xl mx-auto"
          >
            Ринок перенасичений дешевим трендовим одягом. Ми створюємо речі, які стають улюбленими в гардеробі. Ваш мерч — це інструмент стратегічної комунікації.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 2.05 }}
            className="mt-8 flex flex-wrap justify-center gap-3"
          >
            <AnimBtnWhite href="#collections">
              Переглянути каталог
            </AnimBtnWhite>
            <Link href="#contact"
              className="group inline-flex items-center gap-2 border-2 border-white/30 text-white font-bold text-sm px-7 py-3.5 rounded-full hover:bg-white/10 hover:border-white active:scale-95 transition-all duration-200">
              <span>Зв&apos;язатись</span>
              <motion.span className="flex items-center" initial={{ x: 0 }} whileHover={{ x: 4 }} transition={{ duration: 0.2 }}>
                <ArrowRight className="w-4 h-4" />
              </motion.span>
            </Link>
          </motion.div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 2.25 }}
            className="mt-8 flex flex-wrap justify-center gap-x-5 gap-y-1 text-white/70 text-xs font-medium"
          >
            <span>Від 10 одиниць</span>
            <span className="text-white/40">•</span>
            <span>Гарантія якості</span>
            <span className="text-white/40">•</span>
            <span>7–14 днів на виготовлення</span>
          </motion.div>
        </motion.div>
        <motion.div
          animate={{ opacity: cinemaMode ? 0 : 1 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className="flex justify-center pb-8 pointer-events-none"
          aria-hidden={cinemaMode}
        >
          <a href="#collections" className="text-white/50 hover:text-white/80 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 rounded-full" aria-label="Прокрутити вниз">
            <ChevronDown className="w-5 h-5 animate-bounce" />
          </a>
        </motion.div>

        {/* Cinema mode toggle — bottom-right corner */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 2.5 }}
          onClick={() => setCinemaMode((v) => !v)}
          aria-label={cinemaMode ? "Вийти з режиму перегляду" : "Режим перегляду відео"}
          className="absolute bottom-4 right-4 z-10 flex items-center justify-center w-9 h-9 rounded-full bg-black/30 hover:bg-black/50 backdrop-blur-sm border border-white/10 text-white/60 hover:text-white transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
        >
          <AnimatePresence mode="wait" initial={false}>
            {cinemaMode ? (
              <motion.span
                key="exit"
                aria-hidden="true"
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.7 }}
                transition={{ duration: 0.15 }}
              >
                <Shrink className="w-4 h-4" />
              </motion.span>
            ) : (
              <motion.span
                key="enter"
                aria-hidden="true"
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.7 }}
                transition={{ duration: 0.15 }}
              >
                <Fullscreen className="w-4 h-4" />
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </section>

      {/* STATS */}
      <FadeUp>
        <section className="border-b border-border">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-border">
              {[
                { value: 500, suffix: "+",   label: "Задоволених клієнтів" },
                { value: 15,  suffix: "%",   label: "Знижка від 100 шт" },
                { value: 14,  suffix: " дн", label: "Середній термін" },
                { value: 100, suffix: "%",   label: "Контроль якості" },
              ].map((s) => (
                <div key={s.label} className="py-6 px-4 sm:px-6 text-center">
                  <p className="text-2xl font-black text-primary">
                    <CountUp end={s.value} suffix={s.suffix} />
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 font-medium">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </FadeUp>

      {/* COLLECTIONS */}
      <section id="collections" className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
        <FadeUp>
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest mb-2 text-primary">Каталог</p>
              <h2 className="text-3xl font-black tracking-tight">Колекції</h2>
            </div>
            <Link href="/order" className="hidden sm:flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline transition-all duration-200">
              Всі товари <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </FadeUp>

        {hasCatalog && (
          <div className="flex gap-2 overflow-x-auto pb-6 -mx-1 px-1 scrollbar-hide">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex items-center gap-2 whitespace-nowrap px-5 py-2.5 rounded-full text-sm font-semibold transition-all border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  activeCategory === cat.id
                    ? "bg-primary text-primary-foreground border-primary shadow-md"
                    : "bg-background text-muted-foreground border-border hover:border-foreground/40 hover:shadow-sm"
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
        <FadeUp>
          <div className="mb-10">
            <p className="text-xs font-bold uppercase tracking-widest mb-2 text-primary">Додаткові послуги</p>
            <h2 className="text-3xl font-black tracking-tight">Більше, ніж просто мерч</h2>
          </div>
        </FadeUp>
        <StaggerGrid className="grid md:grid-cols-2 gap-5">
          <motion.div variants={cardVariant} className="relative bg-gray-900 rounded-2xl p-8 overflow-hidden flex flex-col justify-between min-h-[280px] hover:shadow-xl transition-shadow duration-300">
            <div>
              <span className="inline-block text-xs font-bold uppercase tracking-widest text-white/50 mb-4">Семпли</span>
              <h3 className="text-white text-2xl font-black mb-3">Box of Touch</h3>
              <p className="text-gray-400 text-sm leading-relaxed max-w-xs">Замов набір зразків тканин, кольорів та виробів — відчуй якість до того, як зробити тираж.</p>
            </div>
            <Link href="#contact" className="mt-6 inline-flex items-center gap-2 bg-white text-gray-900 text-sm font-bold px-5 py-2.5 rounded-full hover:bg-gray-100 hover:scale-105 active:scale-95 transition-all duration-200 w-fit">
              Замовити зразки <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
          <motion.div variants={cardVariant} className="relative rounded-2xl p-8 overflow-hidden flex flex-col justify-between min-h-[280px] border border-gray-200 hover:shadow-xl transition-shadow duration-300">
            <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('/designer-bg.jpg')" }} />
            <div className="absolute inset-0 bg-black/60" />
            <div className="relative z-10">
              <span className="inline-block text-xs font-bold uppercase tracking-widest mb-4 text-white/80">Дизайн</span>
              <h3 className="text-2xl font-black mb-3 text-white">Найми дизайнера</h3>
              <p className="text-white/90 text-sm leading-relaxed max-w-xs">Немає готового логотипу? Наш дизайнер допоможе створити фірмовий стиль або адаптує логотип для нанесення.</p>
            </div>
            <Link href="#contact" className="relative z-10 mt-6 inline-flex items-center gap-2 bg-primary text-primary-foreground text-sm font-bold px-5 py-2.5 rounded-full hover:bg-primary/90 hover:scale-105 active:scale-95 transition-all duration-200 w-fit">
              Обговорити проєкт <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </StaggerGrid>
      </section>

      {/* POPUP SERVICE */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
        <PopupSection />
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="py-20 sm:py-24 bg-primary">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <FadeUp>
            <div className="mb-14">
              <p className="text-xs font-bold text-white/60 uppercase tracking-widest mb-3">Процес</p>
              <h2 className="text-white text-3xl sm:text-4xl font-black tracking-tight">Кастомуй під свої цілі</h2>
            </div>
          </FadeUp>
          <StaggerGrid className="grid md:grid-cols-3 gap-4">
            {[
              { step: "01", title: "Обери товари", desc: "Переглядай каталог, фільтруй за категоріями. Обирай базу для свого мерчу — худі, футболки, аксесуари.", cta: "До каталогу", href: "#collections" },
              { step: "02", title: "Кастомуй одяг", desc: "Завантаж логотип, обери зону нанесення, розмір та колір. Переглянь попередній вигляд у реальному часі.", cta: "Спробувати", href: "/order" },
              { step: "03", title: "Отримай пропозицію", desc: "Заповни форму замовлення. Менеджер зв'яжеться з тобою для узгодження деталей та надішле рахунок.", cta: "Замовити", href: "#contact" },
            ].map((item) => (
              <motion.div
                key={item.step}
                variants={cardVariant}
                whileHover={{ scale: 1.03, y: -4 }}
                transition={{ duration: 0.2 }}
                className="bg-white/[0.08] hover:bg-white/[0.12] border border-white/15 rounded-2xl p-7 flex flex-col gap-5"
              >
                <span className="text-white/40 text-5xl font-black leading-none select-none">{item.step}</span>
                <div className="flex-1">
                  <h3 className="text-white font-bold text-lg mb-2">{item.title}</h3>
                  <p className="text-white/75 text-sm leading-relaxed">{item.desc}</p>
                </div>
                <Link href={item.href} className="inline-flex items-center gap-1.5 text-white font-semibold text-sm hover:gap-2.5 transition-all duration-200 underline-offset-2 hover:underline">
                  {item.cta} <ArrowRight className="w-4 h-4" />
                </Link>
              </motion.div>
            ))}
          </StaggerGrid>
        </div>
      </section>

      {/* WHY US */}
      <section className="bg-white py-24 sm:py-32">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <FadeUp>
            <div className="mb-16 text-center">
              <p className="text-xs font-bold uppercase tracking-widest mb-4 text-primary">Чому ми</p>
              <h2 className="text-4xl sm:text-5xl font-black tracking-tight">Якість, яку відчуваєш</h2>
            </div>
          </FadeUp>
          <StaggerGrid className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { icon: "🎨", title: "Онлайн-редактор",   desc: "Завантажуй логотип, розміщуй на виробі та одразу бачиш результат. Без зайвих листів і погоджень." },
              { icon: "📦", title: "Від 10 одиниць",     desc: "Не потрібно замовляти сотні. Починай з малого тиражу — ідеально для стартапів і команд." },
              { icon: "💳", title: "Прозора ціна",       desc: "Рахунок-фактура одразу після замовлення. Ніяких прихованих доплат — тільки чесна ціна." },
              { icon: "⚡", title: "Швидке виробництво", desc: "7–14 робочих днів від підтвердження до доставки. Дедлайн — це не проблема." },
              { icon: "🔒", title: "Контроль якості",    desc: "Кожна партія проходить перевірку перед відправкою. Ми відповідаємо за результат." },
              { icon: "💬", title: "Особистий менеджер", desc: "Ваш менеджер на зв'язку від першого запиту до отримання замовлення." },
            ].map((f) => (
              <motion.div
                key={f.title}
                variants={cardVariant}
                whileHover={{ y: -6, scale: 1.02 }}
                transition={{ duration: 0.2 }}
                className="bg-card rounded-3xl p-8 border border-border hover:shadow-xl hover:border-border/80 transition-all duration-300"
              >
                <span className="text-3xl mb-6 block" aria-hidden="true">{f.icon}</span>
                <h3 className="font-bold text-foreground text-lg mb-3">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </StaggerGrid>
        </div>
      </section>

      {/* Section divider */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="border-t border-border" />
      </div>

      {/* TESTIMONIALS */}
      <section className="bg-white py-24 sm:py-32">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <FadeUp>
            <div className="mb-16">
              <p className="text-xs font-bold uppercase tracking-widest mb-4 text-primary">Відгуки</p>
              <h2 className="text-4xl sm:text-5xl font-black tracking-tight">Що кажуть клієнти</h2>
            </div>
          </FadeUp>
          <StaggerGrid className="grid md:grid-cols-3 gap-5">
            {[
              { name: "Олена Коваль",      role: "HR Director, TechCorp",      avatar: "ОК", text: "Замовляли корпоративні худі для команди 80 осіб. Якість перевершила очікування — люди носять їх не лише на роботі. Менеджер був на зв'язку на кожному етапі.", rating: 5 },
              { name: "Максим Бондаренко", role: "Co-founder, StartupUA",      avatar: "МБ", text: "Спочатку замовили Box of Touch — це вирішило всі сумніви щодо якості. Потім зробили тираж 200 футболок для конференції. Все вчасно і без нервів.", rating: 5 },
              { name: "Аліна Мороз",       role: "Brand Manager, RetailGroup", avatar: "АМ", text: "Зверталися за допомогою дизайнера — адаптували логотип під вишивку. Результат виглядає дуже преміально. Клієнти постійно питають, де ми це замовляли.", rating: 5 },
            ].map((t) => (
              <motion.div
                key={t.name}
                variants={cardVariant}
                whileHover={{ y: -6 }}
                transition={{ duration: 0.2 }}
                className="bg-card rounded-3xl p-8 border border-border flex flex-col gap-6 hover:shadow-xl hover:border-border/80 transition-all duration-300"
              >
                <div className="flex gap-1" aria-label={`Оцінка: ${t.rating} з 5`}>
                  {[...Array(t.rating)].map((_, i) => (
                    <svg key={i} className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20" aria-hidden="true">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-foreground text-base leading-relaxed flex-1">&ldquo;{t.text}&rdquo;</p>
                <div className="flex items-center gap-4 pt-4 border-t border-border">
                  <div className="w-11 h-11 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-primary-foreground shrink-0" aria-hidden="true">
                    {t.avatar}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{t.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{t.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </StaggerGrid>
        </div>
      </section>

      {/* CONTACT */}
      <section id="contact" className="bg-gray-950 pt-0 pb-0">
        <div className="bg-gray-950 py-20 sm:py-28">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-start">
              <FadeUp>
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest mb-5 text-primary">Контакти</p>
                  <h2 className="text-white text-4xl sm:text-5xl font-black tracking-tight leading-[1.05] mb-6">
                    Зв&apos;яжіться<br />з нами
                  </h2>
                  <p className="text-gray-400 text-base leading-relaxed mb-10 max-w-sm">
                    Розкажіть про ваш проєкт — ми підберемо оптимальне рішення та надішлемо пропозицію протягом 24 годин.
                  </p>
                  <div className="space-y-5 mb-10">
                    {[
                      { label: "Email",   value: "info@udocraft.com",              href: "mailto:info@udocraft.com" },
                      { label: "Телефон", value: "+380 63 070 33 072",             href: "tel:+380630703072" },
                      { label: "Адреса",  value: "м. Львів, вул. Джерельна, 69",  href: "#" },
                    ].map((c) => (
                      <a key={c.label} href={c.href}
                        className="group flex items-start gap-4 hover:opacity-80 transition-opacity duration-200">
                        <span className="text-[10px] font-bold text-gray-600 uppercase tracking-widest w-16 pt-1 shrink-0">{c.label}</span>
                        <span className="text-gray-300 text-sm group-hover:text-white transition-colors duration-200">{c.value}</span>
                      </a>
                    ))}
                  </div>
                  <div className="flex gap-3">
                    <a href="https://www.instagram.com/u.do.craft/" target="_blank" rel="noopener noreferrer"
                      className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40">
                      <Instagram className="w-4 h-4" aria-hidden="true" />
                    </a>
                    <a href="https://t.me/udostore" target="_blank" rel="noopener noreferrer"
                      className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40">
                      <Send className="w-4 h-4" aria-hidden="true" />
                    </a>
                  </div>
                </div>
              </FadeUp>
              <FadeUp delay={0.15}>
                <ContactForm />
              </FadeUp>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-gray-950 text-gray-400">

        {/* Main footer grid */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-16 pb-10">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-10 md:gap-8">

            {/* Brand column */}
            <div className="col-span-2 md:col-span-1 flex flex-col gap-5">
              <Link href="/" aria-label="U:DO CRAFT">
                <BrandLogoFull className="h-8 w-auto" color="var(--color-primary)" />
              </Link>
              <p className="text-xs leading-relaxed text-gray-500 max-w-[180px]">
                B2B мерч-платформа для команд, брендів та подій.
              </p>
              <div className="flex items-center gap-3">
                <a href="https://www.instagram.com/u.do.craft/" target="_blank" rel="noopener noreferrer"
                  aria-label="Instagram"
                  className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all duration-200">
                  <Instagram className="w-3.5 h-3.5" aria-hidden="true" />
                </a>
                <a href="https://t.me/udostore" target="_blank" rel="noopener noreferrer"
                  aria-label="Telegram"
                  className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all duration-200">
                  <Send className="w-3.5 h-3.5" aria-hidden="true" />
                </a>
              </div>
            </div>

            {/* Products */}
            <div className="flex flex-col gap-4">
              <p className="text-white text-xs font-semibold tracking-wide">Продукти</p>
              <nav className="flex flex-col gap-2.5" aria-label="Продукти">
                {[
                  { href: "/order",    label: "Конструктор мерчу" },
                  { href: "#collections", label: "Каталог" },
                  { href: "/popup",    label: "Popup-стенд" },
                  { href: "#contact",  label: "Box of Touch" },
                  { href: "#contact",  label: "Найми дизайнера" },
                ].map((l) => (
                  <Link key={l.label} href={l.href}
                    className="text-xs text-gray-500 hover:text-gray-200 transition-colors duration-200 w-fit focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 rounded">
                    {l.label}
                  </Link>
                ))}
              </nav>
            </div>

            {/* Company */}
            <div className="flex flex-col gap-4">
              <p className="text-white text-xs font-semibold tracking-wide">Компанія</p>
              <nav className="flex flex-col gap-2.5" aria-label="Компанія">
                {[
                  { href: "#how",     label: "Як це працює" },
                  { href: "#contact", label: "Про нас" },
                  { href: "#contact", label: "Кар'єра" },
                  { href: "#contact", label: "Блог" },
                ].map((l) => (
                  <Link key={l.label} href={l.href}
                    className="text-xs text-gray-500 hover:text-gray-200 transition-colors duration-200 w-fit focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 rounded">
                    {l.label}
                  </Link>
                ))}
              </nav>
            </div>

            {/* Support */}
            <div className="flex flex-col gap-4">
              <p className="text-white text-xs font-semibold tracking-wide">Підтримка</p>
              <nav className="flex flex-col gap-2.5" aria-label="Підтримка">
                {[
                  { href: "#contact", label: "Зв'язатись з нами" },
                  { href: "/cabinet", label: "Особистий кабінет" },
                  { href: "#contact", label: "FAQ" },
                  { href: "#contact", label: "Доставка та оплата" },
                ].map((l) => (
                  <Link key={l.label} href={l.href}
                    className="text-xs text-gray-500 hover:text-gray-200 transition-colors duration-200 w-fit focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 rounded">
                    {l.label}
                  </Link>
                ))}
              </nav>
            </div>

            {/* Contact */}
            <div className="flex flex-col gap-4">
              <p className="text-white text-xs font-semibold tracking-wide">Контакти</p>
              <div className="flex flex-col gap-2.5">
                <a href="mailto:info@udocraft.com"
                  className="text-xs text-gray-500 hover:text-gray-200 transition-colors duration-200 w-fit">
                  info@udocraft.com
                </a>
                <a href="tel:+380630703072"
                  className="text-xs text-gray-500 hover:text-gray-200 transition-colors duration-200 w-fit">
                  +380 63 070 33 072
                </a>
                <p className="text-xs text-gray-600 leading-relaxed">
                  м. Львів,<br />вул. Джерельна, 69<br />Офіс 10
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-white/[0.06]" />

        {/* Bottom bar */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-[11px] text-gray-600 text-center sm:text-left">
            © {new Date().getFullYear()} U:DO CRAFT. Всі права захищені.
          </p>
          <div className="flex items-center gap-5">
            {[
              { href: "#", label: "Політика конфіденційності" },
              { href: "#", label: "Умови використання" },
              { href: "#", label: "Cookies" },
            ].map((l) => (
              <Link key={l.label} href={l.href}
                className="text-[11px] text-gray-600 hover:text-gray-400 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 rounded">
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
