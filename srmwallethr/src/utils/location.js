/**
 * Location utility functions with geo-fence caching
 * Caches geo-fence settings locally for faster validation
 */

import { Platform, PermissionsAndroid, Alert, Linking } from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage keys
const GEOFENCE_CACHE_KEY = '@srm_geofence_settings';
const GEOFENCE_CACHE_EXPIRY = '@srm_geofence_expiry';
const LAST_LOCATION_KEY = '@srm_last_location';

// Cache duration: 1 hour (in milliseconds)
const CACHE_DURATION = 60 * 60 * 1000;

// Configure geolocation for faster response
Geolocation.setRNConfiguration({
    skipPermissionRequests: false,
    authorizationLevel: 'whenInUse',
    locationProvider: 'auto',
});

/**
 * Request location permission
 */
export const requestLocationPermission = async () => {
    try {
        if (Platform.OS === 'android') {
            const alreadyGranted = await PermissionsAndroid.check(
                PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
            );

            if (alreadyGranted) {
                return true;
            }

            const granted = await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
                {
                    title: 'Location Permission Required',
                    message: 'SRM Sweets needs your location for attendance.',
                    buttonPositive: 'OK',
                },
            );

            return granted === PermissionsAndroid.RESULTS.GRANTED;
        }
        return true;
    } catch (error) {
        console.error('Permission error:', error);
        return false;
    }
};

/**
 * Get current location - tries GPS first, then network location
 * Will reject ONLY if both fail (meaning location services are truly off)
 */
export const getCurrentLocation = () => {
    return new Promise((resolve, reject) => {
        console.log('[Location] Requesting location (trying GPS first)...');

        // First try: High accuracy GPS
        Geolocation.getCurrentPosition(
            async (position) => {
                const location = {
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    accuracy: position.coords.accuracy,
                    timestamp: Date.now(),
                };
                console.log('[Location] Got GPS location:', location.latitude, location.longitude, 'accuracy:', location.accuracy);

                try {
                    await AsyncStorage.setItem(LAST_LOCATION_KEY, JSON.stringify(location));
                } catch (e) { }

                resolve(location);
            },
            (gpsError) => {
                console.warn('[Location] GPS failed, trying network location...', JSON.stringify(gpsError));

                // Second try: Network/WiFi based location (less accurate but works indoors)
                Geolocation.getCurrentPosition(
                    async (position) => {
                        const location = {
                            latitude: position.coords.latitude,
                            longitude: position.coords.longitude,
                            accuracy: position.coords.accuracy,
                            timestamp: Date.now(),
                        };
                        console.log('[Location] Got network location:', location.latitude, location.longitude, 'accuracy:', location.accuracy);

                        try {
                            await AsyncStorage.setItem(LAST_LOCATION_KEY, JSON.stringify(location));
                        } catch (e) { }

                        resolve(location);
                    },
                    (networkError) => {
                        console.log('[Location] Network location failed:', networkError.message);
                        // Do not reject, just resolve null to avoid crashes/alerts in loop
                        resolve(null);
                    },
                    {
                        enableHighAccuracy: false, // Use network/WiFi
                        timeout: 10000,
                        maximumAge: 30000, // Allow 30 sec old network location
                    }
                );
            },
            {
                enableHighAccuracy: true, // Try GPS first
                timeout: 20000, // 20 seconds for GPS (increased)
                maximumAge: 0, // Must be fresh
            }
        );
    });
};

/**
 * Cache geo-fence settings locally
 */
export const cacheGeofenceSettings = async (settings) => {
    try {
        await AsyncStorage.setItem(GEOFENCE_CACHE_KEY, JSON.stringify(settings));
        await AsyncStorage.setItem(GEOFENCE_CACHE_EXPIRY, String(Date.now() + CACHE_DURATION));
        console.log('Geo-fence settings cached');
    } catch (error) {
        console.error('Error caching geo-fence:', error);
    }
};

/**
 * Get cached geo-fence settings (if valid)
 */
export const getCachedGeofenceSettings = async () => {
    try {
        const expiry = await AsyncStorage.getItem(GEOFENCE_CACHE_EXPIRY);
        if (!expiry || Date.now() > parseInt(expiry, 10)) {
            return null; // Cache expired
        }

        const cached = await AsyncStorage.getItem(GEOFENCE_CACHE_KEY);
        if (cached) {
            return JSON.parse(cached);
        }
    } catch (error) {
        console.error('Error reading cached geo-fence:', error);
    }
    return null;
};

/**
 * Calculate distance between two coordinates (Haversine formula)
 */
export const calculateDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lng2 - lng1) * Math.PI) / 180;

    const a =
        Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return Math.round(R * c);
};

/**
 * Fast geo-fence validation using cached settings
 * Falls back to API if cache is empty/expired
 */
export const validateLocationFast = async (latitude, longitude, apiValidateFn, targetLocation = null) => {
    // If target location is provided (e.g. from selected branch), use it directly
    if (targetLocation && targetLocation.latitude && targetLocation.longitude) {
        const radius = targetLocation.radiusMeters || 100; // Default 100m if not specified
        const distance = calculateDistance(
            latitude,
            longitude,
            targetLocation.latitude,
            targetLocation.longitude
        );

        const withinRange = distance <= radius;

        console.log(`Branch validation: ${distance}m from ${targetLocation.name || 'target'} (max: ${radius}m)`);

        return {
            withinRange,
            distance,
            allowedRadius: radius,
            isConfigured: true,
            fromCache: false,
        };
    }

    // Try cached settings first (instant)
    const cachedSettings = await getCachedGeofenceSettings();

    if (cachedSettings && cachedSettings.officeLat && cachedSettings.officeLng) {
        const distance = calculateDistance(
            latitude,
            longitude,
            cachedSettings.officeLat,
            cachedSettings.officeLng
        );

        const withinRange = distance <= cachedSettings.radiusMeters;

        console.log(`Fast validation: ${distance}m from office (max: ${cachedSettings.radiusMeters}m)`);

        return {
            withinRange,
            distance,
            allowedRadius: cachedSettings.radiusMeters,
            isConfigured: true,
            fromCache: true,
        };
    }

    // No cache - call API and cache the result
    try {
        const result = await apiValidateFn(latitude, longitude);

        // Cache the settings for next time
        if (result.officeLocation) {
            await cacheGeofenceSettings({
                officeLat: result.officeLocation.lat,
                officeLng: result.officeLocation.lng,
                radiusMeters: result.allowedRadius,
            });
        }

        return result;
    } catch (error) {
        // If API fails and no cache, allow access
        console.log('API failed, no cache - allowing access');
        return {
            withinRange: true,
            distance: 0,
            allowedRadius: 0,
            isConfigured: false,
            // Only allow access if we can't verify - but for explicit branch check, failure is safer
        };
    }
};

/**
 * Clear all cached data (for logout or refresh)
 */
export const clearLocationCache = async () => {
    try {
        await AsyncStorage.multiRemove([
            GEOFENCE_CACHE_KEY,
            GEOFENCE_CACHE_EXPIRY,
            LAST_LOCATION_KEY,
        ]);
    } catch (error) {
        console.error('Error clearing cache:', error);
    }
};

/**
 * Subscribe to continuous location updates
 * Returns watchId
 */
export const subscribeToLocationUpdates = (onLocationUpdate, onError) => {
    return Geolocation.watchPosition(
        (position) => {
            const location = {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                accuracy: position.coords.accuracy,
                timestamp: Date.now(),
            };
            // Update cache silently
            AsyncStorage.setItem(LAST_LOCATION_KEY, JSON.stringify(location)).catch(() => { });
            onLocationUpdate(location);
        },
        (error) => {
            console.warn('[Location] Watch error:', JSON.stringify(error));
            if (onError) onError(error);
        },
        {
            enableHighAccuracy: true,
            distanceFilter: 10, // Update every 10 meters
            interval: 5000,     // Or every 5 seconds
            fastestInterval: 2000,
        }
    );
};

/**
 * Clear location watch
 */
export const clearLocationWatch = (watchId) => {
    if (watchId !== null && watchId !== undefined) {
        Geolocation.clearWatch(watchId);
    }
};

export default {
    requestLocationPermission,
    getCurrentLocation,
    calculateDistance,
    cacheGeofenceSettings,
    getCachedGeofenceSettings,
    validateLocationFast,
    clearLocationCache,
    subscribeToLocationUpdates,
    clearLocationWatch,
};
