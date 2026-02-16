import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Image,
    StatusBar,
    RefreshControl,
    Alert,
    TouchableOpacity,
    Platform
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { getSavedEmployee, clearSession, saveSession } from '../utils/session';
import { getAttendanceStatus, default as api } from '../services/api';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { COLORS } from '../utils/theme';

const ProfileScreen = () => {
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();
    const [employee, setEmployee] = useState(null);
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState('Company');

    const tabs = ['Company', 'Statutory', 'Bank', 'Personal', 'Family', 'Education'];

    // ... (loadProfile and other functions remain same)



    // Load Profile Data
    const loadProfile = async () => {
        try {
            const emp = await getSavedEmployee();
            if (emp) {
                setEmployee(emp);

                // Fetch fresh details from API
                const response = await api.get(`/api/employees/${emp.employeeId}`);
                if (response.data.success) {
                    const freshEmployee = response.data.employee;
                    setEmployee(freshEmployee);
                    await saveSession(freshEmployee);
                }

                if (emp.employeeId) {
                    getAttendanceStatus(emp.employeeId).catch(err => console.log('Bg status check failed', err));
                }
            }
        } catch (error) {
            console.log('Error loading profile:', error);
        }
    };

    useFocusEffect(
        useCallback(() => {
            loadProfile();
        }, [])
    );

    const onRefresh = async () => {
        setRefreshing(true);
        await loadProfile();
        setRefreshing(false);
    };

    const handleLogout = () => {
        Alert.alert('Logout', 'Are you sure you want to logout?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Logout',
                style: 'destructive',
                onPress: async () => {
                    await clearSession();
                    navigation.reset({
                        index: 0,
                        routes: [{ name: 'Login' }],
                    });
                },
            },
        ]);
    };

    const InfoRow = ({ label, value, icon }) => (
        <View style={styles.infoRow}>
            <View style={styles.iconContainer}>
                <Icon name={icon} size={20} color={COLORS.primary} />
            </View>
            <View style={styles.infoContent}>
                <Text style={styles.label}>{label}</Text>
                <Text style={styles.value}>{value || '--'}</Text>
            </View>
        </View>
    );

    const renderTabContent = () => {
        const family = employee?.familyDetails || {};
        const edu = employee?.academicQualifications?.[0] || {}; // Showing first/highest qualification for now

        switch (activeTab) {
            case 'Company':
                return (
                    <View style={styles.tabContent}>
                        <InfoRow label="Associate Code" value={employee?.associateCode || employee?.employeeId} icon="badge" />
                        <InfoRow label="Paygroup" value={employee?.paygroup} icon="payments" />
                        <InfoRow label="Reporting Manager" value={employee?.reportingManager} icon="person" />
                        <InfoRow label="Department" value={employee?.department} icon="business" />
                        <InfoRow label="Designation" value={employee?.designation} icon="work" />
                        <InfoRow label="Location" value={employee?.location} icon="place" />
                        <InfoRow label="Job Responsibility" value={employee?.jobResponsibility} icon="description" />
                    </View>
                );
            case 'Statutory':
                return (
                    <View style={styles.tabContent}>
                        <InfoRow label="PAN Number" value={employee?.panNumber} icon="credit-card" />
                        <InfoRow label="Aadhar Number" value={employee?.aadharNumber} icon="fingerprint" />
                        <InfoRow label="UAN Number" value={employee?.uanNumber} icon="work" />
                        <InfoRow label="ESI Number" value={employee?.esiNumber} icon="medical-services" />
                        <InfoRow label="PF Number" value={employee?.pfNumber} icon="savings" />
                    </View>
                );
            case 'Bank':
                return (
                    <View style={styles.tabContent}>
                        <InfoRow label="Bank Name" value={employee?.bankName} icon="account-balance" />
                        <InfoRow label="Bank Account" value={employee?.accountNumber} icon="account-balance-wallet" />
                        <InfoRow label="IFSC Code" value={employee?.ifscCode} icon="qr-code" />
                        <InfoRow label="Payment Mode" value={employee?.paymentMode} icon="payments" />
                    </View>
                );
            case 'Salary Details':
                return (
                    <View style={styles.tabContent}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
                            <Text style={{ fontSize: 16, fontFamily: 'Poppins-Bold', color: '#000' }}>Current Structure</Text>
                            <TouchableOpacity
                                onPress={() => navigation.navigate('PayDetails')}
                                style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#F0F9FF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: '#B9E6FE' }}
                            >
                                <Icon name="history" size={18} color={COLORS.primary} />
                                <Text style={{ fontSize: 12, fontFamily: 'Poppins-Bold', color: COLORS.primary }}>Payout History</Text>
                            </TouchableOpacity>
                        </View>
                        <View style={styles.salaryTable}>
                            <View style={styles.salaryHeader}>
                                <Text style={styles.salaryHeaderText}>EARNINGS</Text>
                                <Text style={styles.salaryHeaderText}>AMOUNT (₹)</Text>
                            </View>
                            <View style={styles.salaryRow}>
                                <Text style={styles.salaryLabel}>Fixed Basic</Text>
                                <Text style={styles.salaryValue}>{employee?.fixedBasic || '0'}</Text>
                            </View>
                            <View style={styles.salaryRow}>
                                <Text style={styles.salaryLabel}>Fixed HRA</Text>
                                <Text style={styles.salaryValue}>{employee?.fixedHra || '0'}</Text>
                            </View>
                            <View style={styles.salaryRow}>
                                <Text style={styles.salaryLabel}>Fixed Spl Allowance</Text>
                                <Text style={styles.salaryValue}>{employee?.fixedSplAllowance || '0'}</Text>
                            </View>
                            <View style={styles.salaryRow}>
                                <Text style={styles.salaryLabel}>Fixed DA</Text>
                                <Text style={styles.salaryValue}>{employee?.fixedDa || '0'}</Text>
                            </View>
                            <View style={styles.salaryRow}>
                                <Text style={styles.salaryLabel}>Fixed Other Allowance</Text>
                                <Text style={styles.salaryValue}>{employee?.fixedOtherAllowance || '0'}</Text>
                            </View>
                            <View style={[styles.salaryRow, { borderTopWidth: 1, borderTopColor: '#EEE', paddingTop: 10 }]}>
                                <Text style={[styles.salaryLabel, { fontFamily: 'Poppins-Bold', color: '#000' }]}>Fixed Gross</Text>
                                <Text style={[styles.salaryValue, { fontFamily: 'Poppins-Bold', color: COLORS.primary }]}>{employee?.fixedGross || '0'}</Text>
                            </View>
                        </View>
                    </View>
                );
            case 'Personal':
                return (
                    <View style={styles.tabContent}>
                        <InfoRow label="Gender" value={employee?.gender} icon="people" />
                        <InfoRow label="Date of Birth" value={employee?.dob} icon="cake" />
                        <InfoRow label="Blood Group" value={family?.bloodGroup} icon="opacity" />
                        <InfoRow label="Marital Status" value={family?.maritalStatus} icon="favorite" />
                        <InfoRow label="Address" value={family?.address} icon="home" />
                        <InfoRow label="Personal Email" value={family?.personalEmail} icon="email" />
                        <InfoRow label="Personal Mobile" value={family?.personalMobile} icon="smartphone" />
                        <InfoRow label="Official Email" value={employee?.email} icon="work" />
                        <InfoRow label="Official Mobile" value={employee?.phone} icon="contact-phone" />
                    </View>
                );
            case 'Family':
                return (
                    <View style={styles.tabContent}>
                        <InfoRow label="Father's Name" value={employee?.fatherName} icon="escalator-warning" />
                        <InfoRow label="Guardian Name" value={family?.guardianName} icon="supervisor-account" />
                        <InfoRow label="No. of Children" value={family?.numbChildren} icon="child-care" />
                        <InfoRow label="Passport" value={family?.passportNumber} icon="book" />
                        <InfoRow label="Driving License" value={family?.drivingLicenseNumber} icon="directions-car" />
                    </View>
                );
            case 'Education':
                return (
                    <View style={styles.tabContent}>
                        <InfoRow label="Highest Qualification" value={edu?.highestQualification || edu?.degree} icon="school" />
                        <InfoRow label="Specialization" value={edu?.specialization || edu?.branch} icon="menu-book" />
                        <InfoRow label="University/College" value={edu?.university || edu?.college} icon="account-balance" />
                        <InfoRow label="Year of Passing" value={edu?.yearOfPassing} icon="event" />
                    </View>
                );
            default:
                return null;
        }
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Associate Master</Text>
                <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
                    <Icon name="logout" size={24} color="#D32F2F" />
                </TouchableOpacity>
            </View>

            <ScrollView
                style={styles.scrollView}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
            >
                {/* 1. Profile Summary Card */}
                <View style={styles.summaryCard}>
                    <View style={styles.avatarContainer}>
                        <Image
                            source={{ uri: employee?.photoUrl || 'https://via.placeholder.com/150' }}
                            style={styles.avatar}
                        />
                        <TouchableOpacity style={styles.editIcon} onPress={() => navigation.navigate('CompleteProfile', { employeeId: employee?.employeeId, employeeData: employee })}>
                            <Icon name="edit" size={16} color="#FFF" />
                        </TouchableOpacity>
                    </View>
                    <Text style={styles.employeeName}>{employee?.firstName} {employee?.lastName}</Text>
                    <Text style={styles.employeeSubText}>{employee?.designation} | {employee?.department}</Text>
                </View>

                {/* 2. Horizontal Tabs */}
                <View style={styles.tabsWrapper}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsContainer}>
                        {tabs.map((tab) => (
                            <TouchableOpacity
                                key={tab}
                                style={[styles.tab, activeTab === tab && styles.activeTab]}
                                onPress={() => setActiveTab(tab)}
                            >
                                <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>{tab}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                {/* 3. Tab Content */}
                <View style={styles.detailsCard}>
                    {renderTabContent()}
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FB',
    },
    header: {
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'android' ? 40 : 20,
        paddingBottom: 15,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#EEE',
    },
    headerTitle: {
        fontSize: 18,
        fontFamily: 'Poppins-Bold',
        color: '#000',
    },
    logoutButton: {
        padding: 8,
        backgroundColor: '#FFF5F5',
        borderRadius: 8,
    },
    scrollView: {
        flex: 1,
    },
    summaryCard: {
        backgroundColor: '#FFF',
        padding: 24,
        alignItems: 'center',
        marginBottom: 10,
    },
    avatarContainer: {
        position: 'relative',
        marginBottom: 15,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 3,
        borderColor: COLORS.primary,
    },
    editIcon: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: COLORS.primary,
        width: 30,
        height: 30,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#FFF',
    },
    employeeName: {
        fontSize: 20,
        fontFamily: 'Poppins-Bold',
        color: '#000',
    },
    employeeSubText: {
        fontSize: 14,
        color: '#666',
        fontFamily: 'Poppins-Regular',
    },
    tabsWrapper: {
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: '#EEE',
    },
    tabsContainer: {
        paddingHorizontal: 15,
        paddingVertical: 10,
    },
    tab: {
        paddingHorizontal: 20,
        paddingVertical: 8,
        marginRight: 10,
        borderRadius: 20,
        backgroundColor: '#F5F5F5',
    },
    activeTab: {
        backgroundColor: COLORS.primary,
    },
    tabText: {
        fontSize: 13,
        fontFamily: 'Poppins-Medium',
        color: '#666',
    },
    activeTabText: {
        color: '#FFF',
    },
    detailsCard: {
        margin: 15,
        backgroundColor: '#FFF',
        borderRadius: 12,
        padding: 15,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    tabContent: {
        gap: 5,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#FAFAFA',
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#FFF5F5',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    infoContent: {
        flex: 1,
    },
    label: {
        fontSize: 11,
        color: '#999',
        fontFamily: 'Poppins-Regular',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    value: {
        fontSize: 14,
        color: '#333',
        fontFamily: 'Poppins-Medium',
        marginTop: 2,
    },
    salaryTable: {
        marginTop: 10,
    },
    salaryHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#EEE',
        marginBottom: 10,
    },
    salaryHeaderText: {
        fontSize: 12,
        fontFamily: 'Poppins-Bold',
        color: '#999',
        letterSpacing: 1,
    },
    salaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 8,
    },
    salaryLabel: {
        fontSize: 13,
        fontFamily: 'Poppins-Regular',
        color: '#666',
    },
    salaryValue: {
        fontSize: 13,
        fontFamily: 'Poppins-Medium',
        color: '#333',
    },
});

export default ProfileScreen;
