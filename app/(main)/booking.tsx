import { Redirect } from 'expo-router';

// Booking is now handled by the in-map BookingSheet on the main screen (R8).
export default function BookingScreenRedirect() {
  return <Redirect href="/(main)/" />;
}
