import type {
  LoginFormValues,
  RegisterFormValues,
  LoginFieldErrors,
  RegisterFieldErrors,
  ValidationResult,
} from '../../types/auth';

type TranslateFn = (key: string) => string | undefined;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const getMessage = (t: TranslateFn | undefined, key: string, fallback: string): string =>
  t?.(key) || fallback;

export const validateEmail = (value: string, t?: TranslateFn): string | undefined => {
  const trimmed = value.trim();

  if (!trimmed) {
    return getMessage(t, 'validation.email_required', 'Email is required');
  }

  if (!EMAIL_REGEX.test(trimmed)) {
    return getMessage(t, 'validation.email_invalid', 'Please enter a valid email address');
  }

  return undefined;
};

export const validatePassword = (
  value: string,
  t?: TranslateFn,
  options?: { minLength?: number }
): string | undefined => {
  if (!value) {
    return getMessage(t, 'validation.password_required', 'Password is required');
  }

  if (options?.minLength && value.length < options.minLength) {
    return (
      getMessage(t, 'validation.password_min_length', 'Password must be at least 6 characters') ||
      `Password must be at least ${options.minLength} characters`
    );
  }

  return undefined;
};

export const validateRequired = (
  value: string,
  t: TranslateFn | undefined,
  key: string,
  fallback: string
): string | undefined => {
  if (!value.trim()) {
    return getMessage(t, key, fallback);
  }

  return undefined;
};

export const validateLoginForm = (
  values: LoginFormValues,
  t?: TranslateFn
): ValidationResult<LoginFormValues, LoginFieldErrors> => {
  const emailError = validateEmail(values.email, t);
  const passwordError = validatePassword(values.password, t);

  const errors: LoginFieldErrors = {
    email: emailError,
    password: passwordError,
  };

  const sanitizedValues = {
    email: values.email.trim(),
    password: values.password,
  };

  return {
    errors,
    sanitizedValues,
    isValid: !emailError && !passwordError,
  };
};

export const validateRegisterForm = (
  values: RegisterFormValues,
  t?: TranslateFn
): ValidationResult<RegisterFormValues, RegisterFieldErrors> => {
  const firstNameError = validateRequired(
    values.firstName,
    t,
    'validation.first_name_required',
    'First name is required'
  );
  const lastNameError = validateRequired(
    values.lastName,
    t,
    'validation.last_name_required',
    'Last name is required'
  );
  const emailError = validateEmail(values.email, t);
  const passwordError = validatePassword(values.password, t, { minLength: 6 });

  const errors: RegisterFieldErrors = {};

  if (firstNameError) errors.firstName = firstNameError;
  if (lastNameError) errors.lastName = lastNameError;
  if (emailError) errors.email = emailError;
  if (passwordError) errors.password = passwordError;

  const sanitizedValues = {
    firstName: values.firstName.trim(),
    lastName: values.lastName.trim(),
    email: values.email.trim(),
    password: values.password,
  };

  return {
    errors,
    sanitizedValues,
    isValid:
      !firstNameError &&
      !lastNameError &&
      !emailError &&
      !passwordError,
  };
};
