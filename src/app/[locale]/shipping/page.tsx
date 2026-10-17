import { createClient } from '@supabase/supabase-js';
import { PLACEHOLDER_SUPABASE_URL } from '@/utils/supabase/placeholder';
import { Separator } from '@/components/ui/separator';
import ShippingContent from '@/components/shipping/ShippingContent';
import { Link } from '@/i18n/navigation';
import { getTranslations } from 'next-intl/server';
import { Truck, DollarSign, PackageCheck, MapPinned, ShieldCheck, Mail } from 'lucide-react';

export const revalidate = 60; // Revalidate every minute

export async function generateMetadata() {
  const t = await getTranslations('shipping');
  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
    alternates: { canonical: '/shipping' },
  };
}

export default async function ShippingPage() {
  const t = await getTranslations('shipping');

  const policyHighlights = [
    { icon: Truck, title: t('policy1Title'), description: t('policy1Desc') },
    { icon: DollarSign, title: t('policy2Title'), description: t('policy2Desc') },
    { icon: PackageCheck, title: t('policy3Title'), description: t('policy3Desc') },
    { icon: MapPinned, title: t('policy4Title'), description: t('policy4Desc') },
    { icon: ShieldCheck, title: t('policy5Title'), description: t('policy5Desc') },
  ];

  // Cookie-free client: this page only reads public data, and cookies() would
  // force fully dynamic (uncached) rendering, overriding `revalidate` above.
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || PLACEHOLDER_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder'
  );
  const { data: zones } = await supabase
    .from('shipping_zones')
    .select('*')
    // Only switched-on countries; Turkish province overrides aren't listed separately.
    .eq('is_enabled', true)
    .is('city', null)
    .order('continent', { ascending: true })
    .order('country', { ascending: true });

  // Group by continent
  const groupedZones = zones?.reduce((acc: any, zone) => {
      const continent = zone.continent || 'Other';
      if (!acc[continent]) acc[continent] = [];
      acc[continent].push(zone);
      return acc;
  }, {});

  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-4xl mx-auto px-6 py-24 space-y-16">

        {/* Hero Header */}
        <div className="text-center space-y-6">
          <h1 className="text-4xl md:text-5xl font-heading font-medium text-black">
            {t('title')}
          </h1>
          <p className="text-lg text-gray-500 font-light max-w-2xl mx-auto leading-relaxed">
            {t('intro')}
          </p>
        </div>

        <Separator className="opacity-50" />

        {/* Shipping Policy */}
        <section className="space-y-6">
          <h2 className="text-2xl font-heading font-medium">{t('shippingPolicy')}</h2>
          <div className="border-t border-gray-100 divide-y divide-gray-100">
            {policyHighlights.map(({ icon: Icon, title, description }) => (
              <div key={title} className="flex gap-5 py-6">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-black" strokeWidth={1.5} />
                </div>
                <div className="space-y-1">
                  <h3 className="font-heading font-medium text-black">{title}</h3>
                  <p className="text-sm text-gray-600 font-light leading-relaxed max-w-2xl">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <ShippingContent groupedZones={groupedZones} allZones={zones || []} />

        {/* Get a Shipping Quote */}
        <section className="bg-ink text-ivory p-8 md:p-10 rounded-sm relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                <Mail className="w-5 h-5 text-white" strokeWidth={1.5} />
              </div>
              <div className="space-y-1">
                <h3 className="font-heading text-xl font-medium text-white">{t('questionsTitle')}</h3>
                <p className="text-gray-300 font-light text-sm leading-relaxed max-w-xl">
                  {t('questionsBody')}
                </p>
              </div>
            </div>
            <div className="flex-shrink-0 flex flex-col gap-3 w-full sm:w-auto">
              <Link
                href="/contact"
                className="inline-flex items-center justify-center rounded-sm bg-white text-black px-6 py-3 text-sm font-medium hover:bg-gray-100 transition-colors"
              >
                {t('contactUs')}
              </Link>
            </div>
          </div>
          {/* Visual decoration */}
          <div className="absolute top-0 right-0 -mt-8 -mr-8 w-32 h-32 bg-white/5 rounded-full blur-2xl"></div>
        </section>

      </div>
    </div>
  );
}
