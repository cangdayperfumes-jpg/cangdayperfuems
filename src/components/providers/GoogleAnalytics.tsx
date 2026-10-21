'use client';

import { useEffect } from 'react';
import Script from 'next/script';
import { usePathname, useSearchParams } from 'next/navigation';
import { hasAnalyticsConsent } from '@/lib/analytics';

let initialised = false;

/** Queues consent defaults + config before anything else (gtag.js replays the queue in order). */
function init(id: string) {
  if (initialised) return;
  initialised = true;
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    // eslint-disable-next-line prefer-rest-params -- gtag.js expects the arguments object
    window.dataLayer!.push(arguments);
  };
  window.gtag('consent', 'default', {
    analytics_storage: hasAnalyticsConsent() ? 'granted' : 'denied',
    // No advertising on this site.
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    wait_for_update: 500,
  });
  window.gtag('js', new Date());
  window.gtag('config', id, { send_page_view: false });
}

/**
 * GA4 with Consent Mode v2. Consent defaults to "denied" (no cookies, only
 * anonymous cookieless pings) and is granted only after the visitor accepts
 * the cookie banner — what KVKK/GDPR require for analytics cookies. Page
 * views are sent manually so client-side navigations are counted too.
 */
export default function GoogleAnalytics({ id }: { id: string }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    init(id);
    const qs = searchParams?.toString();
    window.gtag!('event', 'page_view', {
      page_location: window.location.origin + pathname + (qs ? `?${qs}` : ''),
      page_title: document.title,
    });
  }, [id, pathname, searchParams]);

  return <Script src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`} strategy="afterInteractive" />;
}
