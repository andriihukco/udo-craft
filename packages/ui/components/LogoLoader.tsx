"use client";

/**
 * Full-page loading screen using the brand logo PNG
 * with shimmer + subtle scale pulse animation.
 */
export function LogoLoader() {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white">
      <div
        className="relative overflow-hidden rounded-sm logo-loader-wrap"
        style={{ width: 256, height: 80 }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo.png"
          alt="Loading…"
          className="w-full h-full object-contain select-none"
          draggable={false}
        />
        {/* Shimmer overlay */}
        <span aria-hidden="true" className="absolute inset-0 logo-shimmer" />
      </div>

      <style>{`
        @keyframes logo-shine {
          0%   { transform: translateX(-100%) skewX(-15deg); }
          100% { transform: translateX(250%)  skewX(-15deg); }
        }
        @keyframes logo-pulse {
          0%, 100% { transform: scale(1);    opacity: 1;    }
          50%       { transform: scale(1.04); opacity: 0.85; }
        }
        .logo-loader-wrap {
          animation: logo-pulse 2s ease-in-out infinite;
        }
        .logo-shimmer {
          background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(255,255,255,0.0) 30%,
            rgba(255,255,255,0.75) 50%,
            rgba(255,255,255,0.0) 70%,
            transparent 100%
          );
          animation: logo-shine 1.6s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
