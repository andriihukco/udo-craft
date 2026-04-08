import type { Metadata } from "next";
import { Cousine } from "next/font/google";
import { cn } from "@/lib/utils";
import { PageTracker } from "@/components/PageTracker";
import { Toaster } from "@/components/ui/sonner";
import { ClarityInit } from "@/components/clarity";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const cousine = Cousine({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "700"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "U:DO CRAFT — Корпоративний мерч, який носять",
  description: "B2B мерч-автоматизація. Ми створюємо одяг, який стає частиною вашої корпоративної ДНК.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uk" className={cn(cousine.variable)}>
      <body className="min-h-screen bg-background text-foreground antialiased">
        <ClarityInit clarityId="w7kk9avzfh" />
        <PageTracker />
        {children}
        <Toaster richColors position="top-right" />
        <Analytics />
      </body>
    </html>
  );
}
