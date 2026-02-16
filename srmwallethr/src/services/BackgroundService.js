import notifee, { AndroidImportance, AndroidColor, AndroidForegroundServiceType, AndroidCategory } from '@notifee/react-native';

const CHANNEL_ID = 'srm_sticky_nav_v1';

class BackgroundService {

    constructor() {
        this.isServiceRunning = false;
    }

    /**
     * Start the foreground service to keep app alive
     */
    async start() {
        if (this.isServiceRunning) return;

        try {
            // Request permissions (required for Android 13+)
            await notifee.requestPermission();

            // Create a channel (required for Android)
            await notifee.createChannel({
                id: CHANNEL_ID,
                name: 'SRM Attendance Service',
                importance: AndroidImportance.HIGH, // CHANGED TO HIGH for persistence
                lights: false,
                vibration: false,
            });

            // Display the notification
            await notifee.displayNotification({
                id: 'srm_persistent_notification', // Unified ID
                title: 'SRM Sweets',
                body: 'App is running in the background for attendance.',
                android: {
                    channelId: CHANNEL_ID,
                    asForegroundService: true,
                    ongoing: true, // Prevents swiping away
                    autoCancel: false, // Prevents cancel on click
                    importance: AndroidImportance.HIGH, // High importance
                    foregroundServiceTypes: [
                        AndroidForegroundServiceType.FOREGROUND_SERVICE_TYPE_LOCATION
                    ],
                    category: AndroidCategory.NAVIGATION, // NAVIGATION
                    color: '#EF4136',
                    smallIcon: 'ic_launcher',
                    progress: {
                        max: 10,
                        current: 5,
                        indeterminate: true
                    },
                    pressAction: {
                        id: 'default',
                        launchActivity: 'default',
                    },
                },
            });

            this.isServiceRunning = true;
            console.log('[BackgroundService] Service started');
        } catch (error) {
            console.error('[BackgroundService] Error starting service:', error);
        }
    }

    /**
     * Stop the service
     */
    async stop() {
        try {
            await notifee.stopForegroundService();
            this.isServiceRunning = false;
            console.log('[BackgroundService] Service stopped');
        } catch (error) {
            console.error('[BackgroundService] Error stopping service:', error);
        }
    }
}

export default new BackgroundService();
