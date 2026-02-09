import { memo, useCallback } from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Icon, type IconName } from '@rentascooter/ui';
import { colors, spacing, typography } from '@rentascooter/ui/theme';

export interface SidebarMenuItemProps {
  /** Icon name from the Icon registry */
  icon: IconName;
  /** Display label text */
  label: string;
  /** Press handler */
  onPress: () => void;
  /** Whether to show destructive (red) styling */
  isDestructive?: boolean;
  /** Test ID for testing */
  testID?: string;
}

/**
 * Menu item component for the sidebar
 *
 * Memoized for performance - renders a pressable row with icon and label.
 * Includes haptic feedback on press.
 */
export const SidebarMenuItem = memo(function SidebarMenuItem({
  icon,
  label,
  onPress,
  isDestructive = false,
  testID,
}: SidebarMenuItemProps) {
  const handlePress = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  }, [onPress]);

  return (
    <Pressable
      style={({ pressed }) => [
        styles.menuItem,
        pressed && styles.menuItemPressed,
      ]}
      onPress={handlePress}
      testID={testID}
    >
      <Icon
        name={icon}
        size={24}
        color={isDestructive ? colors.error : colors.icon.default}
      />
      <Text
        style={[
          styles.menuItemLabel,
          isDestructive && styles.menuItemLabelDestructive,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  menuItemPressed: {
    backgroundColor: colors.background.secondary,
  },
  menuItemLabel: {
    ...typography.body,
    color: colors.text.primary,
  },
  menuItemLabelDestructive: {
    color: colors.error,
  },
});
