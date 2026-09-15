'use client';

import { usePathname } from 'next/navigation';

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
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith('/admin');
  const isCheckout = hideOnCheckout && pathname === '/checkout';

  if (isAdmin || isCheckout) {
    return null;
  }

  return <>{children}</>;
}
