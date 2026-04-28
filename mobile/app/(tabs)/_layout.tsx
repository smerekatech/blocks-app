import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { House, BarChart3, User } from 'lucide-react-native';
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
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <House size={size} color={color} strokeWidth={2} />,
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          title: 'Stats',
          tabBarIcon: ({ color, size }) => <BarChart3 size={size} color={color} strokeWidth={2} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <User size={size} color={color} strokeWidth={2} />,
        }}
      />
    </Tabs>
  );
}
