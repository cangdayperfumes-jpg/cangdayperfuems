import { useId } from 'react';
import { cn } from '@/lib/utils';

/**
 * Bludora Software's cloud mark, redrawn as SVG: a blue-to-violet cloud
 * with a white arrow sweeping up through it. Used in the footer credit.
 */
export function BludoraMark({ className }: { className?: string }) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  return (
    <svg viewBox="0 0 120 84" className={className} aria-hidden="true" focusable="false">
      <defs>
        {/* userSpaceOnUse so the overlapping cloud parts share one continuous gradient. */}
        <linearGradient id={`${id}-cloud`} x1="20" y1="6" x2="104" y2="74" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#22D3F5" />
          <stop offset="0.38" stopColor="#0A5CFF" />
          <stop offset="0.8" stopColor="#1336E8" />
          <stop offset="1" stopColor="#8B4DFF" />
        </linearGradient>
        <radialGradient id={`${id}-shade`} cx="58" cy="62" r="40" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#06115E" stopOpacity="0.75" />
          <stop offset="1" stopColor="#06115E" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`${id}-glow`} cx="56" cy="14" r="26" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#5EEBFF" stopOpacity="0.8" />
          <stop offset="1" stopColor="#5EEBFF" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${id}-arrow`} x1="16" y1="68" x2="84" y2="18" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#3FA2FF" />
          <stop offset="0.55" stopColor="#BFE0FF" />
          <stop offset="1" stopColor="#FFFFFF" />
        </linearGradient>
      </defs>

      {/* Cloud: three bumps on a flat base. */}
      <g fill={`url(#${id}-cloud)`}>
        <circle cx="36" cy="46" r="22" />
        <circle cx="62" cy="33" r="28" />
        <circle cx="90" cy="49" r="20" />
        <rect x="36" y="44" width="54" height="25" />
      </g>
      <g fill={`url(#${id}-shade)`}>
        <circle cx="36" cy="46" r="22" />
        <circle cx="90" cy="49" r="20" />
        <rect x="36" y="44" width="54" height="25" />
      </g>
      <circle cx="62" cy="33" r="28" fill={`url(#${id}-glow)`} />

      {/* Arrow sweeping up and to the right. */}
      <path
        d="M14 62 C 30 74, 56 62, 76 30"
        fill="none"
        stroke={`url(#${id}-arrow)`}
        strokeWidth="9"
        strokeLinecap="round"
      />
      <path d="M89 10 L 63 18 L 86 37 Z" fill="#FFFFFF" strokeLinejoin="round" stroke="#FFFFFF" strokeWidth="2" />
    </svg>
  );
}

/** "BLUDORA" wordmark — BLU in the brand blue gradient, DORA in deep navy. */
export function BludoraWordmark({ className }: { className?: string }) {
  return (
    <span className={cn('font-extrabold uppercase tracking-[0.06em] leading-none', className)} style={{ fontFamily: 'var(--font-body), system-ui, sans-serif' }}>
      <span className="bg-gradient-to-b from-[#0BB8FF] to-[#0A4DFF] bg-clip-text text-transparent">Blu</span>
      <span className="text-[#0A1030]">dora</span>
    </span>
  );
}
