/**
 * Typography scale for ZeeFi.
 *
 * Font sizes follow a consistent scale derived from the PDF designs.
 * Font weights are defined as string literals because React Native
 * requires weight values to be specific strings, not numbers.
 */

export const FONT_SIZE = {
  xs: 10,
  sm: 12,
  md: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 28,
  '4xl': 32,
} as const;

export const FONT_WEIGHT = {
  regular: '400' as const,
  medium: '500' as const,
  semiBold: '600' as const,
  bold: '700' as const,
} as const;

export const LINE_HEIGHT = {
  tight: 1.2,
  normal: 1.5,
  relaxed: 1.75,
} as const;