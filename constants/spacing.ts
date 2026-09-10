/**
 * Spacing scale for ZeeFi.
 *
 * All margin, padding, gap, and dimension values should
 * come from this scale to maintain visual consistency.
 *
 * The scale is based on multiples of 4px which is a
 * standard convention in mobile UI design.
 */

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 48,
  '6xl': 64,
} as const;

export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  full: 9999,
} as const;