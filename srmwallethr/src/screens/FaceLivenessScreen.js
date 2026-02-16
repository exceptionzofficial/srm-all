/**
 * Face Liveness Screen - Custom Camera-Based Liveness Check
 * Uses blink detection to verify the user is real (not a photo)
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
    SafeAreaView,
    StatusBar,
} from 'react-native';
import {
    Camera,
    useCameraDevice,
    useCameraPermission,
    useCameraFormat,
} from 'react-native-vision-camera';
import RNFS from 'react-native-fs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getGcpUploadUrls, gcpAnalyzeLiveness } from '../services/api';
import { COLORS } from '../utils/theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

/**
 * Custom Face Liveness Detection Screen
 * 
 * Flow:
 * 1. Show camera with instruction "Blink your eyes 3 times"
 * 2. Capture multiple photos over 3 seconds
 * 3. Send to backend for blink detection analysis
 * 4. If blinks detected, user is real; if not, it's a photo
 */
const FaceLivenessScreen = ({ route, navigation }) => {
    const { employee, onLivenessComplete } = route.params || {};
    const cameraRef = useRef(null);
    const insets = useSafeAreaInsets();

    const [status, setStatus] = useState('ready'); // ready, capturing, analyzing, success, failed
    const [progress, setProgress] = useState(0);
    const [instruction, setInstruction] = useState('');
    const [capturedPhotos, setCapturedPhotos] = useState([]);
    const [loading, setLoading] = useState(false);
    const [countdown, setCountdown] = useState(null);
    const [result, setResult] = useState(null);

    const device = useCameraDevice('front');
    const format = useCameraFormat(device, [
        { photoResolution: { width: 480, height: 640 } }
    ]);
    const { hasPermission, requestPermission } = useCameraPermission();
    const [cameraError, setCameraError] = useState(null);
    const [isCameraReady, setIsCameraReady] = useState(false);

    useEffect(() => {
        if (!hasPermission) {
            requestPermission();
        }
    }, [hasPermission]);

    // Handle camera errors
    const onCameraError = useCallback((error) => {
        console.log('[Liveness] Camera error:', error.code, error.message);
        setCameraError(error.message);
    }, []);

    // Handle camera initialization
    const onCameraInitialized = useCallback(() => {
        console.log('[Liveness] Camera initialized');
        setIsCameraReady(true);
    }, []);

    // Start the liveness capture process
    const startLivenessCheck = useCallback(async () => {
        if (!cameraRef.current) {
            Alert.alert('Error', 'Camera not ready');
            return;
        }

        setStatus('capturing');
        setInstruction('👁️ BLINK YOUR EYES 3 TIMES');
        setCapturedPhotos([]);
        setProgress(0);

        // Countdown before starting
        setCountdown(3);
        await new Promise(r => setTimeout(r, 1000));
        setCountdown(2);
        await new Promise(r => setTimeout(r, 1000));
        setCountdown(1);
        await new Promise(r => setTimeout(r, 1000));
        setCountdown(null);

        // Give camera a moment to stabilize
        await new Promise(r => setTimeout(r, 200));

        // Capture 2 photos 1 second apart
        const photoPaths = []; // Store file paths, not base64
        const totalPhotos = 2;
        const intervalMs = 1000;

        for (let i = 0; i < totalPhotos; i++) {
            try {
                console.log(`[Liveness] Taking photo ${i + 1}/${totalPhotos}...`);
                const photo = await cameraRef.current.takePhoto({
                    qualityPrioritization: 'speed',
                    flash: 'off',
                });

                console.log(`[Liveness] Photo ${i + 1} taken: ${photo.path}`);
                photoPaths.push(photo.path); // Store path, not base64

                // Update progress
                setProgress(((i + 1) / totalPhotos) * 100);

                // Wait for next capture
                if (i < totalPhotos - 1) {
                    await new Promise(r => setTimeout(r, intervalMs));
                }
            } catch (error) {
                console.error(`[Liveness] Error capturing photo ${i + 1}:`, error.message);
            }
        }

        console.log(`[Liveness] Total photos captured: ${photoPaths.length}`);

        if (photoPaths.length < 2) {
            setStatus('failed');
            setInstruction('❌ Not enough photos captured');
            setResult({ isLive: false, message: 'Camera failed to capture enough photos' });
            return;
        }

        setInstruction('Analyzing...');
        setStatus('analyzing');

        // Send to backend for analysis using file paths
        console.log(`[Liveness] Sending ${photoPaths.length} photos to backend...`);
        await analyzeLiveness(photoPaths);
    }, []);

    // Analyze captured photos using S3 upload flow (bypasses payload limit)
    const analyzeLiveness = async (photoFiles) => {
        setLoading(true);

        try {
            // Step 1: Get signed URLs for uploading to GCP
            console.log('[Liveness] Getting GCP upload URLs...');
            setInstruction('Getting upload URLs...');
            const urlsResponse = await getGcpUploadUrls(photoFiles.length);

            if (!urlsResponse.success) {
                throw new Error(urlsResponse.message || 'Failed to get upload URLs');
            }

            const { sessionId, uploadUrls, gcsKeys } = urlsResponse;
            console.log(`[Liveness] Got ${uploadUrls.length} GCP signed URLs for session ${sessionId}`);

            // Step 2: Upload photos to GCS using signed URLs
            // Use fetch with file:// URI to read file as blob (memory efficient)
            setInstruction('Uploading photos...');
            for (let i = 0; i < photoFiles.length; i++) {
                console.log(`[Liveness] Uploading photo ${i + 1} to GCS...`);

                try {
                    // Read file as blob using fetch
                    const filePath = photoFiles[i].startsWith('file://')
                        ? photoFiles[i]
                        : `file://${photoFiles[i]}`;

                    const fileResponse = await fetch(filePath);
                    const fileBlob = await fileResponse.blob();
                    console.log(`[Liveness] Photo ${i + 1} blob size: ${(fileBlob.size / 1024).toFixed(1)} KB`);

                    // Upload blob to GCS
                    const uploadResponse = await fetch(uploadUrls[i], {
                        method: 'PUT',
                        body: fileBlob,
                        headers: {
                            'Content-Type': 'image/jpeg',
                        },
                    });

                    if (!uploadResponse.ok) {
                        throw new Error(`GCS upload failed: ${uploadResponse.status}`);
                    }

                    console.log(`[Liveness] Photo ${i + 1} uploaded to GCS successfully`);
                } catch (uploadError) {
                    console.error(`[Liveness] Upload error:`, uploadError);
                    throw new Error(`Failed to upload photo ${i + 1}: ${uploadError.message}`);
                }

                setProgress(((i + 1) / photoFiles.length) * 100);
            }

            // Step 3: Call GCP analyze endpoint with Vision API
            console.log('[Liveness] Analyzing photos with GCP Vision API...');
            setInstruction('Analyzing...');
            const analysisResponse = await gcpAnalyzeLiveness(sessionId, gcsKeys);

            console.log('[Liveness] API Response:', JSON.stringify(analysisResponse, null, 2));

            if (analysisResponse.success && analysisResponse.isLive) {
                setResult({
                    isLive: true,
                    confidence: analysisResponse.confidence,
                });
                setStatus('success');
                setInstruction('✅ Liveness Verified!');

                // Call callback and navigate back immediately
                if (onLivenessComplete) {
                    onLivenessComplete({
                        success: true,
                        isLive: true,
                        isVerified: true,
                    });
                }

                // Navigate back after a short delay to show success message
                setTimeout(() => {
                    navigation.goBack();
                }, 1500);
            } else {
                setResult({
                    isLive: false,
                    message: analysisResponse.message || 'Liveness check failed',
                });
                setStatus('failed');
                setInstruction('❌ Liveness Check Failed');
            }
        } catch (error) {
            console.error('[Liveness] Analysis error:', error);
            setStatus('failed');
            setResult({
                isLive: false,
                message: error.message || 'Analysis failed',
            });
            setInstruction('❌ Analysis Failed');
        } finally {
            setLoading(false);
        }
    };

    // Render camera or result
    const renderContent = () => {
        if (!hasPermission) {
            return (
                <View style={styles.centerContent}>
                    <Text style={styles.messageText}>Camera permission required</Text>
                    <TouchableOpacity style={styles.primaryButton} onPress={requestPermission}>
                        <Text style={styles.primaryButtonText}>Grant Permission</Text>
                    </TouchableOpacity>
                </View>
            );
        }

        if (!device) {
            return (
                <View style={styles.centerContent}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                    <Text style={styles.messageText}>Loading camera...</Text>
                </View>
            );
        }

        return (
            <View style={styles.cameraContainer}>
                {/* Camera View */}
                <Camera
                    ref={cameraRef}
                    style={styles.camera}
                    device={device}
                    format={format}
                    isActive={status === 'ready' || status === 'capturing'}
                    photo={true}
                    onError={onCameraError}
                    onInitialized={onCameraInitialized}
                    outputOrientation="device"
                />

                {/* Overlay */}
                <View style={styles.overlay}>
                    {/* Face guide circle */}
                    <View style={styles.faceGuide}>
                        <View style={styles.faceCircle} />
                    </View>

                    {/* Countdown */}
                    {countdown !== null && (
                        <View style={styles.countdownContainer}>
                            <Text style={styles.countdownText}>{countdown}</Text>
                        </View>
                    )}

                    {/* Instructions */}
                    <View style={styles.instructionContainer}>
                        <Text style={styles.instructionText}>{instruction || 'Position your face in the circle'}</Text>

                        {/* Progress bar during capture */}
                        {status === 'capturing' && (
                            <View style={styles.progressContainer}>
                                <View style={[styles.progressBar, { width: `${progress}%` }]} />
                            </View>
                        )}

                        {/* Analyzing indicator */}
                        {status === 'analyzing' && (
                            <ActivityIndicator size="large" color="#FFFFFF" style={styles.loader} />
                        )}
                    </View>

                    {/* Result message */}
                    {(status === 'success' || status === 'failed') && (
                        <View style={[
                            styles.resultContainer,
                            status === 'success' ? styles.successResult : styles.failedResult
                        ]}>
                            <Text style={styles.resultIcon}>
                                {status === 'success' ? '✅' : '❌'}
                            </Text>
                            <Text style={styles.resultText}>
                                {status === 'success'
                                    ? `Liveness Verified! (${result?.blinksDetected || 0} blinks detected)`
                                    : result?.message || 'Liveness check failed'}
                            </Text>
                        </View>
                    )}
                </View>

                {/* Bottom controls */}
                <View style={[styles.bottomControls, { bottom: Math.max(insets.bottom, 20) + 20 }]}>
                    {status === 'ready' && (
                        <TouchableOpacity
                            style={styles.startButton}
                            onPress={startLivenessCheck}>
                            <Text style={styles.startButtonText}>Start Liveness Check</Text>
                        </TouchableOpacity>
                    )}

                    {status === 'failed' && (
                        <>
                            <TouchableOpacity
                                style={styles.retryButton}
                                onPress={() => {
                                    setStatus('ready');
                                    setInstruction('');
                                    setResult(null);
                                    setProgress(0);
                                }}>
                                <Text style={styles.retryButtonText}>Try Again</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.cancelButton}
                                onPress={() => navigation.goBack()}>
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>
                        </>
                    )}
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#000000" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}>
                    <Text style={styles.backButtonText}>← Back</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Face Liveness Check</Text>
                <View style={{ width: 60 }} />
            </View>

            {/* Content */}
            {renderContent()}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000000',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#000000',
    },
    backButton: {
        padding: 8,
    },
    backButtonText: {
        fontSize: 16,
        color: '#FFFFFF',
        fontFamily: 'Poppins-Medium',
    },
    headerTitle: {
        fontSize: 18,
        color: '#FFFFFF',
        fontWeight: '600',
        fontFamily: 'Poppins-SemiBold',
    },
    centerContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    messageText: {
        fontSize: 16,
        color: '#FFFFFF',
        textAlign: 'center',
        marginBottom: 24,
        fontFamily: 'Poppins-Regular',
    },
    cameraContainer: {
        flex: 1,
        position: 'relative',
    },
    camera: {
        flex: 1,
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
    },
    faceGuide: {
        position: 'absolute',
        top: '15%',
        alignItems: 'center',
    },
    faceCircle: {
        width: 250,
        height: 300,
        borderRadius: 125,
        borderWidth: 3,
        borderColor: '#FFFFFF',
        borderStyle: 'dashed',
    },
    countdownContainer: {
        position: 'absolute',
        top: '40%',
        backgroundColor: 'rgba(0,0,0,0.7)',
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
    },
    countdownText: {
        fontSize: 48,
        color: '#FFFFFF',
        fontWeight: 'bold',
        fontFamily: 'Poppins-Bold',
    },
    instructionContainer: {
        position: 'absolute',
        bottom: 180,
        left: 20,
        right: 20,
        alignItems: 'center',
    },
    instructionText: {
        fontSize: 22,
        color: '#FFFFFF',
        fontWeight: '700',
        textAlign: 'center',
        backgroundColor: 'rgba(0,0,0,0.7)',
        paddingHorizontal: 20,
        paddingVertical: 12,
        fontFamily: 'Poppins-Bold',
    },
    progressContainer: {
        marginTop: 16,
        width: '80%',
        height: 8,
        backgroundColor: 'rgba(255,255,255,0.3)',
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressBar: {
        height: '100%',
        backgroundColor: COLORS.primary,
    },
    loader: {
        marginTop: 16,
    },
    resultContainer: {
        position: 'absolute',
        top: '45%',
        left: 20,
        right: 20,
        padding: 20,
        borderRadius: 12,
        alignItems: 'center',
    },
    successResult: {
        backgroundColor: 'rgba(46, 125, 50, 0.9)',
    },
    failedResult: {
        backgroundColor: 'rgba(198, 40, 40, 0.9)',
    },
    resultIcon: {
        fontSize: 48,
        marginBottom: 12,
    },
    resultText: {
        fontSize: 16,
        color: '#FFFFFF',
        textAlign: 'center',
        fontFamily: 'Poppins-Medium',
    },
    bottomControls: {
        position: 'absolute',
        bottom: 40,
        left: 0,
        right: 0,
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    startButton: {
        backgroundColor: COLORS.primary,
        paddingHorizontal: 40,
        paddingVertical: 16,
        borderRadius: 30,
        width: '100%',
        alignItems: 'center',
    },
    startButtonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '600',
        fontFamily: 'Poppins-SemiBold',
    },
    retryButton: {
        backgroundColor: COLORS.primary,
        paddingHorizontal: 40,
        paddingVertical: 16,
        borderRadius: 30,
        width: '100%',
        alignItems: 'center',
        marginBottom: 12,
    },
    retryButtonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '600',
        fontFamily: 'Poppins-SemiBold',
    },
    cancelButton: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 40,
        paddingVertical: 14,
        borderRadius: 30,
        width: '100%',
        alignItems: 'center',
    },
    cancelButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontFamily: 'Poppins-Medium',
    },
    primaryButton: {
        backgroundColor: COLORS.primary,
        paddingHorizontal: 30,
        paddingVertical: 14,
        borderRadius: 8,
    },
    primaryButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
        fontFamily: 'Poppins-SemiBold',
    },
});

export default FaceLivenessScreen;
