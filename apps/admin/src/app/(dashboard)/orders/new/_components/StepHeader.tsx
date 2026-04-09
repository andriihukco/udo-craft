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
    <div className="h-12 px-4 border-b border-border shrink-0 flex items-center overflow-hidden relative sticky top-0 z-30 bg-background">
      <button
        onClick={() => router.push("/orders")}
        className="size-7 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors shrink-0 z-10"
      >
        <ArrowLeft className="size-3.5" />
      </button>
      <p className="font-semibold text-sm shrink-0 hidden md:block ml-2 z-10">Нове замовлення</p>

      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="flex items-center gap-1.5 pointer-events-auto">
          {STEPS.map((s, i) => {
            const isCurrent = i === stepIdx;
            const isVisited = i <= stepIdx;
            const canNavigate = i < stepIdx || (i > stepIdx && cartLength > 0);
            return (
              <div key={s} className="flex items-center gap-1.5">
                <button
                  onClick={() => canNavigate ? onNavigate(s) : undefined}
                  disabled={!canNavigate}
                  className={`flex items-center gap-1.5 transition-opacity ${canNavigate ? "cursor-pointer hover:opacity-80" : "cursor-default"}`}
                >
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors shrink-0 ${i < stepIdx ? "bg-emerald-500 text-white" : isCurrent ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                    {i < stepIdx ? <Check className="size-3" /> : i + 1}
                  </div>
                  <span className={`text-xs font-medium hidden sm:block ${isCurrent ? "text-foreground" : isVisited ? "text-foreground/70" : "text-muted-foreground"}`}>
                    {STEP_LABELS[s]}
                  </span>
                </button>
                {i < 2 && <div className="w-4 h-px bg-border" />}
              </div>
            );
          })}
        </div>
      </div>

      <div className="ml-auto z-10 w-7" />
    </div>
  );
}
