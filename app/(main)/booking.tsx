import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@rentascooter/ui/theme';

// Thin scaffold — booking UI wired in T-100

export default function BookingScreen() {
  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.container} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background.primary },
  container: { flex: 1 },
});
