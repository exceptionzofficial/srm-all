import axios from 'axios';

// Use relative path to leverage Vite proxy in development
// This bypasses CORS issues by making requests to localhost
const API_BASE_URL = '/api';

// For production (if not using proxy): https://srm-backend-lake.vercel.app/api
const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Employee verification
export const verifyEmployeeId = async (employeeId) => {
    const response = await api.post('/employees/verify-id', { employeeId });
    return response.data;
};

// Get employee by ID
export const getEmployee = async (employeeId) => {
    const response = await api.get(`/employees/${employeeId}`);
    return response.data;
};

// Face registration
export const registerFace = async (employeeId, imageBase64, latitude, longitude) => {
    const response = await api.post('/face/register', {
        employeeId,
        imageBase64: imageBase64,
        latitude: latitude || 0,
        longitude: longitude || 0,
        isKiosk: true
    });
    return response.data;
};

// Face verification for check-in/out
export const verifyFace = async (imageBase64, employeeId) => {
    const response = await api.post('/face/verify', {
        imageBase64: imageBase64,
        expectedEmployeeId: employeeId,
        latitude: 0,
        longitude: 0,
        isKiosk: true
    });
    return response.data;
};

// Check in
export const checkIn = async (employeeId, imageBase64, latitude, longitude, type = 'KIOSK') => {
    const response = await api.post('/attendance/check-in', {
        employeeId,
        imageBase64,
        latitude: latitude || 0,
        longitude: longitude || 0,
        type,
    });
    return response.data;
};

// Check out
export const checkOut = async (employeeId, imageBase64, latitude, longitude) => {
    const response = await api.post('/attendance/check-out', {
        employeeId,
        imageBase64,
        latitude,
        longitude,
    });
    return response.data;
};

// Get attendance status
export const getAttendanceStatus = async (employeeId) => {
    const response = await api.get(`/attendance/status/${employeeId}`);
    return response.data;
};

export default api;
