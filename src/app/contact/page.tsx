import type { Metadata } from 'next';
import { Mail } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Contact Us',
  description: 'Get in touch with Cangday for order support and general questions.',
  alternates: { canonical: '/contact' },
};

export default function ContactPage() {
  return (
    <div className="container py-12 md:py-24 space-y-8 max-w-2xl mx-auto text-center">
      <h1 className="text-4xl font-heading font-bold">Contact Us</h1>
      <p className="text-lg text-muted-foreground">
        We&apos;d love to hear from you. Reach out for order support or general questions.
      </p>
      <div className="p-6 bg-secondary/50 rounded-lg space-y-4 text-left">
        <div className="flex items-start gap-3">
          <Mail className="w-5 h-5 mt-0.5 flex-shrink-0" strokeWidth={1.5} />
          <div>
            <p className="font-medium">Email</p>
            <a
              href="mailto:hello@cangday.com"
              className="text-muted-foreground hover:text-black transition-colors"
            >
              hello@cangday.com
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
