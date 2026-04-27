"use client";

import { Instagram, Send } from "lucide-react";
import { ContactForm } from "@/components/ContactForm";
import { FadeUp } from "@/app/_components/FadeUp";

interface ContactSectionProps {
  heading: string;
  subtext: string;
  email: string;
  phone: string;
  address: string;
  instagram: string;
  telegram: string;
}

export function ContactSection({
  heading,
  subtext,
  email,
  phone,
  address,
  instagram,
  telegram,
}: ContactSectionProps) {
  return (
    <section id="contact" className="bg-[#080810]">
      <div className="py-20 sm:py-28">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-start">
            <FadeUp>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] mb-5 text-primary">
                Контакти
              </p>
              <h2 className="text-white text-4xl sm:text-5xl font-black tracking-tight leading-[1.02] mb-6">
                {heading}
              </h2>
              <p className="text-white/40 text-base leading-relaxed mb-12 max-w-sm">{subtext}</p>

              <div className="space-y-6 mb-12">
                {[
                  { label: "Email", value: email, href: `mailto:${email}` },
                  { label: "Телефон", value: phone, href: `tel:${phone.replace(/\s/g, "")}` },
                  { label: "Адреса", value: address, href: "#" },
                ].map((c) => (
                  <a
                    key={c.label}
                    href={c.href}
                    className="group flex items-start gap-5 hover:opacity-80 transition-opacity duration-200 focus-visible:outline-none rounded"
                  >
                    <span className="text-[10px] font-bold text-white/25 uppercase tracking-widest w-16 pt-0.5 shrink-0">
                      {c.label}
                    </span>
                    <span className="text-white/55 text-sm group-hover:text-white/80 transition-colors duration-200">
                      {c.value}
                    </span>
                  </a>
                ))}
              </div>

              <div className="space-y-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/20">
                  Або напишіть у соц мережі
                </p>
                <div className="flex gap-3">
                  <a
                    href={instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-white/5 border border-white/10 text-white/40 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all duration-200 text-sm font-medium"
                  >
                    <Instagram className="w-4 h-4" aria-hidden="true" />
                    Instagram
                  </a>
                  <a
                    href={telegram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-white/5 border border-white/10 text-white/40 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all duration-200 text-sm font-medium"
                  >
                    <Send className="w-4 h-4" aria-hidden="true" />
                    Telegram
                  </a>
                </div>
              </div>
            </FadeUp>

            <FadeUp delay={0.15}>
              <ContactForm />
            </FadeUp>
          </div>
        </div>
      </div>
    </section>
  );
}
