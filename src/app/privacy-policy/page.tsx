import type { Metadata } from 'next';
import Link from 'next/link';
import { WHATSAPP_URL, TELEGRAM_URL } from '@/lib/social';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'How Royal Perfumes collects, uses, and protects your personal information when you place a wholesale or retail order.',
  alternates: { canonical: '/privacy-policy' },
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

export default function PrivacyPolicyPage() {
  return (
    <div className="container py-12 md:py-20 max-w-3xl mx-auto space-y-10">
      <div className="space-y-2 text-center">
        <h1 className="text-4xl md:text-5xl font-heading font-medium text-gray-900">Privacy Policy</h1>
        <p className="text-sm text-gray-400">Last updated: {lastUpdated}</p>
      </div>

      <p className="text-sm md:text-base text-gray-600 leading-relaxed">
        Royal Perfumes ("we," "us," "our") is a wholesale and retail fragrance business based in
        Istanbul, Türkiye. This policy explains what personal information we collect through
        royalperfumes.company, how we use it, and who we share it with.
      </p>

      <Section title="Information We Collect">
        <p>
          <strong>Order information.</strong> When you place an order, we collect your name, email
          address, phone number, and shipping address (country, city, and street address).
        </p>
        <p>
          <strong>Shopping cart.</strong> The contents of your shopping cart are stored locally in
          your browser (using browser local storage) and are only sent to us once you submit an
          order at checkout.
        </p>
        <p>
          <strong>WhatsApp & Telegram communications.</strong> Wholesale pricing, shipping quotes,
          and payment are coordinated over WhatsApp or Telegram. Messages you send us there are
          handled according to that platform's own privacy policy (WhatsApp is operated by Meta;
          Telegram by Telegram FZ-LLC), not by us.
        </p>
      </Section>

      <Section title="How We Use Your Information">
        <ul className="list-disc pl-5 space-y-2">
          <li>To process, fulfill, and communicate with you about your order.</li>
          <li>To calculate shipping costs and coordinate delivery.</li>
          <li>To send order confirmation and status emails.</li>
          <li>To respond to inquiries you send us directly.</li>
        </ul>
        <p>We do not sell or rent your personal information to third parties.</p>
      </Section>

      <Section title="Who We Share Information With">
        <p>
          We use a small number of service providers to run the store. They only receive the
          information needed to perform their function on our behalf:
        </p>
        <ul className="list-disc pl-5 space-y-2">
          <li><strong>Supabase</strong> — hosts our database and stores order records.</li>
          <li><strong>Vercel</strong> — hosts the website.</li>
          <li><strong>Resend</strong> — delivers transactional order-confirmation emails.</li>
          <li><strong>WhatsApp (Meta)</strong> — only for conversations you choose to start with us.</li>
        </ul>
      </Section>

      <Section title="Cookies & Local Storage">
        <p>
          We use browser local storage to remember the contents of your shopping cart between
          visits. If you sign in to our admin dashboard, we use a session cookie to keep you
          signed in. We do not currently use advertising or analytics cookies.
        </p>
      </Section>

      <Section title="Data Retention">
        <p>
          We retain order records for as long as necessary to fulfill your order and to meet our
          accounting and legal record-keeping obligations.
        </p>
      </Section>

      <Section title="Your Rights">
        <p>
          You can contact us to request access to, correction of, or deletion of the personal
          information we hold about you. We'll respond to verified requests as quickly as we can.
        </p>
      </Section>

      <Section title="Children's Privacy">
        <p>
          Royal Perfumes is a business-to-business and general retail fragrance store not directed
          at children, and we do not knowingly collect information from anyone under 18.
        </p>
      </Section>

      <Section title="Changes to This Policy">
        <p>
          We may update this policy from time to time. Material changes will be reflected by
          updating the "Last updated" date above.
        </p>
      </Section>

      <Section title="Contact Us">
        <p>
          Questions about this policy or your data? Reach us on{' '}
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-900 underline underline-offset-2 hover:no-underline"
          >
            WhatsApp
          </a>{' '}
          or{' '}
          <a
            href={TELEGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-900 underline underline-offset-2 hover:no-underline"
          >
            Telegram
          </a>
          , or see our{' '}
          <Link href="/contact" className="text-gray-900 underline underline-offset-2 hover:no-underline">
            Contact page
          </Link>
          .
        </p>
      </Section>
    </div>
  );
}
