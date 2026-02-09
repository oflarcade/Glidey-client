/**
 * Sidebar Types
 *
 * Type definitions for sidebar menu components and configuration.
 */

import type { IconName } from '@rentascooter/ui';
import type { ReactNode } from 'react';

/**
 * Menu item configuration for sidebar navigation
 */
export interface MenuItem {
  /** Unique identifier for the menu item */
  id: string;
  /** Display label text */
  label: string;
  /** Icon name from the Icon component registry */
  icon: IconName;
  /** Press handler for navigation or action */
  onPress: () => void;
  /** Whether this item should render with destructive (red) styling */
  isDestructive?: boolean;
}

/**
 * Profile stat for sidebar header display
 */
export interface ProfileStat {
  /** Icon element to display */
  icon: ReactNode;
  /** Stat value (e.g., "15", "45 KM") */
  value: string;
  /** Stat label (e.g., "Rides", "Distance") */
  label: string;
}
