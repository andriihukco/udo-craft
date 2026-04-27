"use client";

import { useState, useEffect } from "react";
import { Product, Material, ProductColorVariant } from "@udo-craft/shared";
import { LogoLoader } from "@udo-craft/ui";
import { createClient } from "@/lib/supabase/client";
import { useCms } from "@/hooks/useCms";
import { useCart } from "@/hooks/useCart";

import { NavBar } from "@/app/_components/NavBar";
import { CartSidebar } from "@/app/_components/CartSidebar";
import { HeroSection } from "@/app/_sections/HeroSection";
import { SocialProofBar } from "@/app/_sections/SocialProofBar";
import { ProblemSolutionSection } from "@/app/_sections/ProblemSolutionSection";
import { StatsSection } from "@/app/_sections/StatsSection";
import { CollectionsSection } from "@/app/_sections/CollectionsSection";
import { HowItWorksSection } from "@/app/_sections/HowItWorksSection";
import { LeadMagnetSection } from "@/app/_sections/LeadMagnetSection";
import { ServicesSection } from "@/app/_sections/ServicesSection";
import { TestimonialsSection } from "@/app/_sections/TestimonialsSection";
import { FaqSection } from "@/app/_sections/FaqSection";
import { AboutSection } from "@/app/_sections/AboutSection";
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

  const { cart, cartCount, totalCents } = useCart();

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
      <NavBar isLoggedIn={isLoggedIn} cartCount={cartCount} onCartOpen={() => setCartOpen(true)} cinemaMode={cinemaMode} />
      <CartSidebar open={cartOpen} onClose={() => setCartOpen(false)} cart={cart} cartCount={cartCount} totalCents={totalCents} />

      {/* 1. Attention */}
      <HeroSection
        cinemaMode={cinemaMode}
        onCinemaEnter={() => setCinemaMode(true)}
        onCinemaExit={() => setCinemaMode(false)}
        heading={get("home_hero", "heading", "Одяг, який стає частиною вашої корпоративної ДНК")}
        subheading={get("home_hero", "subheading", "Ринок перенасичений дешевим трендовим одягом. Ми створюємо речі, які стають улюбленими в гардеробі.")}
        ctaPrimaryText={get("home_hero", "cta_primary_text", "Переглянути каталог")}
        ctaPrimaryUrl={get("home_hero", "cta_primary_url", "#collections")}
        ctaSecondaryText={get("home_hero", "cta_secondary_text", "Дивитись відео")}
        ctaSecondaryUrl={get("home_hero", "cta_secondary_url", "#contact")}
        badge1={get("home_hero", "badge1", "Від 10 одиниць")}
        badge2={get("home_hero", "badge2", "Гарантія якості")}
        badge3={get("home_hero", "badge3", "7–14 днів на виготовлення")}
      />

      {/* 2. Trust signal */}
      <SocialProofBar />

      {/* 3. Interest — problem/solution */}
      <ProblemSolutionSection />

      {/* 4. Stats */}
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

      {/* 5. Desire — product */}
      <CollectionsSection products={products} categories={categories} materials={materials} colorVariants={colorVariants} />

      {/* 6. How it works */}
      <HowItWorksSection />

      {/* 7. Lead magnet — Action trigger */}
      <LeadMagnetSection />

      {/* 8. Services */}
      <ServicesSection
        heading={get("home_services", "heading", "Більше, ніж просто мерч")}
        service1Title={get("home_services", "service1_title", "Box of Touch")}
        service1Desc={get("home_services", "service1_desc", "Замов набір зразків тканин, кольорів та виробів — відчуй якість до того, як зробити тираж.")}
        service1Cta={get("home_services", "service1_cta", "Замовити зразки")}
        service2Title={get("home_services", "service2_title", "Найми дизайнера")}
        service2Desc={get("home_services", "service2_desc", "Немає готового логотипу? Наш дизайнер допоможе створити фірмовий стиль або адаптує логотип для нанесення.")}
        service2Cta={get("home_services", "service2_cta", "Обговорити проєкт")}
      />

      {/* 9. Trust — testimonials */}
      <TestimonialsSection />

      {/* 10. Objection handling — FAQ */}
      <FaqSection />

      {/* 11. About */}
      <AboutSection />

      {/* 12. Final CTA */}
      <FinalCtaSection />

      {/* 13. Contact */}
      <ContactSection
        heading={get("home_contact", "heading", "Зв'яжіться з нами")}
        subtext={get("home_contact", "subtext", "Розкажіть про ваш проєкт — надішлемо пропозицію протягом 24 годин.")}
        email={get("home_contact", "email", "info@udocraft.com")}
        phone={get("home_contact", "phone", "+380 63 070 33 072")}
        address={get("home_contact", "address", "м. Львів, вул. Джерельна, 69")}
        instagram={get("home_contact", "instagram", "https://www.instagram.com/u.do.craft/")}
        telegram={get("home_contact", "telegram", "https://t.me/udostore")}
      />

      {/* 14. Footer */}
      <FooterSection
        tagline={get("footer", "tagline", "B2B мерч-платформа для команд, брендів та подій.")}
        copyright={get("footer", "copyright", "U:DO CRAFT. Всі права захищені.")}
        instagram={get("home_contact", "instagram", "https://www.instagram.com/u.do.craft/")}
        telegram={get("home_contact", "telegram", "https://t.me/udostore")}
      />
    </div>
  );
}
