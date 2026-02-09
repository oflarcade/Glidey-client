/**
 * SearchInput Component
 * Client App - Location Selection Modal
 *
 * Search field with icon, auto-focus, clear button, and debounce.
 *
 * @acceptance AC-SI-001: Input auto-focuses when modal opens
 * @acceptance AC-SI-002: Clear button appears when text present
 * @acceptance AC-SI-003: Input has search icon
 * @acceptance AC-SI-004: Debounce input changes (300ms)
 * @acceptance AC-SI-005: Placeholder text is visible
 */

import React, { forwardRef, useEffect, useRef, useState, useImperativeHandle } from 'react';
import { View, TextInput, Pressable, StyleSheet, type MutableRefObject } from 'react-native';
import { Icon } from '@rentascooter/ui';
import { colors, spacing, typography } from '@rentascooter/ui/theme';

export interface SearchInputRef {
  focus: () => void;
  blur: () => void;
}

export interface SearchInputProps {
  /** Current search value */
  value: string;
  /** Change handler (debounced) */
  onChangeText: (text: string) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Auto-focus on mount */
  autoFocus?: boolean;
  /** When true, same visual but not focusable (e.g. minimized bar) */
  readOnly?: boolean;
  /** Called when input receives focus (e.g. to start session token) */
  onFocus?: () => void;
  /** Called when input loses focus */
  onBlur?: () => void;
  /** When true, focus is suppressed (e.g. user just finished scrolling list – prevents keyboard reappearing) */
  scrollInProgressRef?: MutableRefObject<boolean>;
  /** Test ID */
  testID?: string;
}

export const SearchInput = forwardRef<SearchInputRef, SearchInputProps>(
  function SearchInput(
    {
      value,
      onChangeText,
      placeholder = 'Search for a location...',
      autoFocus = false,
      readOnly = false,
      onFocus,
      onBlur,
      scrollInProgressRef,
      testID = 'search-input',
    },
    ref
  ) {
    const inputRef = useRef<TextInput>(null);
    const [localValue, setLocalValue] = useState(value);
    const debounceTimer = useRef<ReturnType<typeof setTimeout>>();

    // Expose focus/blur methods via ref
    useImperativeHandle(ref, () => ({
      focus: () => inputRef.current?.focus(),
      blur: () => inputRef.current?.blur(),
    }));

    // Clear debounce on unmount
    useEffect(() => {
      return () => {
        if (debounceTimer.current) {
          clearTimeout(debounceTimer.current);
        }
      };
    }, []);

    // Auto-focus on mount if requested
    useEffect(() => {
      if (autoFocus) {
        const timer = setTimeout(() => {
          inputRef.current?.focus();
        }, 300);
        return () => clearTimeout(timer);
      }
    }, [autoFocus]);

    // Sync external value changes
    useEffect(() => {
      setLocalValue(value);
    }, [value]);

    // When scroll just ended, suppress focus so keyboard doesn't reappear on touch end
    const handleFocus = () => {
      if (scrollInProgressRef?.current) {
        setTimeout(() => inputRef.current?.blur(), 0);
        return;
      }
      onFocus?.();
    };

    // Debounced change handler
    const handleChangeText = (text: string) => {
      setLocalValue(text);

      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }

      debounceTimer.current = setTimeout(() => {
        onChangeText(text);
      }, 300);
    };

    // Clear handler
    const handleClear = () => {
      setLocalValue('');
      onChangeText('');
      inputRef.current?.focus();
    };

    return (
      <View style={styles.container} pointerEvents={readOnly ? 'none' : 'auto'}>
        {/* Search icon */}
        <View style={styles.iconContainer}>
          <Icon name="search" size={20} color={colors.icon.default} />
        </View>

        {/* Text input */}
        <TextInput
          ref={inputRef}
          style={styles.input}
          value={localValue}
          onChangeText={handleChangeText}
          onFocus={handleFocus}
          onBlur={onBlur}
          placeholder={placeholder}
          placeholderTextColor={colors.text.tertiary}
          returnKeyType="search"
          autoCapitalize="none"
          autoCorrect={false}
          editable={!readOnly}
          blurOnSubmit
          testID={testID}
        />

        {/* Clear button (hidden when readOnly) */}
        {!readOnly && localValue.length > 0 && (
          <Pressable
            style={styles.clearButton}
            onPress={handleClear}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            testID={`${testID}-clear`}
          >
            <Icon name="x-circle" size={20} color={colors.icon.default} />
          </Pressable>
        )}
      </View>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginHorizontal: spacing.lg,
    marginVertical: spacing.md,
  },

  iconContainer: {
    marginRight: spacing.sm,
  },

  input: {
    flex: 1,
    ...typography.body,
    color: colors.text.primary,
    paddingVertical: spacing.xs,
  },

  clearButton: {
    marginLeft: spacing.sm,
  },
});
