"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Instagram, Send, MapPin, Phone, Mail, Clock } from "lucide-react";
import { ContactForm } from "@/components/ContactForm";

interface ContactSectionProps {
  heading: string; subtext: string;
  email: string; phone: string; address: string;
  instagram: string; telegram: string;
}

const RESPONSE_PROMISE = [
  { icon: Clock, text: "Відповідаємо протягом 2 годин у робочий час" },
  { icon: Phone, text: "Телефонуємо самі, якщо зручніше говорити" },
];

export function ContactSection({ heading, subtext, email, phone, address, instagram, telegram }: ContactSectionProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section id="contact" className="bg-[#06060e]" aria-labelledby="contact-heading">
      <div className="max-w-6xl mx-auto px-5 sm:px-10 lg:px-20 py-20 sm:py-28">

        {/* Top — heading full width */}
        <motion.div ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="mb-14"
        >
          <h2 id="contact-heading" className="text-white text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[0.95] mb-5">
            {heading}
          </h2>
          <p className="text-white/60 text-base leading-relaxed max-w-md">{subtext}</p>
        </motion.div>

        <div className="grid lg:grid-cols-[1fr_1.5fr] gap-12 lg:gap-16 items-start">

          {/* Left — contact info */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-8"
          >
            {/* Contact items */}
            <div className="space-y-3">
              {[
                { icon: Mail, label: "Email", value: email, href: `mailto:${email}` },
                { icon: Phone, label: "Телефон", value: phone, href: `tel:${phone.replace(/\s/g, "")}` },
                { icon: MapPin, label: "Адреса", value: address, href: "#" },
              ].map((c) => {
                const Icon = c.icon;
                return (
                  <a key={c.label} href={c.href}
                    className="group flex items-center gap-4 p-4 rounded-xl bg-white/[0.04] border border-white/8 hover:bg-white/[0.07] hover:border-white/15 transition-all duration-200"
                    aria-label={`${c.label}: ${c.value}`}
                  >
                    <span className="w-9 h-9 rounded-lg bg-primary/15 border border-primary/25 flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4 text-primary" aria-hidden="true" />
                    </span>
                    <div>
                      <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest mb-0.5">{c.label}</p>
                      {/* white/80 on #06060e = 11:1 passes AAA */}
                      <p className="text-white/80 text-sm font-medium">{c.value}</p>
                    </div>
                  </a>
                );
              })}
            </div>

            {/* Response promise */}
            <div className="space-y-3">
              {RESPONSE_PROMISE.map((r) => {
                const Icon = r.icon;
                return (
                  <div key={r.text} className="flex items-center gap-3">
                    <Icon className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
                    <p className="text-white/60 text-sm">{r.text}</p>
                  </div>
                );
              })}
            </div>

            {/* Social */}
            <div>
              <p className="text-white/30 text-[10px] font-bold uppercase tracking-widest mb-3">Соцмережі</p>
              <div className="flex gap-2">
                {[
                  { href: instagram, icon: Instagram, label: "Instagram" },
                  { href: telegram, icon: Send, label: "Telegram" },
                ].map((s) => {
                  const Icon = s.icon;
                  return (
                    <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer"
                      aria-label={`Перейти до ${s.label}`}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-white/50 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all duration-200 text-xs font-medium">
                      <Icon className="w-4 h-4" aria-hidden="true" />{s.label}
                    </a>
                  );
                })}
              </div>
            </div>

            {/* Working hours */}
            <div className="p-5 rounded-xl bg-white/[0.03] border border-white/8">
              <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest mb-3">Графік роботи</p>
              <div className="space-y-1.5">
                {[
                  { days: "Пн–Пт", hours: "09:00 – 18:00" },
                  { days: "Сб", hours: "10:00 – 15:00" },
                  { days: "Нд", hours: "Вихідний" },
                ].map((h) => (
                  <div key={h.days} className="flex justify-between text-sm">
                    <span className="text-white/50">{h.days}</span>
                    <span className="text-white/80 font-medium">{h.hours}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Right — form */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          >
            <ContactForm />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
