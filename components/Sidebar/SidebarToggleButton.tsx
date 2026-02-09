import { memo, useCallback } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { Icon } from '@rentascooter/ui';
import { colors, spacing } from '@rentascooter/ui/theme';
import { useUIStore } from '@rentascooter/shared';

/**
 * Simple button with menu icon that toggles the sidebar (open/close).
 * Single touch target – use as leftIcon in MapTopBar without passing onLeftPress.
 */
export const SidebarToggleButton = memo(function SidebarToggleButton({
  testID,
}: {
  testID?: string;
} = {}) {
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);

  const onPress = useCallback(() => {
    toggleSidebar();
  }, [toggleSidebar]);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      accessibilityLabel="Menu"
      accessibilityRole="button"
      testID={testID}
    >
      <Icon name="menu" size={24} color={colors.text.primary} />
    </Pressable>
  );
});

const styles = StyleSheet.create({
  button: {
    padding: spacing.sm,
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  buttonPressed: {
    opacity: 0.7,
  },
});
