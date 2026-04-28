import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { useSessionStore } from '~/state/session';
import { useTheme } from '~/theme/ThemeProvider';

/**
 * Fallback OAuth callback handler. iOS captures the redirect inline via
 * `WebBrowser.openAuthSessionAsync`, but on Android the deep link sometimes
 * leaks through to Expo Router instead of being intercepted — land here,
 * persist the session, and bounce home.
 */
export default function AuthCallback() {
  const router = useRouter();
  const params = useLocalSearchParams<{ session?: string }>();
  const { tokens } = useTheme();

  useEffect(() => {
    const session = typeof params.session === 'string' ? params.session : null;
    void (async () => {
      if (session && session.length > 0) {
        await useSessionStore.getState().set(session);
        router.replace('/(tabs)/home');
      } else {
        router.replace('/login');
      }
    })();
  }, [params.session, router]);

  return (
    <View style={[styles.root, { backgroundColor: tokens.bg }]}>
      <ActivityIndicator color={tokens.text} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
