/**
 * SRM Employee Chat App
 * @format
 */

import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';
import messaging from '@react-native-firebase/messaging';
import { backgroundMessageHandler } from './src/utils/notifications';

// Register background message handler
try {
    messaging().setBackgroundMessageHandler(backgroundMessageHandler);
} catch (e) {
    console.log('Background message registration error:', e);
}

AppRegistry.registerComponent(appName, () => App);
