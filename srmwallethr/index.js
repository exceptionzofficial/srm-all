import { AppRegistry } from 'react-native';
import notifee, { EventType, AndroidImportance, AndroidCategory } from '@notifee/react-native';
import App from './App';
import { name as appName } from './app.json';

// Handle background events (e.g. user checks out from notification action)
notifee.onBackgroundEvent(async ({ type, detail }) => {
    const { notification, pressAction } = detail;

    // RESURRECTION LOGIC: If user swipes it away, bring it back immediately
    if (type === EventType.DISMISSED && notification.id === 'srm_persistent_notification') {
        console.log('[Background] User tried to dismiss ongoing notification. Resurrecting...');
        await notifee.displayNotification({
            id: 'srm_persistent_notification',
            title: 'Attendance Active',
            body: 'Tracking is running in the background.',
            android: {
                channelId: 'srm_sticky_nav_v1', // Must match current channel
                smallIcon: 'ic_launcher',
                ongoing: true,
                autoCancel: false,
                importance: AndroidImportance.HIGH,
                category: AndroidCategory.NAVIGATION,
                color: '#EF4136',
                pressAction: {
                    id: 'default',
                    launchActivity: 'default',
                },
            },
        });
        return;
    }

    // Handle button actions
    if (type === EventType.ACTION_PRESS && pressAction.id === 'open_app') {
        await notifee.displayNotification({
            id: notification.id,
            title: notification.title,
            body: notification.body,
            android: {
                ...notification.android,
                autoCancel: false,
            }
        });
        console.log('[Background] User pressed notification');
    }
});

// CRITICAL: Register Foreground Service to keep JS Bridge alive
// This allows the location tracker (which runs in the main bundle) to continue working
notifee.registerForegroundService((notification) => {
    return new Promise(() => {
        // We don't need to do anything specific here because LocationTracker is a singleton 
        // that is already running in the shared JS environment.
        // This promise keeps the service alive until stopForegroundService is called.
        console.log('[ForegroundService] Registered and running');
    });
});

AppRegistry.registerComponent(appName, () => App);
