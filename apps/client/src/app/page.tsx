import { createClient } from "@/lib/supabase/server";
import { HomeClient } from "@/app/_components/HomeClient";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "U:DO CRAFT — B2B мерч-платформа",
  description: "Одяг, який стає частиною вашої корпоративної ДНК",
  openGraph: {
    title: "U:DO CRAFT — B2B мерч-платформа",
    description: "Одяг, який стає частиною вашої корпоративної ДНК",
    type: "website",
    url: "https://udocraft.com",
    siteName: "U:DO CRAFT",
  },
};

export default async function HomePage() {
  const supabase = await createClient();

  const [prodRes, catRes, matRes, varRes] = await Promise.all([
    supabase.from("products").select("*").order("created_at", { ascending: true }),
    supabase.from("categories").select("*").eq("is_active", true).order("sort_order", { ascending: true }),
    supabase.from("materials").select("*").eq("is_active", true),
    supabase.from("product_color_variants").select("*").eq("is_active", true).order("sort_order", { ascending: true }),
  ]);

  return (
    <HomeClient
      products={prodRes.data || []}
      categories={catRes.data || []}
      materials={matRes.data || []}
      colorVariants={varRes.data || []}
    />
  );
}
