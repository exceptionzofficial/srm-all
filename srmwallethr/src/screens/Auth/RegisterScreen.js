import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Alert,
    Image,
    SafeAreaView,
    StatusBar,
    KeyboardAvoidingView,
    Platform,
    ScrollView
} from 'react-native';
import { COLORS } from '../../constants/colors';
import api from '../../services/api';

const srmLogo = require('../../assets/srm-logo.png');

const RegisterScreen = ({ route, navigation }) => {
    const employee = route.params?.employee;
    const [email, setEmail] = useState(employee?.email || '');
    const [loading, setLoading] = useState(false);

    const handleRegister = async () => {
        if (!email) {
            Alert.alert('Error', 'Please enter your email address');
            return;
        }

        setLoading(true);
        try {
            const response = await api.post('/api/auth/register/initiate', { email });
            setLoading(false);
            if (response.data.success) {
                Alert.alert('Success', 'OTP sent to your email');
                navigation.navigate('Otp', { email });
            } else {
                Alert.alert('Error', response.data.message || 'Failed to send OTP');
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
                        <Text style={styles.title}>Account Registration</Text>
                        {employee && (
                            <Text style={styles.welcomeText}>
                                Hello, {employee.name}
                            </Text>
                        )}
                        <Text style={styles.subtitle}>Enter your official email to continue</Text>
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
                                    onChangeText={setEmail}
                                    autoCapitalize="none"
                                    keyboardType="email-address"
                                />
                            </View>
                            <Text style={styles.infoText}>We will send an OTP to this email for verification.</Text>
                        </View>

                        <TouchableOpacity
                            style={[styles.button, loading && styles.buttonDisabled]}
                            onPress={handleRegister}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="#FFF" />
                            ) : (
                                <Text style={styles.buttonText}>Send Verification OTP</Text>
                            )}
                        </TouchableOpacity>
                    </View>

                    <View style={styles.footer}>
                        <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.loginLink}>
                            <Text style={styles.footerText}>
                                Already have an account? <Text style={styles.linkText}>Login</Text>
                            </Text>
                        </TouchableOpacity>
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
    welcomeText: {
        fontSize: 16,
        color: COLORS.primary,
        fontFamily: 'Poppins-SemiBold',
        marginTop: 8,
        fontWeight: '600',
    },
    subtitle: {
        fontSize: 14,
        color: '#666',
        fontFamily: 'Poppins-Regular',
        marginTop: 4,
        textAlign: 'center',
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
        marginBottom: 24,
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
    infoText: {
        fontSize: 11,
        color: '#888',
        marginTop: 8,
        fontFamily: 'Poppins-Regular',
    },
    button: {
        backgroundColor: COLORS.primary,
        paddingVertical: 14,
        borderRadius: 0,
        alignItems: 'center',
    },
    buttonDisabled: {
        opacity: 0.7,
    },
    buttonText: {
        color: '#FFF',
        fontSize: 16,
        fontFamily: 'Poppins-SemiBold',
        fontWeight: '600',
    },
    footer: {
        marginTop: 40,
        alignItems: 'center',
    },
    footerText: {
        fontSize: 14,
        color: '#666',
        fontFamily: 'Poppins-Regular',
    },
    linkText: {
        color: COLORS.primary,
        fontFamily: 'Poppins-Bold',
        fontWeight: 'bold',
    },
});

export default RegisterScreen;
