import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    ScrollView,
    Alert,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../../services/api';
import { COLORS } from '../../constants/colors';

const CompleteProfileScreen = ({ navigation, route }) => {
    const { employeeId, employeeData } = route.params || {};
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState(1);

    // Form State
    const [form, setForm] = useState({
        // Basic
        firstName: employeeData?.firstName || '',
        middleName: '',
        lastName: employeeData?.lastName || '',
        gender: '',
        fatherName: '',
        dob: '',

        // Professional
        department: employeeData?.department || '',
        designation: employeeData?.designation || '',
        paygroup: '',
        associateCode: employeeId || '',
        location: '',
        reportingManager: '',
        jobResponsibility: '',

        // Statutory & Bank
        panNumber: '',
        aadharNumber: '',
        bankAccount: '',
        ifscCode: '',
        uan: '',
    });

    const updateForm = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

    const handleSave = async () => {
        setLoading(true);
        try {
            const response = await api.put(`/api/employees/${employeeId}`, form);
            if (response.data.success) {
                Alert.alert('Success', 'Profile completed successfully!', [
                    { text: 'Great!', onPress: () => navigation.replace('Home') }
                ]);
            } else {
                Alert.alert('Error', response.data.message || 'Failed to save profile');
            }
        } catch (error) {
            Alert.alert('Error', 'Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const renderStep1 = () => (
        <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Personal Information</Text>
            <View style={styles.inputGroup}>
                <Text style={styles.label}>First Name</Text>
                <TextInput
                    style={styles.input}
                    value={form.firstName}
                    onChangeText={(t) => updateForm('firstName', t)}
                    placeholder="Enter first name"
                />
            </View>
            <View style={styles.inputGroup}>
                <Text style={styles.label}>Last Name</Text>
                <TextInput
                    style={styles.input}
                    value={form.lastName}
                    onChangeText={(t) => updateForm('lastName', t)}
                    placeholder="Enter last name"
                />
            </View>
            <View style={styles.inputGroup}>
                <Text style={styles.label}>Gender</Text>
                <View style={styles.radioGroup}>
                    {['Male', 'Female', 'Other'].map(g => (
                        <TouchableOpacity
                            key={g}
                            style={[styles.radioButton, form.gender === g && styles.radioActive]}
                            onPress={() => updateForm('gender', g)}
                        >
                            <Text style={[styles.radioText, form.gender === g && styles.radioTextActive]}>{g}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>
            <View style={styles.inputGroup}>
                <Text style={styles.label}>Father's Name</Text>
                <TextInput
                    style={styles.input}
                    value={form.fatherName}
                    onChangeText={(t) => updateForm('fatherName', t)}
                    placeholder="Enter father's name"
                />
            </View>
            <View style={styles.inputGroup}>
                <Text style={styles.label}>Date of Birth (DD/MM/YYYY)</Text>
                <TextInput
                    style={styles.input}
                    value={form.dob}
                    onChangeText={(t) => updateForm('dob', t)}
                    placeholder="21/03/1981"
                />
            </View>
        </View>
    );

    const renderStep2 = () => (
        <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Professional Details</Text>
            <View style={styles.inputGroup}>
                <Text style={styles.label}>Reporting Manager</Text>
                <TextInput
                    style={styles.input}
                    value={form.reportingManager}
                    onChangeText={(t) => updateForm('reportingManager', t)}
                    placeholder="Enter manager name"
                />
            </View>
            <View style={styles.inputGroup}>
                <Text style={styles.label}>Location</Text>
                <TextInput
                    style={styles.input}
                    value={form.location}
                    onChangeText={(t) => updateForm('location', t)}
                    placeholder="B.Komarapalayam"
                />
            </View>
            <View style={styles.inputGroup}>
                <Text style={styles.label}>Paygroup</Text>
                <TextInput
                    style={styles.input}
                    value={form.paygroup}
                    onChangeText={(t) => updateForm('paygroup', t)}
                    placeholder="Management / Staff"
                />
            </View>
            <View style={styles.inputGroup}>
                <Text style={styles.label}>Job Responsibility</Text>
                <TextInput
                    style={[styles.input, { height: 80 }]}
                    value={form.jobResponsibility}
                    onChangeText={(t) => updateForm('jobResponsibility', t)}
                    multiline
                    placeholder="Brief description of your role"
                />
            </View>
        </View>
    );

    const renderStep3 = () => (
        <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Statutory & BankInfo</Text>
            <View style={styles.inputGroup}>
                <Text style={styles.label}>PAN Number</Text>
                <TextInput
                    style={styles.input}
                    value={form.panNumber}
                    onChangeText={(t) => updateForm('panNumber', t)}
                    autoCapitalize="characters"
                    placeholder="ABCDE1234F"
                />
            </View>
            <View style={styles.inputGroup}>
                <Text style={styles.label}>Aadhar Number</Text>
                <TextInput
                    style={styles.input}
                    value={form.aadharNumber}
                    onChangeText={(t) => updateForm('aadharNumber', t)}
                    keyboardType="numeric"
                    placeholder="1234 5678 9012"
                />
            </View>
            <View style={styles.inputGroup}>
                <Text style={styles.label}>Bank Account Number</Text>
                <TextInput
                    style={styles.input}
                    value={form.bankAccount}
                    onChangeText={(t) => updateForm('bankAccount', t)}
                    keyboardType="numeric"
                    placeholder="Enter account number"
                />
            </View>
            <View style={styles.inputGroup}>
                <Text style={styles.label}>IFSC Code</Text>
                <TextInput
                    style={styles.input}
                    value={form.ifscCode}
                    onChangeText={(t) => updateForm('ifscCode', t)}
                    autoCapitalize="characters"
                    placeholder="SBIN0001234"
                />
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.scroll}>
                    <View style={styles.header}>
                        <Text style={styles.title}>Complete Your Profile</Text>
                        <Text style={styles.subtitle}>Help us set up your SRM employee dashboard</Text>

                        {/* Progress Bar */}
                        <View style={styles.progressContainer}>
                            {[1, 2, 3].map(i => (
                                <View key={i} style={[styles.progressDot, step >= i && styles.dotActive]} />
                            ))}
                        </View>
                    </View>

                    {step === 1 && renderStep1()}
                    {step === 2 && renderStep2()}
                    {step === 3 && renderStep3()}

                    <View style={styles.footer}>
                        {step > 1 && (
                            <TouchableOpacity style={styles.backBtn} onPress={() => setStep(s => s - 1)}>
                                <Text style={styles.backText}>Back</Text>
                            </TouchableOpacity>
                        )}

                        <TouchableOpacity
                            style={styles.nextBtn}
                            onPress={() => step < 3 ? setStep(s => s + 1) : handleSave()}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="#FFF" />
                            ) : (
                                <Text style={styles.nextText}>{step === 3 ? 'Complete Setup' : 'Next'}</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFF' },
    scroll: { padding: 24, flexGrow: 1 },
    header: { marginBottom: 30, alignItems: 'center' },
    title: { fontSize: 24, fontFamily: 'Poppins-Bold', color: '#000' },
    subtitle: { fontSize: 14, color: '#666', marginTop: 5, textAlign: 'center' },
    progressContainer: { flexDirection: 'row', marginTop: 20, gap: 10 },
    progressDot: { width: 40, height: 6, backgroundColor: '#EEE', borderRadius: 3 },
    dotActive: { backgroundColor: COLORS.primary },
    stepContainer: { flex: 1 },
    stepTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 20, color: '#333' },
    inputGroup: { marginBottom: 20 },
    label: { fontSize: 12, color: '#555', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 },
    input: { borderWidth: 1, borderColor: '#DDD', padding: 12, backgroundColor: '#F9F9F9', color: '#000' },
    radioGroup: { flexDirection: 'row', gap: 10 },
    radioButton: { flex: 1, padding: 10, borderWidth: 1, borderColor: '#DDD', alignItems: 'center' },
    radioActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
    radioText: { color: '#666' },
    radioTextActive: { color: '#FFF', fontWeight: 'bold' },
    footer: { flexDirection: 'row', gap: 15, marginTop: 20 },
    backBtn: { flex: 1, padding: 15, borderWidth: 1, borderColor: COLORS.primary, alignItems: 'center' },
    backText: { color: COLORS.primary, fontWeight: 'bold' },
    nextBtn: { flex: 2, padding: 15, backgroundColor: COLORS.primary, alignItems: 'center' },
    nextText: { color: '#FFF', fontWeight: 'bold' },
});

export default CompleteProfileScreen;
