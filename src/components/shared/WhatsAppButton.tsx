'use client';

import { useTranslations } from 'next-intl';
import { useSettings } from '@/components/providers/SettingsProvider';
import { useStickyBarStore } from '@/store/useStickyBarStore';
import { isValidWhatsAppNumber, whatsAppLink } from '@/lib/whatsapp';
import { cn } from '@/lib/utils';

/** WhatsApp's glyph (speech bubble with handset). */
export function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true" focusable="false">
      <path
        fill="currentColor"
        d="M16.04 3C8.86 3 3.03 8.82 3.03 16c0 2.3.6 4.53 1.74 6.5L3 29l6.68-1.75A12.95 12.95 0 0 0 16.04 29C23.2 29 29 23.18 29 16S23.2 3 16.04 3Zm0 23.62c-1.98 0-3.92-.53-5.62-1.54l-.4-.24-3.97 1.04 1.06-3.86-.26-.4A10.57 10.57 0 0 1 5.4 16c0-5.86 4.77-10.63 10.64-10.63 5.86 0 10.6 4.77 10.6 10.63 0 5.86-4.74 10.62-10.6 10.62Zm5.83-7.96c-.32-.16-1.89-.93-2.18-1.04-.29-.1-.5-.16-.72.16-.21.32-.82 1.04-1 1.25-.19.21-.37.24-.69.08-.32-.16-1.35-.5-2.57-1.59-.95-.85-1.59-1.9-1.78-2.22-.18-.32-.02-.49.14-.65.15-.14.32-.37.48-.56.16-.18.21-.32.32-.53.1-.21.05-.4-.03-.56-.08-.16-.72-1.73-.98-2.37-.26-.62-.52-.54-.72-.55h-.61c-.21 0-.56.08-.85.4-.29.32-1.11 1.09-1.11 2.66 0 1.57 1.14 3.08 1.3 3.3.16.21 2.24 3.42 5.43 4.8.76.33 1.35.52 1.81.67.76.24 1.45.2 2 .12.61-.09 1.89-.77 2.15-1.52.27-.74.27-1.38.19-1.52-.08-.13-.29-.21-.61-.37Z"
      />
    </svg>
  );
}

/**
 * Floating WhatsApp chat button on every storefront page — Admin → Settings →
 * WhatsApp turns it on and sets the number. Sits above the scroll-to-top
 * button (and above the product page's sticky Add to Cart bar on phones).
 */
export default function WhatsAppButton() {
  const t = useTranslations('common');
  const { whatsapp } = useSettings();
  const stickyBarVisible = useStickyBarStore((s) => s.visible);
  if (!whatsapp.enabled || !isValidWhatsAppNumber(whatsapp.number)) return null;

  return (
    <a
      href={whatsAppLink(whatsapp.number, t('whatsappMessage'))}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={t('whatsappLabel')}
      title={t('whatsappLabel')}
      className={cn(
        'group fixed right-4 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-[#25D366] text-white',
        'shadow-[0_8px_24px_-6px_rgba(37,211,102,0.65)] transition-transform duration-300 hover:scale-105 active:scale-95',
        'md:right-8 md:bottom-24 md:h-14 md:w-14',
        stickyBarVisible ? 'bottom-[12.5rem]' : 'bottom-32'
      )}
    >
      {/* Soft pulse ring to draw the eye, without moving the button. */}
      <span aria-hidden="true" className="absolute inset-0 rounded-full bg-[#25D366] opacity-40 animate-ping [animation-duration:2.5s] motion-reduce:hidden" />
      <WhatsAppIcon className="relative h-7 w-7 md:h-8 md:w-8" />
    </a>
  );
}
