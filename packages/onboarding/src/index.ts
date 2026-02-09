// Components
export { OnboardingFlow } from './components/OnboardingFlow';
export { OnboardingSlide } from './components/OnboardingSlide';
export { PaginationDots } from './components/PaginationDots';

// Context
export { OnboardingProvider, useOnboardingConfig } from './context/OnboardingContext';

// Hooks
export { useOnboardingFlow } from './hooks/useOnboardingFlow';
export { useOnboardingStatus } from './hooks/useOnboardingStatus';
export { useOnboardingStatusStandalone } from './hooks/useOnboardingStatusStandalone';

// Types
export type {
  OnboardingSlideData,
  OnboardingConfig,
  OnboardingTheme,
  OnboardingLabels,
  ButtonType,
  SlideButtonConfig,
} from './types';
