'use client';

import { MotionConfig } from 'framer-motion';

/**
 * reducedMotion="user" makes every framer-motion animation on the storefront
 * skip transform/layout movement (opacity fades still run) whenever the OS
 * "reduce motion" setting is on — one switch instead of per-component checks.
 */
export default function MotionProvider({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
