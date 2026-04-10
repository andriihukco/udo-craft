"use client";

import React from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

interface GenerateImageButtonProps {
  onClick: () => void;
  disabled?: boolean;
  hasLayers?: boolean;
}

export function GenerateImageButton({ onClick, disabled, hasLayers }: GenerateImageButtonProps) {
  if (!process.env.NEXT_PUBLIC_GEMINI_ENABLED) return null;
  if (!hasLayers) return null;

  return (
    <div className="relative overflow-hidden rounded-md">
      <motion.div
        className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
        aria-hidden="true"
        animate={{ x: ["-100%", "200%"] }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
      />
      <Button
        onClick={onClick}
        disabled={disabled}
        className="relative w-full gap-2"
        variant="default"
      >
        <Sparkles className="h-4 w-4" />
        Побачити мерч на людині
      </Button>
    </div>
  );
}
