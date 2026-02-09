import React, { createContext, useContext, useMemo } from 'react';
import type { OnboardingConfig, OnboardingTheme, OnboardingLabels } from '../types';

const defaultTheme: OnboardingTheme = {
  colors: {
    primary: '#FECB00', // Yellow - Senegal flag
    background: '#FFFFFF',
    text: '#1A1A1A',
    textSecondary: '#666666',
    dot: '#E0E0E0',
    dotActive: '#FECB00', // Yellow - active state
  },
  spacing: {
    small: 8,
    medium: 16,
    large: 24,
  },
  borderRadius: {
    small: 4,
    medium: 8,
    large: 16,
    full: 9999,
  },
  typography: {
    titleSize: 28,
    descriptionSize: 16,
    buttonSize: 16,
  },
};

const defaultLabels: OnboardingLabels = {
  skip: 'Skip',
  next: 'Next',
  getStarted: 'GET STARTED',
  useLocation: 'USE MY LOCATION',
};

interface OnboardingContextValue {
  config: OnboardingConfig;
  theme: OnboardingTheme;
  labels: OnboardingLabels;
}

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

interface OnboardingProviderProps {
  children: React.ReactNode;
  config: OnboardingConfig;
}

export function OnboardingProvider({ children, config }: OnboardingProviderProps) {
  const value = useMemo(() => {
    // Merge theme with defaults
    const theme: OnboardingTheme = {
      colors: { ...defaultTheme.colors, ...config.theme?.colors },
      spacing: { ...defaultTheme.spacing, ...config.theme?.spacing },
      borderRadius: { ...defaultTheme.borderRadius, ...config.theme?.borderRadius },
      typography: { ...defaultTheme.typography, ...config.theme?.typography },
    };

    // Merge labels with defaults
    const labels: OnboardingLabels = {
      ...defaultLabels,
      ...config.labels,
    };

    return { config, theme, labels };
  }, [config]);

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboardingConfig() {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboardingConfig must be used within OnboardingProvider');
  }
  return context;
}
