/**
 * OTPInput Component
 * RentAScooter Design System
 *
 * A reusable OTP input component for phone verification screens.
 * Features auto-focus navigation, paste support, and error states.
 */

import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  Keyboard,
} from 'react-native';
import { colors, spacing, borderRadius, typography, shadows } from '../../theme';
import type { OTPInputProps, OTPInputRef } from './types';

const OTPInput = forwardRef<OTPInputRef, OTPInputProps>(
  (
    {
      value = '',
      onChange,
      length = 4,
      error,
      autoFocus = false,
      disabled = false,
      secureTextEntry = false,
      containerStyle,
      inputStyle,
      textStyle,
      testID,
      accessibilityLabel,
    },
    ref
  ) => {
    const inputRefs = useRef<(TextInput | null)[]>([]);
    const [focusedIndex, setFocusedIndex] = useState<number | null>(null);

    // Initialize refs array
    useEffect(() => {
      inputRefs.current = inputRefs.current.slice(0, length);
    }, [length]);

    // Auto-focus first input on mount
    useEffect(() => {
      if (autoFocus && !disabled) {
        const timer = setTimeout(() => {
          inputRefs.current[0]?.focus();
        }, 100);
        return () => clearTimeout(timer);
      }
    }, [autoFocus, disabled]);

    // Expose methods via ref
    useImperativeHandle(ref, () => ({
      focus: () => {
        const firstEmptyIndex = value.length < length ? value.length : length - 1;
        inputRefs.current[firstEmptyIndex]?.focus();
      },
      clear: () => {
        onChange('');
        inputRefs.current[0]?.focus();
      },
    }));

    // Get individual digit from value
    const getDigit = useCallback(
      (index: number): string => {
        return value[index] || '';
      },
      [value]
    );

    // Handle digit input
    const handleChangeText = useCallback(
      (text: string, index: number) => {
        // Handle paste - if multiple characters entered
        if (text.length > 1) {
          const pastedValue = text.replace(/\D/g, '').slice(0, length);
          onChange(pastedValue);
          // Focus last filled or next empty
          const nextIndex = Math.min(pastedValue.length, length - 1);
          inputRefs.current[nextIndex]?.focus();
          return;
        }

        // Only allow single digit
        const digit = text.replace(/\D/g, '');
        if (digit.length === 0) return;

        // Build new value
        const newValue = value.slice(0, index) + digit + value.slice(index + 1);
        onChange(newValue.slice(0, length));

        // Auto-advance to next input
        if (index < length - 1) {
          inputRefs.current[index + 1]?.focus();
        } else {
          // Last digit entered - dismiss keyboard
          Keyboard.dismiss();
        }
      },
      [value, length, onChange]
    );

    // Handle backspace key
    const handleKeyPress = useCallback(
      (event: { nativeEvent: { key: string } }, index: number) => {
        if (event.nativeEvent.key === 'Backspace') {
          if (!getDigit(index) && index > 0) {
            // Current input empty - move to previous and clear it
            const newValue = value.slice(0, index - 1) + value.slice(index);
            onChange(newValue);
            inputRefs.current[index - 1]?.focus();
          } else {
            // Current input has digit - just clear it
            const newValue = value.slice(0, index) + value.slice(index + 1);
            onChange(newValue);
          }
        }
      },
      [value, onChange, getDigit]
    );

    // Handle box press - focus the input
    const handleBoxPress = useCallback(
      (index: number) => {
        if (disabled) return;
        inputRefs.current[index]?.focus();
      },
      [disabled]
    );

    // Handle focus
    const handleFocus = useCallback((index: number) => {
      setFocusedIndex(index);
    }, []);

    // Handle blur
    const handleBlur = useCallback(() => {
      setFocusedIndex(null);
    }, []);

    // Render individual digit box
    const renderDigitBox = (index: number) => {
      const digit = getDigit(index);
      const isFocused = focusedIndex === index;
      const hasValue = digit.length > 0;
      const hasError = !!error;

      const boxStyles = [
        styles.digitBox,
        isFocused && styles.digitBoxFocused,
        hasError && styles.digitBoxError,
        hasValue && styles.digitBoxFilled,
        disabled && styles.digitBoxDisabled,
        inputStyle,
      ];

      return (
        <Pressable
          key={index}
          onPress={() => handleBoxPress(index)}
          style={boxStyles}
          accessibilityRole="none"
        >
          <TextInput
            ref={(ref) => {
              inputRefs.current[index] = ref;
            }}
            style={[
              styles.digitInput,
              hasValue && styles.digitInputFilled,
              textStyle,
            ]}
            value={secureTextEntry && hasValue ? '●' : digit}
            onChangeText={(text) => handleChangeText(text, index)}
            onKeyPress={(e) => handleKeyPress(e, index)}
            onFocus={() => handleFocus(index)}
            onBlur={handleBlur}
            keyboardType="number-pad"
            maxLength={length} // Allow paste of full code
            selectTextOnFocus
            editable={!disabled}
            caretHidden
            testID={testID ? `${testID}-input-${index}` : undefined}
            accessibilityLabel={
              accessibilityLabel
                ? `${accessibilityLabel} digit ${index + 1}`
                : `OTP digit ${index + 1}`
            }
          />
        </Pressable>
      );
    };

    return (
      <View style={[styles.container, containerStyle]} testID={testID}>
        <View style={styles.inputRow}>
          {Array.from({ length }, (_, index) => renderDigitBox(index))}
        </View>

        {error && (
          <Text style={styles.errorText} accessibilityRole="alert">
            {error}
          </Text>
        )}
      </View>
    );
  }
);

OTPInput.displayName = 'OTPInput';

const BOX_SIZE = 56;
const BOX_GAP = 12;

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  inputRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: BOX_GAP,
  },
  digitBox: {
    width: BOX_SIZE,
    height: BOX_SIZE,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.background.secondary,
    borderWidth: 1.5,
    borderColor: colors.background.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: shadows.small,
      android: {
        elevation: 2,
      },
    }),
  },
  digitBoxFocused: {
    borderColor: colors.primary.main,
    backgroundColor: colors.background.primary,
    ...Platform.select({
      ios: {
        ...shadows.medium,
        shadowColor: colors.primary.main,
        shadowOpacity: 0.25,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  digitBoxError: {
    borderColor: colors.error,
    backgroundColor: '#FEF2F2',
  },
  digitBoxFilled: {
    backgroundColor: colors.background.primary,
    borderColor: colors.primary.light,
  },
  digitBoxDisabled: {
    backgroundColor: colors.background.tertiary,
    borderColor: colors.background.tertiary,
    opacity: 0.6,
  },
  digitInput: {
    width: '100%',
    height: '100%',
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '600',
    color: colors.text.primary,
    padding: 0,
    ...Platform.select({
      android: {
        // Android needs explicit styling for centered text
        textAlignVertical: 'center',
        includeFontPadding: false,
      },
    }),
  },
  digitInputFilled: {
    color: colors.text.primary,
  },
  errorText: {
    ...typography.caption,
    color: colors.error,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
});

export { OTPInput };
export type { OTPInputProps, OTPInputRef };
