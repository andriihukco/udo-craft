"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, ShoppingBag, ArrowRight, X, Menu } from "lucide-react";
import { BrandLogoFull } from "@/components/brand-logo";

interface NavBarProps {
  isLoggedIn: boolean;
  cartCount: number;
  onCartOpen: () => void;
  cinemaMode: boolean;
}

const navLinks = [
  { href: "#collections", label: "Колекції" },
  { href: "/popup", label: "Popup" },
  { href: "#about", label: "Про нас" },
  { href: "#how", label: "Як це працює" },
  { href: "#contact", label: "Контакти" },
];

export function NavBar({ isLoggedIn, cartCount, onCartOpen, cinemaMode }: NavBarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [navVisible, setNavVisible] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 60);
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

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{
        y: navVisible && !cinemaMode ? 0 : -80,
        opacity: navVisible && !cinemaMode ? 1 : 0,
      }}
      transition={{
        duration: 0.45,
        ease: [0.32, 0.72, 0, 1],
        delay: navVisible && !scrolled ? 1.4 : 0,
      }}
      className="fixed top-4 inset-x-0 z-50 flex justify-center pointer-events-none px-4"
      aria-label="Головна навігація"
    >
      <div
        className={`pointer-events-auto inline-flex items-center gap-2 h-12 px-3 rounded-full bg-background/90 backdrop-blur-xl border border-border/60 transition-shadow duration-300 ${
          scrolled ? "shadow-xl shadow-black/8" : "shadow-md shadow-black/5"
        }`}
      >
        {/* Logo */}
        <Link href="/" aria-label="U:DO CRAFT" className="shrink-0 pl-1 pr-2">
          <BrandLogoFull className="h-6 w-auto" color="var(--color-primary, #1B18AC)" />
        </Link>

        <div className="hidden md:block w-px h-5 bg-border shrink-0" />

        {/* Nav links */}
        <div className="hidden md:flex items-center">
          {navLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground rounded-full hover:bg-muted transition-all duration-200 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {l.label}
            </Link>
          ))}
        </div>

        <div className="hidden md:block w-px h-5 bg-border shrink-0" />

        {/* Actions */}
        <div className="flex items-center gap-0.5">
          <Link
            href={isLoggedIn ? "/cabinet" : "/cabinet/login"}
            aria-label="Кабінет"
            className="flex items-center justify-center w-8 h-8 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <motion.div whileHover={{ y: -1.5 }} transition={{ duration: 0.2 }}>
              <User className="w-4 h-4" strokeWidth={2} />
            </motion.div>
          </Link>

          <button
            onClick={onCartOpen}
            aria-label="Кошик"
            className="relative flex items-center justify-center w-8 h-8 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <motion.div whileHover={{ y: 1.5, scale: 1.1 }} transition={{ duration: 0.2 }}>
              <ShoppingBag className="w-4 h-4" strokeWidth={2} />
            </motion.div>
            {cartCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 500, damping: 20 }}
                className="absolute -top-0.5 -right-0.5 bg-primary text-white text-[9px] font-black rounded-full w-4 h-4 flex items-center justify-center leading-none"
              >
                {cartCount}
              </motion.span>
            )}
          </button>

          <Link
            href="/order"
            className="hidden sm:inline-flex items-center gap-1.5 bg-primary text-white text-xs font-semibold px-4 py-2 rounded-full hover:bg-primary/90 active:scale-95 transition-all duration-200 whitespace-nowrap ml-1"
          >
            Почати проєкт
            <ArrowRight className="w-3 h-3" />
          </Link>

          <button
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={menuOpen ? "Закрити меню" : "Відкрити меню"}
            aria-expanded={menuOpen}
            className="md:hidden flex items-center justify-center w-9 h-9 rounded-full hover:bg-muted transition-colors duration-200 ml-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {menuOpen ? (
              <X className="w-5 h-5" strokeWidth={2} />
            ) : (
              <Menu className="w-5 h-5" strokeWidth={2} />
            )}
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
            className="absolute top-[calc(100%+8px)] left-4 right-4"
          >
            <div className="bg-background/95 backdrop-blur-xl border border-border shadow-2xl rounded-2xl px-4 py-3 space-y-1">
              {navLinks.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={() => setMenuOpen(false)}
                  className="block px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl transition-colors duration-200"
                >
                  {l.label}
                </Link>
              ))}
              <Link
                href="/order"
                onClick={() => setMenuOpen(false)}
                className="block mt-1 text-center bg-primary text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-primary/90 transition-colors duration-200"
              >
                Почати проєкт
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
