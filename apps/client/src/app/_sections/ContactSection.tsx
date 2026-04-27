"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Instagram, Send, MapPin, Phone, Mail } from "lucide-react";
import { ContactForm } from "@/components/ContactForm";

interface ContactSectionProps {
  heading: string; subtext: string;
  email: string; phone: string; address: string;
  instagram: string; telegram: string;
}

export function ContactSection({ heading, subtext, email, phone, address, instagram, telegram }: ContactSectionProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section id="contact" className="bg-[#04040a]" aria-labelledby="contact-heading">
      <div className="max-w-6xl mx-auto px-5 sm:px-10 lg:px-20 py-20 sm:py-28">
        <div className="grid lg:grid-cols-[1fr_1.4fr] gap-12 lg:gap-20 items-start">

          {/* Left */}
          <motion.div
            ref={ref}
            initial={{ opacity: 0, y: 24 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-primary mb-5">Контакти</p>
            <h2 id="contact-heading" className="text-white text-4xl sm:text-5xl font-black tracking-tight leading-[1.0] mb-5">
              {heading}
            </h2>
            <p className="text-white/35 text-sm leading-relaxed mb-12 max-w-xs">{subtext}</p>

            {/* Contact items — icon-led */}
            <div className="space-y-4 mb-12">
              {[
                { icon: <Mail className="w-4 h-4" aria-hidden="true" />, label: "Email", value: email, href: `mailto:${email}` },
                { icon: <Phone className="w-4 h-4" aria-hidden="true" />, label: "Телефон", value: phone, href: `tel:${phone.replace(/\s/g, "")}` },
                { icon: <MapPin className="w-4 h-4" aria-hidden="true" />, label: "Адреса", value: address, href: "#" },
              ].map((c) => (
                <a
                  key={c.label}
                  href={c.href}
                  className="group flex items-center gap-4 hover:opacity-80 transition-opacity duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg p-1 -m-1"
                  aria-label={`${c.label}: ${c.value}`}
                >
                  <span className="w-9 h-9 rounded-xl bg-white/5 border border-white/8 flex items-center justify-center text-white/35 group-hover:text-white/60 group-hover:border-white/15 transition-all duration-200 shrink-0">
                    {c.icon}
                  </span>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/20 mb-0.5">{c.label}</p>
                    <p className="text-white/55 text-sm group-hover:text-white/75 transition-colors duration-200">{c.value}</p>
                  </div>
                </a>
              ))}
            </div>

            {/* Social */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/15 mb-3">Соцмережі</p>
              <div className="flex gap-2">
                {[
                  { href: instagram, icon: <Instagram className="w-4 h-4" aria-hidden="true" />, label: "Instagram" },
                  { href: telegram, icon: <Send className="w-4 h-4" aria-hidden="true" />, label: "Telegram" },
                ].map((s) => (
                  <a
                    key={s.label}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Перейти до ${s.label}`}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/8 text-white/35 hover:text-white hover:bg-white/10 hover:border-white/15 transition-all duration-200 text-xs font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    {s.icon}{s.label}
                  </a>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Right — form */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.75, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
          >
            <ContactForm />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
