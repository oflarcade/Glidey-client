import { memo } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { Icon } from '@rentascooter/ui';
import { colors, spacing } from '@rentascooter/ui/theme';

/**
 * Menu button component for opening the sidebar
 *
 * Memoized for performance - renders the hamburger menu icon
 * that triggers the sidebar to open.
 */
export const MenuButton = memo(function MenuButton({
  onPress,
  testID,
}: {
  onPress: () => void;
  testID?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={styles.menuButton}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      testID={testID}
    >
      <Icon name="menu" size={24} color={colors.text.primary} />
    </Pressable>
  );
});

const styles = StyleSheet.create({
  menuButton: {
    padding: spacing.xs,
  },
});
