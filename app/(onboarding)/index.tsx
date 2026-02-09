import { useRouter } from 'expo-router';
import {
  OnboardingProvider,
  OnboardingFlow,
  OnboardingConfig,
} from '@rentascooter/onboarding';
import { colors } from '@rentascooter/ui/theme';

const slides = [
  {
    id: '1',
    title: 'Book A Ride',
    description: 'Quickly book your ride in the app',
    image: require('@rentascooter/onboarding/assets/01-book-ride.png'),
    buttonConfig: { type: 'skip' as const },
  },
  {
    id: '2',
    title: 'Set Pick-up Location',
    description: 'Set your preferred pick-up location, and the driver will wait for you there',
    image: require('@rentascooter/onboarding/assets/02-set-location.png'),
    buttonConfig: { type: 'skip' as const },
  },
  {
    id: '3',
    title: 'Quick & Easy Pay',
    description: 'Quick, Secure and Easy payments of your rides',
    image: require('@rentascooter/onboarding/assets/03-quick-easy.png'),
    buttonConfig: { type: 'skipAndGetStarted' as const },
  },
  {
    id: '4',
    title: 'Enjoy The Glide',
    description: 'Enjoy the ride and glide safely by using the provided helmet',
    image: require('@rentascooter/onboarding/assets/04-enjoy-glide.png'),
    buttonConfig: { type: 'action' as const, actionLabel: 'USE MY LOCATION' },
  },
];

const config: OnboardingConfig = {
  slides,
  theme: {
    colors: {
      primary: colors.primary.main,
      background: colors.background.primary,
      text: colors.text.primary,
      textSecondary: colors.text.secondary,
      dot: colors.background.tertiary,
      dotActive: colors.primary.main,
    },
  },
  labels: {
    skip: 'Skip',
    next: 'Next',
    getStarted: 'Get Started',
  },
  persistence: {
    enabled: true,
    storageKey: '@rentascooter/client-onboarding',
  },
};

export default function OnboardingScreen() {
  const router = useRouter();

  const handleComplete = () => {
    router.replace('/(auth)/login');
  };

  return (
    <OnboardingProvider config={config}>
      <OnboardingFlow onComplete={handleComplete} />
    </OnboardingProvider>
  );
}
