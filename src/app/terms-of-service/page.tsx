import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'The terms that apply to orders placed with Cangday.',
  alternates: { canonical: '/terms-of-service' },
  robots: { index: true, follow: true },
};

const lastUpdated = 'August 22, 2026';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-xl md:text-2xl font-heading font-medium text-gray-900">{title}</h2>
      <div className="space-y-3 text-sm md:text-base text-gray-600 leading-relaxed">
        {children}
      </div>
    </section>
  );
}

export default function TermsOfServicePage() {
  return (
    <div className="container py-12 md:py-20 max-w-3xl mx-auto space-y-10">
      <div className="space-y-2 text-center">
        <h1 className="text-4xl md:text-5xl font-heading font-medium text-gray-900">Terms of Service</h1>
        <p className="text-sm text-gray-400">Last updated: {lastUpdated}</p>
      </div>

      <p className="text-sm md:text-base text-gray-600 leading-relaxed">
        Cangday is an online fragrance retailer. By browsing this site or placing an order, you
        agree to these terms.
      </p>

      <Section title="Products & Pricing">
        <p>
          Product photos and descriptions are representative of the item shipped; minor variation
          in packaging or bottle design can occur between production batches. Prices are shown in
          the currency displayed at checkout and are confirmed at the time of purchase.
        </p>
      </Section>

      <Section title="How Ordering Works">
        <p>
          Submitting the checkout form places your order with us. We&apos;ll confirm shipping
          details by email and keep you updated until your order arrives.
        </p>
      </Section>

      <Section title="Shipping">
        <p>
          Shipping costs and delivery timelines vary by destination and shipping method. See our{' '}
          <Link href="/shipping" className="text-gray-900 underline underline-offset-2 hover:no-underline">
            Shipping &amp; Returns
          </Link>{' '}
          page for current rates by country.
        </p>
      </Section>

      <Section title="Returns">
        <p>
          Returns are accepted within 7 days of delivery. To start a return,{' '}
          <Link href="/contact" className="text-gray-900 underline underline-offset-2 hover:no-underline">
            contact us
          </Link>{' '}
          with your order details. Approved returns are shipped back by mail at no cost to you.
        </p>
      </Section>

      <Section title="Order Cancellation">
        <p>
          You can cancel or change an order at no cost any time before it ships — just{' '}
          <Link href="/contact" className="text-gray-900 underline underline-offset-2 hover:no-underline">
            contact us
          </Link>
          .
        </p>
      </Section>

      <Section title="Intellectual Property">
        <p>
          All text, images, and branding on this site belong to Cangday and may not be reproduced
          without our permission.
        </p>
      </Section>

      <Section title="Limitation of Liability">
        <p>
          We aim for accuracy in everything we publish, but we're not liable for indirect or
          consequential losses arising from use of this website or delays outside our reasonable
          control (for example, customs or carrier delays).
        </p>
      </Section>

      <Section title="Governing Law">
        <p>
          These terms are governed by the laws of the jurisdiction in which Cangday is registered.
        </p>
      </Section>

      <Section title="Changes to These Terms">
        <p>
          We may update these terms from time to time. Material changes will be reflected by
          updating the "Last updated" date above.
        </p>
      </Section>

      <Section title="Contact Us">
        <p>
          Questions about an order or these terms? See our{' '}
          <Link href="/contact" className="text-gray-900 underline underline-offset-2 hover:no-underline">
            Contact page
          </Link>
          . For how we handle your personal information, see our{' '}
          <Link href="/privacy-policy" className="text-gray-900 underline underline-offset-2 hover:no-underline">
            Privacy Policy
          </Link>
          .
        </p>
      </Section>
    </div>
  );
}
