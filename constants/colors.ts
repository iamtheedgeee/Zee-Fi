export const CATEGORY_COLOR_OPTIONS: { bg: string; icon: string; label: string }[] = [
  { bg: '#FFE4E4', icon: '#FF6B6B', label: 'Red' },
  { bg: '#E4F7F6', icon: '#4ECDC4', label: 'Teal' },
  { bg: '#E4F4FF', icon: '#45B7D1', label: 'Blue' },
  { bg: '#E8F5E9', icon: '#66BB6A', label: 'Green' },
  { bg: '#FFFDE7', icon: '#FFC107', label: 'Yellow' },
  { bg: '#F3E5F5', icon: '#AB47BC', label: 'Purple' },
  { bg: '#FFF3E0', icon: '#FF9800', label: 'Orange' },
  { bg: '#E8EAF6', icon: '#5C6BC0', label: 'Indigo' },
  { bg: '#FBE9E7', icon: '#8D6E63', label: 'Brown' },
  { bg: '#D8F3DC', icon: '#2D6A4F', label: 'Forest' },
];
export const CATEGORY_ICON_OPTIONS: { name: string; label: string }[] = [
  { name: 'cart-outline',          label: 'Shopping' },
  { name: 'restaurant-outline',    label: 'Food' },
  { name: 'car-outline',           label: 'Transport' },
  { name: 'home-outline',          label: 'Home' },
  { name: 'fitness-outline',       label: 'Health' },
  { name: 'game-controller-outline', label: 'Gaming' },
  { name: 'book-outline',          label: 'Education' },
  { name: 'flash-outline',         label: 'Utilities' },
  { name: 'airplane-outline',      label: 'Travel' },
  { name: 'cash-outline',          label: 'Money' },
  { name: 'laptop-outline',        label: 'Work' },
  { name: 'gift-outline',          label: 'Gifts' },
  { name: 'cafe-outline',          label: 'Coffee' },
  { name: 'musical-notes-outline', label: 'Music' },
  { name: 'star-outline',          label: 'Other' },
];
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