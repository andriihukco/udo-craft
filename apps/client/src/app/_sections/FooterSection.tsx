"use client";

import Link from "next/link";
import { Instagram, Send } from "lucide-react";
import { BrandLogoFull } from "@/components/brand-logo";

interface FooterSectionProps {
  tagline: string; copyright: string; instagram: string; telegram: string;
}

export function FooterSection({ tagline, copyright, instagram, telegram }: FooterSectionProps) {
  return (
    <footer className="bg-[#050508] border-t border-white/5">
      <div className="max-w-6xl mx-auto px-5 sm:px-8 lg:px-16 pt-14 pb-8">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10 md:gap-8 mb-14">
          <div className="col-span-2 md:col-span-1 flex flex-col gap-5">
            <Link href="/" aria-label="U:DO CRAFT">
              <BrandLogoFull className="h-7 w-auto" color="var(--color-primary)" />
            </Link>
            <p className="text-xs leading-relaxed text-white/20 max-w-[180px]">{tagline}</p>
            <div className="flex gap-2.5">
              {[{ href: instagram, icon: <Instagram className="w-3.5 h-3.5" />, label: "Instagram" }, { href: telegram, icon: <Send className="w-3.5 h-3.5" />, label: "Telegram" }].map((s) => (
                <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" aria-label={s.label}
                  className="w-8 h-8 rounded-full bg-white/5 border border-white/8 flex items-center justify-center text-white/25 hover:text-white hover:bg-white/10 hover:border-white/15 transition-all duration-200">
                  {s.icon}
                </a>
              ))}
            </div>
          </div>

          {[
            { title: "Продукти", links: [{ href: "/order", label: "Конструктор мерчу" }, { href: "#collections", label: "Каталог" }, { href: "/popup", label: "Popup-стенд" }, { href: "#contact", label: "Box of Touch" }, { href: "#contact", label: "Найми дизайнера" }] },
            { title: "Компанія", links: [{ href: "#how", label: "Як це працює" }, { href: "#about", label: "Про нас" }, { href: "#contact", label: "Кар'єра" }, { href: "#contact", label: "Блог" }] },
            { title: "Підтримка", links: [{ href: "#contact", label: "Зв'язатись" }, { href: "/cabinet", label: "Кабінет" }, { href: "#contact", label: "FAQ" }, { href: "#contact", label: "Доставка та оплата" }] },
            { title: "Контакти", links: [{ href: "mailto:info@udocraft.com", label: "info@udocraft.com" }, { href: "tel:+380630703072", label: "+380 63 070 33 072" }, { href: "#", label: "м. Львів, вул. Джерельна, 69" }] },
          ].map((col) => (
            <div key={col.title} className="flex flex-col gap-4">
              <p className="text-white/50 text-xs font-semibold tracking-wide">{col.title}</p>
              <nav className="flex flex-col gap-2.5">
                {col.links.map((l) => (
                  <Link key={l.label} href={l.href} className="text-xs text-white/25 hover:text-white/50 transition-colors duration-200 w-fit">{l.label}</Link>
                ))}
              </nav>
            </div>
          ))}
        </div>

        <div className="border-t border-white/5 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-[11px] text-white/15">© {new Date().getFullYear()} {copyright}</p>
          <div className="flex gap-5">
            {[{ href: "/privacy", label: "Конфіденційність" }, { href: "/terms", label: "Умови" }, { href: "#", label: "Cookies" }].map((l) => (
              <Link key={l.label} href={l.href} className="text-[11px] text-white/15 hover:text-white/35 transition-colors duration-200">{l.label}</Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
