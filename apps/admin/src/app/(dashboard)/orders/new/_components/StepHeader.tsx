"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check } from "lucide-react";

type Step = "catalog" | "checkout" | "review";

interface StepHeaderProps {
  step: Step;
  cartLength: number;
  onNavigate: (s: Step) => void;
}

const STEPS: Step[] = ["catalog", "checkout", "review"];
const STEP_LABELS: Record<Step, string> = {
  catalog: "Товари",
  checkout: "Контакти",
  review: "Перевірка",
};

export function StepHeader({ step, cartLength, onNavigate }: StepHeaderProps) {
  const router = useRouter();
  const stepIdx = STEPS.indexOf(step);

  return (
    <div className="h-16 px-6 border-b border-border/40 shrink-0 flex items-center bg-background/60 backdrop-blur-xl sticky top-0 z-40 transition-all">
      <button
        onClick={() => router.push("/orders")}
        className="size-8 rounded-xl border border-border/60 bg-background/50 flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary/20 transition-all shrink-0 z-10 shadow-sm hover:shadow-md active:scale-95"
      >
        <ArrowLeft className="size-4" />
      </button>
      
      <div className="flex flex-col ml-4 z-10 hidden md:flex">
        <p className="font-bold text-sm tracking-tight">Нове замовлення</p>
        <p className="text-[10px] text-muted-foreground/80 font-medium uppercase tracking-widest">{STEP_LABELS[step]}</p>
      </div>

      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="flex items-center gap-1.5 pointer-events-auto bg-muted/30 p-1.5 rounded-2xl border border-border/40 shadow-inner">
          {STEPS.map((s, i) => {
            const isCurrent = i === stepIdx;
            const isVisited = i < stepIdx;
            const canNavigate = i < stepIdx || (i > stepIdx && cartLength > 0);
            
            return (
              <React.Fragment key={s}>
                <button
                  onClick={() => canNavigate ? onNavigate(s) : undefined}
                  disabled={!canNavigate}
                  className={`flex items-center gap-2.5 px-3 py-1.5 rounded-xl transition-all ${
                    isCurrent 
                      ? "bg-background text-primary shadow-sm border border-border/50 scale-105" 
                      : canNavigate 
                      ? "text-muted-foreground hover:text-foreground hover:bg-background/40" 
                      : "text-muted-foreground/40 cursor-not-allowed"
                  }`}
                >
                  <div className={`size-5 rounded-full flex items-center justify-center text-[10px] font-bold transition-all shrink-0 ${
                    isVisited 
                      ? "bg-emerald-500 text-white shadow-sm shadow-emerald-500/20" 
                      : isCurrent 
                      ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20" 
                      : "bg-muted text-muted-foreground/60"
                  }`}>
                    {isVisited ? <Check className="size-3 stroke-[3]" /> : i + 1}
                  </div>
                  <span className={`text-xs font-bold hidden sm:block ${isCurrent ? "text-foreground" : "text-muted-foreground/60"}`}>
                    {STEP_LABELS[s]}
                  </span>
                </button>
                {i < 2 && <div className="w-4 h-px bg-border/40 mx-0.5" />}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      <div className="ml-auto z-10 flex items-center gap-3">
        {cartLength > 0 && (
          <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 bg-primary/5 text-primary rounded-xl border border-primary/10">
            <span className="text-[10px] font-black uppercase tracking-wider">Кошик</span>
            <span className="text-xs font-bold">{cartLength}</span>
          </div>
        )}
      </div>
    </div>
  );
}

