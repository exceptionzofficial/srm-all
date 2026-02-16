/**
 * SRM Sweets Employee Management App
 * Main entry point
 */

import React, { useEffect } from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Navigator from './src/navigation/Navigator';
import BackgroundService from './src/services/BackgroundService';
import notifee, { EventType, AndroidImportance, AndroidCategory } from '@notifee/react-native';

const App = () => {
  useEffect(() => {
    const unsubscribe = notifee.onForegroundEvent(({ type, detail }) => {
      // Resurrection Logic for Foreground
      if (type === EventType.DISMISSED && detail.notification?.id === 'srm_persistent_notification') {
        console.log('[Foreground] User dismissed notification. Resurrecting...');
        notifee.displayNotification({
          id: 'srm_persistent_notification',
          title: 'Attendance Active',
          body: 'Tracking is active.',
          android: {
            channelId: 'srm_sticky_nav_v1',
            ongoing: true,
            autoCancel: false,
            importance: AndroidImportance.HIGH,
            category: AndroidCategory.NAVIGATION,
            color: '#EF4136',
            smallIcon: 'ic_launcher',
            pressAction: {
              id: 'default',
              launchActivity: 'default',
            },
          },
        }).catch(err => console.error('Resurrection failed', err));
      }
      // Handle specific actions if needed
    });
    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
      <Navigator />
    </SafeAreaProvider>
  );
};

export default App;
