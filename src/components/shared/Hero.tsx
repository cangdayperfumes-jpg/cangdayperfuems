'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

// Sourced for design-review placeholder use — swapped for real Cangday
// product photography once the catalog/image migration lands.
const HERO_IMAGE =
  'https://images.unsplash.com/photo-1774682060997-f8959850a7d4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1920';

export default function Hero() {
  return (
    <section className="ink-grain relative h-[92vh] md:h-screen min-h-[620px] w-full overflow-hidden bg-ink text-ivory">
      {/* Background photograph, asymmetric — anchored right, faded into ink on
          the left so the headline block has a clean read without a flat scrim
          covering the whole frame. */}
      <div className="absolute inset-0 z-0">
        <Image
          src={HERO_IMAGE}
          alt=""
          fill
          priority
          fetchPriority="high"
          sizes="100vw"
          className="object-cover object-[70%_center] opacity-70"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/80 to-ink/10" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-transparent to-ink/40" />
      </div>

      {/* Content — left-anchored, asymmetric grid rather than centered text */}
      <div className="relative z-10 h-full container flex flex-col justify-center max-w-none">
        <div className="max-w-xl">
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-xs uppercase tracking-[0.35em] text-gold font-semibold mb-6"
          >
            Modern Perfumery
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="font-heading text-5xl sm:text-6xl lg:text-7xl font-medium leading-[0.95] tracking-tight"
          >
            Wear what
            <br />
            <span className="italic font-normal text-gold-soft">lingers.</span>
          </motion.h1>

          {/* Signature motif — a hairline "scent trail" used as a recurring
              divider across the site instead of a plain <hr>. */}
          <motion.svg
            initial={{ opacity: 0, pathLength: 0 }}
            animate={{ opacity: 1, pathLength: 1 }}
            transition={{ duration: 1.1, delay: 0.6, ease: 'easeInOut' }}
            width="140" height="24" viewBox="0 0 140 24" fill="none"
            className="my-6"
            aria-hidden="true"
          >
            <motion.path
              d="M2 18C24 18 28 4 50 4C72 4 76 20 98 20C112 20 118 12 138 12"
              stroke="#C9A24B" strokeWidth="1.5" strokeLinecap="round"
            />
            <circle cx="138" cy="12" r="2.5" fill="#C9A24B" />
          </motion.svg>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="text-base md:text-lg text-ivory/70 font-light max-w-md leading-relaxed"
          >
            An edited collection of designer and niche fragrances — chosen for
            how they feel hours after you stop noticing them.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.7 }}
            className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mt-9"
          >
            <Link href="/shop">
              <Button
                size="lg"
                className="bg-ivory text-ink hover:bg-gold hover:text-ink rounded-none text-sm px-9 py-6 font-body font-semibold tracking-wider uppercase transition-colors"
              >
                Shop the Collection
              </Button>
            </Link>
            <Link href="/about">
              <Button
                variant="outline"
                size="lg"
                className="bg-transparent border border-ivory/40 text-ivory hover:bg-ivory/10 hover:border-ivory rounded-none text-sm px-9 py-6 font-body tracking-wider uppercase transition-colors"
              >
                Our Story
              </Button>
            </Link>
          </motion.div>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.8 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center z-10 text-ivory/50"
      >
        <div className="animate-bounce flex flex-col items-center">
          <span className="text-[10px] uppercase tracking-[0.3em] mb-2 font-light">Scroll</span>
          <ChevronDown className="h-4 w-4" />
        </div>
      </motion.div>
    </section>
  );
}
