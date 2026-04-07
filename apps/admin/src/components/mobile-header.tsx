"use client";

import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import { SidebarTrigger } from "@/components/ui/sidebar";

export function MobileHeader() {
  return (
    <header className="flex md:hidden items-center justify-between h-12 px-3 border-b border-border bg-background shrink-0 sticky top-0 z-40">
      <SidebarTrigger />
      <Link href="/" aria-label="U:DO CRAFT" className="absolute left-1/2 -translate-x-1/2">
        <BrandLogo />
      </Link>
    </header>
  );
}
