"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { ArrowRight } from "lucide-react";
import { BrandLogoFull } from "@/components/brand-logo";
import { ContactForm } from "@/components/ContactForm";

const steps = [
  { step: "01", title: "Обираєте формат", desc: "Розкажіть нам про захід — кількість гостей, локація, дата. Ми підберемо оптимальний формат попапу." },
  { step: "02", title: "Готуємо стенд", desc: "Привозимо обладнання, одяг і все необхідне для кастомізації. Налаштовуємо стенд до початку заходу." },
  { step: "03", title: "Гості кастомізують", desc: "Кожен гість обирає виріб, розміщує принт і отримує готовий мерч прямо на місці — за лічені хвилини." },
];

const useCases = [
  { icon: "🏢", title: "Корпоративи", desc: "Зробіть корпоратив незабутнім — гості йдуть додому з персональним мерчем вашої компанії." },
  { icon: "🎤", title: "Конференції та форуми", desc: "Брендований мерч на місці — найкращий нетворкінг-інструмент і пам'ять про подію." },
  { icon: "🎪", title: "Фестивалі та маркети", desc: "Попап-стенд, який привертає увагу і генерує чергу. Живий досвід кастомізації — це шоу." },
  { icon: "🚀", title: "Продуктові лончі", desc: "Запуск продукту з мерчем, який гості зробили власноруч — максимальне залучення аудиторії." },
  { icon: "🎓", title: "Університети та школи", desc: "Випускні, дні відкритих дверей, студентські заходи — мерч, який об'єднує спільноту." },
  { icon: "💼", title: "B2B-заходи", desc: "Партнерські зустрічі, виставки, презентації — залиште враження, яке носять." },
];

const faqs = [
  { q: "Яка мінімальна кількість учасників?", a: "Від 50 осіб. Для менших заходів можемо запропонувати альтернативний формат — напишіть нам." },
  { q: "Скільки часу займає кастомізація одного виробу?", a: "Від 3 до 10 хвилин залежно від складності принту. Для великих заходів розгортаємо кілька робочих станцій." },
  { q: "Які вироби доступні на попапі?", a: "Футболки, худі, лонгсліви, кепки та аксесуари. Фінальний асортимент узгоджуємо під ваш захід і бюджет." },
  { q: "Хто оплачує мерч — організатор чи гості?", a: "Обидва варіанти. Можна включити мерч у вартість квитка, зробити подарунком від компанії або продавати на місці." },
  { q: "За скільки потрібно бронювати?", a: "Рекомендуємо за 2–3 тижні до заходу. Для великих подій (500+ осіб) — за місяць." },
];

export default function PopupPage() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const navLinks = [
    { href: "#use-cases", label: "Для кого" },
    { href: "#how",       label: "Як це працює" },
    { href: "#faq",       label: "FAQ" },
    { href: "#contact",   label: "Контакти" },
  ];

  return (
    <div className="min-h-screen bg-white text-gray-900">

      {/* NAV */}
      <nav className={`fixed top-0 inset-x-0 z-50 bg-white border-b border-gray-100 transition-all duration-300 ${scrolled ? "shadow-md" : ""}`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">

          {/* Logo + label */}
          <div className="flex items-center gap-3">
            <Link href="/" aria-label="U:DO CRAFT">
              <BrandLogoFull className="h-10 w-auto" color="var(--color-primary, #1B18AC)" />
            </Link>
            <span className="hidden sm:flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-gray-400">
              <span className="text-gray-300">|</span>
              Попап
            </span>

            {/* Desktop nav links */}
            <div className="hidden md:flex items-center gap-1 ml-4">
              {navLinks.map((l) => (
                <Link key={l.href} href={l.href} className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 rounded-full hover:bg-gray-50 transition-colors duration-200">
                  {l.label}
                </Link>
              ))}
            </div>
          </div>

          {/* CTA + burger */}
          <div className="flex items-center gap-2">
            <Link href="#contact"
              className="hidden sm:flex items-center gap-1.5 bg-primary text-primary-foreground text-sm font-semibold px-4 py-2 rounded-full hover:bg-primary/90 active:scale-95 transition-all duration-200">
              Забронювати <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <button onClick={() => setMenuOpen(!menuOpen)} aria-label={menuOpen ? "Закрити меню" : "Відкрити меню"} aria-expanded={menuOpen}
              className="md:hidden flex items-center justify-center w-9 h-9 rounded-full hover:bg-gray-100 transition-colors duration-200">
              <div className="flex flex-col gap-1.5 w-5">
                <span className={`block h-0.5 bg-gray-700 transition-all duration-300 origin-center ${menuOpen ? "rotate-45 translate-y-2" : ""}`} />
                <span className={`block h-0.5 bg-gray-700 transition-all duration-300 ${menuOpen ? "opacity-0 scale-x-0" : ""}`} />
                <span className={`block h-0.5 bg-gray-700 transition-all duration-300 origin-center ${menuOpen ? "-rotate-45 -translate-y-2" : ""}`} />
              </div>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <div className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${menuOpen ? "max-h-64 opacity-100" : "max-h-0 opacity-0"}`}>
          <div className="bg-white border-t border-gray-100 px-6 py-4 space-y-1">
            {navLinks.map((l) => (
              <Link key={l.href} href={l.href} onClick={() => setMenuOpen(false)}
                className="block px-4 py-2.5 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-full transition-colors duration-200">
                {l.label}
              </Link>
            ))}
            <Link href="#contact" onClick={() => setMenuOpen(false)}
              className="block mt-2 text-center bg-primary text-primary-foreground text-sm font-semibold px-4 py-2.5 rounded-full hover:bg-primary/90 transition-colors duration-200">
              Забронювати
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative overflow-hidden bg-gray-950 pt-32 pb-20 sm:pt-44 sm:pb-28">
        <div className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full bg-primary/25 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full bg-primary/15 blur-3xl pointer-events-none" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <span className="inline-flex items-center gap-2 bg-primary/20 text-primary text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-full mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            Виїзний попап-сервіс
          </span>
          <h1 className="text-white text-4xl sm:text-5xl lg:text-6xl font-black leading-[1.05] tracking-tight mb-6">
            Мерч-попап на вашому заході —<br />
            <span className="text-white/50">живий досвід, який запам'ятовують</span>
          </h1>
          <p className="text-white/70 text-base sm:text-lg leading-relaxed max-w-2xl mx-auto mb-10">
            Ми приїжджаємо до вас. Гості обирають одяг, кастомізують принт на місці і йдуть з готовим мерчем у руках. Жодної логістики з вашого боку — тільки wow-ефект.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <a href="#contact"
              className="inline-flex items-center gap-2 bg-primary text-white font-bold text-sm px-7 py-3.5 rounded-full hover:bg-primary/90 active:scale-95 transition-all duration-200">
              Забронювати попап <ArrowRight className="w-4 h-4" />
            </a>
            <a href="#how"
              className="inline-flex items-center gap-2 border border-white/20 text-white/80 font-semibold text-sm px-7 py-3.5 rounded-full hover:bg-white/10 active:scale-95 transition-all duration-200">
              Як це працює
            </a>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-gray-100">
            {[
              { value: "50+",    label: "Проведених попапів" },
              { value: "3 хв",   label: "Час кастомізації" },
              { value: "500+",   label: "Гостей на одному заході" },
              { value: "100%",   label: "Задоволених організаторів" },
            ].map((s) => (
              <div key={s.label} className="py-6 px-4 sm:px-6 text-center">
                <p className="text-2xl font-black text-primary">{s.value}</p>
                <p className="text-xs text-gray-500 mt-1 font-medium">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* USE CASES */}
      <section id="use-cases" className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
        <div className="mb-12">
          <p className="text-xs font-bold uppercase tracking-widest mb-2 text-primary">Для кого</p>
          <h2 className="text-3xl font-black tracking-tight">Підходить для будь-якого заходу</h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {useCases.map((u) => (
            <div key={u.title} className="bg-gray-50 rounded-2xl p-6 border border-gray-100 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
              <span className="text-3xl mb-4 block" aria-hidden="true">{u.icon}</span>
              <h3 className="font-bold text-gray-900 mb-2">{u.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{u.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="py-20 sm:py-24 bg-primary">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="mb-14">
            <p className="text-xs font-bold text-white/60 uppercase tracking-widest mb-3">Процес</p>
            <h2 className="text-white text-3xl sm:text-4xl font-black tracking-tight">Три кроки до ідеального попапу</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {steps.map((item) => (
              <div key={item.step} className="bg-white/[0.08] hover:bg-white/[0.12] border border-white/15 rounded-2xl p-7 flex flex-col gap-5 transition-all duration-200">
                <span className="text-white/40 text-5xl font-black leading-none select-none">{item.step}</span>
                <div>
                  <h3 className="text-white font-bold text-lg mb-2">{item.title}</h3>
                  <p className="text-white/75 text-sm leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
        <div className="mb-12">
          <p className="text-xs font-bold uppercase tracking-widest mb-2 text-primary">FAQ</p>
          <h2 className="text-3xl font-black tracking-tight">Часті запитання</h2>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          {faqs.map((f) => (
            <div key={f.q} className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
              <h3 className="font-bold text-gray-900 mb-2 text-sm">{f.q}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{f.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CONTACT */}
      <section id="contact" className="bg-gray-900 py-20 sm:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-start">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest mb-4 text-primary">Забронювати</p>
              <h2 className="text-white text-3xl sm:text-4xl font-black tracking-tight mb-4">
                Розкажіть нам про ваш захід
              </h2>
              <p className="text-white/60 text-sm leading-relaxed mb-8 max-w-sm">
                Залиште заявку — менеджер зв'яжеться з вами протягом одного робочого дня, щоб обговорити деталі та розрахувати вартість.
              </p>
              <div className="space-y-3">
                {[
                  "Безкоштовна консультація",
                  "Індивідуальний розрахунок під ваш захід",
                  "Відповідь протягом 24 годин",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2.5 text-white/70 text-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                    {item}
                  </div>
                ))}
              </div>
            </div>
            <ContactForm />
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-gray-950 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <BrandLogoFull className="h-7 w-auto opacity-60" color="white" />
          <p className="text-gray-600 text-xs">© {new Date().getFullYear()} U:DO CRAFT. Всі права захищені.</p>
        </div>
      </footer>
    </div>
  );
}
