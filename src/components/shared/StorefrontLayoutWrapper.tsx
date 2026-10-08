'use client';

import { usePathname } from '@/i18n/navigation';

export default function StorefrontLayoutWrapper({
  children,
  hideOnCheckout = false,
}: {
  children: React.ReactNode
  /** Also hide on the /checkout form page (not /checkout/success). Used to
   *  drop the footer from the checkout screen without affecting bottom nav
   *  or scroll-to-top, which stay wrapped separately. */
  hideOnCheckout?: boolean
}) {
  // usePathname here is next-intl's locale-stripped variant (admin lives
  // under its own root layout now, so it never renders this component).
  const pathname = usePathname();
  const isCheckout = hideOnCheckout && pathname === '/checkout';

  if (isCheckout) {
    return null;
  }

  return <>{children}</>;
}
