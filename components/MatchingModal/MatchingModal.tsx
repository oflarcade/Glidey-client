import { View, Text, TouchableOpacity, Modal, ActivityIndicator, StyleSheet } from 'react-native';
import { RetryTimeline } from '@rentascooter/ui';
import { colors, spacing, typography } from '@rentascooter/ui/theme';
import { useTranslation } from '@rentascooter/i18n';
import { useMatching } from '@/hooks/useMatching';

// ─── Types ────────────────────────────────────────────────────────────────────

interface MatchingModalProps {
  visible: boolean;
  rideId: string | null;
  onCancel: () => void;
}

// ─── MatchingModal (T-102 + T-103) ────────────────────────────────────────────

export function MatchingModal({ visible, rideId, onCancel }: MatchingModalProps) {
  const { t } = useTranslation();
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
              <Text style={styles.fallbackTitle}>{t('matching.no_driver_title')}</Text>
              <Text style={styles.fallbackBody}>{t('matching.no_driver_body')}</Text>
            </>
          ) : (
            // ── Active search (T-102) ────────────────────────────────────────
            <>
              <Text style={styles.title}>{t('matching.searching_title')}</Text>
              <RetryTimeline
                activeIndex={activeAttemptIndex}
                completedCount={completedAttempts}
              />
              <Text style={styles.subtitle}>
                {completedAttempts === 2
                  ? t('matching.last_attempt')
                  : t('matching.attempt_n_of_3', { n: completedAttempts + 1 })}
              </Text>
            </>
          )}

          {/* Cancel always visible (T-101, T-103) */}
          <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
            <Text style={styles.cancelText}>{t('common.cancel')}</Text>
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
