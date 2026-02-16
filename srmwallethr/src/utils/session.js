/**
 * Session Management for SRM Sweets Mobile App
 * Handles persistent login state using AsyncStorage
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const SESSION_KEY = '@srm_session';
const EMPLOYEE_KEY = '@srm_employee';

/**
 * Save employee session after successful check-in/status update
 */
export const saveSession = async (employee, isTracking = false) => {
    try {
        const session = {
            employeeId: employee.employeeId,
            name: employee.name,
            branchId: employee.branchId,
            faceId: employee.faceId,
            loginTime: new Date().toISOString(),
            isTracking: isTracking || employee.isTracking || false, // Save tracking status
        };
        await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session));
        await AsyncStorage.setItem(EMPLOYEE_KEY, JSON.stringify(employee));
        return true;
    } catch (error) {
        console.error('Error saving session:', error);
        return false;
    }
};

/**
 * Get current session (if exists)
 */
export const getSession = async () => {
    try {
        const session = await AsyncStorage.getItem(SESSION_KEY);
        return session ? JSON.parse(session) : null;
    } catch (error) {
        console.error('Error getting session:', error);
        return null;
    }
};

/**
 * Get saved employee data
 */
export const getSavedEmployee = async () => {
    try {
        const employee = await AsyncStorage.getItem(EMPLOYEE_KEY);
        return employee ? JSON.parse(employee) : null;
    } catch (error) {
        console.error('Error getting employee:', error);
        return null;
    }
};

/**
 * Check if user is logged in (has valid session)
 */
export const isLoggedIn = async () => {
    const session = await getSession();
    return session !== null && session.employeeId !== null;
};

/**
 * Clear session (logout)
 */
export const clearSession = async () => {
    try {
        await AsyncStorage.removeItem(SESSION_KEY);
        await AsyncStorage.removeItem(EMPLOYEE_KEY);
        return true;
    } catch (error) {
        console.error('Error clearing session:', error);
        return false;
    }
};

/**
 * Calculate total work duration for today (handles multiple check-ins/outs)
 * @param {Array} attendanceRecords - Array of attendance records for today
 * @returns {Object} { totalMs, formattedDuration, sessions }
 */
export const calculateTodayDuration = (attendanceRecords) => {
    if (!attendanceRecords || attendanceRecords.length === 0) {
        return { totalMs: 0, formattedDuration: '0h 0m 0s', sessions: [] };
    }

    let totalMs = 0;
    const sessions = [];

    attendanceRecords.forEach((record) => {
        if (record.checkInTime) {
            const checkIn = new Date(record.checkInTime);
            const checkOut = record.checkOutTime
                ? new Date(record.checkOutTime)
                : new Date(); // Use current time if not checked out

            const diff = checkOut - checkIn;

            if (diff > 0) {
                totalMs += diff;
                sessions.push({
                    checkIn: checkIn.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
                    checkOut: record.checkOutTime
                        ? checkOut.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                        : 'Active',
                    duration: formatDuration(diff),
                    isActive: !record.checkOutTime,
                });
            }
        }
    });

    return {
        totalMs,
        formattedDuration: formatDuration(totalMs),
        sessions,
    };
};

/**
 * Format milliseconds to hours, minutes, seconds string
 */
export const formatDuration = (ms) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours}h ${minutes}m ${seconds}s`;
};

export default {
    saveSession,
    getSession,
    getSavedEmployee,
    isLoggedIn,
    clearSession,
    calculateTodayDuration,
    formatDuration,
};
