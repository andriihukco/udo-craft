import type { Metadata } from "next";
import { Cousine } from "next/font/google";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/sonner";
import { ClarityInit } from "@/components/clarity";
import "./globals.css";

const cousine = Cousine({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "700"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "U:DO Craft — Адмін панель",
  description: "B2B мерч-автоматизація. Панель управління.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uk" className={cn(cousine.variable)}>
      <body className="min-h-screen bg-background">
        <ClarityInit />
        {children}
        <Toaster theme="light" toastOptions={{ style: { background: "white", border: "1px solid #e5e7eb", color: "#111827" } }} />
      </body>
    </html>
  );
}
