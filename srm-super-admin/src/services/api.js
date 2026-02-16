/**
 * API Service for Super Admin Panel
 */

import axios from 'axios';

// API Base URL - Production
// API Base URL - Production
// In development, we use relative path to trigger the Vite proxy (bypassing CORS)
const API_BASE_URL = import.meta.env.DEV ? '' : 'https://srm-backend-lake.vercel.app';

const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Response interceptor for error handling
api.interceptors.response.use(
    (response) => response,
    (error) => {
        console.error('API Error:', error.response?.data || error.message);
        return Promise.reject(error);
    }
);

// ==================== EMPLOYEE ENDPOINTS ====================

export const getEmployees = async () => {
    const response = await api.get('/api/employees');
    return response.data;
};

export const getEmployee = async (employeeId) => {
    const response = await api.get(`/api/employees/${employeeId}`);
    return response.data;
};

export const createEmployee = async (employeeData) => {
    // Use FormData if there's a photo file
    if (employeeData instanceof FormData) {
        const response = await api.post('/api/employees', employeeData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return response.data;
    }
    const response = await api.post('/api/employees', employeeData);
    return response.data;
};

export const updateEmployee = async (employeeId, updates) => {
    // Use FormData if there's a photo file
    if (updates instanceof FormData) {
        const response = await api.put(`/api/employees/${employeeId}`, updates, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return response.data;
    }
    const response = await api.put(`/api/employees/${employeeId}`, updates);
    return response.data;
};

export const deleteEmployee = async (employeeId) => {
    const response = await api.delete(`/api/employees/${employeeId}`);
    return response.data;
};

// ==================== OTP VERIFICATION ENDPOINTS ====================

export const sendOTP = async (email, employeeName) => {
    const response = await api.post('/api/otp/send', { email, employeeName });
    return response.data;
};

export const verifyOTP = async (email, otp) => {
    const response = await api.post('/api/otp/verify', { email, otp });
    return response.data;
};

export const sendSMSOTP = async (phone, employeeName) => {
    const response = await api.post('/api/otp/send-sms', { phone, employeeName });
    return response.data;
};

export const verifySMSOTP = async (phone, otp) => {
    const response = await api.post('/api/otp/verify-sms', { phone, otp });
    return response.data;
};

// ==================== SETTINGS ENDPOINTS ====================

export const getGeofenceSettings = async () => {
    const response = await api.get('/api/settings/geofence');
    return response.data;
};

export const updateGeofenceSettings = async (settings) => {
    const response = await api.put('/api/settings/geofence', settings);
    return response.data;
};

// ==================== ATTENDANCE ENDPOINTS ====================

// Alias for compatibility
export const getEmployeeById = getEmployee;

export const getAttendanceByDate = async (date) => {
    const response = await api.get(`/api/attendance/date/${date}`);
    return response.data;
};

export const getAttendanceCalendar = async (employeeId, month, year) => {
    const response = await api.get(`/api/attendance/calendar/${employeeId}?month=${month}&year=${year}`);
    return response.data;
};

export const getEmployeeAttendance = async (employeeId, limit = 30) => {
    const response = await api.get(`/api/attendance/${employeeId}?limit=${limit}`);
    return response.data;
};

export const updateAttendance = async (attendanceId, updates) => {
    const response = await api.put(`/api/attendance/${attendanceId}`, updates);
    return response.data;
};

// ==================== BRANCH ENDPOINTS ====================

export const getBranches = async () => {
    const response = await api.get('/api/branches');
    return response.data;
};

export const getBranch = async (branchId) => {
    const response = await api.get(`/api/branches/${branchId}`);
    return response.data;
};

export const createBranch = async (branchData) => {
    const response = await api.post('/api/branches', branchData);
    return response.data;
};

export const updateBranch = async (branchId, updates) => {
    const response = await api.put(`/api/branches/${branchId}`, updates);
    return response.data;
};

export const deleteBranch = async (branchId) => {
    const response = await api.delete(`/api/branches/${branchId}`);
    return response.data;
};

// ==================== LOCATION TRACKING ENDPOINTS ====================

export const getEmployeeLocations = async () => {
    const response = await api.get('/api/location/employees');
    return response.data;
};

export const getWorkSummary = async (employeeId, date) => {
    const url = date
        ? `/api/location/work-summary/${employeeId}?date=${date}`
        : `/api/location/work-summary/${employeeId}`;
    const response = await api.get(url);
    return response.data;
};

// ==================== DASHBOARD ENDPOINTS ====================

export const getDashboardStats = async () => {
    const response = await api.get('/api/dashboard/stats');
    return response.data;
};

// ==================== SALARY ENDPOINTS ====================

export const createSalary = async (salaryData) => {
    const response = await api.post('/api/salary', salaryData);
    return response.data;
};

export const getSalaries = async (employeeId) => {
    const response = await api.get(`/api/salary/employee/${employeeId}`);
    return response.data;
};

export const updateSalary = async (salaryId, data) => {
    const response = await api.put(`/api/salary/${salaryId}`, data);
    return response.data;
};

// ==================== REQUEST ENDPOINTS ====================

export const getAllRequests = async (status = null) => {
    const url = status ? `/api/requests?status=${status}` : '/api/requests';
    const response = await api.get(url);
    return response.data;
};

export const getRequestsByEmployee = async (employeeId) => {
    const response = await api.get(`/api/requests/employee/${employeeId}`);
    return response.data;
};

// ==================== RULES ENDPOINTS ====================

export const getEmployeeRules = async () => {
    const response = await api.get('/api/settings/rules');
    return response.data;
};

export const updateEmployeeRules = async (rulesText, updatedBy) => {
    const response = await api.put('/api/settings/rules', { rules: rulesText, updatedBy });
    return response.data;
};

// ==================== CHAT GROUPS ====================

export const createGroup = async (groupData) => {
    const response = await api.post('/api/chat/groups', groupData);
    return response.data;
};

export const deleteGroup = async (groupId) => {
    const response = await api.delete(`/api/chat/groups/${groupId}`);
    return response.data;
};

export const getUserGroups = async (userId) => {
    const response = await api.get(`/api/chat/groups/${userId}`);
    return response.data;
};

export const updateGroup = async (groupId, groupData) => {
    const response = await api.put(`/api/chat/groups/${groupId}`, groupData);
    return response.data;
};

export const sendMessage = async (groupId, messageData) => {
    const response = await api.post(`/api/chat/groups/${groupId}/messages`, messageData);
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

// ==================== FINANCE / FUND REQUESTS ====================

export const createFundRequest = async (data) => {
    const response = await api.post('/api/finance/request', data);
    return response.data;
};

export const getPendingFundRequests = async (role) => {
    const response = await api.get(`/api/finance/pending/${role}`);
    return response.data;
};

export const processFundRequest = async (data) => {
    const response = await api.post('/api/finance/action', data);
    return response.data;
};

// ==================== AUTH ENDPOINTS ====================

export const checkUserStatus = async (email) => {
    const response = await api.post('/api/auth/status', { email });
    return response.data;
};

export const initiateRegistration = async (email) => {
    const response = await api.post('/api/auth/register/initiate', { email });
    return response.data;
};

export const verifyRegistryOTP = async (email, otp) => {
    const response = await api.post('/api/auth/register/verify', { email, otp });
    return response.data;
};

export const completeRegistration = async (email, password) => {
    const response = await api.post('/api/auth/register/complete', { email, password });
    return response.data;
};

export const login = async (email, password) => {
    const response = await api.post('/api/auth/login', { email, password });
    return response.data;
};

export default api;
