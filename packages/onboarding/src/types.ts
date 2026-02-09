import { ImageSourcePropType } from 'react-native';

export type ButtonType = 'skip' | 'skipAndGetStarted' | 'action';

export interface SlideButtonConfig {
  type: ButtonType;
  actionLabel?: string; // Custom label for action button (e.g., "USE MY LOCATION")
  onAction?: () => void | Promise<void>; // Custom action handler for final slide
}

export interface OnboardingSlideData {
  id: string;
  title: string;
  description: string;
  image: ImageSourcePropType; // SVG or PNG from Figma
  backgroundColor?: string;
  buttonConfig?: SlideButtonConfig; // Per-slide button configuration
}

export interface OnboardingTheme {
  colors: {
    primary: string;
    background: string;
    text: string;
    textSecondary: string;
    dot: string;
    dotActive: string;
  };
  spacing: {
    small: number;
    medium: number;
    large: number;
  };
  borderRadius: {
    small: number;
    medium: number;
    large: number;
    full: number;
  };
  typography: {
    titleSize: number;
    descriptionSize: number;
    buttonSize: number;
  };
}

export interface OnboardingLabels {
  skip: string;
  next: string;
  getStarted: string;
  useLocation: string; // Default label for location permission button
}

export interface OnboardingConfig {
  slides: OnboardingSlideData[];
  theme?: Partial<OnboardingTheme>;
  labels?: Partial<OnboardingLabels>;
  persistence?: {
    enabled: boolean;
    storageKey: string;
  };
  onLocationPermission?: () => void | Promise<void>; // Handler for location permission request
}
