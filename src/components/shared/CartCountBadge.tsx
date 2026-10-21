'use client';

import { useEffect, useRef } from 'react';
import { motion, useAnimationControls } from 'framer-motion';
import { cn } from '@/lib/utils';

/**
 * Cart item count that pops whenever the number goes up, so adding to the
 * bag gets visible feedback in the header and bottom nav. Doesn't animate on
 * first render (rehydrating a saved cart shouldn't look like an add).
 */
export default function CartCountBadge({ count, className }: { count: number | undefined; className?: string }) {
  const controls = useAnimationControls();
  const prev = useRef(count);

  useEffect(() => {
    const before = prev.current;
    prev.current = count;
    if (before !== undefined && count !== undefined && count > before) {
      controls.start({
        scale: [1, 1.45, 0.9, 1],
        transition: { duration: 0.5, ease: 'easeOut' },
      });
    }
  }, [count, controls]);

  if (!count) return null;

  return (
    <motion.span animate={controls} className={cn('pointer-events-none', className)}>
      {count}
    </motion.span>
  );
}
