"use client";

import { useRef, useCallback, useEffect } from "react";
import { motion, useInView } from "framer-motion";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Caveat } from "next/font/google";

const caveat = Caveat({ subsets: ["cyrillic", "latin"], weight: ["400", "700"] });


const TESTIMONIALS = [
  {
    name: "Олена Коваль", role: "HR Director", company: "TechCorp", avatar: "ОК",
    text: "Замовляли корпоративні худі для команди 80 осіб. Якість перевершила очікування — люди носять їх не лише на роботі.",
    metric: "80 осіб", metricLabel: "у команді", rating: 5,
  },
  {
    name: "Максим Бондаренко", role: "Co-founder", company: "StartupUA", avatar: "МБ",
    text: "Спочатку замовили Box of Touch — це вирішило всі сумніви щодо якості. Потім зробили тираж 200 футболок для конференції. Все вчасно.",
    metric: "200 шт", metricLabel: "за 12 днів", rating: 5,
  },
  {
    name: "Аліна Мороз", role: "Brand Manager", company: "RetailGroup", avatar: "АМ",
    text: "Адаптували логотип під вишивку. Результат виглядає дуже преміально. Клієнти постійно питають, де ми це замовляли.",
    metric: "3×", metricLabel: "повторних замовлень", rating: 5,
  },
  {
    name: "Ігор Левченко", role: "CEO", company: "GameStudio", avatar: "ІЛ",
    text: "Дуже зручний конструктор. Самі накидали дизайн мерчу для геймдевів, отримали зразки, і вже за два тижні вся студія в новому одязі.",
    metric: "14 днів", metricLabel: "на весь процес", rating: 5,
  },
  {
    name: "Вікторія Савченко", role: "Event Manager", company: "PromoU", avatar: "ВС",
    text: "Рятували нас перед виставкою! Зробили 500 шоперів за рекордні терміни. Якість принта відмінна, не тріскається після прання.",
    metric: "500+", metricLabel: "одиниць тираж", rating: 5,
  },
  {
    name: "Олексій Дмитренко", role: "Marketing Lead", company: "FinTech", avatar: "ОД",
    text: "Замовили стартові паки для нових працівників. Одяг приємний до тіла, ідеально тримає форму.",
    metric: "100%", metricLabel: "задоволених", rating: 5,
  },
  {
    name: "Наталія Ткач", role: "PR Director", company: "CharityFund", avatar: "НТ",
    text: "Робили благодійний дроп. Завдяки чесній ціноутворювальній політиці змогли зібрати більше коштів з продажу. Сервіс — топ.",
    metric: "100k+", metricLabel: "зібрано", rating: 5,
  },
  {
    name: "Дмитро Ковальчук", role: "Owner", company: "CoffeeRoasters", avatar: "ДК",
    text: "Уніформа для барист — це завжди біль, бо вона швидко зношується. Футболки від U:DO витримують щоденне прання на ура.",
    metric: "50+", metricLabel: "прань витримано", rating: 5,
  },
  {
    name: "Юлія Гриценко", role: "Head of Sales", company: "B2B SaaS", avatar: "ЮГ",
    text: "Використовуємо ваш мерч як подарунки для VIP-клієнтів. Завжди отримуємо вау-ефект.",
    metric: "10/10", metricLabel: "враження", rating: 5,
  },
];

const rotations = ["rotate-[-1deg]", "rotate-[1.5deg]", "rotate-[-0.5deg]", "rotate-[1deg]", "rotate-[-1.5deg]", "rotate-[0.5deg]", "rotate-[-1deg]", "rotate-[2deg]", "rotate-[-2deg]"];

export function TestimonialsSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: true, align: "center", dragFree: true },
    [Autoplay({ delay: 6000, stopOnInteraction: true })]
  );

  useEffect(() => {
    if (!emblaApi) return;
    const onScroll = () => {
      const slideNodes = emblaApi.slideNodes();
      const viewportCenter = window.innerWidth / 2;
      
      slideNodes.forEach((node) => {
        const rect = node.getBoundingClientRect();
        const center = rect.left + rect.width / 2;
        const distance = Math.abs(viewportCenter - center) / (window.innerWidth / 2);
        
        // Smooth scaling: center is 1, edges go down to ~0.75
        const scale = Math.max(0.75, 1 - Math.pow(distance, 2) * 0.4);
        // Smooth opacity: center is 1, edges go down to ~0.3
        const opacity = Math.max(0.3, 1 - Math.pow(distance, 2) * 0.8);
        
        const inner = node.firstElementChild as HTMLElement;
        if (inner) {
          inner.style.transform = `scale(${scale})`;
          inner.style.opacity = `${opacity}`;
        }
      });
    };
    
    emblaApi.on('scroll', onScroll);
    emblaApi.on('reInit', onScroll);
    
    // Initial call
    setTimeout(onScroll, 50);
  }, [emblaApi]);

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  return (
    <section
      id="testimonials"
      className="bg-[#0a0d1a] py-24 sm:py-32 overflow-hidden"
      aria-labelledby="testimonials-heading"
    >
      <div className="max-w-6xl mx-auto px-5 sm:px-10 lg:px-20 relative">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-14"
        >
          <div>
            <h2 id="testimonials-heading" className="text-white text-3xl sm:text-4xl font-black tracking-tight">
              Результати, а не обіцянки
            </h2>
          </div>
          
          {/* Controls visible on desktop next to header, hidden on mobile */}
          <div className="hidden sm:flex gap-2">
            <button onClick={scrollPrev} aria-label="Попередній відгук" className="w-11 h-11 rounded-full flex items-center justify-center border border-white/20 text-white hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-primary active:scale-95">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button onClick={scrollNext} aria-label="Наступний відгук" className="w-11 h-11 rounded-full flex items-center justify-center border border-white/20 text-white hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-primary active:scale-95">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </motion.div>

        {/* Embla Carousel Viewport */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="overflow-visible" 
          ref={emblaRef}
        >
          <div className="flex gap-6 sm:gap-10 py-10" style={{ cursor: "grab" }} onMouseDown={(e) => (e.currentTarget.style.cursor = "grabbing")} onMouseUp={(e) => (e.currentTarget.style.cursor = "grab")} onMouseLeave={(e) => (e.currentTarget.style.cursor = "grab")}>
            {TESTIMONIALS.map((t, i) => {
              const rotation = rotations[i % rotations.length];
              return (
                <div key={i} className="flex-[0_0_85%] sm:flex-[0_0_45%] lg:flex-[0_0_31%] min-w-0">
                  <div className="flex flex-col items-center w-full transition-transform duration-75 ease-out origin-center">
                    {/* Paper Card */}
                    <article
                      className={`relative w-full rounded-sm bg-[#fdfdfd] shadow-xl ${rotation} transition-transform duration-300 hover:scale-[1.02] flex flex-col`}
                      style={{
                        backgroundImage: `
                          linear-gradient(#e5e7eb 1px, transparent 1px),
                          linear-gradient(90deg, transparent 32px, #fca5a5 32px, #fca5a5 33px, transparent 33px)
                        `,
                        backgroundSize: "100% 32px, 100% 100%",
                        backgroundPosition: "0 8px, 0 0",
                        padding: "40px 24px 32px 48px",
                        minHeight: "300px"
                      }}
                    >
                      <p className={`${caveat.className} text-blue-700 text-2xl leading-[32px] flex-1 tracking-wide`}>
                        {t.text}
                      </p>

                      <div className="mt-8 flex flex-col items-center">
                        <span className={`${caveat.className} text-6xl leading-none font-bold text-black`}>{t.metric}</span>
                        <span className={`${caveat.className} text-2xl text-black -mt-1`}>{t.metricLabel}</span>
                      </div>
                    </article>

                    {/* Author Details Below Paper */}
                    <div className={`flex flex-col items-center gap-3 w-full px-4 mt-8 text-center`}>
                      <div
                        className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold text-white shrink-0 shadow-inner"
                        aria-hidden="true"
                      >
                        {t.avatar}
                      </div>
                      <div>
                        <p className="text-white/90 text-[15px] font-medium leading-tight tracking-wide">{t.name}</p>
                        <p className="text-white/40 text-xs mt-1.5 font-mono tracking-wider">{t.role}, {t.company}</p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Mobile controls */}
        <div className="flex sm:hidden justify-center gap-4 mt-8">
          <button onClick={scrollPrev} aria-label="Попередній відгук" className="w-12 h-12 rounded-full flex items-center justify-center border border-white/20 text-white hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-primary active:scale-95">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button onClick={scrollNext} aria-label="Наступний відгук" className="w-12 h-12 rounded-full flex items-center justify-center border border-white/20 text-white hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-primary active:scale-95">
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>

      </div>
    </section>
  );
}

