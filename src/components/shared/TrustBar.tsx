import { Truck, Gift, ShieldCheck, RotateCcw } from 'lucide-react';

const ITEMS = [
  { icon: Truck, label: 'Free shipping on every order' },
  { icon: Gift, label: 'Free mini gift over $75' },
  { icon: ShieldCheck, label: '100% original, guaranteed' },
  { icon: RotateCcw, label: '14-day easy returns' },
];

/**
 * Thin utility strip above the header — the first trust signal a visitor
 * reads, before the brand mark even loads. Sits on the same ink surface as
 * the header so the two read as one chrome unit.
 */
export default function TrustBar() {
  return (
    <div className="hidden md:block w-full bg-ink text-ivory/80 border-b border-ink-line">
      <div className="container flex items-center justify-center gap-10 h-9 text-[11px] font-medium tracking-wide">
        {ITEMS.map(({ icon: Icon, label }) => (
          <div key={label} className="flex items-center gap-2">
            <Icon className="h-3.5 w-3.5 text-gold" strokeWidth={1.75} />
            <span>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
