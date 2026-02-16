/**
 * Employee ID Verification Screen
 * First screen where employee enters their ID for verification
 */

import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Image,
    Modal,
    FlatList,
    StatusBar,
    ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { verifyEmployeeId, getBranches } from '../services/api';
import Icon from 'react-native-vector-icons/MaterialIcons'; // Assuming MaterialIcons is available

// Import logo
const srmLogo = require('../assets/srm-logo.png');

const EmployeeIdScreen = ({ navigation }) => {
    const [employeeId, setEmployeeId] = useState('');
    const [loading, setLoading] = useState(false);
    const [branches, setBranches] = useState([]);
    const [selectedBranch, setSelectedBranch] = useState(null);
    const [showBranchModal, setShowBranchModal] = useState(false);
    const [isLoadingBranches, setIsLoadingBranches] = useState(true);

    useEffect(() => {
        fetchBranches();
    }, []);

    const fetchBranches = async () => {
        try {
            const response = await getBranches();
            if (response.success && response.branches) {
                setBranches(response.branches);
                // Pre-select if only one branch exists
                if (response.branches.length === 1) {
                    setSelectedBranch(response.branches[0]);
                }
            }
        } catch (error) {
            console.log('Error fetching branches:', error);
        } finally {
            setIsLoadingBranches(false);
        }
    };


    const handleVerify = async () => {
        if (!employeeId.trim()) {
            Alert.alert('Error', 'Please enter your Employee ID');
            return;
        }

        // Enforce branch selection if branches are available
        if (branches.length > 0 && !selectedBranch) {
            Alert.alert('Error', 'Please select your branch');
            return;
        }

        setLoading(true);
        try {
            const branchId = selectedBranch ? selectedBranch.branchId : null;
            const response = await verifyEmployeeId(employeeId.trim().toUpperCase(), branchId);

            if (response.success) {
                const emp = response.employee;

                // CHECK: If employee already has faceId, go to Attendance
                // Robust check for faceId to avoid false positives (e.g. string "null")
                const hasFaceId = emp.faceId && emp.faceId !== 'null' && emp.faceId !== 'undefined' && emp.faceId !== '';

                if (hasFaceId) {
                    Alert.alert(
                        'Face Registered',
                        `Hello ${emp.name}! Your face is already registered. Please login with your email and password.`,
                        [{ text: 'Go to Login', onPress: () => navigation.navigate('Login') }]
                    );
                } else {
                    // No face registered, go to FaceRegistration
                    navigation.navigate('FaceRegistration', { employee: emp });
                }
            }
        } catch (error) {
            const errorMessage =
                error.response?.data?.message || 'Unable to verify Employee ID';

            if (error.response?.data?.alreadyRegistered) {
                // Save the employee data from error response
                const emp = error.response?.data?.employee;

                Alert.alert(
                    'Welcome Back!',
                    `Hello ${emp?.name || 'Employee'}! Your face is already registered. Please login with your email and password.`,
                    [
                        {
                            text: 'Go to Login',
                            onPress: () => navigation.navigate('Login'),
                        },
                    ],
                );
            } else {
                Alert.alert('Verification Failed', errorMessage);
            }
        } finally {
            setLoading(false);
        }
    };

    const renderBranchItem = ({ item }) => (
        <TouchableOpacity
            style={styles.branchItem}
            onPress={() => {
                setSelectedBranch(item);
                setShowBranchModal(false);
            }}>
            <View>
                <Text style={styles.branchName}>{item.name}</Text>
                {item.address && <Text style={styles.branchAddress}>{item.address}</Text>}
            </View>
            {selectedBranch?.branchId === item.branchId && (
                <Text style={styles.checkMark}>✓</Text>
            )}
        </TouchableOpacity>
    );

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled">
                {/* Logo/Header */}
                <View style={styles.headerSection}>
                    <Image source={srmLogo} style={styles.logoImage} resizeMode="contain" />
                    <Text style={styles.subtitle}>SRM Group Institutions</Text>
                </View>

                {/* Form Section */}
                <View style={styles.formSection}>
                    <Text style={styles.formTitle}>Employee Verification</Text>
                    <Text style={styles.formDescription}>
                        First, let's verify your identity. Enter your details below.
                    </Text>

                    {/* Branch Selection */}
                    <View style={styles.inputContainer}>
                        <Text style={styles.inputLabel}>Branch / Department</Text>
                        <TouchableOpacity
                            style={styles.selector}
                            onPress={() => setShowBranchModal(true)}
                            disabled={isLoadingBranches || branches.length === 0}>
                            {isLoadingBranches ? (
                                <ActivityIndicator size="small" color="#EF4136" />
                            ) : (
                                <Text style={[
                                    styles.selectorText,
                                    !selectedBranch && styles.placeholderText
                                ]}>
                                    {selectedBranch ? selectedBranch.name : 'Select your branch'}
                                </Text>
                            )}
                            <Text style={styles.dropdownIcon}>▼</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={styles.inputLabel}>Employee ID</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g., SRM001"
                            placeholderTextColor="#999"
                            value={employeeId}
                            onChangeText={(text) => setEmployeeId(text.toUpperCase())}
                            autoCapitalize="characters"
                            autoCorrect={false}
                            editable={!loading}
                        />
                    </View>

                    <TouchableOpacity
                        style={[styles.button, loading && styles.buttonDisabled]}
                        onPress={handleVerify}
                        disabled={loading}>
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.buttonText}>Verify ID</Text>
                        )}
                    </TouchableOpacity>
                </View>

                {/* Info Section */}
                <View style={styles.infoSection}>
                    <Text style={styles.infoText}>
                        💡 Make sure you select the correct branch assigned by your admin.
                    </Text>
                </View>

                {/* Already Registered Link */}
                <TouchableOpacity
                    style={styles.linkButton}
                    onPress={() => navigation.navigate('Login')}>
                    <Text style={styles.linkText}>
                        Already have an account? Login here →
                    </Text>
                </TouchableOpacity>
            </ScrollView>

            {/* Branch Selection Modal */}
            <Modal
                visible={showBranchModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowBranchModal(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Select Branch</Text>
                            <TouchableOpacity
                                onPress={() => setShowBranchModal(false)}
                                style={styles.closeButton}>
                                <Text style={styles.closeButtonText}>✕</Text>
                            </TouchableOpacity>
                        </View>

                        {branches.length > 0 ? (
                            <FlatList
                                data={branches}
                                keyExtractor={(item) => item.branchId}
                                renderItem={renderBranchItem}
                                contentContainerStyle={styles.listContent}
                            />
                        ) : (
                            <View style={styles.emptyState}>
                                <Text style={styles.emptyStateText}>No branches available</Text>
                            </View>
                        )}
                    </View>
                </View>
            </Modal>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0, // Ensure safe area
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        padding: 24,
        justifyContent: 'center',
        paddingBottom: 40, // Add explicit bottom padding
    },
    headerSection: {
        alignItems: 'center',
        marginBottom: 30,
    },
    logoImage: {
        width: 150,
        height: 100,
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        color: '#666666',
        fontFamily: 'Poppins-Regular',
    },
    formSection: {
        backgroundColor: '#FFFFFF',
        borderRadius: 0, // No border radius
        padding: 24,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    formTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#000000',
        marginBottom: 8,
        fontFamily: 'Poppins-SemiBold',
    },
    formDescription: {
        fontSize: 14,
        color: '#666666',
        marginBottom: 24,
        lineHeight: 20,
        fontFamily: 'Poppins-Regular',
    },
    inputContainer: {
        marginBottom: 20,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '500',
        color: '#000000',
        marginBottom: 8,
        fontFamily: 'Poppins-Medium',
    },
    input: {
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 0, // No border radius
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 16,
        backgroundColor: '#FFFFFF',
        color: '#000000',
        fontFamily: 'Poppins-Regular',
    },
    selector: {
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 0, // No border radius
        paddingHorizontal: 16,
        paddingVertical: 14,
        backgroundColor: '#FFFFFF',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    selectorText: {
        fontSize: 16,
        color: '#000000',
        fontFamily: 'Poppins-Regular',
    },
    placeholderText: {
        color: '#999999',
    },
    dropdownIcon: {
        color: '#666666',
        fontSize: 12,
    },
    button: {
        backgroundColor: '#EF4136',
        borderRadius: 0, // No border radius
        paddingVertical: 16,
        alignItems: 'center',
        marginTop: 10,
    },
    buttonDisabled: {
        backgroundColor: '#ccc',
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
        fontFamily: 'Poppins-SemiBold',
    },
    infoSection: {
        marginTop: 24,
        padding: 16,
        backgroundColor: '#FFF5F5',
        borderRadius: 0, // No border radius
        borderWidth: 1,
        borderColor: '#EF4136',
    },
    infoText: {
        fontSize: 13,
        color: '#EF4136',
        lineHeight: 18,
        fontFamily: 'Poppins-Regular',
    },
    linkButton: {
        marginTop: 24,
        alignItems: 'center',
    },
    linkText: {
        color: '#EF4136',
        fontSize: 14,
        fontWeight: '500',
        fontFamily: 'Poppins-Medium',
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 0, // No border radius
        borderTopRightRadius: 0, // No border radius
        height: '60%',
        paddingBottom: 20,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#EEEEEE',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '600',
        fontFamily: 'Poppins-SemiBold',
        color: '#000000',
    },
    closeButton: {
        padding: 5,
    },
    closeButtonText: {
        fontSize: 20,
        color: '#666666',
    },
    listContent: {
        padding: 20,
    },
    branchItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F5F5F5',
    },
    branchName: {
        fontSize: 16,
        fontWeight: '500',
        color: '#000000',
        fontFamily: 'Poppins-Medium',
        marginBottom: 4,
    },
    branchAddress: {
        fontSize: 12,
        color: '#666666',
        fontFamily: 'Poppins-Regular',
    },
    checkMark: {
        color: '#EF4136',
        fontSize: 18,
        fontWeight: 'bold',
    },
    emptyState: {
        padding: 40,
        alignItems: 'center',
    },
    emptyStateText: {
        color: '#999',
        fontSize: 16,
        fontFamily: 'Poppins-Regular',
    },
});

export default EmployeeIdScreen;
