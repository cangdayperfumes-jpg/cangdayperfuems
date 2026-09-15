
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';

export const revalidate = 60;

export const metadata = {
  title: 'Our Collections',
  description: 'Explore our exclusive range of fragrance collections and products.',
  alternates: { canonical: '/categories' },
  openGraph: {
    title: 'Our Collections | Royal Perfumes',
    description: 'Explore our exclusive range of fragrance collections and products.',
  },
};

export default async function CategoriesPage() {
  // Cookie-free client: this page only reads public data, and cookies() would
  // force fully dynamic (uncached) rendering, overriding `revalidate` above.
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .order('name');

  if (!categories) {
    return <div className="p-12 text-center">Error loading categories.</div>;
  }

  return (
    <div className="container py-12 md:py-20">
      <div className="text-center mb-16 space-y-4">
        <h1 className="text-4xl md:text-5xl font-heading font-medium">Our Collections</h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto font-body">
          Explore our exclusive range of fragrances and products, crafted for every personality and occasion.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {categories.map((category) => (
          <Link 
            key={category.id} 
            href={`/shop?category=${category.slug}`}
            className="group relative aspect-square w-full overflow-hidden block bg-gray-100 rounded-lg shadow-sm"
          >
            {category.image_url ? (
                <Image
                src={category.image_url}
                alt={category.name}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
            ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-500">
                    <span className="text-lg">No Image</span>
                </div>
            )}
            
            {/* Black Overlay */}
            <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition-colors" />
            
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 border-white/0 transition-all duration-300 group-hover:border-[1px] group-hover:border-white/20 m-4">
              <h2 className="text-3xl md:text-4xl font-heading text-white mb-4 tracking-wide drop-shadow-md text-center">
                {category.name}
              </h2>
              {category.description && (
                  <p className="text-white/80 text-sm max-w-xs text-center mb-6 line-clamp-2">
                      {category.description}
                  </p>
              )}
              <Button 
                variant="outline" 
                className="mt-2 border-white text-white hover:bg-white hover:text-black transition-colors opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 duration-500 bg-transparent"
              >
                Explore Collection
              </Button>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
