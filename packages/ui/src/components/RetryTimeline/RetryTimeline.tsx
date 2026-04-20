import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { borderRadius, colors, spacing } from '../../theme';

export interface RetryTimelineProps {
  activeIndex: 0 | 1 | 2;
  completedCount: number;
}

type StageState = 'completed' | 'active' | 'waiting';

const LABELS = ['Attempt 1', 'Attempt 2', 'Attempt 3'] as const;

function stageState(i: number, activeIndex: number, completedCount: number): StageState {
  if (i < completedCount) return 'completed';
  if (i === activeIndex) return 'active';
  return 'waiting';
}

const NODE = 20;
const NODE_ACTIVE = 26;

export function RetryTimeline({ activeIndex, completedCount }: RetryTimelineProps) {
  const pulse = useSharedValue(1);

  useEffect(() => {
    pulse.value = withRepeat(
      withTiming(0.35, { duration: 800, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [pulse]);

  const pulseStyle = useAnimatedStyle(() => ({ opacity: pulse.value }));

  return (
    <View style={styles.row}>
      {LABELS.map((label, i) => {
        const state = stageState(i, activeIndex, completedCount);
        const isLast = i === LABELS.length - 1;
        const segFilled = i < completedCount;

        return (
          <React.Fragment key={label}>
            <View style={styles.stage}>
              {state === 'completed' && <View style={[styles.node, styles.nodeDone]} />}
              {state === 'active' && (
                <Animated.View style={[styles.node, styles.nodeActive, pulseStyle]} />
              )}
              {state === 'waiting' && <View style={[styles.node, styles.nodeWait]} />}
              <Text
                style={[
                  styles.label,
                  state === 'active' && styles.labelActive,
                  state === 'waiting' && styles.labelWait,
                ]}
              >
                {label}
              </Text>
            </View>
            {!isLast && (
              <View
                style={[
                  styles.segment,
                  segFilled ? styles.segFilled : styles.segPending,
                ]}
              />
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    paddingVertical: spacing.sm,
  },
  stage: {
    alignItems: 'center',
  },
  node: {
    borderRadius: borderRadius.full,
  },
  nodeDone: {
    width: NODE,
    height: NODE,
    backgroundColor: colors.primary.main,
  },
  nodeActive: {
    width: NODE_ACTIVE,
    height: NODE_ACTIVE,
    backgroundColor: colors.primary.main,
  },
  nodeWait: {
    width: NODE,
    height: NODE,
    borderWidth: 2,
    borderColor: colors.border.light,
    backgroundColor: colors.background.primary,
  },
  label: {
    marginTop: spacing.xs,
    fontSize: 12,
    fontWeight: '500',
    color: colors.text.secondary,
  },
  labelActive: {
    color: colors.text.primary,
    fontWeight: '600',
  },
  labelWait: {
    color: colors.text.tertiary,
  },
  segment: {
    flex: 1,
    height: 2,
    marginHorizontal: spacing.xs,
    marginBottom: spacing.lg,
  },
  segFilled: {
    backgroundColor: colors.primary.main,
  },
  segPending: {
    backgroundColor: colors.border.light,
  },
});
