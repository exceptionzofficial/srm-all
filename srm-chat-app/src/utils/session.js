/**
 * Session Management for SRM Employee Chat App
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const EMPLOYEE_KEY = '@srm_chat_employee';

export const saveEmployee = async (employee) => {
    try {
        await AsyncStorage.setItem(EMPLOYEE_KEY, JSON.stringify(employee));
        return true;
    } catch (error) {
        console.error('Error saving employee:', error);
        return false;
    }
};

export const saveUserSession = saveEmployee;

export const getSavedEmployee = async () => {
    try {
        const employee = await AsyncStorage.getItem(EMPLOYEE_KEY);
        return employee ? JSON.parse(employee) : null;
    } catch (error) {
        console.error('Error getting employee:', error);
        return null;
    }
};

export const isLoggedIn = async () => {
    const emp = await getSavedEmployee();
    return emp !== null && emp.employeeId !== null;
};

export const clearSession = async () => {
    try {
        await AsyncStorage.removeItem(EMPLOYEE_KEY);
        return true;
    } catch (error) {
        console.error('Error clearing session:', error);
        return false;
    }
};
