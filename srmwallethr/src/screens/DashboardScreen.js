import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Dimensions, RefreshControl } from 'react-native';
import { COLORS } from '../constants/colors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api, { getRequestsByEmployee } from '../services/api';

// Placeholder for charts/icons. using text/simple blocks for now.
// In a real app we'd use react-native-chart-kit or similar.

import { getSavedEmployee, saveSession, calculateTodayDuration } from '../utils/session';
import { getAttendanceStatus } from '../services/api';

const DashboardScreen = ({ navigation }) => {
    const [employee, setEmployee] = useState(null);
    const [attendanceStatus, setAttendanceStatus] = useState(null);
    const [todayDuration, setTodayDuration] = useState('0h 0m');
    const [loading, setLoading] = useState(false);
    const [requests, setRequests] = useState([]);
    const [activeRequestTab, setActiveRequestTab] = useState(null);

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        try {
            setLoading(true);
            const initialEmployee = await getSavedEmployee();
            console.log('[Dashboard] Initial employee from storage:', initialEmployee?.employeeId);

            if (initialEmployee && initialEmployee.employeeId) {
                setEmployee(initialEmployee);

                // Parallel fetch for fresh details, status, and REQUESTS
                const [empRes, statusRes, requestsRes] = await Promise.all([
                    api.get(`/api/employees/${initialEmployee.employeeId}`),
                    getAttendanceStatus(initialEmployee.employeeId),
                    getRequestsByEmployee(initialEmployee.employeeId).catch(() => ({ success: false, requests: [] }))
                ]);

                console.log('[Dashboard] Emp details response:', empRes.data?.success);
                console.log('[Dashboard] Attendance status response:', statusRes?.success);

                if (empRes.data.success) {
                    const freshEmployee = empRes.data.employee;
                    setEmployee(freshEmployee);
                    await saveSession(freshEmployee);
                }

                if (statusRes.success) {
                    setAttendanceStatus(statusRes.status);

                    // Calculate duration
                    if (statusRes.status?.attendanceRecords) {
                        const { formattedDuration } = calculateTodayDuration(statusRes.status.attendanceRecords);
                        setTodayDuration(formattedDuration);
                    }
                }

                if (requestsRes.success) {
                    setRequests(requestsRes.requests);
                }
            } else {
                console.log('[Dashboard] No employee found in storage, redirecting to login');
                navigation.replace('Login');
            }
        } catch (error) {
            console.log('Error loading dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const getPendingCount = (type) => {
        return requests.filter(r => r.type === type && r.status === 'Pending').length;
    };

    const renderRequestList = (type) => {
        const filtered = requests.filter(r => r.type === type);
        if (filtered.length === 0) {
            return <Text style={styles.noRequestsText}>No {type.toLowerCase()} requests found.</Text>;
        }
        return filtered.map(req => (
            <View key={req.requestId} style={styles.requestItem}>
                <View style={styles.reqHeader}>
                    <Text style={styles.reqDate}>{new Date(req.createdAt).toLocaleDateString()}</Text>
                    <View style={[
                        styles.reqStatusBadge,
                        req.status === 'APPROVED' ? styles.statusApproved :
                            req.status === 'REJECTED' ? styles.statusRejected :
                                styles.statusPending
                    ]}>
                        <Text style={[
                            styles.reqStatusText,
                            req.status === 'APPROVED' ? styles.textApproved :
                                req.status === 'REJECTED' ? styles.textRejected :
                                    styles.textPending
                        ]}>{req.status}</Text>
                    </View>
                </View>
                <View style={styles.reqBody}>
                    {type === 'ADVANCE' && <Text style={styles.reqDetail}>Amount: ₹{req.data?.amount}</Text>}
                    {type === 'LEAVE' && <Text style={styles.reqDetail}>Type: {req.data?.leaveType}</Text>}
                    {type === 'PERMISSION' && <Text style={styles.reqDetail}>Time: {req.data?.duration} mins</Text>}
                    {req.data?.reason && <Text style={styles.reqReason}>"{req.data.reason}"</Text>}
                </View>
            </View>
        ));
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>SRM Group Institutions</Text>
                <View style={styles.headerIcons}>
                    {/* Icons would go here */}
                </View>
            </View>

            <ScrollView
                style={styles.content}
                refreshControl={
                    <RefreshControl refreshing={loading} onRefresh={loadProfile} colors={[COLORS.primary]} />
                }
            >

                {/* Profile Card */}
                <View style={styles.card}>
                    <View style={styles.profileRow}>
                        <Image source={{ uri: employee?.photoUrl }} style={styles.avatar} />
                        <View style={styles.profileInfo}>
                            <Text style={styles.name}>{employee?.firstName ? `${employee.firstName} ${employee.lastName || ''}` : (employee?.name || employee?.employeeId || 'Loading...')}</Text>
                            <Text style={styles.designation}>{employee?.designation || 'Employee'} | {employee?.associateCode || employee?.employeeId}</Text>
                            <Text style={styles.location}>{employee?.location || 'Location not set'}</Text>
                            <TouchableOpacity onPress={() => navigation.navigate('Requests', { initialTab: 'HISTORY' })}>
                                <Text style={styles.link}>My Request Status</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={styles.moodSection}>
                        <Text style={styles.sectionTitle}>What's your mood today?</Text>
                        <View style={styles.emojis}>
                            <Text style={styles.emoji}>😊</Text>
                            <Text style={styles.emoji}>😐</Text>
                            <Text style={styles.emoji}>😢</Text>
                        </View>
                    </View>

                    <View style={styles.checkInSection}>
                        <Text style={styles.checkInLabel}>Check In Time</Text>
                        <Text style={styles.checkInTime}>
                            {attendanceStatus?.checkInTime
                                ? new Date(attendanceStatus.checkInTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                                : '--:--'}
                        </Text>
                        <View style={styles.progressBar}>
                            <View
                                style={[
                                    styles.progressFill,
                                    { width: `${Math.min((attendanceStatus?.totalWorkDurationMinutes || 0) / 4.8, 100)}%` } // 480 mins = 8 hours
                                ]}
                            />
                        </View>
                        <Text style={styles.progressText}>
                            {todayDuration}
                        </Text>
                    </View>
                </View>

                {/* ---------------- NEW REQUESTS WIDGET ---------------- */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>My Requests</Text>
                    <View style={styles.requestButtonsRow}>
                        {['ADVANCE', 'PERMISSION', 'LEAVE'].map(type => {
                            const pendingCount = getPendingCount(type);
                            const isActive = activeRequestTab === type;
                            const label = type.charAt(0) + type.slice(1).toLowerCase();

                            // Choose button color based on type
                            let btnColor = '#757575';
                            if (type === 'ADVANCE') btnColor = '#2196F3';
                            if (type === 'PERMISSION') btnColor = '#9C27B0';
                            if (type === 'LEAVE') btnColor = '#FF9800';

                            return (
                                <TouchableOpacity
                                    key={type}
                                    style={[
                                        styles.reqButton,
                                        { backgroundColor: btnColor },
                                        isActive && styles.reqButtonActive
                                    ]}
                                    onPress={() => setActiveRequestTab(isActive ? null : type)}
                                >
                                    <Text style={styles.reqButtonText}>{label}</Text>
                                    {pendingCount > 0 && (
                                        <View style={styles.badgeContainer}>
                                            <Text style={styles.badgeText}>{pendingCount}</Text>
                                        </View>
                                    )}
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    {activeRequestTab && (
                        <View style={styles.requestListContainer}>
                            {renderRequestList(activeRequestTab)}
                            <TouchableOpacity
                                style={styles.viewHistoryBtn}
                                onPress={() => navigation.navigate('Requests', { initialTab: 'HISTORY' })}
                            >
                                <Text style={styles.viewHistoryText}>View Full History →</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
                {/* ----------------------------------------------------- */}

                {/* Leave Details Chart Placeholder */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Leave Details</Text>
                    <View style={styles.chartPlaceholder}>
                        <Text>Chart Visual Here</Text>
                        {/* 
                         In React Native, we would use <BarChart /> from react-native-chart-kit
                         For this demo, we layout basic bars
                        */}
                        <View style={styles.barRow}>
                            <View style={styles.barGroup}>
                                <View style={[styles.bar, { height: 50, backgroundColor: COLORS.chart.red }]} />
                                <View style={[styles.bar, { height: 100, backgroundColor: COLORS.chart.blue }]} />
                                <Text style={styles.barLabel}>Casual</Text>
                            </View>
                            <View style={styles.barGroup}>
                                <View style={[styles.bar, { height: 20, backgroundColor: COLORS.chart.red }]} />
                                <View style={[styles.bar, { height: 120, backgroundColor: COLORS.chart.blue }]} />
                                <Text style={styles.barLabel}>Spell</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Thoughts Of The Day */}
                <View style={[styles.card, { backgroundColor: '#E3F2FD' }]}>
                    <Text style={styles.cardTitle}>Thoughts Of The Day</Text>
                    <Text style={styles.quote}>“Lead with a positive attitude and...”</Text>
                </View>

                {/* Celebrations */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Celebrations</Text>
                    <View style={styles.celebrationRow}>
                        <View style={styles.celebrationItem}>
                            <Text>Today</Text>
                            <View style={styles.donut} />
                        </View>
                        <View style={styles.celebrationItem}>
                            <Text>Tomorrow</Text>
                            <View style={styles.donut} />
                        </View>
                    </View>
                </View>

            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    header: {
        backgroundColor: COLORS.primary,
        padding: 15,
        paddingTop: 40,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerTitle: {
        color: COLORS.white,
        fontSize: 18,
        fontWeight: 'bold',
    },
    content: {
        flex: 1,
        padding: 10,
    },
    card: {
        backgroundColor: COLORS.white,
        borderRadius: 10,
        padding: 15,
        marginBottom: 15,
        elevation: 2,
    },
    profileRow: {
        flexDirection: 'row',
        marginBottom: 20,
    },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        marginRight: 15,
    },
    profileInfo: {
        flex: 1,
        justifyContent: 'center',
    },
    name: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    designation: {
        fontSize: 14,
        color: COLORS.textSecondary,
    },
    location: {
        fontSize: 12,
        color: COLORS.textSecondary,
        marginBottom: 5,
    },
    link: {
        color: COLORS.primary,
        fontSize: 14,
    },
    moodSection: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 16,
        marginBottom: 10,
        color: COLORS.text,
    },
    emojis: {
        flexDirection: 'row',
        gap: 15,
    },
    emoji: {
        fontSize: 30,
    },
    checkInSection: {
        alignItems: 'center',
    },
    checkInLabel: {
        fontSize: 14,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    checkInTime: {
        fontSize: 16,
        color: COLORS.success,
        marginBottom: 5,
    },
    progressBar: {
        width: '100%',
        height: 10,
        backgroundColor: '#E0E0E0',
        borderRadius: 5,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: COLORS.success,
    },
    progressText: {
        alignSelf: 'flex-end',
        fontSize: 12,
        color: COLORS.success,
        marginTop: 2,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: 15,
        textAlign: 'center'
    },
    chartPlaceholder: {
        height: 150,
        justifyContent: 'center',
        alignItems: 'center',
    },
    barRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: 20,
        height: 120,
    },
    barGroup: {
        alignItems: 'center',
    },
    bar: {
        width: 20,
        marginBottom: 2,
    },
    barLabel: {
        fontSize: 10,
        color: COLORS.textSecondary
    },
    quote: {
        fontStyle: 'italic',
        fontSize: 16,
        color: COLORS.primary,
        textAlign: 'center',
        marginTop: 10
    },
    celebrationRow: {
        flexDirection: 'row',
        justifyContent: 'space-around'
    },
    celebrationItem: {
        alignItems: 'center'
    },
    donut: {
        width: 60,
        height: 60,
        borderRadius: 30,
        borderWidth: 10,
        borderColor: '#F8BBD0',
        marginTop: 10
    },

    // --- NEW STYLES for REQUESTS WIDGET ---
    requestButtonsRow: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 10
    },
    reqButton: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 6,
        position: 'relative', // For badge
    },
    reqButtonActive: {
        opacity: 0.8,
        borderWidth: 2,
        borderColor: '#333'
    },
    reqButtonText: {
        color: '#FFF',
        fontSize: 12,
        fontWeight: 'bold'
    },
    badgeContainer: {
        position: 'absolute',
        top: -6,
        right: -6,
        backgroundColor: 'red',
        borderRadius: 10,
        width: 18,
        height: 18,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#FFF'
    },
    badgeText: {
        color: '#FFF',
        fontSize: 10,
        fontWeight: 'bold'
    },
    requestListContainer: {
        maxHeight: 250,
        marginTop: 5,
        borderTopWidth: 1,
        borderTopColor: '#EEE',
        paddingTop: 5
    },
    noRequestsText: {
        textAlign: 'center',
        color: '#999',
        fontSize: 13,
        marginTop: 10
    },
    requestItem: {
        backgroundColor: '#f9f9f9',
        padding: 10,
        borderRadius: 6,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#eee'
    },
    reqHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 4
    },
    reqDate: {
        fontSize: 11,
        color: '#888'
    },
    reqStatusBadge: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        borderWidth: 1
    },
    reqStatusText: {
        fontSize: 9,
        fontWeight: 'bold',
        textTransform: 'uppercase'
    },
    statusPending: { backgroundColor: '#FFF3E0', borderColor: '#FFB74D' },
    statusApproved: { backgroundColor: '#E8F5E9', borderColor: '#AED581' },
    statusRejected: { backgroundColor: '#FFEBEE', borderColor: '#E57373' },
    textPending: { color: '#EF6C00' },
    textApproved: { color: '#2E7D32' },
    textRejected: { color: '#C62828' },
    reqBody: {
        paddingLeft: 2
    },
    reqDetail: {
        fontSize: 13,
        color: '#333',
        fontWeight: '500'
    },
    reqReason: {
        fontSize: 12,
        color: '#666',
        fontStyle: 'italic',
        marginTop: 2
    },
    viewHistoryBtn: {
        marginTop: 10,
        padding: 10,
        backgroundColor: '#f0f0f0',
        borderRadius: 6,
        alignItems: 'center'
    },
    viewHistoryText: {
        color: COLORS.primary,
        fontSize: 12,
        fontWeight: 'bold'
    }
});

export default DashboardScreen;
