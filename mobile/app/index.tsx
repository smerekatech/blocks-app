import { Redirect } from 'expo-router';

export default function Index() {
  // SessionGate (in _layout.tsx) handles redirects post-hydration.
  // This route only fires for the brief loading period; redirect to today and
  // let the gate kick the user back to /login if needed.
  return <Redirect href="/(tabs)/today" />;
}
