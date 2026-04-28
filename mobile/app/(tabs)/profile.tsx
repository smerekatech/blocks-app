import { Pressable, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { signOut } from '~/api/auth';
import { useTheme } from '~/theme/ThemeProvider';

export default function ProfileScreen() {
  const { tokens } = useTheme();
  return (
    <SafeAreaView style={[styles.root, { backgroundColor: tokens.bg }]} edges={['top']}>
      <Pressable
        onPress={() => void signOut()}
        style={({ pressed }) => [styles.btn, { opacity: pressed ? 0.75 : 1 }]}
      >
        <Text style={styles.btnText}>Sign out</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  btn: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#FF3B30',
  },
  btnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
});
