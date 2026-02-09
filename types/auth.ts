/**
 * Authentication-related types
 * Centralized type definitions for auth forms and validation
 */

export type LoginFormValues = {
  email: string;
  password: string;
};

export type RegisterFormValues = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
};

export type LoginFieldErrors = {
  email?: string;
  password?: string;
};

export type RegisterFieldErrors = {
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
};

export type ValidationResult<TValues, TErrors> = {
  errors: TErrors;
  sanitizedValues: TValues;
  isValid: boolean;
};
