import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { useTheme } from '~/theme/ThemeProvider';

export default function TabsLayout() {
  const { tokens } = useTheme();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: tokens.accent,
        tabBarInactiveTintColor: tokens.textTertiary,
        tabBarStyle:
          Platform.OS === 'ios'
            ? { borderTopWidth: 0.5, borderTopColor: tokens.separator }
            : { backgroundColor: tokens.surface, height: 80 },
      }}
    >
      <Tabs.Screen name="today" options={{ title: 'Today' }} />
      <Tabs.Screen name="stats" options={{ title: 'Stats' }} />
    </Tabs>
  );
}
