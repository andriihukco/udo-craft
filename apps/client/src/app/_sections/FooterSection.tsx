"use client";

import Link from "next/link";
import { Instagram, Send } from "lucide-react";
import { BrandLogoFull } from "@/components/brand-logo";

interface FooterSectionProps {
  tagline: string;
  copyright: string;
  instagram: string;
  telegram: string;
}

const FOOTER_LINKS = {
  products: [
    { href: "/order", label: "Конструктор мерчу" },
    { href: "#collections", label: "Каталог" },
    { href: "/popup", label: "Popup-стенд" },
    { href: "#contact", label: "Box of Touch" },
    { href: "#contact", label: "Найми дизайнера" },
  ],
  company: [
    { href: "#how", label: "Як це працює" },
    { href: "#about", label: "Про нас" },
    { href: "#contact", label: "Кар'єра" },
    { href: "#contact", label: "Блог" },
  ],
  support: [
    { href: "#contact", label: "Зв'язатись з нами" },
    { href: "/cabinet", label: "Особистий кабінет" },
    { href: "#contact", label: "FAQ" },
    { href: "#contact", label: "Доставка та оплата" },
  ],
};

export function FooterSection({ tagline, copyright, instagram, telegram }: FooterSectionProps) {
  return (
    <footer className="bg-[#080810] text-white/40">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-16 pb-10">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10 md:gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1 flex flex-col gap-5">
            <Link href="/" aria-label="U:DO CRAFT">
              <BrandLogoFull className="h-7 w-auto" color="var(--color-primary)" />
            </Link>
            <p className="text-xs leading-relaxed text-white/25 max-w-[180px]">{tagline}</p>
            <div className="flex items-center gap-3">
              <a
                href={instagram}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="w-8 h-8 rounded-full bg-white/5 border border-white/8 flex items-center justify-center text-white/30 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all duration-200"
              >
                <Instagram className="w-3.5 h-3.5" aria-hidden="true" />
              </a>
              <a
                href={telegram}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Telegram"
                className="w-8 h-8 rounded-full bg-white/5 border border-white/8 flex items-center justify-center text-white/30 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all duration-200"
              >
                <Send className="w-3.5 h-3.5" aria-hidden="true" />
              </a>
            </div>
          </div>

          {/* Products */}
          <div className="flex flex-col gap-4">
            <p className="text-white/70 text-xs font-semibold tracking-wide">Продукти</p>
            <nav className="flex flex-col gap-2.5" aria-label="Продукти">
              {FOOTER_LINKS.products.map((l) => (
                <Link
                  key={l.label}
                  href={l.href}
                  className="text-xs text-white/30 hover:text-white/60 transition-colors duration-200 w-fit"
                >
                  {l.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Company */}
          <div className="flex flex-col gap-4">
            <p className="text-white/70 text-xs font-semibold tracking-wide">Компанія</p>
            <nav className="flex flex-col gap-2.5" aria-label="Компанія">
              {FOOTER_LINKS.company.map((l) => (
                <Link
                  key={l.label}
                  href={l.href}
                  className="text-xs text-white/30 hover:text-white/60 transition-colors duration-200 w-fit"
                >
                  {l.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Support */}
          <div className="flex flex-col gap-4">
            <p className="text-white/70 text-xs font-semibold tracking-wide">Підтримка</p>
            <nav className="flex flex-col gap-2.5" aria-label="Підтримка">
              {FOOTER_LINKS.support.map((l) => (
                <Link
                  key={l.label}
                  href={l.href}
                  className="text-xs text-white/30 hover:text-white/60 transition-colors duration-200 w-fit"
                >
                  {l.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Contact */}
          <div className="flex flex-col gap-4">
            <p className="text-white/70 text-xs font-semibold tracking-wide">Контакти</p>
            <div className="flex flex-col gap-2.5">
              <a
                href="mailto:info@udocraft.com"
                className="text-xs text-white/30 hover:text-white/60 transition-colors duration-200 w-fit"
              >
                info@udocraft.com
              </a>
              <a
                href="tel:+380630703072"
                className="text-xs text-white/30 hover:text-white/60 transition-colors duration-200 w-fit"
              >
                +380 63 070 33 072
              </a>
              <p className="text-xs text-white/20 leading-relaxed">
                м. Львів,
                <br />
                вул. Джерельна, 69
                <br />
                Офіс 10
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-white/5" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
        <p className="text-[11px] text-white/20 text-center sm:text-left">
          © {new Date().getFullYear()} {copyright}
        </p>
        <div className="flex items-center gap-5">
          {[
            { href: "/privacy", label: "Політика конфіденційності" },
            { href: "/terms", label: "Умови використання" },
            { href: "#", label: "Cookies" },
          ].map((l) => (
            <Link
              key={l.label}
              href={l.href}
              className="text-[11px] text-white/20 hover:text-white/40 transition-colors duration-200"
            >
              {l.label}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  );
}
