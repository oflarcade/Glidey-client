import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, typography, shadows } from '../theme';

/**
 * @description Individual tab item configuration for BottomNav
 */
export interface BottomNavItem {
  /** Unique identifier for the tab */
  id: string;
  /** Display label shown below the icon */
  label: string;
  /** Icon component to render */
  icon: React.ReactNode;
}

/**
 * @description Props for the BottomNav component
 *
 * @acceptance AC-BNV-001: BottomNav displays all tabs horizontally with equal spacing
 * @acceptance AC-BNV-002: Active tab shows primary color (#FFC629) for icon and label
 * @acceptance AC-BNV-003: Inactive tabs show muted color (tertiary text)
 * @acceptance AC-BNV-004: Active tab icon scales up to 1.1x for visual emphasis
 * @acceptance AC-BNV-005: BottomNav has top border and card background
 * @acceptance AC-BNV-006: BottomNav respects safe area insets on notched devices
 * @acceptance AC-BNV-007: Tab labels use caption typography (12px, 400 weight)
 * @acceptance AC-BNV-008: onTabPress callback fires with tab id when pressed
 * @acceptance AC-BNV-009: Press feedback reduces opacity to 0.7
 */
export interface BottomNavProps {
  /** Array of tab items to display */
  tabs: BottomNavItem[];
  /** ID of the currently active tab */
  activeTab: string;
  /** Callback fired when a tab is pressed */
  onTabPress: (tabId: string) => void;
  /** Optional custom styles for the container */
  style?: ViewStyle;
  /** Test ID for testing */
  testID?: string;
}

/**
 * BottomNav Component
 *
 * Mobile tab navigation bar for switching between main app sections.
 * Supports safe area insets for notched devices and provides visual
 * feedback for the active tab state.
 *
 * @example
 * ```tsx
 * <BottomNav
 *   tabs={[
 *     { id: 'home', label: 'Home', icon: <HomeIcon /> },
 *     { id: 'rides', label: 'Rides', icon: <RidesIcon /> },
 *     { id: 'profile', label: 'Profile', icon: <ProfileIcon /> },
 *   ]}
 *   activeTab="home"
 *   onTabPress={(tabId) => setActiveTab(tabId)}
 * />
 * ```
 */
export function BottomNav({
  tabs,
  activeTab,
  onTabPress,
  style,
  testID,
}: BottomNavProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        { paddingBottom: Math.max(insets.bottom, spacing.sm) },
        style,
      ]}
      testID={testID}
    >
      <View style={styles.tabsContainer}>
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;

          return (
            <TouchableOpacity
              key={tab.id}
              style={styles.tab}
              onPress={() => onTabPress(tab.id)}
              activeOpacity={0.7}
              accessibilityLabel={tab.label}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
              testID={`${testID}-tab-${tab.id}`}
            >
              <View
                style={[
                  styles.iconContainer,
                  isActive && styles.iconContainerActive,
                ]}
              >
                {React.isValidElement(tab.icon)
                  ? React.cloneElement(tab.icon as React.ReactElement<{ color?: string }>, {
                      color: isActive
                        ? colors.primary.main
                        : colors.text.tertiary,
                    })
                  : tab.icon}
              </View>
              <Text
                style={[
                  styles.label,
                  isActive ? styles.labelActive : styles.labelInactive,
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background.primary,
    borderTopWidth: 1,
    borderTopColor: colors.background.tertiary,
    ...shadows.small,
  },

  tabsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },

  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
  },

  iconContainer: {
    marginBottom: spacing.xs,
  },

  iconContainerActive: {
    transform: [{ scale: 1.1 }],
  },

  label: {
    ...typography.caption,
    textAlign: 'center',
  },

  labelActive: {
    color: colors.primary.main,
    fontWeight: '500',
  },

  labelInactive: {
    color: colors.text.tertiary,
  },
});
