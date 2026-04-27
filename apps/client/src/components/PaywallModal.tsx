"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PaywallModalProps {
  open: boolean;
  onClose: () => void;
}

export function PaywallModal({ open, onClose }: PaywallModalProps) {
  const router = useRouter();

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[10010] flex items-center justify-center px-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal panel */}
      <div className="relative bg-card rounded-2xl w-full max-w-md p-6 space-y-5 shadow-xl">
        {/* Dismiss button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
          aria-label="Закрити"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center size-14 rounded-full bg-primary/10 mb-3">
            <Sparkles className="size-7 text-primary" />
          </div>
          <h2 className="text-xl font-bold">
            Для використання AI потрібна реєстрація
          </h2>
          <p className="text-sm text-muted-foreground mt-2">
            Зареєструйтесь безкоштовно та отримайте 3 безкоштовні AI-генерації
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3 pt-1">
          <Button
            className="w-full"
            onClick={() => router.push("/cabinet/login?mode=register")}
          >
            Зареєструватись
          </Button>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => router.push("/cabinet/login")}
          >
            Увійти
          </Button>
        </div>

        {/* Dismiss link */}
        <button
          type="button"
          onClick={onClose}
          className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors text-center"
        >
          Продовжити без реєстрації
        </button>
      </div>
    </div>
  );
}
