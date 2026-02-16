import React, { useState } from 'react';
import {
    View, Text, StyleSheet, TextInput, TouchableOpacity,
    StatusBar, Alert, ActivityIndicator, Image
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
// import LinearGradient from 'react-native-linear-gradient';
import { forgotPassword } from '../services/api';
import { COLORS, FONT_FAMILY } from '../utils/theme';

const ForgotPasswordScreen = ({ navigation }) => {
    const insets = useSafeAreaInsets();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSendOTP = async () => {
        if (!email.trim()) {
            Alert.alert('Error', 'Please enter your registered Email Address');
            return;
        }

        setLoading(true);
        try {
            const response = await forgotPassword(email.trim());
            if (response.success) {
                Alert.alert('Success', 'Verification OTP has been sent to your email.');
                navigation.navigate('ResetPassword', { email: email.trim() });
            } else {
                Alert.alert('Error', response.message || 'Failed to send OTP. Please try again.');
            }
        } catch (error) {
            console.log('Forgot Password Error:', error);
            Alert.alert('Error', 'Something went wrong. Please check your connection and try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
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
                    <View style={styles.logoContainer}>
                        <Image
                            source={require('../assets/images/logo.png')}
                            style={styles.logo}
                            resizeMode="contain"
                        />
                    </View>
                    <Text style={styles.title}>Forgot Password</Text>
                    <Text style={styles.subtitle}>Enter your email to receive an OTP</Text>
                </View>
            </View>

            <View style={styles.formContainer}>
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Email Address</Text>
                    <View style={styles.inputWrapper}>
                        <Icon name="email" size={20} color={COLORS.textLight} style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Enter your registered email"
                            placeholderTextColor={COLORS.textLight}
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />
                    </View>
                </View>

                <TouchableOpacity
                    style={styles.actionButton}
                    onPress={handleSendOTP}
                    disabled={loading}
                    activeOpacity={0.8}
                >
                    {loading ? (
                        <ActivityIndicator color="#FFF" />
                    ) : (
                        <Text style={styles.actionButtonText}>Send OTP</Text>
                    )}
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.backToLogin}
                    onPress={() => navigation.goBack()}
                >
                    <Text style={styles.backToLoginText}>Back to Login</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFFFFF' },
    header: {
        flex: 0.4,
        borderBottomLeftRadius: 40,
        borderBottomRightRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 5,
    },
    headerContent: { alignItems: 'center' },
    backButton: {
        position: 'absolute',
        left: -80,
        top: 40,
        padding: 10,
    },
    logoContainer: {
        width: 80,
        height: 80,
        backgroundColor: '#FFF',
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 15,
        elevation: 8,
    },
    logo: { width: 50, height: 50 },
    title: {
        fontSize: 24,
        fontFamily: FONT_FAMILY.bold,
        color: '#FFF',
        marginBottom: 5,
    },
    subtitle: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.9)',
        fontFamily: FONT_FAMILY.regular,
    },
    formContainer: { flex: 0.6, padding: 32, paddingTop: 40 },
    inputGroup: { marginBottom: 30 },
    label: {
        fontSize: 14,
        color: COLORS.textSecondary,
        marginBottom: 10,
        fontFamily: FONT_FAMILY.semiBold,
        marginLeft: 4,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F5F5F5',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#EEEEEE',
        paddingHorizontal: 16,
        height: 56,
    },
    inputIcon: { marginRight: 12 },
    input: {
        flex: 1,
        fontSize: 16,
        color: COLORS.textPrimary,
        fontFamily: FONT_FAMILY.regular,
    },
    actionButton: {
        backgroundColor: COLORS.primary,
        borderRadius: 16,
        height: 56,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 4,
    },
    actionButtonText: {
        color: '#FFF',
        fontSize: 18,
        fontFamily: FONT_FAMILY.bold,
    },
    backToLogin: {
        marginTop: 20,
        alignItems: 'center',
    },
    backToLoginText: {
        color: COLORS.primary,
        fontFamily: FONT_FAMILY.semiBold,
        fontSize: 16,
    },
});

export default ForgotPasswordScreen;
