import Image from "next/image";
import { cn } from "@/lib/utils";

interface BrandLogoProps {
  compact?: boolean;
  className?: string;
  color?: string; // kept for API compat, unused with image logo
}

export function BrandLogo({ compact = false, className }: BrandLogoProps) {
  if (compact) {
    return (
      <Image
        src="/logo.png"
        alt="CRAFT"
        width={32}
        height={32}
        className={cn("object-contain", className)}
      />
    );
  }
  return (
    <Image
      src="/logo.png"
      alt="CRAFT"
      width={120}
      height={40}
      className={cn("object-contain h-8 w-auto", className)}
    />
  );
}

// Keep BrandLogoFull re-exported from shared for any usage
export { BrandLogoFull } from "@udo-craft/ui";
