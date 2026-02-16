import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    ScrollView,
    Alert,
    ActivityIndicator,
    Modal,
    Platform,
    StatusBar,
    SafeAreaView
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { createRequest, getRequestsByEmployee } from '../services/api';
import { getSavedEmployee } from '../utils/session';

const REQUEST_TYPES = {
    ADVANCE: 'Advance Money',
    LEAVE: 'Leave Application',
    PERMISSION: 'Permission'
};

const RequestsScreen = ({ navigation, route }) => {
    const [activeTab, setActiveTab] = useState('NEW'); // 'NEW' or 'HISTORY'
    const [requestType, setRequestType] = useState('ADVANCE');
    const [employee, setEmployee] = useState(null);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [requestsHistory, setRequestsHistory] = useState([]);

    // Form inputs
    const [amount, setAmount] = useState('');
    const [reason, setReason] = useState('');
    const [duration, setDuration] = useState(''); // For Permission (minutes)
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);

    useEffect(() => {
        if (route.params?.initialTab) {
            setActiveTab(route.params.initialTab);
        }
        loadEmployee();
    }, [route.params]);

    const loadEmployee = async () => {
        const emp = await getSavedEmployee();
        setEmployee(emp);
        if (emp?.employeeId) {
            loadHistory(emp.employeeId);
        }
    };

    const loadHistory = async (empId) => {
        setLoading(true);
        try {
            const result = await getRequestsByEmployee(empId);
            if (result.success) {
                // Sort by date desc
                const sorted = result.requests.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                setRequestsHistory(sorted);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async () => {
        if (!employee?.employeeId) return;

        let requestData = {};

        if (requestType === 'ADVANCE') {
            if (!amount) {
                Alert.alert('Error', 'Please enter amount');
                return;
            }
            requestData = { amount: parseFloat(amount) };
        } else if (requestType === 'LEAVE') {
            if (!reason) {
                Alert.alert('Error', 'Please enter reason');
                return;
            }
            requestData = {
                date: selectedDate.toISOString().split('T')[0],
                reason
            };
        } else if (requestType === 'PERMISSION') {
            if (!duration || !reason) {
                Alert.alert('Error', 'Please enter duration (minutes) and reason');
                return;
            }
            requestData = {
                date: selectedDate.toISOString().split('T')[0],
                duration: parseFloat(duration),
                reason
            };
        }

        setSubmitting(true);
        try {
            const currentType = requestType === 'ADVANCE' ? 'ADVANCE' : requestType === 'LEAVE' ? 'LEAVE' : 'PERMISSION';

            const result = await createRequest({
                employeeId: employee.employeeId,
                type: currentType,
                data: requestData
            });

            if (result.success) {
                Alert.alert('Success', 'Request submitted successfully!', [
                    {
                        text: 'OK',
                        onPress: () => {
                            setAmount('');
                            setReason('');
                            setDuration('');
                            loadHistory(employee.employeeId);
                            setActiveTab('HISTORY');
                        }
                    }
                ]);
            }
        } catch (error) {
            Alert.alert('Error', error.response?.data?.message || 'Failed to submit request');
        } finally {
            setSubmitting(false);
        }
    };

    const getTypeDetails = (type) => {
        switch (type) {
            case 'ADVANCE': return { color: '#2196F3', label: 'Advance' };
            case 'LEAVE': return { color: '#FF9800', label: 'Leave' };
            case 'PERMISSION': return { color: '#9C27B0', label: 'Permission' };
            default: return { color: '#757575', label: type };
        }
    };

    const renderForm = () => (
        <ScrollView style={styles.formScroll} contentContainerStyle={{ paddingBottom: 40 }}>
            <View style={styles.card}>
                <Text style={styles.sectionTitle}>Select Request Type</Text>
                <View style={styles.typeSelector}>
                    {Object.entries(REQUEST_TYPES).map(([key, label]) => {
                        const isSelected = requestType === key;
                        const { color } = getTypeDetails(key);
                        return (
                            <TouchableOpacity
                                key={key}
                                style={[
                                    styles.typeButton,
                                    isSelected && { backgroundColor: color, borderColor: color }
                                ]}
                                onPress={() => setRequestType(key)}
                            >
                                <Text style={[
                                    styles.typeText,
                                    isSelected && styles.activeTypeText
                                ]}>
                                    {label === 'Advance Money' ? 'Advance' : label === 'Leave Application' ? 'Leave' : label}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                <View style={styles.formContent}>
                    {requestType === 'ADVANCE' && (
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Amount (₹)</Text>
                            <TextInput
                                style={styles.input}
                                keyboardType="numeric"
                                placeholder="Enter amount"
                                placeholderTextColor="#999"
                                value={amount}
                                onChangeText={setAmount}
                            />
                        </View>
                    )}

                    {(requestType === 'LEAVE' || requestType === 'PERMISSION') && (
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Date</Text>
                            <TouchableOpacity
                                style={styles.dateButton}
                                onPress={() => setShowDatePicker(true)}
                            >
                                <Text style={styles.dateText}>
                                    {selectedDate.toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'long', day: 'numeric' })}
                                </Text>
                            </TouchableOpacity>
                            {showDatePicker && (
                                <DateTimePicker
                                    value={selectedDate}
                                    mode="date"
                                    display="default"
                                    onChange={(event, date) => {
                                        setShowDatePicker(false);
                                        if (date) setSelectedDate(date);
                                    }}
                                    minimumDate={new Date()}
                                />
                            )}
                        </View>
                    )}

                    {requestType === 'PERMISSION' && (
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Duration (Minutes)</Text>
                            <TextInput
                                style={styles.input}
                                keyboardType="numeric"
                                placeholder="e.g. 120"
                                placeholderTextColor="#999"
                                value={duration}
                                onChangeText={setDuration}
                            />
                            <Text style={styles.helperText}>Example: 60 for 1 hour</Text>
                        </View>
                    )}

                    {(requestType === 'LEAVE' || requestType === 'PERMISSION') && (
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Reason</Text>
                            <TextInput
                                style={[styles.input, styles.textArea]}
                                multiline
                                placeholder="Type your reason here..."
                                placeholderTextColor="#999"
                                value={reason}
                                onChangeText={setReason}
                            />
                        </View>
                    )}

                    <TouchableOpacity
                        style={[
                            styles.submitButton,
                            submitting && styles.disabledButton,
                            { backgroundColor: getTypeDetails(requestType).color }
                        ]}
                        onPress={handleSubmit}
                        disabled={submitting}
                    >
                        {submitting ? (
                            <ActivityIndicator color="#FFF" />
                        ) : (
                            <Text style={styles.submitButtonText}>Submit Request</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </View>
        </ScrollView>
    );

    const renderHistory = () => (
        <ScrollView style={styles.historyList} contentContainerStyle={{ paddingBottom: 40 }}>
            {requestsHistory.length === 0 ? (
                <View style={styles.emptyState}>
                    <Text style={styles.emptyEmoji}>📭</Text>
                    <Text style={styles.emptyText}>No requests found.</Text>
                </View>
            ) : (
                requestsHistory.map((req) => {
                    const { color } = getTypeDetails(req.type);
                    return (
                        <View key={req.requestId} style={styles.historyCard}>
                            <View style={[styles.cardAccentStrip, { backgroundColor: color }]} />

                            <View style={styles.cardContent}>
                                <View style={styles.cardHeader}>
                                    <View style={[styles.typeBadge, { backgroundColor: `${color}15` }]}>
                                        <Text style={[styles.typeBadgeText, { color: color }]}>
                                            {req.type}
                                        </Text>
                                    </View>
                                    <View style={[
                                        styles.statusBadge,
                                        req.status === 'APPROVED' ? styles.statusApproved :
                                            req.status === 'REJECTED' ? styles.statusRejected :
                                                styles.statusPending
                                    ]}>
                                        <Text style={[
                                            styles.statusText,
                                            req.status === 'APPROVED' ? styles.textApproved :
                                                req.status === 'REJECTED' ? styles.textRejected :
                                                    styles.textPending
                                        ]}>{req.status}</Text>
                                    </View>
                                </View>

                                <View style={styles.cardDetails}>
                                    {req.type === 'ADVANCE' && (
                                        <View style={styles.detailRow}>
                                            <Text style={styles.detailLabel}>Amount</Text>
                                            <Text style={styles.detailValue}>₹{req.data?.amount}</Text>
                                        </View>
                                    )}
                                    {(req.type === 'LEAVE' || req.type === 'PERMISSION') && (
                                        <>
                                            <View style={styles.detailRow}>
                                                <Text style={styles.detailLabel}>Date</Text>
                                                <Text style={styles.detailValue}>{req.data?.date}</Text>
                                            </View>
                                            {req.type === 'PERMISSION' && (
                                                <View style={styles.detailRow}>
                                                    <Text style={styles.detailLabel}>Duration</Text>
                                                    <Text style={styles.detailValue}>{req.data?.duration} mins</Text>
                                                </View>
                                            )}
                                            <View style={styles.detailRow}>
                                                <Text style={styles.detailLabel}>Reason</Text>
                                                <Text style={styles.detailValue}>{req.data?.reason}</Text>
                                            </View>
                                        </>
                                    )}
                                </View>

                                {req.rejectionReason && (
                                    <View style={styles.rejectionBox}>
                                        <Text style={styles.rejectionText}>Note: {req.rejectionReason}</Text>
                                    </View>
                                )}

                                <Text style={styles.cardDate}>
                                    Requested on {new Date(req.createdAt).toLocaleDateString()}
                                </Text>
                            </View>
                        </View>
                    );
                })
            )}
        </ScrollView>
    );

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
            <View style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Text style={styles.backButtonText}>←</Text>
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>My Requests</Text>
                    <View style={{ width: 40 }} />
                </View>

                <View style={styles.tabContainer}>
                    <View style={styles.tabWrapper}>
                        <TouchableOpacity
                            style={[styles.tab, activeTab === 'NEW' && styles.activeTab]}
                            onPress={() => setActiveTab('NEW')}
                        >
                            <Text style={[styles.tabText, activeTab === 'NEW' && styles.activeTabText]}>New Request</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.tab, activeTab === 'HISTORY' && styles.activeTab]}
                            onPress={() => setActiveTab('HISTORY')}
                        >
                            <Text style={[styles.tabText, activeTab === 'HISTORY' && styles.activeTabText]}>History</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.content}>
                    {activeTab === 'NEW' ? renderForm() : renderHistory()}
                </View>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },
    header: {
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 16,
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 20,
        paddingBottom: 15,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        elevation: 0,
        borderBottomWidth: 1,
        borderBottomColor: '#EEEEEE',
    },
    backButton: {
        padding: 8,
        borderRadius: 0,
        backgroundColor: 'transparent',
    },
    backButtonText: {
        color: '#000000',
        fontSize: 24,
        fontWeight: 'bold',
    },
    headerTitle: {
        color: '#000000',
        fontSize: 18,
        fontWeight: 'bold',
        fontFamily: 'Poppins-Bold',
    },
    tabContainer: {
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 20,
        paddingBottom: 20,
        paddingTop: 10,
    },
    tabWrapper: {
        flexDirection: 'row',
        backgroundColor: '#F5F5F5',
        borderRadius: 0,
        padding: 4,
    },
    tab: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 0,
    },
    activeTab: {
        backgroundColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    tabText: {
        color: '#757575',
        fontWeight: '600',
        fontSize: 14,
        fontFamily: 'Poppins-Medium',
    },
    activeTabText: {
        color: '#EF4136',
        fontWeight: '700',
    },
    content: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },
    formScroll: {
        padding: 20,
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 0,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#EEE',
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#333',
        marginBottom: 15,
        fontFamily: 'Poppins-Bold',
    },
    typeSelector: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 25,
    },
    typeButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 0,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    typeText: {
        fontSize: 13,
        color: '#666',
        fontWeight: '600',
        fontFamily: 'Poppins-Medium',
    },
    activeTypeText: {
        color: '#FFFFFF',
        fontWeight: '700',
    },
    formContent: {
        gap: 15,
    },
    inputGroup: {
        marginBottom: 5,
    },
    inputLabel: {
        fontSize: 14,
        color: '#444',
        marginBottom: 8,
        fontWeight: '600',
        fontFamily: 'Poppins-Medium',
    },
    input: {
        backgroundColor: '#FAFAFA',
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 0,
        padding: 14,
        fontSize: 16,
        color: '#333',
        fontFamily: 'Poppins-Regular',
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
    },
    dateButton: {
        backgroundColor: '#FAFAFA',
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 0,
        padding: 14,
    },
    dateText: {
        fontSize: 16,
        color: '#333',
        fontFamily: 'Poppins-Regular',
    },
    helperText: {
        fontSize: 12,
        color: '#999',
        marginTop: 5,
        marginLeft: 5,
        fontFamily: 'Poppins-Regular',
    },
    submitButton: {
        padding: 16,
        borderRadius: 0,
        alignItems: 'center',
        marginTop: 10,
        elevation: 2,
    },
    disabledButton: {
        opacity: 0.6,
    },
    submitButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
        fontFamily: 'Poppins-SemiBold',
        letterSpacing: 0.5,
    },
    historyList: {
        padding: 20,
    },
    emptyState: {
        alignItems: 'center',
        marginTop: 60,
    },
    emptyEmoji: {
        fontSize: 40,
        marginBottom: 10,
    },
    emptyText: {
        color: '#999',
        fontSize: 16,
        fontFamily: 'Poppins-Regular',
    },
    historyCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 0,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
        overflow: 'hidden',
        flexDirection: 'row',
        borderWidth: 1,
        borderColor: '#EEE',
    },
    cardAccentStrip: {
        width: 6,
        height: '100%',
    },
    cardContent: {
        flex: 1,
        padding: 16,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    typeBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 0,
    },
    typeBadgeText: {
        fontSize: 11,
        fontWeight: '700',
        textTransform: 'uppercase',
        fontFamily: 'Poppins-Bold',
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 0,
        borderWidth: 1,
    },
    statusApproved: { backgroundColor: '#E8F5E9', borderColor: '#AED581' },
    statusRejected: { backgroundColor: '#FFEBEE', borderColor: '#E57373' },
    statusPending: { backgroundColor: '#FFF3E0', borderColor: '#FFB74D' },

    statusText: { fontSize: 10, fontWeight: '700', fontFamily: 'Poppins-Bold' },
    textApproved: { color: '#2E7D32' },
    textRejected: { color: '#C62828' },
    textPending: { color: '#EF6C00' },

    cardDetails: {
        gap: 6,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    detailLabel: {
        color: '#888',
        fontSize: 13,
        fontFamily: 'Poppins-Regular',
    },
    detailValue: {
        color: '#333',
        fontWeight: '600',
        fontSize: 13,
        fontFamily: 'Poppins-SemiBold',
    },
    rejectionBox: {
        marginTop: 12,
        padding: 10,
        backgroundColor: '#FFEBEE',
        borderRadius: 0,
        borderLeftWidth: 3,
        borderLeftColor: '#F44336',
    },
    rejectionText: {
        color: '#C62828',
        fontSize: 12,
        fontStyle: 'italic',
        fontFamily: 'Poppins-Regular',
    },
    cardDate: {
        marginTop: 10,
        fontSize: 11,
        color: '#AAA',
        textAlign: 'right',
        fontFamily: 'Poppins-Regular',
    },
});

export default RequestsScreen;
