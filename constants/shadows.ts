/**
 * Shadow / elevation presets for ZeeFi.
 *
 * React Native shadows require separate properties for iOS
 * (shadowColor, shadowOffset, shadowOpacity, shadowRadius)
 * and Android (elevation). Both are included in each preset
 * so the same object can be spread onto any StyleSheet.
 *
 * Usage:
 *   StyleSheet.create({
 *     card: {
 *       ...SHADOWS.sm,
 *       backgroundColor: COLORS.surface,
 *     }
 *   })
 */

export const SHADOWS = {
  sm: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 8,
  },
} as const;