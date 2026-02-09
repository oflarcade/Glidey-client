import { Redirect } from 'expo-router';

/**
 * Root Index - Entry Point
 *
 * Immediately redirects to the custom splash screen which handles:
 * - Hiding the expo splash screen
 * - Playing the custom animation
 * - Routing to the appropriate screen based on app state
 */
export default function Index() {
  return <Redirect href="/(splash)" />;
}
