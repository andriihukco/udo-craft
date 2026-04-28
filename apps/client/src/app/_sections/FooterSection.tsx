"use client";

import Link from "next/link";
import { Instagram, Send, ArrowRight } from "lucide-react";

interface FooterSectionProps {
  tagline: string; copyright: string; instagram: string; telegram: string;
}

const NAV = [
  {
    title: "Продукти",
    links: [
      { href: "/order", label: "Конструктор мерчу" },
      { href: "#collections", label: "Каталог" },
      { href: "/popup", label: "Popup-стенд" },
      { href: "#contact", label: "Box of Touch" },
      { href: "#contact", label: "Найми дизайнера" },
    ],
  },
  {
    title: "Компанія",
    links: [
      { href: "#about", label: "Про нас" },
      { href: "#how", label: "Як це працює" },
      { href: "#contact", label: "Кар'єра" },
      { href: "#contact", label: "Блог" },
    ],
  },
  {
    title: "Підтримка",
    links: [
      { href: "#faq", label: "FAQ" },
      { href: "#contact", label: "Зв'язатись" },
      { href: "/cabinet", label: "Кабінет" },
      { href: "#contact", label: "Доставка та оплата" },
    ],
  },
];

export function FooterSection({ tagline, copyright, instagram, telegram }: FooterSectionProps) {
  return (
    <footer className="bg-[#06060e]" aria-label="Підвал сайту">
      {/* Pre-footer CTA strip */}
      <div className="border-t border-white/8">
        <div className="max-w-6xl mx-auto px-5 sm:px-10 lg:px-20 py-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <p className="text-white font-bold text-base mb-1">Готові почати?</p>
            <p className="text-white/45 text-sm">Від 10 одиниць · 7–14 днів · Доставка по Україні</p>
          </div>
          <Link href="/order"
            className="inline-flex items-center gap-2 bg-primary text-white font-semibold text-sm px-6 py-3 rounded-full hover:bg-primary/90 active:scale-[0.97] transition-all duration-200 shrink-0">
            Почати проєкт <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </Link>
        </div>
      </div>

      {/* Main footer */}
      <div className="border-t border-white/5">
        <div className="max-w-6xl mx-auto px-5 sm:px-10 lg:px-20 pt-14 pb-10">
          <div className="grid grid-cols-2 md:grid-cols-[1.5fr_1fr_1fr_1fr] gap-10 md:gap-8">

            {/* Brand */}
            <div className="col-span-2 md:col-span-1 flex flex-col gap-5">
              <Link href="/" aria-label="U:DO CRAFT — на головну">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logo-inverted.png" alt="U:DO CRAFT" className="h-10 w-auto" />
              </Link>
              <p className="text-white/35 text-xs leading-relaxed max-w-[200px]">{tagline}</p>
              <div className="flex gap-2">
                {[
                  { href: instagram, icon: Instagram, label: "Instagram" },
                  { href: telegram, icon: Send, label: "Telegram" },
                ].map((s) => {
                  const Icon = s.icon;
                  return (
                    <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer"
                      aria-label={s.label}
                      className="w-8 h-8 rounded-full bg-white/5 border border-white/8 flex items-center justify-center text-white/30 hover:text-white hover:bg-white/10 hover:border-white/15 transition-all duration-200">
                      <Icon className="w-3.5 h-3.5" aria-hidden="true" />
                    </a>
                  );
                })}
              </div>
            </div>

            {/* Nav columns */}
            {NAV.map((col) => (
              <div key={col.title} className="flex flex-col gap-4">
                <p className="text-white/50 text-xs font-semibold tracking-wide">{col.title}</p>
                <nav className="flex flex-col gap-2.5" aria-label={col.title}>
                  {col.links.map((l) => (
                    <Link key={l.label} href={l.href}
                      className="text-xs text-white/30 hover:text-white/60 transition-colors duration-200 w-fit">
                      {l.label}
                    </Link>
                  ))}
                </nav>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/5">
        <div className="max-w-6xl mx-auto px-5 sm:px-10 lg:px-20 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-[11px] text-white/20">© {new Date().getFullYear()} {copyright}</p>
          <div className="flex gap-5">
            {[
              { href: "/privacy", label: "Конфіденційність" },
              { href: "/terms", label: "Умови" },
              { href: "#", label: "Cookies" },
            ].map((l) => (
              <Link key={l.label} href={l.href}
                className="text-[11px] text-white/20 hover:text-white/45 transition-colors duration-200">
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
