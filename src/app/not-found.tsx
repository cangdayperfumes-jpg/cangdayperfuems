import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="container flex flex-col items-center justify-center text-center py-24 md:py-40 min-h-[60vh]">
      <span className="font-heading text-7xl md:text-9xl font-medium tracking-tight text-black/10 select-none">
        404
      </span>
      <h1 className="font-heading text-2xl md:text-4xl font-medium tracking-tight mt-4">
        Page Not Found
      </h1>
      <p className="text-muted-foreground font-body mt-3 max-w-md">
        The page you&apos;re looking for doesn&apos;t exist or may have been moved.
      </p>
      <div className="flex flex-col sm:flex-row items-center gap-4 mt-8">
        <Link href="/shop">
          <Button
            size="lg"
            className="bg-black text-white hover:bg-gray-800 rounded-none px-10 tracking-wider font-body"
          >
            Shop Collection
          </Button>
        </Link>
        <Link href="/">
          <Button
            variant="outline"
            size="lg"
            className="rounded-none px-10 tracking-wider font-body"
          >
            Back to Home
          </Button>
        </Link>
      </div>
    </div>
  );
}
