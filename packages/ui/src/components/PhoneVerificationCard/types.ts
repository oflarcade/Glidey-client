/**
 * PhoneVerificationCard Component Types
 * RentAScooter Design System
 *
 * @acceptance AC-PVC-001: Card displays title "Phone Verification" centered and bold
 * @acceptance AC-PVC-002: Subtitle "Enter your OTP code here" displays in gray
 * @acceptance AC-PVC-003: OTP input shows 4 digit boxes (configurable length)
 * @acceptance AC-PVC-004: Yellow "VERIFY NOW" button uses brand color (#FECB00)
 * @acceptance AC-PVC-005: Resend link shows countdown when resendCountdown > 0
 * @acceptance AC-PVC-006: Error message displays below OTP input in red
 * @acceptance AC-PVC-007: Loading state disables button and shows spinner
 * @acceptance AC-PVC-008: secureTextEntry shows dots instead of numbers
 */

import type { ViewStyle } from 'react-native';

export interface PhoneVerificationCardProps {
  /** Card title - defaults to "Phone Verification" */
  title?: string;
  /** Subtitle text - defaults to "Enter your OTP code here" */
  subtitle?: string;
  /** Current OTP value (string of digits) */
  otp: string;
  /** Callback when OTP value changes */
  onOtpChange: (value: string) => void;
  /** Callback when VERIFY NOW button is pressed */
  onVerify: () => void;
  /** Optional callback when Resend Code is pressed */
  onResend?: () => void;
  /** Verify button label - defaults to "VERIFY NOW" */
  verifyLabel?: string;
  /** Resend link text - defaults to "Resend Code" */
  resendLabel?: string;
  /** Loading state - shows spinner on button */
  loading?: boolean;
  /** Disabled state - disables all interactions */
  disabled?: boolean;
  /** Error message to display below OTP input */
  error?: string;
  /** Number of OTP digits - defaults to 4 */
  length?: number;
  /** Show dots instead of numbers for security */
  secureTextEntry?: boolean;
  /** Seconds until resend is available (0 = available now) */
  resendCountdown?: number;
  /** Auto-focus OTP input on mount */
  autoFocus?: boolean;
  /** Container style override */
  style?: ViewStyle;
  /** Test ID for testing */
  testID?: string;
}
