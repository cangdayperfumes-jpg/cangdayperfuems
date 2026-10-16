/**
 * Single source of truth for the hero frame's shape — used by both the live
 * <Hero> box and the admin crop editor, so the crop an admin draws in
 * /admin/marketing/hero-slides is exactly the frame the storefront shows.
 */
export const HERO_DESKTOP_ASPECT = 2.6;
export const HERO_MOBILE_ASPECT = 1;

/**
 * Tallest the desktop hero gets. Rather than letting the frame keep widening
 * past this (which changes its aspect and crops differently from the admin
 * preview), the frame stops growing at HERO_MAX_HEIGHT_PX × aspect wide and
 * centers — so on ultra-wide screens the crop still matches the dashboard.
 */
export const HERO_MAX_HEIGHT_PX = 760;
export const HERO_MAX_WIDTH_PX = Math.round(HERO_MAX_HEIGHT_PX * HERO_DESKTOP_ASPECT);
