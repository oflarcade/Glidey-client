import { View, Text, TouchableOpacity, Modal, ActivityIndicator, StyleSheet } from 'react-native';
import { RetryTimeline } from '@rentascooter/ui';
import { colors, spacing, typography } from '@rentascooter/ui/theme';
import { useMatching } from '@/hooks/useMatching';

// ─── Types ────────────────────────────────────────────────────────────────────

interface MatchingModalProps {
  visible: boolean;
  rideId: string | null;
  onCancel: () => void;
}

// ─── MatchingModal (T-102 + T-103) ────────────────────────────────────────────

export function MatchingModal({ visible, rideId, onCancel }: MatchingModalProps) {
  const { activeAttemptIndex, completedAttempts, inFallback } = useMatching(
    visible ? rideId : null,
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {inFallback ? (
            // ── No-driver fallback (T-103) ──────────────────────────────────
            <>
              <ActivityIndicator
                size="large"
                color={colors.text.secondary}
                style={styles.fallbackIndicator}
              />
              <Text style={styles.fallbackTitle}>Aucun conducteur disponible</Text>
              <Text style={styles.fallbackBody}>
                Tous les conducteurs sont occupés pour le moment. Veuillez réessayer dans quelques minutes.
              </Text>
            </>
          ) : (
            // ── Active search (T-102) ────────────────────────────────────────
            <>
              <Text style={styles.title}>Recherche d'un conducteur…</Text>
              <RetryTimeline
                activeIndex={activeAttemptIndex}
                completedCount={completedAttempts}
              />
              <Text style={styles.subtitle}>
                {completedAttempts === 0
                  ? 'Tentative 1 sur 3'
                  : completedAttempts === 1
                    ? 'Tentative 2 sur 3'
                    : 'Dernière tentative'}
              </Text>
            </>
          )}

          {/* Cancel always visible (T-101, T-103) */}
          <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
            <Text style={styles.cancelText}>Annuler</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.background.primary,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl,
    alignItems: 'center',
    gap: spacing.md,
  },
  title: {
    ...typography.h3,
    color: colors.text.primary,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.caption,
    color: colors.text.secondary,
    textAlign: 'center',
  },

  // No-driver fallback
  fallbackIndicator: { marginBottom: spacing.sm },
  fallbackTitle: {
    ...typography.h3,
    color: colors.text.primary,
    textAlign: 'center',
  },
  fallbackBody: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
    paddingHorizontal: spacing.md,
  },

  cancelBtn: {
    marginTop: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xl,
  },
  cancelText: { color: colors.text.secondary, fontSize: 15 },
});
