/**
 * Location Tracking Service with Foreground Service
 * Keeps tracking active even when app is minimized/closed
 */

import { AppState, PermissionsAndroid, Platform } from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import notifee, { AndroidImportance, EventType, AndroidForegroundServiceType, AndroidCategory, AndroidColor } from '@notifee/react-native';
import { sendLocationPing } from './api';
import { getSavedEmployee } from '../utils/session';

class LocationTrackingService {
    constructor() {
        this.isTracking = false;
        this.intervalId = null;
        this.watchId = null;
        this.currentLocation = null;
        this.employeeId = null;
        // Ping every 30 seconds for more responsive tracking
        this.pingInterval = 30000;
        this.hasFirstLocation = false;
        // Work duration tracking
        this.startTime = null;
        this.notificationUpdateInterval = null;
        // Callback when auto-checkout happens
        this.onAutoCheckout = null;
    }

    /**
     * Start location tracking with Foreground Service
     */
    // Define a consistent Channel ID
    CHANNEL_ID = 'srm_sticky_nav_v1';

    /**
     * Start location tracking with Foreground Service
     */
    async start() {
        if (this.isTracking) {
            console.log('[LocationTracker] Already tracking');
            return;
        }

        try {
            // Stop any existing service to be safe
            await this.stop();

            const employee = await getSavedEmployee();
            if (!employee?.employeeId) {
                console.log('[LocationTracker] No employee found');
                return;
            }
            this.employeeId = employee.employeeId;
            console.log('[LocationTracker] Employee loaded:', this.employeeId);

            // 1. Request Permissions FIRST
            console.log('[LocationTracker] Requesting Loc Permission...');
            const hasLocPerm = await this.requestLocationPermission();
            if (!hasLocPerm) {
                console.log('[LocationTracker] Location Permission denied');
                return;
            }
            if (Platform.OS === 'android' && Platform.Version >= 33) {
                console.log('[LocationTracker] Requesting Notifee Permission...');
                await notifee.requestPermission();
            }

            // 2. Start Foreground Service
            console.log('[LocationTracker] Starting Foreground Service...');
            await this.startForegroundService();
            console.log('[LocationTracker] Foreground Service Started.');

            // 3. Configure Geolocation
            Geolocation.setRNConfiguration({
                skipPermissionRequests: false,
                authorizationLevel: 'whenInUse', // Use whenInUse + FG Service for best stability
                locationProvider: 'auto',
            });

            // 4. Start Listeners
            this.getImmediateLocation();
            this.watchId = Geolocation.watchPosition(
                (position) => this.handleLocationUpdate(position),
                (error) => {
                    console.log('[LocationTracker] Watch error:', error.message);
                },
                {
                    enableHighAccuracy: true,
                    distanceFilter: 10,
                    interval: 10000,
                    fastestInterval: 5000,
                    showLocationDialog: true,
                }
            );

            // 5. Start Interval Ping
            this.intervalId = setInterval(async () => {
                if (this.currentLocation) {
                    await this.sendPing();
                } else {
                    this.getImmediateLocation();
                }
            }, this.pingInterval);

            // 6. Start Duration Timer
            this.startTime = new Date();
            this.notificationUpdateInterval = setInterval(() => {
                this.updateNotificationWithDuration();
            }, 60000);

            this.isTracking = true;
            console.log('[LocationTracker] Tracking Started Successfully');

        } catch (error) {
            console.error('[LocationTracker] Critical Start Error:', error);
        }
    }

    async startForegroundService() {
        try {
            const channelId = await notifee.createChannel({
                id: this.CHANNEL_ID,
                name: 'SRM Attendance Service',
                importance: AndroidImportance.HIGH,
                visibility: 1, // Public
            });

            await notifee.displayNotification({
                id: 'srm_persistent_notification',
                title: 'SRM Attendance Active',
                body: 'Notification is non-swipeable until you check out.',
                android: {
                    channelId,
                    asForegroundService: true,
                    ongoing: true,
                    autoCancel: false,
                    importance: AndroidImportance.HIGH,
                    category: AndroidCategory.NAVIGATION, // NAVIGATION
                    color: '#EF4136',
                    smallIcon: 'ic_launcher',
                    showTimestamp: true,
                    timestamp: Date.now(),
                    showChronometer: true,
                    foregroundServiceTypes: [AndroidForegroundServiceType.FOREGROUND_SERVICE_TYPE_LOCATION],
                    progress: {
                        max: 10,
                        current: 5,
                        indeterminate: true
                    },
                    pressAction: {
                        id: 'default',
                        launchActivity: 'default'
                    },
                    actions: [
                        { title: 'Open App', pressAction: { id: 'open_app', launchActivity: 'default' } },
                    ],
                },
            });
        } catch (e) {
            console.error('[LocationTracker] FS Start Error:', e);
            throw e; // Re-throw to stop tracking if FS fails
        }
    }

    /**
 * Request Permissions
 */
    async requestLocationPermission() {
        if (Platform.OS === 'android') {
            const granted = await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
            );
            return granted === PermissionsAndroid.RESULTS.GRANTED;
        }
        return true;
    }

    /**
     * Handle incoming location
     */
    handleLocationUpdate(position) {
        console.log('[LocationTracker] Loc update:', position.coords.latitude);
        this.currentLocation = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: Date.now(),
        };

        // First location? Send ping immediately
        if (!this.hasFirstLocation) {
            this.hasFirstLocation = true;
            this.sendPing();
        }
    }

    /**
     * Get one-time location
     */
    getImmediateLocation() {
        Geolocation.getCurrentPosition(
            (pos) => this.handleLocationUpdate(pos),
            (err) => console.log('[LocationTracker] One-time error:', err.message),
            { enableHighAccuracy: true, timeout: 20000, maximumAge: 10000 }
        );
    }

    /**
     * Stop tracking and remove foreground service
     */
    async stop() {
        console.log('[LocationTracker] Stopping...');
        this.isTracking = false;

        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }

        if (this.notificationUpdateInterval) {
            clearInterval(this.notificationUpdateInterval);
            this.notificationUpdateInterval = null;
        }

        if (this.watchId !== null) {
            Geolocation.clearWatch(this.watchId);
            this.watchId = null;
        }

        this.currentLocation = null;
        this.employeeId = null;
        this.startTime = null;

        // Stop Foreground Service
        await notifee.stopForegroundService();
        console.log('[LocationTracker] Stopped');
    }

    /**
     * Update notification with current work duration
     */
    async updateNotificationWithDuration() {
        if (!this.startTime || !this.isTracking) return;

        const now = new Date();
        const diffMs = now - this.startTime;
        const hours = Math.floor(diffMs / (1000 * 60 * 60));
        const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        const durationText = `${hours}h ${minutes}m`;

        try {
            await notifee.displayNotification({
                id: 'srm_persistent_notification',
                title: '🟢 SRM Attendance Active',
                body: `Working Time: ${durationText} (Do not swipe check out to clear)`,
                android: {
                    channelId: this.CHANNEL_ID,
                    asForegroundService: true,
                    ongoing: true,
                    autoCancel: false,
                    showTimestamp: true,
                    timestamp: this.startTime ? this.startTime.getTime() : Date.now(),
                    showChronometer: true,
                    importance: AndroidImportance.HIGH,
                    category: AndroidCategory.NAVIGATION, // CHANGED TO NAVIGATION for "Active Trip" stickiness
                    color: '#EF4136', // Brand red
                    smallIcon: 'ic_launcher',
                    foregroundServiceTypes: [AndroidForegroundServiceType.FOREGROUND_SERVICE_TYPE_LOCATION],
                    progress: {
                        max: 10,
                        current: 5,
                        indeterminate: true
                    },
                    pressAction: { id: 'default', launchActivity: 'default' },
                    actions: [
                        { title: 'Open App', pressAction: { id: 'open_app', launchActivity: 'default' } },
                    ],
                },
            });
        } catch (e) {
            console.log('[LocationTracker] Notification update error:', e);
        }
    }

    /**
     * Send ping to server
     */
    async sendPing() {
        if (!this.employeeId || !this.currentLocation) return;
        await this.sendPingWithLocation(this.currentLocation.latitude, this.currentLocation.longitude);
    }

    /**
     * Send ping with specific coordinates (for both fresh and cached locations)
     */
    async sendPingWithLocation(latitude, longitude) {
        if (!this.employeeId) return;
        try {
            console.log(`[LocationTracker] Pinging server... (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`);
            const response = await sendLocationPing(this.employeeId, latitude, longitude);

            // Safety check - ensure we got a valid response
            if (!response || typeof response !== 'object') {
                console.log('[LocationTracker] Invalid response from ping, continuing...');
                return;
            }

            console.log('[LocationTracker] Ping success. Inside geofence:', response.ping?.isInsideGeofence);

            // Handle auto-checkout response from server
            // ONLY stop if explicitly told by server (autoCheckedOut === true)
            if (response.autoCheckedOut === true) {
                console.log('[LocationTracker] Server triggered auto-checkout - stopping tracker');

                // Show notification to user
                try {
                    await notifee.displayNotification({
                        id: 'auto_checkout_notification',
                        title: '⚠️ Auto Checked Out',
                        body: 'You have been checked out because you were outside the office for 5 minutes.',
                        android: {
                            channelId: this.CHANNEL_ID,
                            importance: AndroidImportance.HIGH,
                            pressAction: { id: 'default' },
                        },
                    });
                } catch (notifError) {
                    console.log('[LocationTracker] Notification error:', notifError);
                }

                // Stop tracking
                await this.stop();

                // Trigger callback to refresh UI (AttendanceScreen)
                if (this.onAutoCheckout && typeof this.onAutoCheckout === 'function') {
                    console.log('[LocationTracker] Triggering onAutoCheckout callback');
                    this.onAutoCheckout();
                }
                return;
            }

            // Log if outside geofence but not yet auto-checked out
            if (response.outsideGeofenceCount && response.outsideGeofenceCount > 0) {
                console.log(`[LocationTracker] Outside geofence. Warning: ${response.outsideGeofenceCount}/5 pings until auto-checkout`);
            }
        } catch (e) {
            console.log('[LocationTracker] Ping failed:', e.message);
            // Don't stop tracker on ping failure - it will retry on next interval
        }
    }

    /**
     * Set callback for auto-checkout event
     */
    setOnAutoCheckout(callback) {
        this.onAutoCheckout = callback;
    }
}

const locationTracker = new LocationTrackingService();
export default locationTracker;
