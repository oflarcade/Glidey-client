import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { StarRating } from '@rentascooter/ui';
import { colors, spacing, typography } from '@rentascooter/ui/theme';

const MAX_COMMENT_LENGTH = 280;

export interface RatingModalProps {
  visible: boolean;
  /** Called when the rider submits a rating. Comment omitted if empty. */
  onSubmit: (rating: number, comment?: string) => void;
  /** Called when the rider dismisses without submitting. */
  onDismiss: () => void;
  /** While true: submit button shows loading indicator and is disabled. */
  loading?: boolean;
}

export function RatingModal({ visible, onSubmit, onDismiss, loading = false }: RatingModalProps) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');

  const canSubmit = rating >= 1 && !loading;
  const remaining = MAX_COMMENT_LENGTH - comment.length;

  const handleSubmit = () => {
    if (!canSubmit) return;
    const trimmed = comment.trim();
    onSubmit(rating, trimmed.length > 0 ? trimmed : undefined);
  };

  const handleDismiss = () => {
    setRating(0);
    setComment('');
    onDismiss();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleDismiss}
    >
      <TouchableOpacity
        style={styles.backdrop}
        activeOpacity={1}
        onPress={handleDismiss}
        accessibilityLabel="Dismiss rating modal"
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.sheetWrapper}
      >
        <View style={styles.sheet}>
          {/* Handle */}
          <View style={styles.handle} />

          {/* Title */}
          <Text style={styles.title}>
            Notez votre chauffeur{'\n'}Rate your driver
          </Text>

          {/* Star rating */}
          <View style={styles.starsRow}>
            <StarRating
              rating={rating}
              interactive
              onRatingChange={setRating}
              size={40}
            />
          </View>

          {/* Comment input */}
          <View style={styles.commentContainer}>
            <TextInput
              style={styles.commentInput}
              placeholder="Ajouter un commentaire… / Add a comment…"
              placeholderTextColor={colors.text.tertiary ?? colors.text.secondary}
              value={comment}
              onChangeText={setComment}
              maxLength={MAX_COMMENT_LENGTH}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
            <Text style={[styles.charCounter, remaining < 20 && styles.charCounterWarn]}>
              {remaining}
            </Text>
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.dismissButton}
              onPress={handleDismiss}
              activeOpacity={0.7}
            >
              <Text style={styles.dismissText}>Plus tard / Later</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.submitButton, !canSubmit && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={!canSubmit}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator size="small" color={colors.text.inverse} />
              ) : (
                <Text style={styles.submitText}>Envoyer / Submit</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheetWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  sheet: {
    backgroundColor: colors.background.primary,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxl ?? spacing.xl ?? 32,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.background.tertiary,
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  title: {
    ...typography.h3,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  starsRow: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  commentContainer: {
    borderWidth: 1,
    borderColor: colors.background.tertiary,
    borderRadius: 12,
    padding: spacing.sm,
    marginBottom: spacing.md,
    minHeight: 80,
  },
  commentInput: {
    ...typography.body,
    color: colors.text.primary,
    flex: 1,
    minHeight: 60,
  },
  charCounter: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    textAlign: 'right',
    marginTop: spacing.xs,
  },
  charCounterWarn: {
    color: colors.error,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  dismissButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.background.tertiary,
    alignItems: 'center',
  },
  dismissText: {
    ...typography.body,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  submitButton: {
    flex: 2,
    paddingVertical: spacing.md,
    borderRadius: 12,
    backgroundColor: colors.primary.main,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.45,
  },
  submitText: {
    ...typography.body,
    color: colors.text.inverse,
    fontWeight: '700',
  },
});
