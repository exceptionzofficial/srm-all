/**
 * Push Notification Utilities for SRM Employee Chat App
 */

import messaging from '@react-native-firebase/messaging';
import notifee, { AndroidImportance } from '@notifee/react-native';
import { registerFcmToken } from '../services/api';

// Request permission and get FCM token
export const initNotifications = async (employeeId) => {
    try {
        const authStatus = await messaging().requestPermission();
        const enabled =
            authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
            authStatus === messaging.AuthorizationStatus.PROVISIONAL;

        if (enabled) {
            const token = await messaging().getToken();
            console.log('FCM Token:', token);

            // Register token with backend
            if (employeeId && token) {
                await registerFcmToken(employeeId, token);
            }

            return token;
        }
    } catch (error) {
        console.log('Notification init error:', error);
    }
    return null;
};

// Create notification channel for Android
export const createNotificationChannel = async () => {
    await notifee.createChannel({
        id: 'chat_messages',
        name: 'Chat Messages',
        importance: AndroidImportance.HIGH,
        sound: 'default',
        vibration: true,
    });
};

// Display a local notification
export const displayNotification = async (title, body, data = {}) => {
    try {
        await notifee.displayNotification({
            title,
            body,
            data,
            android: {
                channelId: 'chat_messages',
                // Removed missing smallIcon: 'ic_notification',
                pressAction: { id: 'default' },
                sound: 'default',
            },
        });
    } catch (e) {
        console.log('Display notification error:', e);
    }
};

// Handle foreground messages
export const setupForegroundHandler = () => {
    try {
        return messaging().onMessage(async (remoteMessage) => {
            const { title, body } = remoteMessage.notification || {};
            if (title || body) {
                await displayNotification(
                    title || 'New Message',
                    body || '',
                    remoteMessage.data || {}
                );
            }
        });
    } catch (e) {
        console.log('Foreground handler error:', e);
        return () => { };
    }
};

// Handle background messages (called from index.js)
export const backgroundMessageHandler = async (remoteMessage) => {
    console.log('Background message:', remoteMessage);
};
