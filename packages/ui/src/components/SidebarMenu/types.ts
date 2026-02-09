/**
 * SidebarMenu Types
 * Shared drawer/sidebar menu component for RentAScooter apps
 */

import type { ReactNode } from 'react';

/**
 * @description Props for the SidebarMenu component
 *
 * @acceptance AC-SBM-001: Menu slides in from left edge
 * @acceptance AC-SBM-002: Menu takes 75% screen width by default
 * @acceptance AC-SBM-003: Semi-transparent backdrop closes menu on tap
 * @acceptance AC-SBM-004: Smooth 300ms slide animation
 * @acceptance AC-SBM-005: Safe area aware (respects notch/status bar)
 * @acceptance AC-SBM-006: Works identically on iOS and Android
 */
export interface SidebarMenuProps {
  /** Whether the sidebar is currently open */
  isOpen: boolean;
  /** Callback fired when the sidebar should close (backdrop tap or swipe) */
  onClose: () => void;
  /** Content to render inside the sidebar */
  children: ReactNode;
  /** Width of the sidebar (default: '75%') */
  width?: number | `${number}%`;
  /** Animation duration in milliseconds (default: 300) */
  animationDuration?: number;
  /** Backdrop opacity when fully open (default: 0.5) */
  backdropOpacity?: number;
  /** Test ID for testing */
  testID?: string;
}
