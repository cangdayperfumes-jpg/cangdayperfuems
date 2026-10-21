import type { Metadata } from 'next';

// Checkout and order confirmation are private, per-visitor pages.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
