'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import ImageWithFallback from '@/components/shared/ImageWithFallback';
import { X } from 'lucide-react';
import { useSettings } from '@/components/providers/SettingsProvider';

export default function SitePopup() {
  const { popupSettings: settings } = useSettings();
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    // Don't show on admin pages, or if popup config isn't enabled
    if (pathname?.startsWith('/admin')) return;
    if (!settings || !settings.popup_enabled) return;

    // Check if popup was already dismissed in the last 24 hours
    const dismissedData = localStorage.getItem('popup_dismissed_v2');
    if (dismissedData) {
      try {
        const { timestamp } = JSON.parse(dismissedData);
        const hoursSinceDismissed = (Date.now() - timestamp) / (1000 * 60 * 60);
        if (hoursSinceDismissed < 24) return; // 24-hour cooldown
      } catch (e) {
        // Fallback if parsing fails
      }
    }

    const showOn = settings.popup_show_on || 'all';
    const shouldShow =
      showOn === 'all' ||
      (showOn === 'shop' && pathname?.startsWith('/shop')) ||
      (showOn === 'home' && (pathname === '/' || pathname === '/home1'));

    if (shouldShow) {
      // Small delay so the page loads first
      const timer = setTimeout(() => setIsOpen(true), 1500);
      return () => clearTimeout(timer);
    }
  }, [pathname, settings]);

  const handleClose = () => {
    setIsOpen(false);
    localStorage.setItem('popup_dismissed_v2', JSON.stringify({ timestamp: Date.now() }));
  };

  if (!isOpen || !settings) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={handleClose}
      />

      {/* Popup */}
      <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none">
        <div className="relative bg-white w-full max-w-md pointer-events-auto shadow-2xl animate-in zoom-in-95 fade-in duration-300">
          {/* Close Button */}
          <button
            onClick={handleClose}
            className="absolute top-3 right-3 z-10 w-8 h-8 flex items-center justify-center text-gray-400 hover:text-black transition-colors"
            aria-label="Close popup"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Optional Image */}
          {settings.popup_image_url && (
            <div className="relative w-full aspect-[16/9] bg-gray-100">
              <ImageWithFallback
                src={settings.popup_image_url}
                alt={settings.popup_title || 'Promotion'}
                fill
                className="object-cover"
                sizes="(max-width: 448px) 100vw, 448px"
              />
            </div>
          )}

          {/* Content */}
          <div className="p-6 md:p-8 text-center">
            {settings.popup_title && (
              <h2 className="text-2xl md:text-3xl font-heading font-medium mb-3">
                {settings.popup_title}
              </h2>
            )}

            {settings.popup_message && (
              <p className="text-sm md:text-base text-gray-500 font-body font-light leading-relaxed mb-6">
                {settings.popup_message}
              </p>
            )}

            {settings.popup_button_text && (
              <Link
                href={settings.popup_button_link || '/shop'}
                onClick={handleClose}
                className="inline-flex items-center justify-center bg-black text-white px-8 py-3.5 text-xs uppercase tracking-[0.2em] font-body font-medium hover:bg-gray-800 transition-colors w-full"
              >
                {settings.popup_button_text}
              </Link>
            )}

            <button
              onClick={handleClose}
              className="mt-4 text-xs text-gray-400 hover:text-gray-600 uppercase tracking-widest font-body transition-colors"
            >
              No thanks
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
