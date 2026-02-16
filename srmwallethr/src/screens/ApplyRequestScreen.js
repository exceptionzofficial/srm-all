
import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    ScrollView,
    Alert,
    Platform,
    ActivityIndicator
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { COLORS } from '../utils/theme';
import DateTimePicker from '@react-native-community/datetimepicker';
import { getSavedEmployee } from '../utils/session';
import { createRequest } from '../services/api';

const ApplyRequestScreen = ({ navigation, route }) => {
    const { type } = route.params; // 'LEAVE', 'PERMISSION', 'ADVANCE'
    const insets = useSafeAreaInsets();

    // Form States
    const [reason, setReason] = useState('');
    const [amount, setAmount] = useState('');
    const [leaveType, setLeaveType] = useState('Casual Leave'); // Default
    const [date, setDate] = useState(new Date());
    const [endDate, setEndDate] = useState(new Date());

    // Time States for Permission
    const [startTime, setStartTime] = useState(new Date());
    const [endTime, setEndTime] = useState(new Date());

    // UI States
    const [loading, setLoading] = useState(false);
    const [showPicker, setShowPicker] = useState({ show: false, mode: 'date', field: null });

    const handleDateChange = (event, selectedDate) => {
        const currentPicker = showPicker;
        setShowPicker({ ...showPicker, show: false });

        if (event.type === 'dismissed' || !selectedDate) return;

        if (currentPicker.field === 'date') setDate(selectedDate);
        if (currentPicker.field === 'endDate') setEndDate(selectedDate);
        if (currentPicker.field === 'startTime') setStartTime(selectedDate);
        if (currentPicker.field === 'endTime') setEndTime(selectedDate);
    };

    const openPicker = (mode, field) => {
        setShowPicker({ show: true, mode, field });
    };

    const handleSubmit = async () => {
        if (!reason.trim()) {
            Alert.alert('Error', 'Please provide a reason or note.');
            return;
        }

        try {
            setLoading(true);
            const employee = await getSavedEmployee();
            if (!employee) {
                Alert.alert('Error', 'Employee session not found. Please login again.');
                return;
            }

            let requestData = {
                employeeId: employee.employeeId,
                type: type,
                data: {
                    reason: reason,
                    date: date.toISOString().split('T')[0] // Common request date
                }
            };

            if (type === 'ADVANCE') {
                if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
                    Alert.alert('Error', 'Please enter a valid amount.');
                    setLoading(false);
                    return;
                }
                requestData.data.amount = parseFloat(amount);
            } else if (type === 'LEAVE') {
                requestData.data.leaveType = leaveType;
                requestData.data.startDate = date.toISOString().split('T')[0];
                requestData.data.endDate = endDate.toISOString().split('T')[0];
                // basic validation
                if (endDate < date) {
                    Alert.alert('Error', 'End date cannot be before start date.');
                    setLoading(false);
                    return;
                }
            } else if (type === 'PERMISSION') {
                requestData.data.startTime = startTime.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
                requestData.data.endTime = endTime.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
            }

            const response = await createRequest(requestData);
            if (response.success) {
                Alert.alert('Success', 'Request submitted successfully!', [
                    { text: 'OK', onPress: () => navigation.goBack() }
                ]);
            }
        } catch (error) {
            console.log('Submit Error', error);
            const msg = error.response?.data?.message || 'Failed to submit request.';
            Alert.alert('Error', msg);
        } finally {
            setLoading(false);
        }
    };

    const getTitle = () => {
        switch (type) {
            case 'LEAVE': return 'Apply Leave';
            case 'PERMISSION': return 'Request Permission';
            case 'ADVANCE': return 'Request Advance';
            default: return 'Request';
        }
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Icon name="arrow-back" size={24} color="#000" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{getTitle()}</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView style={styles.content}>

                {/* ADVANCE FIELDS */}
                {type === 'ADVANCE' && (
                    <View style={styles.fieldGroup}>
                        <Text style={styles.label}>Amount (₹)</Text>
                        <TextInput
                            style={styles.input}
                            value={amount}
                            onChangeText={setAmount}
                            keyboardType="numeric"
                            placeholder="Enter amount"
                        />
                    </View>
                )}

                {/* LEAVE FIELDS */}
                {type === 'LEAVE' && (
                    <>
                        <View style={styles.fieldGroup}>
                            <Text style={styles.label}>Leave Type</Text>
                            <View style={styles.typeRow}>
                                {['Casual Leave', 'Medical Leave'].map(t => (
                                    <TouchableOpacity
                                        key={t}
                                        style={[styles.typeChip, leaveType === t && styles.activeChip]}
                                        onPress={() => setLeaveType(t)}
                                    >
                                        <Text style={[styles.chipText, leaveType === t && styles.activeChipText]}>{t}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        <View style={styles.row}>
                            <View style={[styles.fieldGroup, { flex: 1, marginRight: 10 }]}>
                                <Text style={styles.label}>From Date</Text>
                                <TouchableOpacity style={styles.dateBtn} onPress={() => openPicker('date', 'date')}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                        <Icon name="event" size={20} color="#666" style={{ marginRight: 8 }} />
                                        <Text style={styles.dateText}>{date.toLocaleDateString()}</Text>
                                    </View>
                                </TouchableOpacity>
                            </View>
                            <View style={[styles.fieldGroup, { flex: 1 }]}>
                                <Text style={styles.label}>To Date</Text>
                                <TouchableOpacity style={styles.dateBtn} onPress={() => openPicker('date', 'endDate')}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                        <Icon name="event" size={20} color="#666" style={{ marginRight: 8 }} />
                                        <Text style={styles.dateText}>{endDate.toLocaleDateString()}</Text>
                                    </View>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </>
                )}

                {/* PERMISSION FIELDS */}
                {type === 'PERMISSION' && (
                    <>
                        <View style={styles.fieldGroup}>
                            <Text style={styles.label}>Date</Text>
                            <TouchableOpacity style={styles.dateBtn} onPress={() => openPicker('date', 'date')}>
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <Icon name="event" size={20} color="#666" style={{ marginRight: 8 }} />
                                    <Text style={styles.dateText}>{date.toLocaleDateString()}</Text>
                                </View>
                            </TouchableOpacity>
                        </View>
                        <View style={styles.row}>
                            <View style={[styles.fieldGroup, { flex: 1, marginRight: 10 }]}>
                                <Text style={styles.label}>Start Time</Text>
                                <TouchableOpacity style={styles.dateBtn} onPress={() => openPicker('time', 'startTime')}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                        <Icon name="schedule" size={20} color="#666" style={{ marginRight: 8 }} />
                                        <Text style={styles.dateText}>{startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                                    </View>
                                </TouchableOpacity>
                            </View>
                            <View style={[styles.fieldGroup, { flex: 1 }]}>
                                <Text style={styles.label}>End Time</Text>
                                <TouchableOpacity style={styles.dateBtn} onPress={() => openPicker('time', 'endTime')}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                        <Icon name="schedule" size={20} color="#666" style={{ marginRight: 8 }} />
                                        <Text style={styles.dateText}>{endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                                    </View>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </>
                )}

                {/* NOTE/REASON - COMMON */}
                <View style={styles.fieldGroup}>
                    <Text style={styles.label}>{type === 'ADVANCE' ? 'Reason for Advance' : 'Reason / Note'}</Text>
                    <TextInput
                        style={[styles.input, { height: 100, textAlignVertical: 'top' }]}
                        value={reason}
                        onChangeText={setReason}
                        placeholder="Enter details..."
                        multiline
                    />
                </View>

                <TouchableOpacity
                    style={[styles.submitBtn, loading && { opacity: 0.7 }]}
                    onPress={handleSubmit}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#FFF" />
                    ) : (
                        <Text style={styles.submitBtnText}>Submit Request</Text>
                    )}
                </TouchableOpacity>

                <View style={{ height: 100 }} />
            </ScrollView>

            {showPicker.show && (
                <DateTimePicker
                    value={
                        showPicker.field === 'date' ? date :
                            showPicker.field === 'endDate' ? endDate :
                                showPicker.field === 'startTime' ? startTime :
                                    showPicker.field === 'endTime' ? endTime : new Date()
                    }
                    mode={showPicker.mode}
                    is24Hour={false}
                    display="default"
                    onChange={handleDateChange}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA'
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 15,
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: '#EEE'
    },
    headerTitle: {
        fontSize: 18,
        fontFamily: 'Poppins-Bold',
        color: '#333'
    },
    content: {
        padding: 20
    },
    fieldGroup: {
        marginBottom: 20
    },
    label: {
        fontSize: 13,
        fontFamily: 'Poppins-Medium',
        color: '#555',
        marginBottom: 8
    },
    input: {
        backgroundColor: '#FFF',
        borderWidth: 1,
        borderColor: '#DDD',
        borderRadius: 8,
        padding: 12,
        fontSize: 14,
        fontFamily: 'Poppins-Regular',
        color: '#333'
    },
    row: {
        flexDirection: 'row'
    },
    dateBtn: {
        backgroundColor: '#FFF',
        borderWidth: 1,
        borderColor: '#DDD',
        borderRadius: 8,
        padding: 12,
        justifyContent: 'center'
    },
    dateText: {
        fontSize: 14,
        color: '#333',
        fontFamily: 'Poppins-Medium'
    },
    typeRow: {
        flexDirection: 'row',
        gap: 10
    },
    typeChip: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        backgroundColor: '#EEE',
        borderWidth: 1,
        borderColor: 'transparent'
    },
    activeChip: {
        backgroundColor: '#FEF2F2',
        borderColor: COLORS.primary
    },
    chipText: {
        fontSize: 13,
        color: '#666',
        fontFamily: 'Poppins-Medium'
    },
    activeChipText: {
        color: COLORS.primary
    },
    submitBtn: {
        backgroundColor: COLORS.primary,
        paddingVertical: 15,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 10
    },
    submitBtnText: {
        color: '#FFF',
        fontSize: 16,
        fontFamily: 'Poppins-Bold'
    }
});

export default ApplyRequestScreen;
