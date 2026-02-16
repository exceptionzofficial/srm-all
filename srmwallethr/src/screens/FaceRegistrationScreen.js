/**
 * Face Registration Screen
 * Camera screen for capturing employee face with geo-fence validation
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    Dimensions,
    StatusBar,
    Platform,
    Linking,
} from 'react-native';
import {
    Camera,
    useCameraDevice,
    useCameraPermission,
    useCameraFormat,
} from 'react-native-vision-camera';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { registerFace, validateLocation } from '../services/api';
import {
    requestLocationPermission,
    getCurrentLocation,
    validateLocationFast,
} from '../utils/location';
import RNFS from 'react-native-fs';
import { COLORS } from '../utils/theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const FaceRegistrationScreen = ({ route, navigation }) => {
    const { employee } = route.params;
    const cameraRef = useRef(null);
    const insets = useSafeAreaInsets();

    const [loading, setLoading] = useState(false);
    const [locationStatus, setLocationStatus] = useState('checking');
    const [currentLocation, setCurrentLocation] = useState(null);
    const [isWithinGeofence, setIsWithinGeofence] = useState(false);
    const [distance, setDistance] = useState(null);
    const [capturedPhoto, setCapturedPhoto] = useState(null);

    const [cameraError, setCameraError] = useState(null);

    const device = useCameraDevice('front');
    const format = useCameraFormat(device, [
        { photoResolution: { width: 480, height: 640 } }
    ]);
    const { hasPermission, requestPermission } = useCameraPermission();

    useEffect(() => {
        initializeScreen();
    }, []);

    const initializeScreen = async () => {
        if (!hasPermission) {
            await requestPermission();
        }
        await checkLocationAndGeofence();
    };

    // ... (rest of the code)

    // Handle Camera Errors
    const onCameraError = useCallback((error) => {
        console.error('Camera Runtime Error:', error);
        setCameraError(error);
        Alert.alert(
            'Camera Error',
            'Your camera is restricted or unavailable. Please check device settings.',
            [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
    }, [navigation]);

    if (cameraError) {
        return (
            <View style={styles.permissionContainer}>
                <Text style={styles.permissionText}>Camera Unavailable</Text>
                <Text style={[styles.permissionText, { fontSize: 14 }]}>
                    {cameraError.message || 'Device policy has restricted the camera.'}
                </Text>
                <TouchableOpacity style={styles.button} onPress={() => navigation.goBack()}>
                    <Text style={styles.buttonText}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }


    const checkLocationAndGeofence = async () => {
        setLocationStatus('checking');
        try {
            const hasLocationPermission = await requestLocationPermission();
            if (!hasLocationPermission) {
                setLocationStatus('denied');
                Alert.alert('Location Required', 'Please enable location access.');
                return;
            }

            // Get current location (uses cache for speed)
            let location;
            try {
                location = await getCurrentLocation();

                if (!location) {
                    throw new Error('Unable to fetch location. Please enable Location/GPS.');
                }

                setCurrentLocation(location);
            } catch (locError) {
                console.error('Location Error:', locError);

                Alert.alert(
                    'Location Required',
                    'Please turn on your device Location/GPS to register.',
                    [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Open Settings', onPress: () => Linking.openSettings() }
                    ]
                );

                setLocationStatus('denied');
                return;
            }

            // Fast validation using cached geo-fence settings
            const validation = await validateLocationFast(
                location.latitude,
                location.longitude,
                validateLocation
            );

            if (!validation.isConfigured) {
                setIsWithinGeofence(true); // Allow them to proceed, but warn
                setLocationStatus('warning');
                return;
            }

            setIsWithinGeofence(validation.withinRange);
            setDistance(validation.distance);

            if (validation.withinRange) {
                setLocationStatus('valid');
            } else {
                setLocationStatus('out_of_range');
                Alert.alert(
                    '⚠️ Too Far From Office',
                    `You are ${validation.distance}m away.\nAllowed: ${validation.allowedRadius}m`,
                );
            }
        } catch (error) {
            console.error('Location check error:', error);
            // Allow if validation fails
            setIsWithinGeofence(true);
            setLocationStatus('valid');
        }
    };

    const handleCapture = async () => {
        if (!cameraRef.current) return;
        if (!isWithinGeofence) {
            Alert.alert(
                'Cannot Register',
                'You must be within office premises to register your face.',
            );
            return;
        }

        setLoading(true);
        try {
            // Capture photo
            const photo = await cameraRef.current.takePhoto({
                qualityPrioritization: 'balanced',
                flash: 'off',
            });

            // Read the photo as base64
            const base64Data = await RNFS.readFile(photo.path, 'base64');
            const imageBase64 = `data:image/jpeg;base64,${base64Data}`;

            // Register face with backend
            const response = await registerFace(
                employee.employeeId,
                imageBase64,
                currentLocation.latitude,
                currentLocation.longitude,
            );

            Alert.alert(
                '✅ Registration Successful!',
                `Welcome, ${employee.name}!\n\nYour face has been registered successfully. Now please set up your account.`,
                [
                    {
                        text: 'Continue',
                        onPress: () => navigation.replace('Register', { employee }),
                    },
                ],
            );
        } catch (error) {
            const errorMessage =
                error.response?.data?.message || 'Failed to register face';

            if (error.response?.data?.withinRange === false) {
                Alert.alert(
                    '⚠️ Too Far From Office',
                    errorMessage,
                );
            } else {
                Alert.alert('Registration Failed', errorMessage);
            }
        } finally {
            setLoading(false);
        }
    };

    // Render location status badge
    const renderLocationStatus = () => {
        switch (locationStatus) {
            case 'checking':
                return (
                    <View style={[styles.statusBadge, styles.statusChecking]}>
                        <ActivityIndicator size="small" color="#fff" />
                        <Text style={styles.statusText}>Checking location...</Text>
                    </View>
                );
            case 'valid':
                return (
                    <View style={[styles.statusBadge, styles.statusValid]}>
                        <Text style={styles.statusIcon}>✓</Text>
                        <Text style={styles.statusText}>Within office range</Text>
                    </View>
                );
            case 'out_of_range':
                return (
                    <View style={[styles.statusBadge, styles.statusInvalid]}>
                        <Text style={styles.statusIcon}>⚠️</Text>
                        <Text style={styles.statusText}>
                            {distance ? `${distance}m away` : 'Too far from office'}
                        </Text>
                    </View>
                );
            case 'warning':
                return (
                    <View style={[styles.statusBadge, styles.statusChecking]}>
                        <Text style={styles.statusIcon}>⚠️</Text>
                        <Text style={styles.statusText}>Location unverified</Text>
                    </View>
                );
            case 'denied':
                return (
                    <View style={[styles.statusBadge, styles.statusInvalid]}>
                        <Text style={styles.statusIcon}>🚫</Text>
                        <Text style={styles.statusText}>Location access denied</Text>
                    </View>
                );
            default:
                return (
                    <View style={[styles.statusBadge, styles.statusInvalid]}>
                        <Text style={styles.statusIcon}>❌</Text>
                        <Text style={styles.statusText}>Location error</Text>
                    </View>
                );
        }
    };

    // Camera permission not granted
    if (!hasPermission) {
        return (
            <View style={styles.permissionContainer}>
                <Text style={styles.permissionText}>Camera permission required</Text>
                <TouchableOpacity style={styles.button} onPress={requestPermission}>
                    <Text style={styles.buttonText}>Grant Permission</Text>
                </TouchableOpacity>
            </View>
        );
    }

    // No camera device
    if (!device) {
        return (
            <View style={styles.permissionContainer}>
                <Text style={styles.permissionText}>No camera device found</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#000000" />
            {/* Camera View */}
            <Camera
                ref={cameraRef}
                style={StyleSheet.absoluteFill}
                device={device}
                format={format}
                isActive={true}
                photo={true}
                onError={onCameraError}
            />

            {/* Overlay */}
            <View style={styles.overlay}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}>
                        <Text style={styles.backText}>← Back</Text>
                    </TouchableOpacity>
                    <View style={styles.employeeInfo}>
                        <Text style={styles.employeeName}>{employee.name}</Text>
                        <Text style={styles.employeeId}>{employee.employeeId}</Text>
                    </View>
                </View>

                {/* Location Status */}
                <View style={styles.statusContainer}>
                    {renderLocationStatus()}
                    {currentLocation && (
                        <Text style={{ color: '#aaa', fontSize: 10, marginTop: 5 }}>
                            GPS: {currentLocation.latitude.toFixed(5)}, {currentLocation.longitude.toFixed(5)}
                            {distance ? ` (${distance}m)` : ''}
                        </Text>
                    )}
                </View>

                {/* Face Guide */}
                <View style={styles.faceGuideContainer}>
                    <View style={styles.faceGuide}>
                        <View style={styles.cornerTL} />
                        <View style={styles.cornerTR} />
                        <View style={styles.cornerBL} />
                        <View style={styles.cornerBR} />
                    </View>
                    <Text style={styles.guideText}>
                        Position your face within the frame
                    </Text>
                </View>

                {/* Capture Button */}
                <View style={[styles.captureContainer, { paddingBottom: Math.max(insets.bottom, 30) + 20 }]}>
                    <TouchableOpacity
                        style={[
                            styles.captureButton,
                            (!isWithinGeofence || loading) && styles.captureButtonDisabled,
                        ]}
                        onPress={handleCapture}
                        disabled={!isWithinGeofence || loading}>
                        {loading ? (
                            <ActivityIndicator size="large" color="#fff" />
                        ) : (
                            <View style={styles.captureInner} />
                        )}
                    </TouchableOpacity>
                    <Text style={styles.captureHint}>
                        {isWithinGeofence
                            ? 'Tap to capture'
                            : 'Move closer to office to capture'}
                    </Text>

                    {/* Refresh Location Button */}
                    <TouchableOpacity
                        style={styles.refreshButton}
                        onPress={checkLocationAndGeofence}>
                        <Text style={styles.refreshText}>🔄 Refresh Location</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000000',
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'space-between',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 20,
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 50,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    backButton: {
        padding: 8,
    },
    backText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontFamily: 'Poppins-Regular',
    },
    employeeInfo: {
        alignItems: 'flex-end',
    },
    employeeName: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
        fontFamily: 'Poppins-SemiBold',
    },
    employeeId: {
        color: '#CCCCCC',
        fontSize: 12,
        fontFamily: 'Poppins-Regular',
    },
    statusContainer: {
        alignItems: 'center',
        marginTop: 20,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 0,
        gap: 8,
    },
    statusChecking: {
        backgroundColor: 'rgba(255,193,7,0.9)',
    },
    statusValid: {
        backgroundColor: 'rgba(76,175,80,0.9)',
    },
    statusInvalid: {
        backgroundColor: 'rgba(244,67,54,0.9)',
    },
    statusIcon: {
        fontSize: 16,
    },
    statusText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '500',
        fontFamily: 'Poppins-Medium',
    },
    faceGuideContainer: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    faceGuide: {
        width: 250,
        height: 300,
        position: 'relative',
    },
    cornerTL: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: 40,
        height: 40,
        borderTopWidth: 4,
        borderLeftWidth: 4,
        borderColor: '#EF4136',
        borderTopLeftRadius: 0,
    },
    cornerTR: {
        position: 'absolute',
        top: 0,
        right: 0,
        width: 40,
        height: 40,
        borderTopWidth: 4,
        borderRightWidth: 4,
        borderColor: '#EF4136',
        borderTopRightRadius: 0,
    },
    cornerBL: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        width: 40,
        height: 40,
        borderBottomWidth: 4,
        borderLeftWidth: 4,
        borderColor: '#EF4136',
        borderBottomLeftRadius: 0,
    },
    cornerBR: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 40,
        height: 40,
        borderBottomWidth: 4,
        borderRightWidth: 4,
        borderColor: '#EF4136',
        borderBottomRightRadius: 0,
    },
    guideText: {
        color: '#FFFFFF',
        fontSize: 14,
        marginTop: 16,
        textAlign: 'center',
        textShadowColor: '#000',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
        fontFamily: 'Poppins-Regular',
    },
    captureContainer: {
        alignItems: 'center',
        paddingBottom: 50,
        backgroundColor: 'rgba(0,0,0,0.5)',
        paddingTop: 20,
    },
    captureButton: {
        width: 80,
        height: 80,
        borderRadius: 0,
        backgroundColor: '#EF4136',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 4,
        borderColor: '#FFFFFF',
    },
    captureButtonDisabled: {
        backgroundColor: '#999999',
    },
    captureInner: {
        width: 60,
        height: 60,
        borderRadius: 0,
        backgroundColor: '#EF4136',
    },
    captureHint: {
        color: '#FFFFFF',
        fontSize: 12,
        marginTop: 12,
        fontFamily: 'Poppins-Regular',
    },
    refreshButton: {
        marginTop: 16,
        padding: 10,
    },
    refreshText: {
        color: '#EF4136',
        fontSize: 14,
        fontFamily: 'Poppins-Regular',
    },
    permissionContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#000000',
        padding: 20,
    },
    permissionText: {
        color: '#FFFFFF',
        fontSize: 18,
        textAlign: 'center',
        marginBottom: 20,
        fontFamily: 'Poppins-Regular',
    },
    button: {
        backgroundColor: '#EF4136',
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: 0,
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
        fontFamily: 'Poppins-SemiBold',
    },
});

export default FaceRegistrationScreen;
