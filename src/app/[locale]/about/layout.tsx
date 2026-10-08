import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Our Story',
  description: 'Learn about Cangday — a modern fragrance house offering an edited collection of designer and niche perfumes for everyday wear.',
  openGraph: {
    title: 'Our Story | Cangday',
    description: 'Learn about Cangday — a modern fragrance house offering an edited collection of designer and niche perfumes for everyday wear.',
  },
};

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
