import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import { useEffect, useRef } from 'react';
import { View } from 'react-native';
import CustomAlert from '../components/CustomAlert';
import { setAlertRef } from '../utils/alertHelper';

export default function RootLayout() {
  const alertRef = useRef(null);

  useEffect(() => {
    // Set global alert reference
    setAlertRef(alertRef);

    // Request notification permissions on app start
    Notifications.requestPermissionsAsync();
  }, []);

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: '#2563eb',
          tabBarInactiveTintColor: '#6b7280',
          tabBarStyle: {
            backgroundColor: '#fff',
            borderTopWidth: 1,
            borderTopColor: '#e5e7eb',
            height: 60,
            paddingBottom: 8,
            paddingTop: 8,
          },
          headerStyle: {
            backgroundColor: '#fff',
            elevation: 0,
            shadowOpacity: 0,
            borderBottomWidth: 1,
            borderBottomColor: '#e5e7eb',
          },
          headerTitleStyle: {
            fontSize: 20,
            fontWeight: 'bold',
            color: '#111827',
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            headerTitle: 'Dashboard',
            tabBarLabel: () => null,
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="home" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="stopwatch"
          options={{
            headerTitle: 'Stopwatch',
            tabBarLabel: () => null,
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="stopwatch" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="pomodoro"
          options={{
            headerTitle: 'Pomodoro Timer',
            tabBarLabel: () => null,
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="timer" size={size} color={color} />
            ),
          }}
        />
      </Tabs>
      <CustomAlert ref={alertRef} />
    </View>
  );
}