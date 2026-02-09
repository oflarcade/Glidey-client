/**
 * SidebarProfileHeader Types
 * Profile header component for sidebar menus in RentAScooter apps
 */

/**
 * Represents a single stat item to display in the stats row
 */
export interface StatItem {
  /**
   * Icon to display - can be:
   * - Ionicons icon name (e.g., 'time-outline', 'speedometer-outline')
   * - React element for custom icons (e.g., <Icon name="scooter" />)
   */
  icon: string | React.ReactNode;
  /** The value to display (e.g., '10.2', 30, '20') */
  value: string | number;
  /** Label text below the value (e.g., 'Hours', 'Distance', 'Jobs') */
  label: string;
}

/**
 * @description Props for the SidebarProfileHeader component
 *
 * @acceptance AC-SPH-001: Yellow primary background (#FECB00)
 * @acceptance AC-SPH-002: Avatar is 60x60 circular with white border
 * @acceptance AC-SPH-003: Name displayed bold to the right of avatar
 * @acceptance AC-SPH-004: Stats row shows 3 items evenly spaced
 * @acceptance AC-SPH-005: Each stat shows icon, value (bold), and label
 * @acceptance AC-SPH-006: Proper safe area padding at top
 * @acceptance AC-SPH-007: Tappable profile area with onProfilePress
 * @acceptance AC-SPH-008: Works identically on iOS and Android
 */
export interface SidebarProfileHeaderProps {
  /** Profile image URL - falls back to initials if not provided */
  avatarUrl?: string;
  /** User's full name (used for display and avatar initials fallback) */
  name: string;
  /** Array of stat items to display in the stats row (max 3 recommended) */
  stats: StatItem[];
  /** Callback when the profile area (avatar/name) is pressed */
  onProfilePress?: () => void;
  /** Test ID for testing */
  testID?: string;
}
