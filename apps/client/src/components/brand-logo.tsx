import Image from "next/image";

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
        alt="U:DO CRAFT"
        width={32}
        height={32}
        className={`object-contain ${className ?? ""}`}
      />
    );
  }
  return (
    <Image
      src="/logo.png"
      alt="U:DO CRAFT"
      width={120}
      height={40}
      className={`object-contain h-8 w-auto ${className ?? ""}`}
    />
  );
}

export function BrandLogoFull({ className, color: _color }: { className?: string; color?: string }) {
  return (
    <Image
      src="/logo.png"
      alt="U:DO CRAFT"
      width={160}
      height={48}
      className={`object-contain w-auto ${className ?? ""}`}
    />
  );
}
