import React, { useState } from 'react';
import {
    View, Text, StyleSheet, TextInput, TouchableOpacity,
    StatusBar, Alert, ActivityIndicator, Image, ScrollView
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
// import LinearGradient from 'react-native-linear-gradient';
import { verifyOTP, resetPassword } from '../services/api';
import { COLORS, FONT_FAMILY } from '../utils/theme';

const ResetPasswordScreen = ({ navigation, route }) => {
    const insets = useSafeAreaInsets();
    const { email } = route.params || {};

    const [otp, setOtp] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [isOtpVerified, setIsOtpVerified] = useState(false);

    const handleVerifyOTP = async () => {
        if (!otp.trim()) {
            Alert.alert('Error', 'Please enter the 6-digit OTP sent to your email');
            return;
        }

        setLoading(true);
        try {
            const response = await verifyOTP(email, otp.trim());
            if (response.success) {
                setIsOtpVerified(true);
                Alert.alert('Verified', 'OTP verified successfully. Now set your new password.');
            } else {
                Alert.alert('Error', response.message || 'Invalid OTP');
            }
        } catch (error) {
            Alert.alert('Error', 'OTP verification failed');
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async () => {
        if (password.length < 6) {
            Alert.alert('Error', 'Password must be at least 6 characters long');
            return;
        }
        if (password !== confirmPassword) {
            Alert.alert('Error', 'Passwords do not match');
            return;
        }

        setLoading(true);
        try {
            const response = await resetPassword(email, password);
            if (response.success) {
                Alert.alert('Success', 'Password reset successfully. You can now login.');
                navigation.navigate('Login');
            } else {
                Alert.alert('Error', response.message || 'Failed to reset password');
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to update password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={{ flexGrow: 1 }}>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
            <View
                style={[styles.header, { backgroundColor: COLORS.primary }]}
            >
                <View style={[styles.headerContent, { paddingTop: insets.top }]}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                    >
                        <Icon name="arrow-back" size={24} color="#FFF" />
                    </TouchableOpacity>
                    <Text style={styles.title}>Reset Password</Text>
                    <Text style={styles.subtitle}>Verify OTP and set new password</Text>
                </View>
            </View>

            <View style={styles.formContainer}>
                {!isOtpVerified ? (
                    <>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Enter 6-Digit OTP</Text>
                            <View style={styles.inputWrapper}>
                                <Icon name="vpn-key" size={20} color={COLORS.textLight} style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="000000"
                                    placeholderTextColor={COLORS.textLight}
                                    value={otp}
                                    onChangeText={setOtp}
                                    keyboardType="number-pad"
                                    maxLength={6}
                                />
                            </View>
                            <Text style={styles.hint}>Check your email: {email}</Text>
                        </View>

                        <TouchableOpacity
                            style={styles.actionButton}
                            onPress={handleVerifyOTP}
                            disabled={loading}
                        >
                            {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.actionButtonText}>Verify OTP</Text>}
                        </TouchableOpacity>
                    </>
                ) : (
                    <>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>New Password</Text>
                            <View style={styles.inputWrapper}>
                                <Icon name="lock" size={20} color={COLORS.textLight} style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Enter new password"
                                    placeholderTextColor={COLORS.textLight}
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry={!showPassword}
                                />
                                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                    <Icon name={showPassword ? "visibility" : "visibility-off"} size={20} color={COLORS.textLight} />
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Confirm New Password</Text>
                            <View style={styles.inputWrapper}>
                                <Icon name="lock" size={20} color={COLORS.textLight} style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Confirm new password"
                                    placeholderTextColor={COLORS.textLight}
                                    value={confirmPassword}
                                    onChangeText={setConfirmPassword}
                                    secureTextEntry={!showPassword}
                                />
                            </View>
                        </View>

                        <TouchableOpacity
                            style={styles.actionButton}
                            onPress={handleResetPassword}
                            disabled={loading}
                        >
                            {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.actionButtonText}>Update Password</Text>}
                        </TouchableOpacity>
                    </>
                )}
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFFFFF' },
    header: {
        paddingVertical: 40,
        borderBottomLeftRadius: 40,
        borderBottomRightRadius: 40,
        alignItems: 'center',
    },
    headerContent: { alignItems: 'center' },
    backButton: { position: 'absolute', left: -80, top: 0, padding: 10 },
    title: { fontSize: 24, fontFamily: FONT_FAMILY.bold, color: '#FFF' },
    subtitle: { fontSize: 14, color: 'rgba(255,255,255,0.9)', fontFamily: FONT_FAMILY.regular },
    formContainer: { padding: 32, paddingTop: 40 },
    inputGroup: { marginBottom: 24 },
    label: { fontSize: 14, color: COLORS.textSecondary, marginBottom: 10, fontFamily: FONT_FAMILY.semiBold },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F5F5F5',
        borderRadius: 16,
        paddingHorizontal: 16,
        height: 56,
        borderWidth: 1,
        borderColor: '#EEEEEE',
    },
    inputIcon: { marginRight: 12 },
    input: { flex: 1, fontSize: 16, color: COLORS.textPrimary, fontFamily: FONT_FAMILY.regular },
    hint: { marginTop: 8, fontSize: 12, color: COLORS.textLight, textAlign: 'center' },
    actionButton: {
        backgroundColor: COLORS.primary,
        borderRadius: 16,
        height: 56,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
    },
    actionButtonText: { color: '#FFF', fontSize: 18, fontFamily: FONT_FAMILY.bold },
});

export default ResetPasswordScreen;
