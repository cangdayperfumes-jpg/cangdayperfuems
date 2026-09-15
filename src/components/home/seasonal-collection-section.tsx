'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion, Variants } from 'framer-motion';
import { SeasonalCollection } from '@/types';

const HEIGHT_CLASSES: Record<SeasonalCollection['section_height'], string> = {
  sm: 'h-[320px] md:h-[380px]',
  md: 'h-[420px] md:h-[500px]',
  lg: 'h-[560px] md:h-[640px]',
  full: 'h-[80vh] md:h-screen',
};

const OBJECT_POSITION: Record<SeasonalCollection['image_position'], string> = {
  center: 'object-center',
  top: 'object-top',
  bottom: 'object-bottom',
  left: 'object-left',
  right: 'object-right',
};

const TEXT_ALIGN: Record<SeasonalCollection['text_alignment'], string> = {
  left: 'items-start text-left',
  center: 'items-center text-center',
  right: 'items-end text-right',
};

const ANIMATION_PRESETS: Record<SeasonalCollection['animation_style'], Variants> = {
  'fade-up': { hidden: { opacity: 0, y: 32 }, visible: { opacity: 1, y: 0 } },
  'fade-in': { hidden: { opacity: 0 }, visible: { opacity: 1 } },
  'slide-left': { hidden: { opacity: 0, x: 48 }, visible: { opacity: 1, x: 0 } },
  'slide-right': { hidden: { opacity: 0, x: -48 }, visible: { opacity: 1, x: 0 } },
  'zoom-in': { hidden: { opacity: 0, scale: 0.94 }, visible: { opacity: 1, scale: 1 } },
  none: { hidden: {}, visible: {} },
};

function buttonClasses(collection: SeasonalCollection): string {
  const base = 'inline-flex items-center px-6 py-2.5 text-sm uppercase tracking-widest transition-all duration-300';
  if (collection.button_style === 'outline') {
    return `${base} border`;
  }
  if (collection.button_style === 'ghost') {
    return `${base} hover:opacity-70`;
  }
  return `${base} shadow-sm`;
}

function buttonStyle(collection: SeasonalCollection): React.CSSProperties {
  const color = collection.button_color || '#FFFFFF';
  if (collection.button_style === 'solid') {
    return { backgroundColor: color, color: collection.background_color };
  }
  if (collection.button_style === 'outline') {
    return { borderColor: color, color };
  }
  return { color };
}

function CollectionCard({ collection }: { collection: SeasonalCollection }) {
  const preset = ANIMATION_PRESETS[collection.animation_style] || ANIMATION_PRESETS['fade-up'];

  return (
    <Link
      href={`/shop?season=${collection.slug}`}
      className={`group relative block w-full overflow-hidden ${HEIGHT_CLASSES[collection.section_height]}`}
      style={{ backgroundColor: collection.background_color }}
    >
      {collection.banner_image_desktop && (
        <Image
          src={collection.banner_image_desktop}
          alt={collection.title}
          fill
          loading="lazy"
          sizes="(max-width: 768px) 100vw, 100vw"
          className={`hidden md:block object-cover transition-transform duration-700 group-hover:scale-105 ${OBJECT_POSITION[collection.image_position]}`}
        />
      )}
      {(collection.banner_image_mobile || collection.banner_image_desktop) && (
        <Image
          src={collection.banner_image_mobile || collection.banner_image_desktop!}
          alt={collection.title}
          fill
          loading="lazy"
          sizes="100vw"
          className={`md:hidden object-cover transition-transform duration-700 group-hover:scale-105 ${OBJECT_POSITION[collection.image_position]}`}
        />
      )}

      {collection.background_pattern_image && (
        <Image
          src={collection.background_pattern_image}
          alt=""
          fill
          loading="lazy"
          className="object-cover opacity-40 mix-blend-overlay"
        />
      )}

      <div
        className="absolute inset-0"
        style={{ backgroundColor: collection.background_color, opacity: collection.overlay_opacity / 100 }}
      />

      {collection.decorative_image && (
        <Image
          src={collection.decorative_image}
          alt=""
          width={160}
          height={160}
          loading="lazy"
          className="absolute bottom-4 right-4 w-24 md:w-40 h-auto pointer-events-none opacity-90"
        />
      )}

      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.4 }}
        variants={preset}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className={`relative z-10 flex h-full w-full flex-col justify-center gap-4 px-6 md:px-16 ${TEXT_ALIGN[collection.text_alignment]}`}
        style={{ color: collection.text_color }}
      >
        {collection.subtitle && (
          <p className="text-xs md:text-sm uppercase tracking-[0.3em] opacity-90">{collection.subtitle}</p>
        )}
        <h2 className="text-3xl md:text-5xl font-heading font-medium">{collection.title}</h2>
        {collection.description && (
          <p className="max-w-md text-sm md:text-base opacity-90 font-body font-light">
            {collection.description}
          </p>
        )}
        <span className={buttonClasses(collection)} style={buttonStyle(collection)}>
          {collection.button_text}
        </span>
      </motion.div>
    </Link>
  );
}

export default function SeasonalCollectionSection({ collections }: { collections: SeasonalCollection[] }) {
  if (collections.length === 0) return null;

  if (collections.length === 1) {
    return (
      <section className="w-full">
        <CollectionCard collection={collections[0]} />
      </section>
    );
  }

  return (
    <section className="w-full py-16 md:py-24">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div
          className={`grid grid-cols-1 gap-6 ${
            collections.length === 2 ? 'md:grid-cols-2' : 'md:grid-cols-2 lg:grid-cols-3'
          }`}
        >
          {collections.map((collection) => (
            <CollectionCard key={collection.id} collection={collection} />
          ))}
        </div>
      </div>
    </section>
  );
}
