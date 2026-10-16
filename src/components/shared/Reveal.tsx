'use client';

import { motion, type HTMLMotionProps } from 'framer-motion';

interface RevealProps extends HTMLMotionProps<'div'> {
  /** Seconds to wait after entering the viewport — for staggering siblings. */
  delay?: number;
  /** Vertical travel in px. Kept small — this should read as "settling in", not sliding. */
  y?: number;
}

/**
 * Fades + lifts its children into place the first time they scroll into
 * view. Plays once (no re-trigger on scroll back up), and collapses to an
 * instant appear under prefers-reduced-motion via the app-wide MotionConfig.
 */
export default function Reveal({ children, delay = 0, y = 16, ...rest }: RevealProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '0px 0px -60px 0px' }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      {...rest}
    >
      {children}
    </motion.div>
  );
}
