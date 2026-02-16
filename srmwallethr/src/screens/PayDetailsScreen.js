import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { COLORS } from '../utils/theme';
import api from '../services/api';
import { getSavedEmployee } from '../utils/session';

const PayDetailsScreen = () => {
    const insets = useSafeAreaInsets();
    const [salaries, setSalaries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [employee, setEmployee] = useState(null);

    const loadSalaries = async () => {
        try {
            const emp = await getSavedEmployee();
            if (emp) {
                setEmployee(emp);
                const response = await api.get(`/api/salary/employee/${emp.employeeId}`);
                // Match backend structure: router.get('/employee/:employeeId' returns array)
                const data = response.data;

                // Sort by year and month descending
                const sorted = (data || []).sort((a, b) => {
                    if (a.year !== b.year) return b.year - a.year;
                    return b.month - a.month;
                });
                setSalaries(sorted);
            }
        } catch (error) {
            console.log('Error loading salaries:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadSalaries();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        loadSalaries();
    };

    const getMonthName = (monthNum) => {
        const months = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];
        return months[monthNum - 1] || 'Unknown';
    };

    const TableHeader = () => (
        <View style={styles.tableHeader}>
            <Text style={[styles.headerText, { flex: 1.5 }]}>Month/Year</Text>
            <Text style={[styles.headerText, { flex: 1 }]}>Gross</Text>
            <Text style={[styles.headerText, { flex: 1 }]}>Deduction</Text>
            <Text style={[styles.headerText, { flex: 1 }]}>Net Pay</Text>
            <Text style={[styles.headerText, { flex: 0.8, textAlign: 'center' }]}>Slip</Text>
        </View>
    );

    const TableRow = ({ item }) => (
        <View style={styles.tableRow}>
            <View style={{ flex: 1.5 }}>
                <Text style={styles.monthText}>{getMonthName(item.month)}</Text>
                <Text style={styles.yearText}>{item.year}</Text>
            </View>
            <Text style={[styles.valueText, { flex: 1 }]}>₹{item.grossSalary?.toLocaleString()}</Text>
            <Text style={[styles.valueText, { flex: 1, color: '#D32F2F' }]}>₹{item.totalDeductions?.toLocaleString()}</Text>
            <Text style={[styles.valueText, { flex: 1, color: '#2E7D32', fontFamily: 'Poppins-Bold' }]}>₹{item.netPayable?.toLocaleString() || item.netSalary?.toLocaleString()}</Text>
            <TouchableOpacity style={{ flex: 0.8, alignItems: 'center' }}>
                <Icon name="file-download" size={24} color={COLORS.primary} />
            </TouchableOpacity>
        </View>
    );

    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <View style={styles.payHeader}>
                <Icon name="payments" size={32} color={COLORS.primary} />
                <Text style={styles.payHeaderText}>Salary History</Text>
            </View>

            <ScrollView
                horizontal={true}
                contentContainerStyle={{ flex: 1 }}
            >
                <View style={{ flex: 1 }}>
                    <TableHeader />
                    <ScrollView
                        refreshControl={
                            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
                        }
                    >
                        {salaries.length > 0 ? (
                            salaries.map((item, index) => (
                                <TableRow key={index} item={item} />
                            ))
                        ) : (
                            <View style={styles.emptyContainer}>
                                <Text style={styles.emptyText}>No salary records found.</Text>
                            </View>
                        )}
                        <View style={{ height: 40 }} />
                    </ScrollView>
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    payHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#F0F9FF',
        gap: 12,
        marginBottom: 10,
    },
    payHeaderText: {
        fontSize: 22,
        fontFamily: 'Poppins-Bold',
        color: '#003366',
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: COLORS.primary,
        paddingVertical: 12,
        paddingHorizontal: 15,
    },
    headerText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontFamily: 'Poppins-Bold',
        textTransform: 'uppercase',
    },
    tableRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 15,
        paddingHorizontal: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#EEEEEE',
    },
    monthText: {
        fontSize: 14,
        fontFamily: 'Poppins-Medium',
        color: '#333',
    },
    yearText: {
        fontSize: 12,
        color: '#666',
        fontFamily: 'Poppins-Regular',
    },
    valueText: {
        fontSize: 13,
        fontFamily: 'Poppins-Medium',
        color: '#333',
    },
    emptyContainer: {
        padding: 40,
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 14,
        fontFamily: 'Poppins-Regular',
        color: '#999',
    }
});

export default PayDetailsScreen;
