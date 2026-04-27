import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface ServicesSectionProps {
  heading: string;
  service1Title: string;
  service1Desc: string;
  service1Cta: string;
  service2Title: string;
  service2Desc: string;
  service2Cta: string;
}

export function ServicesSection({
  heading,
  service1Title,
  service1Desc,
  service1Cta,
  service2Title,
  service2Desc,
  service2Cta,
}: ServicesSectionProps) {
  return (
    <div className="flex flex-col gap-4">
      {/* Row 1 — two equal-height service cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Card 1 — Box of Touch */}
        <div className="relative bg-gray-950 rounded-3xl overflow-hidden flex flex-col min-h-[280px] group">
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage:
                "radial-gradient(circle at 30% 20%, #4f46e5 0%, transparent 60%), radial-gradient(circle at 80% 80%, #7c3aed 0%, transparent 50%)",
            }}
          />
          <div className="relative z-10 flex flex-col flex-1 p-8">
            <div className="flex-1">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-white/40 mb-5">
                <span className="w-1 h-1 rounded-full bg-white/30" />
                Семпли
              </span>
              <h3 className="text-white text-3xl font-black tracking-tight leading-tight mb-3">
                {service1Title}
              </h3>
              <p className="text-white/55 text-sm leading-relaxed max-w-sm">
                {service1Desc}
              </p>
            </div>
            <div className="mt-8">
              <Link
                href="#contact?ref=box"
                className="inline-flex items-center gap-2 bg-white text-gray-900 text-sm font-bold px-5 py-2.5 rounded-full hover:bg-gray-100 active:scale-95 transition-all duration-200"
              >
                {service1Cta}
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>

        {/* Card 2 — Designer */}
        <div className="relative rounded-3xl overflow-hidden flex flex-col min-h-[280px] group">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: "url('/designer-bg.jpg')" }}
          />
          <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/50 to-black/30" />
          <div className="relative z-10 flex flex-col flex-1 p-8">
            <div className="flex-1">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-white/40 mb-5">
                <span className="w-1 h-1 rounded-full bg-white/30" />
                Дизайн
              </span>
              <h3 className="text-white text-3xl font-black tracking-tight leading-tight mb-3">
                {service2Title}
              </h3>
              <p className="text-white/60 text-sm leading-relaxed max-w-xs">
                {service2Desc}
              </p>
            </div>
            <div className="mt-8">
              <Link
                href="#contact?ref=designer"
                className="inline-flex items-center gap-2 bg-primary text-white text-sm font-bold px-5 py-2.5 rounded-full hover:bg-primary/90 active:scale-95 transition-all duration-200"
              >
                {service2Cta}
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
