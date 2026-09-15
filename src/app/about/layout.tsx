import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Our Story',
  description: 'Learn about Royal Perfumes. Operational precision, manufacturing excellence, and uncompromising quality for luxury fragrances.',
  openGraph: {
    title: 'Our Story | Royal Perfumes',
    description: 'Learn about Royal Perfumes. Operational precision, manufacturing excellence, and uncompromising quality for luxury fragrances.',
  },
};

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
