import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { getTranslations } from 'next-intl/server';

export default async function NotFound() {
  const t = await getTranslations('notFound');
  return (
    <div className="container flex flex-col items-center justify-center text-center py-24 md:py-40 min-h-[60vh]">
      <span className="font-heading text-7xl md:text-9xl font-medium tracking-tight text-black/10 select-none">
        404
      </span>
      <h1 className="font-heading text-2xl md:text-4xl font-medium tracking-tight mt-4">
        {t('title')}
      </h1>
      <p className="text-muted-foreground font-body mt-3 max-w-md">
        {t('body')}
      </p>
      <div className="flex flex-col sm:flex-row items-center gap-4 mt-8">
        <Link href="/shop">
          <Button
            size="lg"
            className="bg-black text-white hover:bg-gray-800 rounded-none px-10 tracking-wider font-body"
          >
            {t('shopCollection')}
          </Button>
        </Link>
        <Link href="/">
          <Button
            variant="outline"
            size="lg"
            className="rounded-none px-10 tracking-wider font-body"
          >
            {t('backToHome')}
          </Button>
        </Link>
      </div>
    </div>
  );
}
