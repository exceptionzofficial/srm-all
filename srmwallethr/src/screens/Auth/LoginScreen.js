import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Alert,
    Image,
    StatusBar,
    KeyboardAvoidingView,
    Platform,
    ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS } from '../../constants/colors';
import api from '../../services/api';
import { saveSession, getSavedEmployee } from '../../utils/session';

// Import logo
const srmLogo = require('../../assets/srm-logo.png');

const LoginScreen = ({ navigation }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [emailStatus, setEmailStatus] = useState(null); // null, 'not_registered', 'needs_password', 'ready'

    useEffect(() => {
        checkAutoLogin();
    }, []);

    const checkAutoLogin = async () => {
        const emp = await getSavedEmployee();
        if (emp && emp.employeeId) {
            navigation.reset({
                index: 0,
                routes: [{ name: 'Home' }],
            });
        }
    };

    const handleContinue = async () => {
        if (!email) {
            Alert.alert('Error', 'Please enter your email');
            return;
        }

        setLoading(true);
        try {
            const response = await api.post('/api/auth/status', { email });
            setLoading(false);
            if (response.data.success) {
                if (!response.data.registered) {
                    setEmailStatus('not_registered');
                    Alert.alert('Not Registered', response.data.message);
                } else if (!response.data.hasPassword) {
                    setEmailStatus('needs_password');
                    Alert.alert(
                        'Setup Required',
                        `Hello ${response.data.employeeName}, your account is registered by admin but you haven't set a password yet.`,
                        [
                            { text: 'Set up now', onPress: () => navigation.navigate('Register', { employee: { email, name: response.data.employeeName } }) },
                            { text: 'Cancel', style: 'cancel' }
                        ]
                    );
                } else {
                    setEmailStatus('ready');
                }
            } else {
                Alert.alert('Error', response.data.message || 'Verification failed');
            }
        } catch (error) {
            setLoading(false);
            Alert.alert('Error', error.response?.data?.message || 'Network error');
        }
    };

    const handleLogin = async () => {
        if (!password) {
            Alert.alert('Error', 'Please enter your password');
            return;
        }

        setLoading(true);
        try {
            const response = await api.post('/api/auth/login', { email, password });
            setLoading(false);
            if (response.data.success) {
                // Store user data using standard utility
                await saveSession(response.data.employee);

                // Reset navigation to Home (which is TabNavigator)
                navigation.reset({
                    index: 0,
                    routes: [{ name: 'Home' }],
                });
            } else {
                Alert.alert('Error', response.data.message || 'Login failed');
            }
        } catch (error) {
            setLoading(false);
            Alert.alert('Error', error.response?.data?.message || 'Network error');
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                    <View style={styles.header}>
                        <Image source={srmLogo} style={styles.logo} resizeMode="contain" />
                        <Text style={styles.title}>SRM Group Institutions</Text>
                        <Text style={styles.subtitle}>Sign in to your dashboard</Text>
                    </View>

                    <View style={styles.card}>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Official Email</Text>
                            <View style={styles.inputWrapper}>
                                <TextInput
                                    style={styles.input}
                                    placeholder="employee@srm.com"
                                    placeholderTextColor="#999"
                                    value={email}
                                    onChangeText={(text) => {
                                        setEmail(text);
                                        setEmailStatus(null);
                                    }}
                                    autoCapitalize="none"
                                    keyboardType="email-address"
                                    editable={!loading && emailStatus !== 'ready'}
                                />
                            </View>
                            {emailStatus === 'not_registered' && (
                                <Text style={[styles.infoText, { color: '#D32F2F' }]}>This email is not registered in our records.</Text>
                            )}
                        </View>

                        {emailStatus === 'ready' && (
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Password</Text>
                                <View style={styles.inputWrapper}>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="••••••••"
                                        placeholderTextColor="#999"
                                        value={password}
                                        onChangeText={setPassword}
                                        secureTextEntry
                                        autoFocus
                                    />
                                </View>
                                <TouchableOpacity style={styles.forgotPass}>
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                                        <TouchableOpacity onPress={() => setEmailStatus(null)}>
                                            <Text style={[styles.forgotPassText, { color: '#666' }]}>Change Email</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity>
                                            <Text style={styles.forgotPassText}>Forgot Password?</Text>
                                        </TouchableOpacity>
                                    </View>
                                </TouchableOpacity>
                            </View>
                        )}

                        {emailStatus === 'ready' ? (
                            <TouchableOpacity
                                style={[styles.loginButton, loading && styles.buttonDisabled]}
                                onPress={handleLogin}
                                disabled={loading}
                            >
                                {loading ? (
                                    <ActivityIndicator color="#FFF" />
                                ) : (
                                    <Text style={styles.loginButtonText}>Login to Account</Text>
                                )}
                            </TouchableOpacity>
                        ) : emailStatus === 'needs_password' ? (
                            <TouchableOpacity
                                style={[styles.loginButton, { backgroundColor: COLORS.success }]}
                                onPress={() => navigation.navigate('Register', { employee: { email } })}
                            >
                                <Text style={styles.loginButtonText}>Set up Password</Text>
                            </TouchableOpacity>
                        ) : (
                            <TouchableOpacity
                                style={[styles.loginButton, loading && styles.buttonDisabled]}
                                onPress={handleContinue}
                                disabled={loading}
                            >
                                {loading ? (
                                    <ActivityIndicator color="#FFF" />
                                ) : (
                                    <Text style={styles.loginButtonText}>Continue</Text>
                                )}
                            </TouchableOpacity>
                        )}
                    </View>

                    <View style={styles.footer}>
                        <View style={styles.registerOption}>
                            <Text style={styles.footerText}>Registered by Admin but no login?</Text>
                            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                                <Text style={styles.linkText}>Set up Account</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={[styles.registerOption, { marginTop: 15 }]}>
                            <Text style={styles.footerText}>New employee? Register ID first</Text>
                            <TouchableOpacity onPress={() => navigation.navigate('EmployeeId')}>
                                <Text style={styles.linkText}>Register Face & ID</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FB',
    },
    scrollContent: {
        flexGrow: 1,
        padding: 24,
        justifyContent: 'center',
    },
    header: {
        alignItems: 'center',
        marginBottom: 40,
    },
    logo: {
        width: 140,
        height: 70,
        marginBottom: 16,
    },
    title: {
        fontSize: 22,
        color: '#1A1A1A',
        fontFamily: 'Poppins-Bold',
        fontWeight: 'bold',
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 14,
        color: '#666',
        fontFamily: 'Poppins-Regular',
        marginTop: 4,
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 0,
        padding: 24,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 13,
        color: '#1A1A1A',
        fontFamily: 'Poppins-Medium',
        marginBottom: 8,
        fontWeight: '600',
    },
    inputWrapper: {
        backgroundColor: '#FFF',
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 0,
    },
    input: {
        paddingVertical: 12,
        paddingHorizontal: 16,
        fontSize: 15,
        color: '#1A1A1A',
        fontFamily: 'Poppins-Regular',
    },
    forgotPass: {
        alignSelf: 'flex-end',
        marginTop: 8,
    },
    forgotPassText: {
        fontSize: 12,
        color: COLORS.primary,
        fontFamily: 'Poppins-Medium',
    },
    loginButton: {
        backgroundColor: COLORS.primary,
        paddingVertical: 14,
        borderRadius: 0,
        alignItems: 'center',
        marginTop: 10,
    },
    buttonDisabled: {
        opacity: 0.7,
    },
    loginButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontFamily: 'Poppins-SemiBold',
        fontWeight: '600',
    },
    footer: {
        marginTop: 40,
        alignItems: 'center',
    },
    registerOption: {
        flexDirection: 'column',
        alignItems: 'center',
        gap: 4,
    },
    footerText: {
        fontSize: 13,
        color: '#666',
        fontFamily: 'Poppins-Regular',
    },
    linkText: {
        fontSize: 14,
        color: COLORS.primary,
        fontFamily: 'Poppins-Bold',
        fontWeight: 'bold',
    },
});

export default LoginScreen;
