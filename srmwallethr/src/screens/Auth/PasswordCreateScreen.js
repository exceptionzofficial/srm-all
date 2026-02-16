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

const PasswordCreateScreen = ({ route, navigation }) => {
    const { email } = route.params;
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!password || !confirmPassword) {
            Alert.alert('Error', 'Please fill all fields');
            return;
        }

        if (password !== confirmPassword) {
            Alert.alert('Error', 'Passwords do not match');
            return;
        }

        if (password.length < 6) {
            Alert.alert('Error', 'Password must be at least 6 characters long');
            return;
        }

        setLoading(true);
        try {
            const response = await api.post('/api/auth/register/complete', { email, password });
            setLoading(false);
            if (response.data.success) {
                Alert.alert('Success', 'Password Set! Let\'s complete your profile.', [
                    {
                        text: 'Continue', onPress: () => navigation.replace('CompleteProfile', {
                            employeeId: response.data.employeeId,
                            employeeData: response.data.employee
                        })
                    }
                ]);
            } else {
                Alert.alert('Error', response.data.message || 'Failed to set password');
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
                        <Text style={styles.title}>Secure Your Account</Text>
                        <Text style={styles.subtitle}>Set a password for account login</Text>
                        <Text style={styles.emailText}>{email}</Text>
                    </View>

                    <View style={styles.card}>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Create Password</Text>
                            <View style={styles.inputWrapper}>
                                <TextInput
                                    style={styles.input}
                                    placeholder="••••••••"
                                    placeholderTextColor="#CCC"
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry
                                />
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Confirm Password</Text>
                            <View style={styles.inputWrapper}>
                                <TextInput
                                    style={styles.input}
                                    placeholder="••••••••"
                                    placeholderTextColor="#CCC"
                                    value={confirmPassword}
                                    onChangeText={setConfirmPassword}
                                    secureTextEntry
                                />
                            </View>
                            <Text style={styles.infoText}>Password should be at least 6 characters.</Text>
                        </View>

                        <TouchableOpacity
                            style={[styles.button, loading && styles.buttonDisabled]}
                            onPress={handleSubmit}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="#FFF" />
                            ) : (
                                <Text style={styles.buttonText}>Complete Setup</Text>
                            )}
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
        color: COLORS.primary,
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
        marginTop: 10,
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
});

export default PasswordCreateScreen;
