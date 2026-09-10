/**
 * Central color palette for ZeeFi.
 *
 * Every color used in the application should come from here.
 * Never hardcode a color hex value directly inside a component
 * or StyleSheet — always reference a token from this file.
 *
 * Colors were extracted from the Visily PDF wireframes.
 * Where exact values could not be read, sensible approximations
 * are used and marked with an APPROX comment.
 */

export const COLORS = {

  // ── Backgrounds ──────────────────────────────
  /** Main app background — light grey-white */
  background: '#F5F7FA',
  /** Card and surface background — pure white */
  surface: '#FFFFFF',
  /** Slightly green-tinted surface for highlighted cards */
  surfaceGreen: '#F0FFF4',

  // ── Brand / Primary ──────────────────────────
  /** Deep forest green — primary brand color */
  primary: '#2D6A4F',
  /** Medium green — progress bars, secondary accents */
  primaryLight: '#52B788',
  /** Very light green — badge backgrounds, tinted surfaces */
  primaryMuted: '#D8F3DC',
  /** White text/icons on green backgrounds */
  textOnPrimary: '#FFFFFF',

  // ── Text ─────────────────────────────────────
  /** Near-black — headings and primary body text */
  textPrimary: '#1A1A2E',
  /** Medium grey — subtitles, labels, secondary info */
  textSecondary: '#6B7280',
  /** Light grey — timestamps, minor labels, placeholders */
  textMuted: '#9CA3AF',
  /** White — text on dark/colored backgrounds */
  textWhite: '#FFFFFF',

  // ── Transaction Amounts ───────────────────────
  /** Green for income amounts */
  income: '#2D6A4F',
  /** Red for expense amounts */
  expense: '#EF4444',

  // ── Status / Feedback ────────────────────────
  success: '#52B788',
  warning: '#F59E0B',
  danger: '#EF4444',
  info: '#3B82F6',

  // ── UI Elements ──────────────────────────────
  /** Light grey for borders and dividers */
  border: '#E5E7EB',
  /** Very light grey for input field backgrounds */
  inputBackground: '#F9FAFB',
  /** Semi-transparent black for modal backdrops */
  overlay: 'rgba(0, 0, 0, 0.5)',
  /** White tab bar background */
  tabBarBackground: '#FFFFFF',
  /** Active tab icon and label */
  tabBarActive: '#2D6A4F',
  /** Inactive tab icon and label */
  tabBarInactive: '#9CA3AF',

  // ── Category Icon Backgrounds ─────────────────
  /** APPROX — derived from PDF category icon colors */
  categoryDining: '#FFE4E4',
  categoryGroceries: '#E4F7F6',
  categoryTravel: '#E4F4FF',
  categoryBills: '#E8F5E9',
  categoryHealth: '#FFFDE7',
  categoryTransport: '#F3E5F5',
  categoryShopping: '#FFF3E0',
  categoryEntertainment: '#E8EAF6',
  categorySalary: '#E8F5E9',
  categoryBonus: '#FFF8E1',
  categoryCoffee: '#FBE9E7',
  categoryUtilities: '#E3F2FD',

  // ── Category Icon Colors ──────────────────────
  categoryDiningIcon: '#FF6B6B',
  categoryGroceriesIcon: '#4ECDC4',
  categoryTravelIcon: '#45B7D1',
  categoryBillsIcon: '#66BB6A',
  categoryHealthIcon: '#FFC107',
  categoryTransportIcon: '#AB47BC',
  categoryShoppingIcon: '#FF9800',
  categoryEntertainmentIcon: '#5C6BC0',
  categorySalaryIcon: '#2D6A4F',
  categoryBonusIcon: '#F9A825',
  categoryCoffeeIcon: '#8D6E63',
  categoryUtilitiesIcon: '#42A5F5',

} as const;

/**
 * Type representing any valid color token key.
 * Useful when passing color names as props.
 */
export type ColorToken = keyof typeof COLORS;