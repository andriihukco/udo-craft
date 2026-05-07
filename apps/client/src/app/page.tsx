"use client";

import { useState, useEffect } from "react";
import { Product, Material, ProductColorVariant } from "@udo-craft/shared";
import { LogoLoader } from "@udo-craft/ui";
import { createClient } from "@/lib/supabase/client";
import { useCms } from "@/hooks/useCms";
import { useCart } from "@/hooks/useCart";
import { useSoundInit } from "@/hooks/useSoundInit";

import { NavBar } from "@/app/_components/NavBar";
import { CartSidebar } from "@/app/_components/CartSidebar";
import { AuthModal } from "@/components/AuthModal";

// Sections — ordered by AIDA + conversion best practices
import { HeroSection } from "@/app/_sections/HeroSection";
import { SocialProofBar } from "@/app/_sections/SocialProofBar";
import { ProblemSolutionSection } from "@/app/_sections/ProblemSolutionSection";
import { StatsSection } from "@/app/_sections/StatsSection";
import { CollectionsSection } from "@/app/_sections/CollectionsSection";
import { ProcessSection } from "@/app/_sections/ProcessSection";
import { BoxOfTouchSection } from "@/app/_sections/BoxOfTouchSection";
import { PopupStandSection } from "@/app/_sections/PopupStandSection";
import { DesignerSection } from "@/app/_sections/DesignerSection";
import { TrustSection } from "@/app/_sections/TrustSection";
import { ComparisonSection } from "@/app/_sections/ComparisonSection";
import { TestimonialsSection } from "@/app/_sections/TestimonialsSection";
import { FaqSection } from "@/app/_sections/FaqSection";
import { FinalCtaSection } from "@/app/_sections/FinalCtaSection";
import { ContactSection } from "@/app/_sections/ContactSection";
import { FooterSection } from "@/app/_sections/FooterSection";

interface Category {
  id: string; name: string; slug: string;
  sort_order: number; is_active: boolean; image_url?: string | null;
}
interface ProductWithCategory extends Product { category_id?: string | null; }

export default function HomePage() {
  const { get } = useCms();
  const supabase = createClient();

  const [products, setProducts] = useState<ProductWithCategory[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [colorVariants, setColorVariants] = useState<ProductColorVariant[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [cinemaMode, setCinemaMode] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);

  const { cart, cartCount, totalCents } = useCart();
  useSoundInit();

  useEffect(() => {
    void supabase.auth.getSession().then((r: { data: { session: unknown } }) => setIsLoggedIn(!!r.data.session));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    Promise.all([
      supabase.from("products").select("*").order("created_at", { ascending: true }),
      supabase.from("categories").select("*").eq("is_active", true).order("sort_order", { ascending: true }),
      supabase.from("materials").select("*").eq("is_active", true),
      supabase.from("product_color_variants").select("*").eq("is_active", true).order("sort_order", { ascending: true }),
    ])
      .then(([prodRes, catRes, matRes, varRes]) => {
        setProducts((prodRes.data || []) as ProductWithCategory[]);
        setCategories((catRes.data || []) as Category[]);
        setMaterials((matRes.data || []) as Material[]);
        setColorVariants((varRes.data || []) as ProductColorVariant[]);
        setLoading(false);
      })
      .catch((err) => { console.error("Database error:", err); setLoading(false); });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) return <LogoLoader />;

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden scroll-smooth">
      <NavBar isLoggedIn={isLoggedIn} cartCount={cartCount} onCartOpen={() => setCartOpen(true)} cinemaMode={cinemaMode} onAuthOpen={() => setAuthOpen(true)} />
      <CartSidebar open={cartOpen} onClose={() => setCartOpen(false)} cart={cart} cartCount={cartCount} totalCents={totalCents} />
      <AuthModal
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        onAuthSuccess={() => { setIsLoggedIn(true); setAuthOpen(false); }}
      />

      {/* A — Attention */}
      <HeroSection
        cinemaMode={cinemaMode}
        onCinemaEnter={() => setCinemaMode(true)}
        onCinemaExit={() => setCinemaMode(false)}
        heading={get("home_hero", "heading", "Одяг, який стає частиною вашої корпоративної ДНК")}
        subheading={get("home_hero", "subheading", "Ринок перенасичений дешевим трендовим одягом. Ми створюємо речі, які стають улюбленими в гардеробі.")}
        ctaPrimaryText={get("home_hero", "cta_primary_text", "Переглянути каталог")}
        ctaPrimaryUrl={get("home_hero", "cta_primary_url", "#collections")}
        ctaSecondaryText={get("home_hero", "cta_secondary_text", "Дивитись відео")}
        badge1={get("home_hero", "badge1", "Від 10 одиниць")}
        badge2={get("home_hero", "badge2", "Гарантія якості")}
        badge3={get("home_hero", "badge3", "7–14 днів на виготовлення")}
      />

      {/* I — Interest: social proof immediately after hero */}
      <SocialProofBar />

      {/* I — Problem/Solution */}
      <ProblemSolutionSection />

      {/* I — Numbers that matter */}
      <StatsSection
        stat1Value={Number(get("home_stats", "stat1_value", "500"))}
        stat1Suffix={get("home_stats", "stat1_suffix", "+")}
        stat1Label={get("home_stats", "stat1_label", "Задоволених клієнтів")}
        stat2Value={Number(get("home_stats", "stat2_value", "15"))}
        stat2Suffix={get("home_stats", "stat2_suffix", "%")}
        stat2Label={get("home_stats", "stat2_label", "Знижка від 100 шт")}
        stat3Value={Number(get("home_stats", "stat3_value", "14"))}
        stat3Suffix={get("home_stats", "stat3_suffix", " дн")}
        stat3Label={get("home_stats", "stat3_label", "Середній термін")}
        stat4Value={Number(get("home_stats", "stat4_value", "100"))}
        stat4Suffix={get("home_stats", "stat4_suffix", "%")}
        stat4Label={get("home_stats", "stat4_label", "Контроль якості")}
      />

      {/* D — Desire: show the product */}
      <CollectionsSection products={products} categories={categories} materials={materials} colorVariants={colorVariants} />

      {/* D — How it works */}
      <ProcessSection />

      {/* A — Action: Box of Touch lead magnet */}
      <BoxOfTouchSection />

      {/* D — Services: Popup */}
      <PopupStandSection />

      {/* D — Services: Designer */}
      <DesignerSection />

      {/* Trust — why us */}
      <TrustSection />

      {/* Trust — vs competition */}
      <ComparisonSection />

      {/* Trust — social proof */}
      <TestimonialsSection />

      {/* Objection handling */}
      <FaqSection />

      {/* Final conversion */}
      <FinalCtaSection />

      {/* Contact */}
      <ContactSection
        heading={get("home_contact", "heading", "Зв'яжіться з нами")}
        subtext={get("home_contact", "subtext", "Розкажіть про ваш проєкт — надішлемо пропозицію протягом 24 годин.")}
        email={get("home_contact", "email", "info@udocraft.com")}
        phone={get("home_contact", "phone", "+380 63 070 33 072")}
        address={get("home_contact", "address", "м. Львів, вул. Джерельна, 69")}
        instagram={get("home_contact", "instagram", "https://www.instagram.com/u.do.craft/")}
        telegram={get("home_contact", "telegram", "https://t.me/udostore")}
      />

      {/* Footer */}
      <FooterSection
        tagline={get("footer", "tagline", "B2B мерч-платформа для команд, брендів та подій.")}
        copyright={get("footer", "copyright", "U:DO CRAFT. Всі права захищені.")}
        instagram={get("home_contact", "instagram", "https://www.instagram.com/u.do.craft/")}
        telegram={get("home_contact", "telegram", "https://t.me/udostore")}
      />
    </div>
  );
}
