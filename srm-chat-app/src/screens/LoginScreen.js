import React, { useState } from 'react';
import {
    View, Text, StyleSheet, TextInput, TouchableOpacity,
    StatusBar, Alert, ActivityIndicator, Image
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
// import LinearGradient from 'react-native-linear-gradient';
import { login } from '../services/api';
import { saveUserSession } from '../utils/session';
import { initNotifications } from '../utils/notifications';
import { COLORS, FONT_FAMILY } from '../utils/theme';

export const LoginScreen = ({ onLogin }) => {
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [loginError, setLoginError] = useState('');

    const handleLogin = async () => {
        if (!email.trim() || !password) {
            Alert.alert('Error', 'Please enter both Email and Password');
            return;
        }

        setLoading(true);
        setLoginError('');
        try {
            const response = await login(email.trim(), password);
            if (response.success) {
                await saveUserSession(response.employee);

                // Register for notifications
                await initNotifications(response.employee.employeeId);

                if (onLogin) {
                    onLogin(response.employee);
                } else {
                    // Fallback to direct navigation if onLogin isn't provided
                    if (response.employee.role === 'admin') {
                        navigation.replace('AdminDashboard');
                    } else {
                        navigation.replace('ChatList');
                    }
                }
            } else {
                setLoginError(response.message || 'Invalid credentials');
                Alert.alert('Login Failed', response.message || 'Invalid credentials');
            }
        } catch (error) {
            console.log('Login Error:', error);
            setLoginError('Something went wrong. Please try again.');
            Alert.alert('Error', 'Something went wrong. Please try again.');
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
                    <View style={styles.logoContainer}>
                        <Image
                            source={require('../assets/images/logo.png')}
                            style={styles.logo}
                            resizeMode="contain"
                        />
                    </View>
                    <Text style={styles.title}>SRM Chat</Text>
                    <Text style={styles.subtitle}>Connect with your team</Text>
                </View>
            </View>

            <View style={styles.formContainer}>
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Email Address</Text>
                    <View style={styles.inputWrapper}>
                        <Icon name="email" size={20} color={COLORS.textLight} style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Enter your email"
                            placeholderTextColor={COLORS.textLight}
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />
                    </View>
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Password</Text>
                    <View style={styles.inputWrapper}>
                        <Icon name="lock" size={20} color={COLORS.textLight} style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Enter your password"
                            placeholderTextColor={COLORS.textLight}
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry={!showPassword}
                        />
                        <TouchableOpacity
                            style={styles.eyeIcon}
                            onPress={() => setShowPassword(!showPassword)}
                        >
                            <Icon
                                name={showPassword ? "visibility" : "visibility-off"}
                                size={20}
                                color={COLORS.textLight}
                            />
                        </TouchableOpacity>
                    </View>
                </View>

                <TouchableOpacity
                    style={styles.loginButton}
                    onPress={handleLogin}
                    disabled={loading}
                    activeOpacity={0.8}
                >
                    {loading ? (
                        <ActivityIndicator color="#FFF" />
                    ) : (
                        <Text style={styles.loginButtonText}>Login</Text>
                    )}
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.forgotPasswordContainer}
                    onPress={() => navigation.navigate('ForgotPassword')}
                >
                    <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                </TouchableOpacity>

                <View style={styles.footer}>
                    <Text style={styles.footerText}>SRM Technologies</Text>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    header: {
        flex: 0.45,
        borderBottomLeftRadius: 40,
        borderBottomRightRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
    },
    headerContent: {
        alignItems: 'center',
    },
    logoContainer: {
        width: 100,
        height: 100,
        backgroundColor: '#FFF',
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        elevation: 8,
        shadowColor: 'rgba(0,0,0,0.2)',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
    },
    logo: {
        width: 70,
        height: 70,
    },
    title: {
        fontSize: 28,
        fontFamily: FONT_FAMILY.bold,
        color: '#FFF',
        marginBottom: 8,
        textShadowColor: 'rgba(0,0,0,0.2)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 3,
    },
    subtitle: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.9)',
        fontFamily: FONT_FAMILY.regular,
    },
    formContainer: {
        flex: 0.55,
        padding: 32,
        marginTop: 10,
    },
    inputGroup: {
        marginBottom: 24,
    },
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
    inputIcon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: COLORS.textPrimary,
        fontFamily: FONT_FAMILY.regular,
    },
    eyeIcon: {
        padding: 8,
    },
    loginButton: {
        backgroundColor: COLORS.primary,
        borderRadius: 16,
        height: 56,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
        elevation: 4,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    loginButtonText: {
        color: '#FFF',
        fontSize: 18,
        fontFamily: FONT_FAMILY.bold,
    },
    footer: {
        marginTop: 'auto',
        alignItems: 'center',
        paddingBottom: 10,
    },
    forgotPasswordContainer: {
        marginTop: 15,
        alignItems: 'center',
    },
    forgotPasswordText: {
        color: COLORS.primary,
        fontSize: 15,
        fontFamily: FONT_FAMILY.semiBold,
    },
    footerText: {
        color: COLORS.textLight,
        fontSize: 13,
        fontFamily: FONT_FAMILY.regular,
    },
});

// export default LoginScreen;
