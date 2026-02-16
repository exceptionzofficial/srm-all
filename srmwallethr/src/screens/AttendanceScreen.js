import React, { useState, useEffect, useRef } from 'react';
import notifee from '@notifee/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    ScrollView,
    AppState,
    Image,
    RefreshControl,
    StatusBar,
    Platform,
    TextInput,
    Linking,
    FlatList,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { Camera, useCameraDevice, useCameraPermission, useCameraFormat } from 'react-native-vision-camera';
import {
    checkIn,
    checkOut,
    getAttendanceStatus,
    resumeSession,
    verifyViewAccess,
    getBranches
} from '../services/api';
import { getCurrentLocation, requestLocationPermission, validateLocationFast } from '../utils/location';
import { saveSession, getSavedEmployee, clearSession, calculateTodayDuration } from '../utils/session';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import locationTracker from '../services/LocationTracker';
import BackgroundService from '../services/BackgroundService';
import { COLORS } from '../utils/theme';
import RNFS from 'react-native-fs';

const AttendanceScreen = () => {
    const navigation = useNavigation();
    const isFocused = useIsFocused();
    const insets = useSafeAreaInsets();
    const device = useCameraDevice('front');
    const format = useCameraFormat(device, [
        { photoResolution: { width: 480, height: 640 } }
    ]);
    const { hasPermission, requestPermission } = useCameraPermission();

    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    // Camera State
    const [cameraActive, setCameraActive] = useState(false);
    const cameraRef = useRef(null);
    const [verifyingViewAccess, setVerifyingViewAccess] = useState(false);

    // Data State
    const [employee, setEmployee] = useState(null);
    const [status, setStatus] = useState(null);
    const [branches, setBranches] = useState([]);
    const [selectedBranch, setSelectedBranch] = useState(null);
    const [loadingBranches, setLoadingBranches] = useState(true);
    const [todayDuration, setTodayDuration] = useState('0h 0m');

    // Branch search state
    const [branchSearchQuery, setBranchSearchQuery] = useState('');
    const [showBranchDropdown, setShowBranchDropdown] = useState(false);

    // Location & Geofence State
    const [currentLocation, setCurrentLocation] = useState(null);
    const [locationStatus, setLocationStatus] = useState('checking'); // 'checking', 'enabled', 'disabled', 'error'
    const [geofenceStatus, setGeofenceStatus] = useState({
        withinRange: false,
        distance: 0,
        allowedRadius: 0,
        message: 'Getting location...'
    });

    const appState = useRef(AppState.currentState);
    const isMounted = useRef(true); // Track if component is still mounted

    useEffect(() => {
        isMounted.current = true; // Set mounted on init

        checkPermissions();
        loadInitialData();

        // Register callback for auto-checkout (triggered by LocationTracker)
        locationTracker.setOnAutoCheckout(() => {
            console.log('[AttendanceScreen] Auto-checkout callback received');

            // Safety check - only proceed if component is still mounted
            if (!isMounted.current) {
                console.log('[AttendanceScreen] Component unmounted, skipping callback');
                return;
            }

            try {
                // Use setTimeout to allow React to complete current render cycle
                setTimeout(() => {
                    if (!isMounted.current) return;

                    // Refresh the screen to show checked-out state
                    refreshAll();

                    // Show alert to user with slight delay to avoid conflicts
                    setTimeout(() => {
                        if (!isMounted.current) return;
                        Alert.alert(
                            '⚠️ Auto Checked Out',
                            'You have been automatically checked out because you were outside the office for 5 minutes.',
                            [{ text: 'OK' }]
                        );
                    }, 300);
                }, 100);
            } catch (error) {
                console.log('[AttendanceScreen] Callback error:', error.message);
            }
        });

        const subscription = AppState.addEventListener('change', nextAppState => {
            if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
                if (isMounted.current) refreshAll();
            }
            appState.current = nextAppState;
        });

        return () => {
            isMounted.current = false; // Mark as unmounted
            subscription.remove();
            // Clear callback on unmount
            locationTracker.setOnAutoCheckout(null);
        };
    }, []);

    useEffect(() => {
        if (isFocused) {
            refreshAll();
        }
    }, [isFocused]);

    useEffect(() => {
        if (currentLocation && selectedBranch) {
            validateGeofence(currentLocation, selectedBranch);
        } else if (currentLocation && !selectedBranch) {
            setGeofenceStatus(prev => ({ ...prev, message: 'Select a branch first', withinRange: false }));
        }
    }, [currentLocation, selectedBranch]);

    const checkPermissions = async () => {
        await requestLocationPermission();
        if (!hasPermission) {
            await requestPermission();
        }
    };

    const loadInitialData = async () => {
        try {
            setLoading(true);
            await Promise.all([loadEmployee(), loadBranches()]);
            await checkLocation();
        } catch (e) {
            console.error('Initial load error:', e);
        } finally {
            setLoading(false);
        }
    };

    const refreshAll = async () => {
        setRefreshing(true);
        await Promise.all([
            refreshStatus(),
            checkLocation(),
            loadBranches()
        ]);
        setRefreshing(false);
    };

    const loadEmployee = async () => {
        const emp = await getSavedEmployee();
        setEmployee(emp);
    };

    const loadBranches = async () => {
        setLoadingBranches(true);
        try {
            const response = await getBranches();
            const branchList = response?.branches || response || [];
            console.log('[Branches] Loaded:', branchList.length);

            if (branchList.length > 0) {
                setBranches(branchList);

                // Auto-select assigned branch
                if (!selectedBranch) {
                    const savedEmp = await getSavedEmployee();
                    const assignedId = savedEmp?.branchId;

                    console.log(`[Branches] DEBUG: User BranchID: ${assignedId}`);
                    // Log first few branches to check ID format
                    if (branchList.length > 0) {
                        console.log(`[Branches] DEBUG: Sample Branch[0]: ID=${branchList[0].branchId} / _id=${branchList[0]._id}`);
                    }

                    const assignedBranch = branchList.find(b =>
                        (b.branchId && b.branchId === assignedId) ||
                        (b._id && b._id === assignedId)
                    );

                    if (assignedBranch) {
                        console.log(`[Branches] Auto-selecting assigned: ${assignedBranch.name}`);
                        setSelectedBranch(assignedBranch);
                    } else {
                        // DO NOT default to first branch. Let user select.
                        console.log('[Branches] No assigned branch match found. Waiting for user selection.');
                    }
                }
            } else {
                setBranches([]);
            }
        } catch (error) {
            console.log('Error loading branches:', error);
            setBranches([]);
        } finally {
            setLoadingBranches(false);
        }
    };

    // Live Timer for Duration - OPTIMIZED to prevent re-renders/looping
    const recordsRef = useRef(null);
    useEffect(() => {
        if (status?.attendanceRecords) {
            recordsRef.current = status.attendanceRecords;
        }
    }, [status?.attendanceRecords]);

    useEffect(() => {
        let interval;
        if (status?.isTracking) {
            // Calculate immediately once
            if (recordsRef.current) {
                const { formattedDuration } = calculateTodayDuration(recordsRef.current);
                setTodayDuration(formattedDuration);
            }

            // Update duration every SECOND, without dependencies on objects
            interval = setInterval(() => {
                if (recordsRef.current) {
                    const { formattedDuration } = calculateTodayDuration(recordsRef.current);
                    setTodayDuration(formattedDuration);
                }
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [status?.isTracking]); // Only restart if Tracking toggles (Check In/Out)

    const refreshStatus = async () => {
        const emp = await getSavedEmployee();
        if (emp?.employeeId) {
            try {
                const statusData = await getAttendanceStatus(emp.employeeId);
                setStatus(statusData.status);

                // Calculate Duration
                if (statusData.status?.totalWorkDurationMinutes !== undefined) {
                    const mins = statusData.status.totalWorkDurationMinutes;
                    const formatted = `${Math.floor(mins / 60)}h ${mins % 60}m`;
                    setTodayDuration(formatted);
                } else if (statusData.status?.attendanceRecords) {
                    const { formattedDuration } = calculateTodayDuration(statusData.status.attendanceRecords);
                    setTodayDuration(formattedDuration);
                }

                if (statusData.employee) {
                    setEmployee(statusData.employee);
                    // Also save to session to persist faceId AND tracking status
                    await saveSession(statusData.employee, statusData.status?.isTracking);
                }

                // Handle Location Tracking based on status
                if (statusData.status?.isTracking) {
                    if (!locationTracker.isTracking) locationTracker.start();
                } else {
                    if (locationTracker.isTracking) locationTracker.stop();
                }

            } catch (e) {
                console.log('Error refreshing status:', e);
            }
        }
    };

    // --- Battery Optimization Check ---
    useEffect(() => {
        const checkBatteryOpt = async () => {
            try {
                const hasPrompted = await AsyncStorage.getItem('hasPromptedBatteryOpt');
                if (!hasPrompted) {
                    Alert.alert(
                        'Enable Background Tracking',
                        'To ensure attendance tracks correctly while the app is in the background, please disable Battery Optimization for this app.',
                        [
                            { text: 'Later', style: 'cancel' },
                            {
                                text: 'Open Settings',
                                onPress: async () => {
                                    await notifee.openBatteryOptimizationSettings();
                                    await AsyncStorage.setItem('hasPromptedBatteryOpt', 'true');
                                },
                            },
                        ]
                    );
                }
            } catch (e) {
                console.log('Battery Opt Check Error:', e);
            }
        };
        checkBatteryOpt();
    }, []);

    const checkLocation = async () => {
        try {
            setLocationStatus('checking');
            setGeofenceStatus(prev => ({ ...prev, message: 'Getting location...' }));

            // First check if location permission is granted
            const hasPermission = await requestLocationPermission();
            if (!hasPermission) {
                setLocationStatus('disabled');
                setGeofenceStatus(prev => ({ ...prev, message: '📍 Location permission denied' }));
                return;
            }

            const location = await getCurrentLocation();
            if (location) {
                setCurrentLocation(location);
                setLocationStatus('enabled');
            } else {
                setLocationStatus('disabled');
                setGeofenceStatus(prev => ({ ...prev, message: '📍 Please enable GPS' }));
            }
        } catch (e) {
            console.log('Location error:', e.message);
            setLocationStatus('error');
            setGeofenceStatus(prev => ({ ...prev, message: '📍 Location unavailable - Please enable GPS' }));
        }
    };

    const openLocationSettings = () => {
        if (Platform.OS === 'android') {
            Linking.sendIntent('android.settings.LOCATION_SOURCE_SETTINGS');
        } else {
            Linking.openURL('app-settings:');
        }
    };

    // Filter branches based on search query
    const filteredBranches = branches.filter(branch => {
        const branchName = (branch.name || branch.branchName || '').toLowerCase();
        return branchName.includes(branchSearchQuery.toLowerCase());
    });


    const validateGeofence = async (location, branch) => {
        if (!branch) return;

        // Handle different branch data structures
        const branchLat = branch.latitude || branch.location?.lat || branch.location?.latitude;
        const branchLng = branch.longitude || branch.location?.lng || branch.location?.longitude;
        const branchName = branch.name || branch.branchName;
        const radius = branch.radiusMeters || branch.radius || 100;

        if (!branchLat || !branchLng) {
            setGeofenceStatus({ withinRange: true, distance: 0, allowedRadius: radius, message: 'Geofence not configured' });
            return;
        }

        const result = await validateLocationFast(
            location.latitude,
            location.longitude,
            null,
            {
                latitude: branchLat,
                longitude: branchLng,
                radiusMeters: radius,
                name: branchName
            }
        );

        setGeofenceStatus({
            withinRange: result.withinRange,
            distance: result.distance,
            allowedRadius: result.allowedRadius,
            message: result.withinRange
                ? `✓ Inside ${branchName}`
                : `${result.distance}m from ${branchName} (max ${result.allowedRadius}m)`
        });
    };

    const handleBranchSelect = (branch) => {
        setSelectedBranch(branch);
    };

    const handleLogout = async () => {
        Alert.alert(
            'Logout',
            'Clear your session and return to login?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Logout',
                    style: 'destructive',
                    onPress: async () => {
                        await clearSession();
                        locationTracker.stop();
                        await BackgroundService.stop();
                        navigation.replace('EmployeeId');
                    }
                }
            ]
        );
    };

    const handleRegisterFace = () => {
        if (employee) {
            navigation.navigate('FaceRegistration', { employee });
        }
    };

    const capturePhoto = async () => {
        if (!cameraRef.current) {
            Alert.alert('Error', 'Camera not ready. Please try again.');
            return null;
        }

        try {
            // Small delay to ensure camera is ready
            await new Promise(resolve => setTimeout(resolve, 500));

            const photo = await cameraRef.current.takePhoto({
                qualityPrioritization: 'speed',
                flash: 'off',
                enableShutterSound: false
            });

            console.log('[Camera] Photo captured:', photo.path);

            // Use RNFS for reliable base64 conversion
            const base64Data = await RNFS.readFile(photo.path, 'base64');
            return `data:image/jpeg;base64,${base64Data}`;
        } catch (e) {
            console.error('[Camera] Capture error:', e);
            Alert.alert('Camera Error', `Failed to capture photo: ${e.message || 'Unknown error'}`);
            return null;
        }
    };

    const handleCheckIn = async () => {
        console.log('[AttendanceScreen] handleCheckIn pressed. CameraDevice:', !!device);
        if (!currentLocation) {
            checkLocation();
            Alert.alert('Wait', 'Fetching your location...');
            return;
        }
        if (!selectedBranch) {
            Alert.alert('Select Branch', 'Please tap on a branch first.');
            return;
        }
        if (!geofenceStatus.withinRange) {
            Alert.alert('Out of Range', `You are ${geofenceStatus.distance}m away.\nMax allowed: ${geofenceStatus.allowedRadius}m`);
            return;
        }
        setCameraActive(true);
    };



    const confirmCheckIn = async (imageBase64) => {
        try {
            setLoading(true);
            const res = await checkIn(
                imageBase64,
                currentLocation.latitude,
                currentLocation.longitude,
                selectedBranch?.branchId || selectedBranch?._id,
                employee?.employeeId  // Pass expected employee ID for validation
            );
            if (res.success) {
                await saveSession(res.employee);
                setEmployee(res.employee);
                setStatus({ ...status, isTracking: true });

                // Start location tracker (fail-safe)
                try {
                    console.log('Starting location tracker...');
                    await locationTracker.start();
                } catch (trackErr) {
                    console.error('Tracker Start Error:', trackErr);
                    Alert.alert('Warning', 'Check-in successful, but background tracking failed to start.');
                }

                Alert.alert('Success', `Welcome, ${res.employee.name}!`);
                setCameraActive(false);
                // Refresh status to update attendance data
                await refreshStatus();
            } else {
                Alert.alert('Failed', res.message || 'Check-in failed');
                setCameraActive(false);
            }
        } catch (error) {
            console.error('CheckIn Logic Error:', error);
            const errorMsg = error.response?.data?.message || error.message || 'Check-in failed';

            // Handle "Already checked in" specifically
            if (error.response?.status === 400 && errorMsg.toLowerCase().includes('already checked in')) {
                Alert.alert(
                    'Already Checked In',
                    'It seems you are already checked in. Refreshing your status...',
                    [{
                        text: 'OK',
                        onPress: async () => {
                            setCameraActive(false);
                            await refreshStatus();
                        }
                    }]
                );
            } else {
                Alert.alert('Check-in Error', errorMsg);
                setCameraActive(false);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleCheckOut = () => setCameraActive(true);

    const confirmCheckOut = async (imageBase64) => {
        try {
            setLoading(true);
            const res = await checkOut(imageBase64, employee?.employeeId);

            if (res.success) {
                // 1. Update local state immediately
                setStatus(prev => ({ ...prev, isTracking: false, canResume: false }));

                // Stop location tracker
                try {
                    await locationTracker.stop();
                    // BackgroundService is exported as a singleton instance
                    await BackgroundService.stop();
                } catch (err) {
                    console.error('Error stopping tracker:', err);
                }

                setCameraActive(false);

                // 3. Show Success
                Alert.alert('Checked Out', 'Have a good day!', [
                    {
                        text: 'OK',
                        onPress: () => refreshStatus() // Refresh AFTER alert is closed
                    }
                ]);
            } else {
                Alert.alert('Failed', res.message);
                setCameraActive(false);
            }
        } catch (error) {
            console.error('CheckOut error:', error);
            Alert.alert('Error', error.message || 'Failed to check out');
            setCameraActive(false);
        } finally {
            setLoading(false);
        }
    };

    const handleResumeSession = async () => {
        try {
            setLoading(true);
            const res = await resumeSession(employee.employeeId);
            if (res.success) {
                locationTracker.start();
                refreshStatus();
                Alert.alert('Welcome Back', 'Session resumed.');
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to resume');
        } finally {
            setLoading(false);
        }
    };

    const handleViewDashboard = () => {
        setVerifyingViewAccess(true);
        setCameraActive(true);
    };

    const confirmViewAccess = async (imageBase64) => {
        try {
            setLoading(true);
            const res = await verifyViewAccess(employee?.employeeId, imageBase64);
            if (res.success) {
                setCameraActive(false);
                setVerifyingViewAccess(false);
                navigation.navigate('Dashboard');
            } else {
                Alert.alert('Access Denied', res.message);
                setCameraActive(false);
                setVerifyingViewAccess(false);
            }
        } catch (error) {
            Alert.alert('Error', 'Verification failed');
            setCameraActive(false);
            setVerifyingViewAccess(false);
        } finally {
            setLoading(false);
        }
    };

    const onPhotoCaptured = async () => {
        const base64 = await capturePhoto();
        if (!base64) return;
        if (verifyingViewAccess) {
            confirmViewAccess(base64);
        } else if (status?.isTracking) {
            confirmCheckOut(base64);
        } else {
            confirmCheckIn(base64);
        }
    };

    // Camera View
    if (cameraActive && device) {
        return (
            <View style={StyleSheet.absoluteFill}>
                <Camera
                    ref={cameraRef}
                    style={StyleSheet.absoluteFill}
                    device={device}
                    format={format}
                    isActive={true}
                    photo={true}
                />
                <View style={[styles.cameraOverlay, { paddingBottom: Math.max(insets.bottom, 20) + 20 }]}>
                    <Text style={styles.cameraText}>
                        {verifyingViewAccess ? 'Verify Identity' :
                            status?.isTracking ? 'Selfie to Check Out' : 'Selfie to Check In'}
                    </Text>
                    <TouchableOpacity onPress={onPhotoCaptured} style={styles.captureBtn}>
                        <View style={styles.captureInner} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => { setCameraActive(false); setVerifyingViewAccess(false); }} style={styles.cancelBtn}>
                        <Text style={styles.cancelText}>Cancel</Text>
                    </TouchableOpacity>
                </View>
                {loading && (
                    <View style={styles.loaderOverlay}>
                        <ActivityIndicator size="large" color="#fff" />
                    </View>
                )}
            </View>
        );
    }

    // Main Screen
    return (
        <View style={[styles.safeArea, { paddingTop: insets.top }]}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
            <View style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <Image source={require('../assets/srm-logo.png')} style={styles.logo} resizeMode="contain" />
                    <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
                        <Text style={styles.logoutText}>Logout</Text>
                    </TouchableOpacity>
                </View>

                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refreshAll} />}
                >
                    {/* Big Status Banner */}
                    <View style={[styles.statusBanner, status?.isTracking ? styles.bannerOnline : styles.bannerOffline]}>
                        <View style={[styles.statusStrip, { backgroundColor: status?.isTracking ? '#4CAF50' : '#757575' }]} />
                        <View style={styles.statusContent}>
                            <Text style={styles.statusBannerText}>
                                {status?.isTracking ? 'YOU ARE CHECKED IN' : 'YOU ARE CHECKED OUT'}
                            </Text>
                            <Text style={styles.statusBannerSubText}>
                                {status?.isTracking ? 'Tracking your attendance...' : 'Not tracking currently'}
                            </Text>
                        </View>
                        <TouchableOpacity
                            onPress={() => navigation.navigate('AttendanceDetails')}
                            style={{ padding: 10, alignSelf: 'center', marginRight: 10 }}
                        >
                            <Icon name="event-note" size={24} color="#FFF" />
                        </TouchableOpacity>
                    </View>

                    {/* User Card with Photo */}
                    <View style={styles.card}>
                        <View style={styles.userRow}>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                {employee?.photoUrl ? (
                                    <Image
                                        source={{ uri: employee.photoUrl }}
                                        style={styles.userPhoto}
                                        onError={(e) => console.log('Photo load error:', e.nativeEvent.error)}
                                    />
                                ) : (
                                    <View style={[styles.userPhoto, styles.userPhotoPlaceholder]}>
                                        <Text style={styles.userPhotoText}>{employee?.name?.[0] || 'E'}</Text>
                                    </View>
                                )}
                                <View style={{ marginLeft: 12 }}>
                                    <Text style={styles.welcomeLabel}>Welcome,</Text>
                                    <Text style={styles.userName}>{employee?.name || 'Employee'}</Text>
                                    <Text style={styles.userId}>ID: {employee?.employeeId} • {employee?.department}</Text>

                                    {/* Debug/Setup Button */}
                                    <TouchableOpacity
                                        onPress={async () => {
                                            try {
                                                console.log('[Debug] Requesting permissions...');
                                                const settings = await notifee.requestPermission();
                                                console.log('[Debug] Notification Perm:', settings.authorizationStatus);

                                                if (settings.authorizationStatus >= 1) {
                                                    Alert.alert('Notifications', 'Permission GRANTED.');
                                                } else {
                                                    Alert.alert('Notifications', 'Permission DENIED. Please enable in Settings.');
                                                }

                                                Alert.alert(
                                                    'Battery Optimization',
                                                    'Opening settings now. Please find this app and select "Don\'t Optimize".',
                                                    [
                                                        { text: 'OK', onPress: () => notifee.openBatteryOptimizationSettings() }
                                                    ]
                                                );

                                                // Try starting service
                                                await BackgroundService.start();

                                            } catch (e) {
                                                Alert.alert('Error', e.message);
                                            }
                                        }}
                                        style={{ marginTop: 8, padding: 8, backgroundColor: '#eee', borderRadius: 4, alignSelf: 'flex-start' }}
                                    >
                                        <Text style={{ fontSize: 10, color: '#333' }}>⚠️ Fix Background Perms</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                        <Text style={styles.dateText}>Date: {new Date().toLocaleDateString()}</Text>
                        <Text style={styles.durationText}>⏱ Work Duration: {todayDuration}</Text>

                        {/* Request Button */}
                        <TouchableOpacity
                            style={styles.requestButton}
                            onPress={() => navigation.navigate('Requests')}
                        >
                            <Text style={styles.requestButtonText}>📝 Apply Request (Leave/One hour/Advance)</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Auto-checkout Warning */}
                    {status?.autoCheckedOut && !status?.isTracking && (
                        <View style={styles.warningCard}>
                            <Text style={styles.warningText}>⚠️ Session paused due to inactivity</Text>
                        </View>
                    )}

                    {/* REGISTER FACE PROMPT */}
                    {!employee?.faceId && (
                        <View style={styles.registerCard}>
                            <Text style={styles.registerTitle}>Face Not Registered</Text>
                            <Text style={styles.registerDesc}>You must register your face before marking attendance.</Text>
                            <TouchableOpacity style={styles.registerBtn} onPress={handleRegisterFace}>
                                <Text style={styles.registerBtnText}>Register My Face</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* ACTION BUTTONS - MUTUALLY EXCLUSIVE */}
                    <View style={styles.actionsContainer}>
                        {employee?.faceId ? (
                            <>
                                {/* CHECK IN BUTTON - Only show if NOT tracking */}
                                {!status?.isTracking && (
                                    <>
                                        {/* Location Status - Show Enable Button if GPS Disabled */}
                                        {(locationStatus === 'disabled' || locationStatus === 'error') && (
                                            <View style={styles.locationWarningCard}>
                                                <Text style={styles.locationWarningText}>
                                                    📍 Location is required for check-in
                                                </Text>
                                                <TouchableOpacity
                                                    style={styles.enableLocationBtn}
                                                    onPress={openLocationSettings}
                                                >
                                                    <Text style={styles.enableLocationBtnText}>Enable Location</Text>
                                                </TouchableOpacity>
                                            </View>
                                        )}

                                        {/* BRANCH SELECTION - Searchable Dropdown */}
                                        <View style={styles.sectionCard}>
                                            <Text style={styles.sectionTitle}>Select Branch to Check-In</Text>
                                            {loadingBranches ? (
                                                <ActivityIndicator size="small" color={COLORS.primary} style={{ marginVertical: 10 }} />
                                            ) : branches.length === 0 ? (
                                                <Text style={styles.emptyText}>No branches found.</Text>
                                            ) : (
                                                <View>
                                                    {/* Search Input */}
                                                    <View style={styles.branchSearchContainer}>
                                                        <TextInput
                                                            style={styles.branchSearchInput}
                                                            placeholder="🔍 Type to search branches..."
                                                            placeholderTextColor="#999"
                                                            value={branchSearchQuery}
                                                            onChangeText={(text) => {
                                                                setBranchSearchQuery(text);
                                                                setShowBranchDropdown(true);
                                                            }}
                                                            onFocus={() => setShowBranchDropdown(true)}
                                                        />
                                                    </View>

                                                    {/* Selected Branch Display */}
                                                    {selectedBranch && !showBranchDropdown && (
                                                        <TouchableOpacity
                                                            style={styles.selectedBranchDisplay}
                                                            onPress={() => setShowBranchDropdown(true)}
                                                        >
                                                            <Text style={styles.selectedBranchText}>
                                                                ✓ {selectedBranch.name || selectedBranch.branchName}
                                                            </Text>
                                                            <Text style={styles.changeBranchText}>Tap to change</Text>
                                                        </TouchableOpacity>
                                                    )}

                                                    {/* Dropdown List */}
                                                    {showBranchDropdown && (
                                                        <View style={styles.branchDropdown}>
                                                            <ScrollView
                                                                style={{ maxHeight: 200 }}
                                                                nestedScrollEnabled={true}
                                                                showsVerticalScrollIndicator={true}
                                                            >
                                                                {filteredBranches.length === 0 ? (
                                                                    <Text style={styles.noResultsText}>No branches match your search</Text>
                                                                ) : (
                                                                    filteredBranches.map((branch, idx) => {
                                                                        const branchName = branch.name || branch.branchName;
                                                                        const branchId = branch.branchId || branch._id;
                                                                        const isSelected = selectedBranch?.branchId === branchId || selectedBranch?._id === branchId;
                                                                        return (
                                                                            <TouchableOpacity
                                                                                key={branchId || idx}
                                                                                style={[styles.branchDropdownItem, isSelected && styles.branchDropdownItemSelected]}
                                                                                onPress={() => {
                                                                                    handleBranchSelect(branch);
                                                                                    setBranchSearchQuery('');
                                                                                    setShowBranchDropdown(false);
                                                                                }}
                                                                            >
                                                                                <Text style={[styles.branchDropdownItemText, isSelected && styles.branchDropdownItemTextSelected]}>
                                                                                    {isSelected ? '✓ ' : ''}{branchName}
                                                                                </Text>
                                                                            </TouchableOpacity>
                                                                        );
                                                                    })
                                                                )}
                                                            </ScrollView>
                                                        </View>
                                                    )}
                                                </View>
                                            )}
                                        </View>

                                        {/* Location Status */}
                                        <View style={{ marginBottom: 15 }}>
                                            <Text style={[styles.geoMessage, { color: geofenceStatus.withinRange ? 'green' : '#d32', textAlign: 'center' }]}>
                                                {geofenceStatus.message}
                                            </Text>
                                        </View>

                                        <TouchableOpacity
                                            style={[styles.mainBtn, styles.checkInBtn]}
                                            onPress={handleCheckIn}
                                            disabled={loading}
                                        >
                                            <Text style={styles.mainBtnText}>Check In</Text>
                                        </TouchableOpacity>
                                    </>
                                )}

                                {/* CHECK OUT BUTTON - Only show if TRACKING */}
                                {status?.isTracking && (
                                    <View>
                                        <View style={{ marginBottom: 20, alignItems: 'center' }}>
                                            <Text style={{ fontSize: 16, color: '#28a745', fontWeight: 'bold' }}>
                                                Currently Working at {selectedBranch?.name || selectedBranch?.branchName || 'Branch'}
                                            </Text>
                                        </View>
                                        <TouchableOpacity
                                            style={[styles.mainBtn, styles.checkOutBtn]}
                                            onPress={handleCheckOut}
                                            disabled={loading}
                                        >
                                            <Text style={styles.mainBtnText}>Check Out</Text>
                                        </TouchableOpacity>
                                    </View>
                                )}

                            </>
                        ) : (
                            <Text style={{ textAlign: 'center', color: '#999', marginVertical: 20 }}>
                                Loading...
                            </Text>
                        )}
                    </View>
                </ScrollView>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    container: {
        flex: 1,
        backgroundColor: '#F5F5F5',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 20,
        paddingBottom: 15,
        backgroundColor: '#FFFFFF',
        elevation: 0, // Flat look as per image
        borderBottomWidth: 1,
        borderBottomColor: '#EEEEEE',
    },
    logo: {
        width: 80,
        height: 40,
        resizeMode: 'contain',
    },
    logoutBtn: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        backgroundColor: '#FFEBEE', // Pale Red
        borderRadius: 0,
    },
    logoutText: {
        color: '#D32F2F', // Dark Red
        fontSize: 14,
        fontWeight: '600',
        fontFamily: 'Poppins-Medium',
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 40,
    },
    statusBanner: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        borderRadius: 0,
        overflow: 'hidden',
        marginBottom: 16,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        minHeight: 80,
    },
    bannerOnline: {
        backgroundColor: '#E8F5E9', // Light Green
    },
    bannerOffline: {
        backgroundColor: '#EEEEEE', // Light Grey
    },
    statusStrip: {
        width: 6,
        height: '100%',
    },
    statusContent: {
        flex: 1,
        padding: 16,
        justifyContent: 'center',
    },
    statusBannerText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2E7D32',
        fontFamily: 'Poppins-Bold',
        marginBottom: 4,
        textTransform: 'uppercase',
    },
    statusBannerSubText: {
        fontSize: 14,
        color: '#555555',
        fontFamily: 'Poppins-Regular',
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 0,
        padding: 16,
        marginBottom: 16,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    userRow: {
        marginBottom: 16,
    },
    userPhoto: {
        width: 60,
        height: 60,
        borderRadius: 0, // Square as requested
        backgroundColor: '#ddd',
    },
    userPhotoPlaceholder: {
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#EF4136',
    },
    userPhotoText: {
        fontSize: 24,
        color: '#FFF',
        fontWeight: 'bold',
    },
    welcomeLabel: {
        fontSize: 12,
        color: '#757575',
        fontFamily: 'Poppins-Regular',
    },
    userName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#000000',
        fontFamily: 'Poppins-Bold',
    },
    userId: {
        fontSize: 12,
        color: '#757575',
        marginTop: 2,
        fontFamily: 'Poppins-Regular',
    },
    dateText: {
        fontSize: 14,
        color: '#757575',
        marginBottom: 8,
        fontFamily: 'Poppins-Regular',
    },
    durationText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#D32F2F', // Red as per image
        fontFamily: 'Poppins-Bold',
        marginBottom: 16,
    },
    requestButton: {
        backgroundColor: '#2196F3', // Blue
        paddingVertical: 14,
        borderRadius: 0,
        alignItems: 'center',
        marginTop: 8,
    },
    requestButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
        fontFamily: 'Poppins-SemiBold',
    },
    // Action Buttons
    actionsContainer: {
        marginBottom: 30,
    },
    mainBtn: {
        paddingVertical: 18,
        borderRadius: 0,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    mainBtnText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: 1,
        fontFamily: 'Poppins-Bold',
    },
    checkInBtn: {
        backgroundColor: '#4CAF50', // Green
    },
    checkOutBtn: {
        backgroundColor: '#D32F2F', // Red
    },
    disabledBtn: {
        backgroundColor: '#BDBDBD',
    },
    warningCard: {
        backgroundColor: '#FFF3E0',
        padding: 16,
        borderRadius: 0,
        borderLeftWidth: 4,
        borderLeftColor: '#FF9800',
        marginBottom: 16,
    },
    warningText: {
        color: '#E65100',
        fontSize: 14,
        fontFamily: 'Poppins-Regular',
    },
    registerCard: {
        backgroundColor: '#FFF',
        padding: 24,
        borderRadius: 0,
        alignItems: 'center',
        marginVertical: 20,
        borderWidth: 1,
        borderColor: '#eee',
    },
    registerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 8,
        color: '#333',
    },
    registerDesc: {
        textAlign: 'center',
        color: '#666',
        marginBottom: 20,
    },
    registerBtn: {
        backgroundColor: '#EF4136',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 0,
    },
    registerBtnText: {
        color: '#FFF',
        fontWeight: 'bold',
    },
    locationWarningCard: {
        backgroundColor: '#FFEBEE',
        padding: 16,
        borderRadius: 0,
        marginBottom: 16,
        alignItems: 'center',
    },
    locationWarningText: {
        color: '#D32F2F',
        marginBottom: 10,
        fontWeight: '500',
    },
    enableLocationBtn: {
        backgroundColor: '#FFF',
        borderWidth: 1,
        borderColor: '#D32F2F',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 0,
    },
    enableLocationBtnText: {
        color: '#D32F2F',
        fontWeight: '600',
    },
    sectionCard: {
        backgroundColor: '#FFF',
        borderRadius: 0,
        padding: 16,
        marginBottom: 16,
        elevation: 2,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 12,
        color: '#333',
    },
    branchSearchContainer: {
        marginBottom: 10,
    },
    branchSearchInput: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 0,
        padding: 12,
        fontSize: 15,
        color: '#000',
        backgroundColor: '#F9F9F9',
    },
    selectedBranchDisplay: {
        padding: 12,
        backgroundColor: '#E3F2FD',
        borderLeftWidth: 4,
        borderLeftColor: '#2196F3',
        marginBottom: 10,
    },
    selectedBranchText: {
        color: '#1565C0',
        fontSize: 16,
        fontWeight: '600',
    },
    changeBranchText: {
        color: '#1976D2',
        fontSize: 12,
        marginTop: 4,
    },
    branchDropdown: {
        maxHeight: 200,
        borderWidth: 1,
        borderColor: '#EEE',
        borderRadius: 0,
    },
    branchDropdownItem: {
        padding: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    branchDropdownItemSelected: {
        backgroundColor: '#E3F2FD',
    },
    branchDropdownItemText: {
        fontSize: 15,
        color: '#333',
    },
    branchDropdownItemTextSelected: {
        color: '#1565C0',
        fontWeight: '600',
    },
    noResultsText: {
        padding: 15,
        textAlign: 'center',
        color: '#888',
        fontStyle: 'italic',
    },
    geoMessage: {
        fontSize: 14,
        fontWeight: '500',
        marginTop: 5,
    },
    // Camera Overlay Style
    cameraOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        alignItems: 'center',
        paddingTop: 20,
        backgroundColor: 'rgba(0,0,0,0.6)',
        borderTopLeftRadius: 0, // No border radius
        borderTopRightRadius: 0, // No border radius
    },
    cameraText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 30,
    },
    captureBtn: {
        width: 80,
        height: 80,
        borderRadius: 0, // No border radius (Square button)
        borderWidth: 4,
        borderColor: '#FFF',
        backgroundColor: 'rgba(255,255,255,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    captureInner: {
        width: 60,
        height: 60,
        borderRadius: 0, // No border radius
        backgroundColor: '#FFF',
    },
    cancelBtn: {
        marginBottom: 10,
        padding: 10,
    },
    cancelText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '500',
    },
    loaderOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 999,
    },
    emptyText: {
        textAlign: 'center',
        color: '#999',
        marginVertical: 10,
    }
});

export default AttendanceScreen;
