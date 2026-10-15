import React from 'react';
import { Tabs } from 'expo-router';
import { StyleSheet } from 'react-native';
import { COLORS } from '../../constants/theme';
import { Home, Gift, Settings } from 'lucide-react-native';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: COLORS.gold,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <Home size={22} color={focused ? COLORS.gold : color} />
          ),
        }}
      />
      {/* Chat removido: rota oculta da barra de abas */}
      <Tabs.Screen name="chat" options={{ href: null }} />
      <Tabs.Screen
        name="offers"
        options={{
          title: 'Ofertas',
          tabBarIcon: ({ color, focused }) => (
            <Gift size={22} color={focused ? COLORS.gold : color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Configurações',
          tabBarIcon: ({ color, focused }) => (
            <Settings size={22} color={focused ? COLORS.gold : color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.surfaceBorder,
    height: 64,
    paddingBottom: 8,
    paddingTop: 8,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
});
