import type { Metadata } from 'next';
import { MessageCircle, MapPin, Send } from 'lucide-react';
import { WHATSAPP_URL, TELEGRAM_URL } from '@/lib/social';

export const metadata: Metadata = {
  title: 'Contact Us',
  description: 'Get in touch with Royal Perfumes, our Istanbul-based fragrance manufacturer, via WhatsApp or Telegram for wholesale inquiries and order support.',
  alternates: { canonical: '/contact' },
};

export default function ContactPage() {
  return (
    <div className="container py-12 md:py-24 space-y-8 max-w-2xl mx-auto text-center">
      <h1 className="text-4xl font-heading font-bold">Contact Us</h1>
      <p className="text-lg text-muted-foreground">
        We'd love to hear from you. Reach out for wholesale inquiries, order support, or general questions.
      </p>
      <div className="p-6 bg-gray-50 rounded-lg space-y-4 text-left">
        <div className="flex items-start gap-3">
          <MessageCircle className="w-5 h-5 mt-0.5 flex-shrink-0" strokeWidth={1.5} />
          <div>
            <p className="font-medium">WhatsApp</p>
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-black transition-colors"
            >
              +90 541 115 8571
            </a>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <Send className="w-5 h-5 mt-0.5 flex-shrink-0" strokeWidth={1.5} />
          <div>
            <p className="font-medium">Telegram</p>
            <a
              href={TELEGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-black transition-colors"
            >
              @royalperfumess
            </a>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <MapPin className="w-5 h-5 mt-0.5 flex-shrink-0" strokeWidth={1.5} />
          <div>
            <p className="font-medium">Address</p>
            <p className="text-muted-foreground">Istanbul, Türkiye</p>
          </div>
        </div>
      </div>
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <a
          href={WHATSAPP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center rounded-sm bg-black text-white px-8 py-3 text-sm font-medium hover:bg-gray-800 transition-colors"
        >
          WhatsApp Us
        </a>
        <a
          href={TELEGRAM_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center rounded-sm border border-black text-black px-8 py-3 text-sm font-medium hover:bg-gray-100 transition-colors"
        >
          Message on Telegram
        </a>
      </div>
    </div>
  );
}
