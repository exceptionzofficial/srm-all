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

const OtpScreen = ({ route, navigation }) => {
    const { email } = route.params;
    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);

    const handleVerify = async () => {
        if (!otp || otp.length < 6) {
            Alert.alert('Error', 'Please enter a valid 6-digit OTP');
            return;
        }

        setLoading(true);
        try {
            const response = await api.post('/api/auth/register/verify', { email, otp });
            setLoading(false);
            if (response.data.success) {
                navigation.navigate('PasswordCreate', { email });
            } else {
                Alert.alert('Error', response.data.message || 'Invalid OTP');
            }
        } catch (error) {
            setLoading(false);
            Alert.alert('Error', error.response?.data?.message || 'Verification failed');
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
                        <Text style={styles.title}>Verification OTP</Text>
                        <Text style={styles.subtitle}>We have sent a 6-digit code to</Text>
                        <Text style={styles.emailText}>{email}</Text>
                    </View>

                    <View style={styles.card}>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>OTP Code</Text>
                            <View style={styles.inputWrapper}>
                                <TextInput
                                    style={styles.input}
                                    placeholder="0 0 0 0 0 0"
                                    placeholderTextColor="#CCC"
                                    value={otp}
                                    onChangeText={setOtp}
                                    keyboardType="numeric"
                                    maxLength={6}
                                    letterSpacing={10}
                                />
                            </View>
                            <TouchableOpacity style={styles.resendBtn}>
                                <Text style={styles.resendText}>Didn't receive code? Resend</Text>
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity
                            style={[styles.button, loading && styles.buttonDisabled]}
                            onPress={handleVerify}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="#FFF" />
                            ) : (
                                <Text style={styles.buttonText}>Verify OTP</Text>
                            )}
                        </TouchableOpacity>
                    </View>

                    <View style={styles.footer}>
                        <TouchableOpacity onPress={() => navigation.goBack()}>
                            <Text style={styles.linkText}>← Change Email</Text>
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
    subtitle: {
        fontSize: 14,
        color: '#666',
        fontFamily: 'Poppins-Regular',
        marginTop: 8,
    },
    emailText: {
        fontSize: 14,
        color: '#1A1A1A',
        fontFamily: 'Poppins-SemiBold',
        fontWeight: '600',
        marginTop: 2,
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
        fontSize: 20,
        color: '#1A1A1A',
        fontFamily: 'Poppins-Bold',
        textAlign: 'center',
    },
    resendBtn: {
        alignSelf: 'center',
        marginTop: 16,
    },
    resendText: {
        fontSize: 12,
        color: COLORS.primary,
        fontFamily: 'Poppins-Medium',
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
    linkText: {
        fontSize: 14,
        color: '#666',
        fontFamily: 'Poppins-Medium',
    },
});

export default OtpScreen;
