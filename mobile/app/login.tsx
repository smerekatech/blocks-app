import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { signInWithGoogle } from '~/api/auth';
import { BRAND } from '~/theme/tokens';
import { useTheme } from '~/theme/ThemeProvider';

export default function LoginScreen() {
  const { tokens } = useTheme();
  const [busy, setBusy] = useState(false);

  async function onPress() {
    if (busy) return;
    setBusy(true);
    try {
      const ok = await signInWithGoogle();
      if (!ok) Alert.alert('Sign-in cancelled');
    } catch (err) {
      Alert.alert('Sign-in failed', err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: tokens.bg }]} edges={['top', 'bottom']}>
      <View style={styles.content}>
        <View style={[styles.logoMark, { backgroundColor: BRAND.accent }]}>
          <Text style={styles.logoText}>B0</Text>
        </View>
        <Text style={[styles.title, { color: tokens.text }]}>Blocks</Text>
        <Text style={[styles.tagline, { color: tokens.textTertiary }]}>
          Track your day in 45-minute blocks.
        </Text>
      </View>

      <View style={styles.bottom}>
        <Pressable
          onPress={onPress}
          disabled={busy}
          style={({ pressed }) => [
            styles.button,
            { backgroundColor: BRAND.accent, opacity: pressed || busy ? 0.7 : 1 },
          ]}
        >
          <Text style={styles.buttonText}>{busy ? 'Opening browser…' : 'Sign in with Google'}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'space-between' },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  logoMark: {
    width: 88,
    height: 88,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: { color: '#fff', fontSize: 32, fontWeight: '700', letterSpacing: -0.5 },
  title: { fontSize: 34, fontWeight: '700', letterSpacing: 0.4 },
  tagline: { fontSize: 16, textAlign: 'center', paddingHorizontal: 32 },
  bottom: { padding: 24 },
  button: {
    height: 56,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: { color: '#fff', fontSize: 17, fontWeight: '600' },
});
