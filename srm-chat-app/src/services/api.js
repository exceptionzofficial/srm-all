/**
 * API Configuration and Service for SRM Employee Chat App
 */

import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'https://srm-backend-lake.vercel.app';

const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 120000,
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use(
    async (config) => {
        const token = await AsyncStorage.getItem('authToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

api.interceptors.response.use(
    (response) => response,
    (error) => {
        console.log('API Error:', error.response?.data?.message || error.message);
        return Promise.reject(error);
    }
);

// ==================== EMPLOYEE ENDPOINTS ====================

export const verifyEmployeeId = async (employeeId, branchId = null) => {
    const payload = { employeeId };
    if (branchId) payload.branchId = branchId;
    const response = await api.post('/api/employees/verify-id', payload);
    return response.data;
};

export const login = async (email, password) => {
    const response = await api.post('/api/auth/login', { email, password });
    return response.data;
};

export const forgotPassword = async (email) => {
    const response = await api.post('/api/auth/password/forgot', { email });
    return response.data;
};

export const verifyOTP = async (email, otp) => {
    const response = await api.post('/api/auth/register/verify', { email, otp });
    return response.data;
};

export const resetPassword = async (email, password) => {
    const response = await api.post('/api/auth/register/complete', { email, password });
    return response.data;
};

export const getEmployee = async (employeeId) => {
    const response = await api.get(`/api/employees/${employeeId}`);
    return response.data;
};

export const getEmployees = async () => {
    const response = await api.get('/api/employees');
    return response.data;
};

// ==================== CHAT ENDPOINTS ====================

export const getGroupById = async (groupId) => {
    const response = await api.get(`/api/chat/groups/details/${groupId}`);
    return response.data;
};

export const getUserGroups = async (userId) => {
    const response = await api.get(`/api/chat/groups/${userId}`);
    return response.data;
};

export const sendMessage = async (groupId, messageData) => {
    const response = await api.post(`/api/chat/groups/${groupId}/messages`, messageData);
    return response.data;
};

export const sendMediaMessage = async (groupId, formData) => {
    const response = await api.post(`/api/chat/groups/${groupId}/messages`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 180000,
    });
    return response.data;
};

export const getMessages = async (groupId) => {
    const response = await api.get(`/api/chat/groups/${groupId}/messages`);
    return response.data;
};

export const markMessageAsRead = async (groupId, userId) => {
    const response = await api.post(`/api/chat/groups/${groupId}/read`, { userId });
    return response.data;
};

export const votePoll = async (groupId, messageId, userId, optionIndex) => {
    const response = await api.post(`/api/chat/groups/${groupId}/messages/${messageId}/vote`, { userId, optionIndex });
    return response.data;
};

export const updateGroup = async (groupId, updates) => {
    const response = await api.put(`/api/chat/groups/${groupId}`, updates);
    return response.data;
};

// ==================== FCM TOKEN ====================

export const registerFcmToken = async (employeeId, token) => {
    const response = await api.post('/api/chat/register-fcm-token', { employeeId, token });
    return response.data;
};

export default api;
