export type EmailLocale = 'tr' | 'en';

export const EMAIL_SUBJECTS: Record<EmailLocale, { confirmation: string; accepted: string }> = {
  tr: { confirmation: 'Cangday: Siparişiniz alındı', accepted: 'Cangday: Siparişiniz onaylandı ve kargoya hazırlanıyor' },
  en: { confirmation: 'Cangday: Order received', accepted: 'Cangday: Order accepted & ready for shipment' },
};

/** Wording for the two order emails. Payment is always cash on delivery. */
export const EMAIL_COPY = {
  tr: {
    confirmationPreview: 'Cangday siparişiniz için teşekkür ederiz.',
    confirmationHeading: 'Siparişiniz alındı.',
    dear: (name: string) => `Sayın ${name},`,
    confirmationBody: (ref: string) => `Siparişiniz için teşekkür ederiz. #${ref} numaralı siparişinizi inceliyoruz.`,
    confirmationNext: 'Kargo detaylarını onaylamak için kısa süre içinde sizinle iletişime geçeceğiz.',
    acceptedPreview: 'Siparişiniz kargoya hazır.',
    acceptedHeading: 'Siparişiniz onaylandı.',
    acceptedBody: (ref: string) => `#${ref} numaralı siparişiniz onaylandı ve kargoya hazırlanıyor.`,
    acceptedNext: 'Sorularınız için iletişim sayfamızdan bize ulaşabilirsiniz.',
    payment: 'Ödeme: Kapıda nakit ödeme. Ödemeyi siparişiniz teslim edildiğinde kuryeye yaparsınız.',
    slogan: 'İzini Bırakan Kokular.',
    rights: 'Tüm hakları saklıdır.',
  },
  en: {
    confirmationPreview: 'Thank you for your order from Cangday.',
    confirmationHeading: 'Order received.',
    dear: (name: string) => `Dear ${name},`,
    confirmationBody: (ref: string) => `Thank you for your order. We are currently reviewing Order #${ref}.`,
    confirmationNext: 'We will contact you shortly to confirm the shipping details.',
    acceptedPreview: 'Your package is ready for shipment.',
    acceptedHeading: 'Order accepted.',
    acceptedBody: (ref: string) => `Your package for Order #${ref} is ready for shipment.`,
    acceptedNext: 'If you have any questions, please reach out through our contact page.',
    payment: 'Payment: cash on delivery. You pay the courier when your order arrives.',
    slogan: 'Wear What Lingers.',
    rights: 'All rights reserved.',
  },
} as const;
