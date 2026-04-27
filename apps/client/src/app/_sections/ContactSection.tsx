"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Instagram, Send, ArrowUpRight } from "lucide-react";
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
    <section id="contact" className="bg-[#050508]">
      <div className="max-w-6xl mx-auto px-5 sm:px-8 lg:px-16 py-20 sm:py-28">
        <div className="grid lg:grid-cols-[1fr_1.2fr] gap-12 lg:gap-20 items-start">

          {/* Left */}
          <motion.div
            ref={ref}
            initial={{ opacity: 0, x: -24 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary block mb-6">07</span>
            <h2 className="text-white text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.0] mb-6">
              {heading}
            </h2>
            <p className="text-white/35 text-base leading-relaxed mb-12 max-w-sm">{subtext}</p>

            <div className="space-y-5 mb-12">
              {[
                { label: "Email", value: email, href: `mailto:${email}` },
                { label: "Телефон", value: phone, href: `tel:${phone.replace(/\s/g, "")}` },
                { label: "Адреса", value: address, href: "#" },
              ].map((c) => (
                <a key={c.label} href={c.href}
                  className="group flex items-start gap-5 hover:opacity-75 transition-opacity duration-200">
                  <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest w-16 pt-0.5 shrink-0">{c.label}</span>
                  <span className="text-white/50 text-sm group-hover:text-white/70 transition-colors duration-200">{c.value}</span>
                </a>
              ))}
            </div>

            <div className="space-y-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/15">Соц мережі</p>
              <div className="flex gap-2">
                {[
                  { href: instagram, icon: <Instagram className="w-4 h-4" />, label: "Instagram" },
                  { href: telegram, icon: <Send className="w-4 h-4" />, label: "Telegram" },
                ].map((s) => (
                  <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/8 text-white/35 hover:text-white hover:bg-white/10 hover:border-white/15 transition-all duration-200 text-xs font-medium">
                    {s.icon}{s.label}
                  </a>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Right — form */}
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          >
            <ContactForm />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
