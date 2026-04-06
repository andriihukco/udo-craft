"use client";

import { cn } from "../lib/utils";

interface BrandLogoProps {
  compact?: boolean;
  className?: string;
  /** Override fill color — defaults to currentColor so it inherits text color */
  color?: string;
}

/**
 * U:DO CRAFT brand logo.
 * Uses currentColor by default — wrap in a text-* class to tint it.
 * Pass color="var(--brand-primary)" or a hex to pin the color explicitly.
 */
export function BrandLogo({ compact = false, className, color = "currentColor" }: BrandLogoProps) {
  if (compact) {
    return (
      <div className={cn("flex items-center justify-center", className)}>
        <svg width="20" height="24" viewBox="0 0 20 24" fill="none" aria-hidden="true">
          <path
            d="M0 0H8.72727V10.9091H10.9091V0H19.6364V14.1818C19.6364 20.4545 15.2406 24 9.81818 24C4.39575 24 0 20.1818 0 14.1818V0Z"
            fill={color}
          />
        </svg>
      </div>
    );
  }

  return (
    <div className={cn("flex items-center", className)}>
      <svg
        width="78"
        height="24"
        viewBox="0 0 78 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="U:DO Craft"
        role="img"
      >
        <path d="M0 0H8.72727V10.9091H10.9091V0H19.6364V14.1818C19.6364 20.4545 15.2406 24 9.81818 24C4.39575 24 0 20.1818 0 14.1818V0Z" fill={color} />
        <path d="M27.8182 7.0909C27.8182 8.8984 26.3529 10.3636 24.5454 10.3636C22.7379 10.3636 21.2727 8.8984 21.2727 7.0909C21.2727 5.28342 22.7379 3.81818 24.5454 3.81818C26.3529 3.81818 27.8182 5.28342 27.8182 7.0909Z" fill={color} />
        <path d="M27.8182 16.9091C27.8182 18.7166 26.3529 20.1818 24.5454 20.1818C22.7379 20.1818 21.2727 18.7166 21.2727 16.9091C21.2727 15.1016 22.7379 13.6363 24.5454 13.6363C26.3529 13.6363 27.8182 15.1016 27.8182 16.9091Z" fill={color} />
        <path d="M40.3637 10.9091H29.4546V0H40.2425C47.9092 0 52.2425 5.37258 52.2425 12C52.2425 18.6274 47.5758 24 40.2425 24H29.4546V13.0909H40.3637V10.9091Z" fill={color} />
        <path d="M77.8786 12.0244C77.8786 18.2841 73.0861 23.4244 66.9696 23.9756V13.1154H64.7879V23.9756C58.6717 23.4244 53.8788 18.2841 53.8788 12.0244C53.8788 5.39703 59.2514 0.0244446 65.8788 0.0244446C72.5059 0.0244446 77.8786 5.39703 77.8786 12.0244Z" fill={color} />
      </svg>
    </div>
  );
}

/** Full-size logo SVG for hero/marketing contexts (780×240 viewBox) */
export function BrandLogoFull({ className, color = "currentColor" }: { className?: string; color?: string }) {
  return (
    <svg
      viewBox="0 0 780 240"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="U:DO CRAFT"
      role="img"
    >
      <path d="M0 0H87.2727V109.091H109.091V0H196.364V141.818C196.364 204.545 152.406 240 98.1818 240C43.9575 240 0 201.818 0 141.818V0Z" fill={color} />
      <path d="M278.182 70.9091C278.182 88.9841 263.529 103.636 245.454 103.636C227.379 103.636 212.727 88.9841 212.727 70.9091C212.727 52.8343 227.379 38.1818 245.454 38.1818C263.529 38.1818 278.182 52.8343 278.182 70.9091Z" fill={color} />
      <path d="M278.182 169.091C278.182 187.166 263.529 201.818 245.454 201.818C227.379 201.818 212.727 187.166 212.727 169.091C212.727 151.016 227.379 136.364 245.454 136.364C263.529 136.364 278.182 151.016 278.182 169.091Z" fill={color} />
      <path d="M403.636 109.091H294.545V0H402.424C479.091 0 522.424 53.7258 522.424 120C522.424 186.274 475.758 240 402.424 240H294.545V130.909H403.636V109.091Z" fill={color} />
      <path d="M778.786 120.244C778.786 182.841 730.861 234.244 669.695 239.756V131.154H647.878V239.756C586.717 234.244 538.788 182.841 538.788 120.244C538.788 53.9703 592.513 0.244446 658.788 0.244446C725.059 0.244446 778.786 53.9703 778.786 120.244Z" fill={color} />
    </svg>
  );
}
