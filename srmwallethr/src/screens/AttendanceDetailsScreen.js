import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Dimensions,
    Modal
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { COLORS } from '../utils/theme';
import api from '../services/api';
import { getSavedEmployee } from '../utils/session';

const { width } = Dimensions.get('window');

const AttendanceDetailsScreen = () => {
    const [employee, setEmployee] = useState(null);
    const [calendarData, setCalendarData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentDate, setCurrentDate] = useState(new Date(2026, 0, 1)); // Default Jan 2026
    const [selectedDay, setSelectedDay] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);
    const insets = useSafeAreaInsets();
    const navigation = useNavigation();

    useEffect(() => {
        loadData();
    }, [currentDate]);

    const changeMonth = (increment) => {
        setCurrentDate(prev => {
            const newDate = new Date(prev);
            newDate.setMonth(newDate.getMonth() + increment);
            return newDate;
        });
        setLoading(true); // Show loading while fetching new month
    };

    const loadData = async () => {
        try {
            const emp = await getSavedEmployee();
            if (emp) {
                // Parallel fetch: Employee Details + Calendar
                // Note: Employee details might not need refetching every month change, but strictly speaking balance might change? 
                // Let's keep it simple for now or optimize to only fetch calendar if emp already exists.

                const promises = [
                    api.get(`/api/attendance/calendar/${emp.employeeId}?month=${currentDate.getMonth()}&year=${currentDate.getFullYear()}`)
                ];

                // Fetch employee data only if not already loaded or maybe strictly on mount? 
                // For now, let's just fetch both to be safe (balances might update).
                promises.push(api.get(`/api/employees/${emp.employeeId}`));

                const [calRes, empRes] = await Promise.all(promises);

                if (empRes.data) setEmployee(empRes.data);
                if (calRes.data.success) {
                    setCalendarData(calRes.data.days);
                }
            }
        } catch (error) {
            console.log('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDayPress = (item) => {
        if (!item.current) return;
        setSelectedDay(item);
        setModalVisible(true);
    };

    const renderCalendar = () => {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

        // Pad start of month
        const firstDayDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const firstDayIndex = firstDayDate.getDay(); // 0-6

        const paddedDays = [];
        // Add empty cells for previous month
        for (let i = 0; i < firstDayIndex; i++) {
            paddedDays.push({ empty: true, key: `prev-${i}` });
        }

        // Merge with API data
        // API returns 1..31. We just map them.
        const mergedDays = [...paddedDays, ...calendarData];

        const rows = [];
        for (let i = 0; i < mergedDays.length; i += 7) {
            rows.push(mergedDays.slice(i, i + 7));
        }

        return (
            <View style={styles.calendarContainer}>
                <View style={styles.calendarHeader}>
                    <TouchableOpacity onPress={() => changeMonth(-1)}><Icon name="chevron-left" size={24} color="#555" /></TouchableOpacity>
                    <Text style={styles.monthTitle}>
                        {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                    </Text>
                    <TouchableOpacity onPress={() => changeMonth(1)}><Icon name="chevron-right" size={24} color="#555" /></TouchableOpacity>
                </View>

                <View style={styles.daysRow}>
                    {days.map(d => <Text key={d} style={styles.dayLabel}>{d}</Text>)}
                </View>

                {rows.map((row, i) => (
                    <View key={i} style={styles.calendarRow}>
                        {row.map((item, j) => {
                            if (item.empty) {
                                return (
                                    <View key={item.key} style={[styles.dateCell, styles.otherMonthCell]}>
                                        <Text style={[styles.dateText, styles.otherMonthText]}></Text>
                                    </View>
                                );
                            }

                            const isHoliday = item.events?.some(e => e.type === 'holiday');

                            // CHANGED: Support all leave status types
                            const leaveEvent = item.events?.find(e => ['leave', 'leave-pending', 'leave-rejected'].includes(e.type));
                            const isLeave = !!leaveEvent;

                            const isPresent = item.events?.some(e => e.type === 'present');
                            const isWeekoff = item.events?.some(e => e.type === 'weekoff');

                            // Find Holiday label
                            const holidayLabel = item.events?.find(e => e.type === 'holiday')?.label;

                            return (
                                <TouchableOpacity
                                    key={j}
                                    style={styles.dateCell}
                                    onPress={() => handleDayPress(item)}
                                >
                                    <Text style={styles.dateText}>{item.day}</Text>
                                    <View style={styles.eventStack}>
                                        {/* Shift Name if needed, or static */}
                                        <Text style={styles.shiftText}>G.Shift</Text>

                                        {item.events?.map((e, idx) => {
                                            // Determine styles dynamically based on type
                                            let bg = '#E8F5E9';
                                            let color = '#1B5E20';
                                            let textDecor = 'none';

                                            switch (e.type) {
                                                case 'holiday': bg = '#E0F7FA'; color = '#006064'; break;
                                                case 'leave': bg = '#FCE4EC'; color = '#880E4F'; break;
                                                case 'leave-pending': bg = '#FFF3E0'; color = '#E65100'; break;
                                                case 'leave-rejected': bg = '#FFEBEE'; color = '#C62828'; textDecor = 'line-through'; break;
                                                case 'permission': bg = '#E1F5FE'; color = '#0277BD'; break;
                                                case 'permission-pending': bg = '#E0F7FA'; color = '#006064'; break;
                                                case 'permission-rejected': bg = '#FFEBEE'; color = '#C62828'; textDecor = 'line-through'; break;
                                                case 'advance': bg = '#E8EAF6'; color = '#283593'; break;
                                                case 'advance-pending': bg = '#E3F2FD'; color = '#1565C0'; break;
                                                case 'advance-rejected': bg = '#FFEBEE'; color = '#C62828'; textDecor = 'line-through'; break;
                                                case 'present': bg = '#E8F5E9'; color = '#1B5E20'; break;
                                                case 'weekoff': bg = '#FFF3E0'; color = '#E65100'; break;
                                                default: bg = '#F5F5F5'; color = '#333';
                                            }

                                            return (
                                                <View key={idx} style={[styles.eventBadge, { backgroundColor: bg }]}>
                                                    <Text style={[styles.eventText, { color: color, textDecorationLine: textDecor }]} numberOfLines={1}>
                                                        {e.label}
                                                    </Text>
                                                </View>
                                            );
                                        })}
                                    </View>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                ))}
            </View>
        );
    };

    const StatusTable = ({ title, data, headers }) => (
        <View style={styles.tableCard}>
            <Text style={styles.tableTitle}>{title}</Text>
            <View style={styles.tableHead}>
                {headers.map((h, i) => (
                    <Text key={i} style={[styles.tableHeadText, { flex: i === 0 ? 2 : 1 }]}>{h}</Text>
                ))}
            </View>
            {data.map((row, i) => (
                <View key={i} style={styles.tableRow}>
                    <Text style={[styles.tableRowText, { flex: 2, fontFamily: 'Poppins-Medium' }]}>{row.type}</Text>
                    <Text style={[styles.tableRowText, { flex: 1, textAlign: 'center' }]}>{row.opening}</Text>
                    <Text style={[styles.tableRowText, { flex: 1, textAlign: 'center' }]}>{row.credit}</Text>
                    <Text style={[styles.tableRowText, { flex: 1, textAlign: 'center' }]}>{row.used}</Text>
                    <Text style={[styles.tableRowText, { flex: 1, textAlign: 'center', color: COLORS.primary, fontFamily: 'Poppins-Bold' }]}>{row.balance}</Text>
                </View>
            ))}
        </View>
    );

    if (loading) {
        return <View style={styles.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>;
    }

    return (
        <View style={[styles.safeArea, { paddingTop: insets.top }]}>
            <ScrollView style={styles.container}>
                {renderCalendar()}

                <View style={styles.section}>
                    <Text style={styles.sectionHeader}>Apply</Text>
                    <View style={styles.applyGrid}>
                        <TouchableOpacity
                            style={[styles.applyBtn, { backgroundColor: '#E3F2FD' }]}
                            onPress={() => navigation.navigate('ApplyRequest', { type: 'PERMISSION' })}
                        >
                            <Icon name="timer" size={24} color="#1565C0" />
                            <Text style={[styles.applyText, { color: '#1565C0' }]}>Permission</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.applyBtn, { backgroundColor: '#F3E5F5' }]}
                            onPress={() => navigation.navigate('ApplyRequest', { type: 'LEAVE' })}
                        >
                            <Icon name="event-busy" size={24} color="#7B1FA2" />
                            <Text style={[styles.applyText, { color: '#7B1FA2' }]}>Leave</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.applyBtn, { backgroundColor: '#FFF3E0' }]}
                            onPress={() => navigation.navigate('ApplyRequest', { type: 'ADVANCE' })}
                        >
                            <Icon name="attach-money" size={24} color="#E65100" />
                            <Text style={[styles.applyText, { color: '#E65100' }]}>Advance</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionHeader}>Short fall</Text>
                    <View style={styles.shortfallBox}>
                        <View style={styles.shortfallItem}>
                            <Text style={styles.sfLabel}>ExcessStay</Text>
                            <Text style={[styles.sfValue, { color: '#2E7D32' }]}>{employee?.shortfallStats?.excessStay || '00:48'}</Text>
                        </View>
                        <View style={styles.shortfallItem}>
                            <Text style={styles.sfLabel}>Shortfall</Text>
                            <Text style={[styles.sfValue, { color: '#D32F2F' }]}>{employee?.shortfallStats?.shortfall || '00:00'}</Text>
                        </View>
                        <View style={styles.shortfallItem}>
                            <Text style={styles.sfLabel}>Difference</Text>
                            <Text style={[styles.sfValue, { color: COLORS.primary }]}>{employee?.shortfallStats?.difference || '00:48'}</Text>
                        </View>
                    </View>
                </View>

                <StatusTable
                    title="Leave Details"
                    headers={['Type', 'Open', 'Cr', 'Used', 'Bal']}
                    data={(employee?.leaveBalances || []).filter(l => l.type !== 'Spell Leave')}
                />



                <View style={{ height: 40 }} />
            </ScrollView>

            {/* Detail Modal */}
            <Modal
                transparent={true}
                visible={modalVisible}
                animationType="fade"
                onRequestClose={() => setModalVisible(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setModalVisible(false)}
                >
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>
                                {selectedDay ? new Date(selectedDay.date).toDateString() : ''}
                            </Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <Icon name="close" size={24} color="#666" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.modalBody}>
                            {selectedDay?.details ? (
                                <>
                                    <View style={styles.detailRow}>
                                        <View style={styles.detailItem}>
                                            <Icon name="login" size={20} color={COLORS.primary} />
                                            <Text style={styles.detailLabel}>Check In</Text>
                                            <Text style={styles.detailValue}>{selectedDay.details.checkIn}</Text>
                                        </View>
                                        <View style={styles.detailItem}>
                                            <Icon name="logout" size={20} color={COLORS.primary} />
                                            <Text style={styles.detailLabel}>Check Out</Text>
                                            <Text style={styles.detailValue}>{selectedDay.details.checkOut}</Text>
                                        </View>
                                    </View>
                                    <View style={styles.durationBox}>
                                        <Icon name="schedule" size={20} color="#FFF" />
                                        <Text style={{ color: '#FFF', fontFamily: 'Poppins-Bold', marginLeft: 8 }}>
                                            Total Work Time: {selectedDay.details.duration}
                                        </Text>
                                    </View>
                                </>
                            ) : (
                                <View style={{ alignItems: 'center', padding: 20 }}>
                                    <Icon name="info-outline" size={40} color="#CCC" />
                                    <Text style={{ color: '#999', marginTop: 10 }}>No working hours recorded.</Text>
                                </View>
                            )}

                            {/* Show Events if any */}
                            {selectedDay?.events?.length > 0 && (
                                <View style={{ marginTop: 20 }}>
                                    {selectedDay.events.map((e, idx) => (
                                        <View key={idx} style={[styles.modalBadge, {
                                            backgroundColor: e.type === 'holiday' ? '#E0F7FA' :
                                                e.type === 'leave' ? '#FCE4EC' :
                                                    e.type === 'leave-pending' ? '#FFF3E0' :
                                                        e.type === 'leave-rejected' ? '#FFEBEE' :
                                                            e.type === 'permission' ? '#E1F5FE' :
                                                                e.type === 'permission-pending' ? '#E0F7FA' :
                                                                    e.type === 'permission-rejected' ? '#FFEBEE' :
                                                                        e.type === 'present' ? '#E8F5E9' : '#FFF3E0'
                                        }]}>
                                            <Text style={{ color: '#333', fontSize: 12, fontFamily: 'Poppins-Medium' }}>
                                                {e.label}
                                            </Text>
                                        </View>
                                    ))}
                                </View>
                            )}
                        </View>
                    </View>
                </TouchableOpacity>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#F8F9FA' },
    container: { flex: 1 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    calendarContainer: {
        backgroundColor: '#FFF',
        padding: 10,
        margin: 10,
        borderRadius: 8,
        elevation: 2,
    },
    calendarHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
        paddingHorizontal: 10,
    },
    monthTitle: { fontSize: 18, fontFamily: 'Poppins-Bold', color: '#333' },
    daysRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#EEE', paddingBottom: 5 },
    dayLabel: { flex: 1, textAlign: 'center', fontSize: 12, color: '#999', fontFamily: 'Poppins-Medium' },
    calendarRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
    dateCell: {
        flex: 1,
        minHeight: 85,
        padding: 4,
        borderRightWidth: 1,
        borderRightColor: '#F5F5F5'
    },
    otherMonthCell: { backgroundColor: '#FAFAFA' },
    dateText: { fontSize: 13, fontFamily: 'Poppins-SemiBold', color: '#555' },
    otherMonthText: { color: '#CCC' },
    eventStack: { marginTop: 4, gap: 2 },
    shiftText: { fontSize: 9, color: '#999', fontFamily: 'Poppins-Regular' },
    eventBadge: { paddingHorizontal: 4, paddingVertical: 1, borderRadius: 2 },
    eventText: { fontSize: 8, fontFamily: 'Poppins-Bold' },
    section: { marginHorizontal: 10, marginBottom: 15 },
    sectionHeader: { fontSize: 16, fontFamily: 'Poppins-Bold', color: '#333', marginBottom: 10 },
    applyGrid: { flexDirection: 'row', gap: 10 },
    applyBtn: {
        flex: 1,
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)'
    },
    applyText: { fontSize: 11, fontFamily: 'Poppins-Bold', marginTop: 5 },
    shortfallBox: {
        flexDirection: 'row',
        backgroundColor: '#FFF',
        borderRadius: 8,
        padding: 15,
        elevation: 1,
        borderWidth: 1,
        borderColor: '#EEE'
    },
    shortfallItem: { flex: 1, alignItems: 'center' },
    sfLabel: { fontSize: 12, color: '#999', fontFamily: 'Poppins-Regular' },
    sfValue: { fontSize: 16, fontFamily: 'Poppins-Bold' },
    tableCard: {
        backgroundColor: '#FFF',
        margin: 10,
        borderRadius: 8,
        padding: 15,
        elevation: 1,
        borderWidth: 1,
        borderColor: '#EEE'
    },
    tableTitle: { fontSize: 16, fontFamily: 'Poppins-Bold', color: '#7B1FA2', marginBottom: 12 },
    tableHead: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#EEE', paddingBottom: 8, marginBottom: 8 },
    tableHeadText: { fontSize: 11, color: '#999', fontFamily: 'Poppins-Bold', textTransform: 'uppercase' },
    tableRow: { flexDirection: 'row', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F9F9F9' },
    tableRowText: { fontSize: 12, color: '#444' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
    modalContent: { width: '85%', backgroundColor: '#FFF', borderRadius: 12, padding: 20, elevation: 5 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 18, fontFamily: 'Poppins-Bold', color: '#333' },
    modalBody: {},
    detailRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
    detailItem: { alignItems: 'center', flex: 1 },
    detailLabel: { fontSize: 12, color: '#999', marginTop: 5 },
    detailValue: { fontSize: 16, fontFamily: 'Poppins-Bold', color: '#333', marginTop: 2 },
    durationBox: { flexDirection: 'row', backgroundColor: COLORS.primary, padding: 12, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
    modalBadge: { padding: 8, borderRadius: 4, marginBottom: 5, alignItems: 'center' }
});

export default AttendanceDetailsScreen;
