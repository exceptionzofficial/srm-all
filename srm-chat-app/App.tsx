import React, { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AuthNavigator from './src/navigation/AuthNavigator';
import AppNavigator from './src/navigation/AppNavigator';
import { getSavedEmployee } from './src/utils/session';
import { initNotifications, createNotificationChannel, setupForegroundHandler } from './src/utils/notifications';

const App = () => {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    const init = async () => {
      console.log('App: [RE-INTEGRATION] Step 1: Session check...');

      // DEBUG: Verify we are running this code
      // Alert.alert('Debug', 'Chat App Initializing Notifications...'); 

      // Initialize notifications channel
      await createNotificationChannel();

      // Setup foreground handler
      const unsubscribe = setupForegroundHandler();

      try {
        const employee = await getSavedEmployee();
        if (employee) {
          console.log('App: [RE-INTEGRATION] Session found:', employee.name);
          setCurrentUser(employee);

          // Register for notifications
          await initNotifications(employee.employeeId);
        }
      } catch (e) {
        console.log('App: [RE-INTEGRATION] Session check error:', e);
      } finally {
        setCheckingSession(false);
      }

      return () => {
        if (unsubscribe) unsubscribe();
      };
    };

    init();
  }, []);

  const handleLogin = (employee: any) => {
    setCurrentUser(employee);
  };

  if (checkingSession) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#EF4136" />
        <Text style={styles.text}>SRM Chat Loading...</Text>
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        {!currentUser ? (
          <AuthNavigator onLogin={handleLogin} />
        ) : (
          <AppNavigator currentUser={currentUser} />
        )}
      </NavigationContainer>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  center: { flex: 1, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center' },
  text: { marginTop: 10, color: '#666' }
});

export default App;
