/**
 * API Configuration and Service for SRM Sweets Mobile App
 */

import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// API Base URL - Production Vercel deployment
const API_BASE_URL = 'https://srm-backend-lake.vercel.app'; // Production
// const API_BASE_URL = 'http://10.0.2.2:3001'; // Local Android Emulator
// const API_BASE_URL = 'http://localhost:3001'; // iOS / Web

const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 120000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor for adding auth token
api.interceptors.request.use(
    async (config) => {
        const token = await AsyncStorage.getItem('authToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor for error handling
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Use console.log instead of console.error to avoid red popup in dev mode
        console.log('API Error:', error.response?.data?.message || error.message);
        return Promise.reject(error);
    }
);

// ==================== AUTH ENDPOINTS ====================

export const loginUser = async (email, password) => {
    const response = await api.post('/api/auth/login', { email, password });
    return response.data;
};

export const checkEmailStatus = async (email) => {
    const response = await api.post('/api/auth/status', { email });
    return response.data;
};

export const registerInitiate = async (email) => {
    const response = await api.post('/api/auth/register/initiate', { email });
    return response.data;
};

export const registerVerify = async (email, otp) => {
    const response = await api.post('/api/auth/register/verify', { email, otp });
    return response.data;
};

export const registerComplete = async (email, password) => {
    const response = await api.post('/api/auth/register/complete', { email, password });
    return response.data;
};

// ==================== EMPLOYEE ENDPOINTS ====================

/**
 * Verify employee ID exists in database
 * @param {string} employeeId - Employee ID to verify
 * @param {string} branchId - Optional Branch ID to verify against
 */
export const verifyEmployeeId = async (employeeId, branchId = null) => {
    const payload = { employeeId };
    if (branchId) payload.branchId = branchId;

    const response = await api.post('/api/employees/verify-id', payload);
    return response.data;
};

/**
 * Get employee details
 * @param {string} employeeId - Employee ID
 */
export const getEmployee = async (employeeId) => {
    const response = await api.get(`/api/employees/${employeeId}`);
    return response.data;
};

// ==================== LOCATION ENDPOINTS ====================

/**
 * Validate if current location is within geo-fence
 * @param {number} latitude - Current latitude
 * @param {number} longitude - Current longitude
 */
export const validateLocation = async (latitude, longitude) => {
    const response = await api.post('/api/location/validate', {
        latitude,
        longitude,
    });
    return response.data;
};

/**
 * Send location ping to backend (for GPS tracking)
 * @param {string} employeeId - Employee ID
 * @param {number} latitude - Current latitude
 * @param {number} longitude - Current longitude
 */
export const sendLocationPing = async (employeeId, latitude, longitude) => {
    const response = await api.post('/api/location/ping', {
        employeeId,
        latitude,
        longitude,
    });
    return response.data;
};

/**
 * Get geo-fence settings
 */
export const getGeofenceSettings = async () => {
    const response = await api.get('/api/settings/geofence');
    return response.data;
};

// ==================== FACE ENDPOINTS ====================

/**
 * Register face for employee
 * @param {string} employeeId - Employee ID
 * @param {string} imageBase64 - Base64 encoded image
 * @param {number} latitude - Current latitude
 * @param {number} longitude - Current longitude
 */
export const registerFace = async (employeeId, imageBase64, latitude, longitude) => {
    const response = await api.post('/api/face/register', {
        employeeId,
        imageBase64,
        latitude,
        longitude,
    });
    return response.data;
};

/**
 * Verify face for attendance
 * @param {string} imageBase64 - Base64 encoded image
 * @param {number} latitude - Current latitude
 * @param {number} longitude - Current longitude
 */
export const verifyFace = async (imageBase64, latitude, longitude) => {
    const response = await api.post('/api/face/verify', {
        imageBase64,
        latitude,
        longitude,
    });
    return response.data;
};

/**
 * Check-in attendance with face verification
 * @param {string} imageBase64 - Base64 encoded image
 * @param {number} latitude - Current latitude
 * @param {number} longitude - Current longitude
 * @param {string} branchId - Branch ID
 * @param {string} employeeId - Expected employee ID (for validation)
 * @param {string} type - Check-in type (OFFICE or TRAVEL)
 */
export const checkIn = async (imageBase64, latitude, longitude, branchId, employeeId = null, type = 'OFFICE') => {
    const payload = {
        imageBase64,
        latitude,
        longitude,
        type,
    };
    if (branchId) payload.branchId = branchId;
    if (employeeId) payload.expectedEmployeeId = employeeId;

    const response = await api.post('/api/attendance/check-in', payload);
    return response.data;
};

/**
 * Check-out attendance
 * @param {string} imageBase64 - Base64 encoded image
 */
export const checkOut = async (imageBase64, employeeId = null) => {
    const payload = { imageBase64 };
    if (employeeId) payload.expectedEmployeeId = employeeId;

    const response = await api.post('/api/attendance/check-out', payload);
    return response.data;
};

/**
 * Get attendance history for employee
 * @param {string} employeeId - Employee ID
 * @param {number} limit - Number of records to fetch
 */
export const getAttendanceHistory = async (employeeId, limit = 30) => {
    const response = await api.get(`/api/attendance/${employeeId}?limit=${limit}`);
    return response.data;
};

/**
 * Get current attendance status for employee
 * @param {string} employeeId - Employee ID
 */
export const getAttendanceStatus = async (employeeId) => {
    const response = await api.get(`/api/attendance/status/${employeeId}`);
    return response.data;
};

// ==================== LIVENESS ENDPOINTS ====================

/**
 * Create a Face Liveness session
 * @param {string} employeeId - Optional employee ID
 */
export const createLivenessSession = async (employeeId = null) => {
    const response = await api.post('/api/liveness/create-session', { employeeId });
    return response.data;
};

/**
 * Get Face Liveness session results
 * @param {string} sessionId - Session ID from createLivenessSession
 */
export const getLivenessResults = async (sessionId) => {
    const response = await api.get(`/api/liveness/get-results/${sessionId}`);
    return response.data;
};

/**
 * Get AWS credentials for Face Liveness
 */
export const getLivenessCredentials = async () => {
    const response = await api.get('/api/liveness/credentials');
    return response.data;
};

/**
 * Verify liveness and match with registered face
 * @param {string} sessionId - Session ID
 * @param {string} employeeId - Employee ID
 */
export const verifyLiveness = async (sessionId, employeeId) => {
    const response = await api.post('/api/liveness/verify', { sessionId, employeeId });
    return response.data;
};

/**
 * Get presigned URLs for uploading liveness photos to S3
 * @param {number} photoCount - Number of photos to upload
 */
export const getUploadUrls = async (photoCount = 2) => {
    const response = await api.post('/api/liveness/get-upload-urls', { photoCount });
    return response.data;
};

/**
 * Analyze liveness photos from S3
 * @param {string} sessionId - Liveness session ID
 * @param {string[]} s3Keys - Array of S3 keys for uploaded photos
 */
export const analyzeFromS3 = async (sessionId, s3Keys) => {
    const response = await api.post('/api/liveness/analyze-from-s3', { sessionId, s3Keys });
    return response.data;
};

/**
 * GCP LIVENESS (using Google Cloud Storage and Vision API)
 */

/**
 * Get GCP signed URLs for uploading liveness photos
 * @param {number} photoCount - Number of photos to upload
 */
export const getGcpUploadUrls = async (photoCount = 2) => {
    const response = await api.post('/api/liveness/gcp-upload-urls', { photoCount });
    return response.data;
};

/**
 * Analyze liveness photos from GCP using Vision API
 * @param {string} sessionId - Liveness session ID
 * @param {string[]} gcsKeys - Array of GCS keys for uploaded photos
 */
export const gcpAnalyzeLiveness = async (sessionId, gcsKeys) => {
    const response = await api.post('/api/liveness/gcp-analyze', { sessionId, gcsKeys });
    return response.data;
};

/**
 * Get active branches
 */
export const getBranches = async () => {
    const response = await api.get('/api/branches/active');
    return response.data;
};

// ==================== REQUEST ENDPOINTS ====================

/**
 * Create a new Request (Advance, Leave, Permission)
 * @param {Object} requestData - { employeeId, type, data: { ... } }
 */
export const createRequest = async (requestData) => {
    const response = await api.post('/api/requests', requestData);
    return response.data;
};

/**
 * Get Requests by Employee ID
 * @param {string} employeeId - Employee ID
 */
export const getRequestsByEmployee = async (employeeId) => {
    const response = await api.get(`/api/requests/employee/${employeeId}`);
    return response.data;
};



// ==================== RULES ENDPOINTS ====================

export const getEmployeeRules = async () => {
    const response = await api.get('/api/settings/rules');
    return response.data;
};

export default api;
export const resumeSession = async (employeeId) => {
    const response = await api.post('/api/attendance/resume-session', { employeeId });
    return response.data;
};

export const verifyViewAccess = async (employeeId, imageBase64) => {
    const response = await api.post('/api/attendance/verify-view-access', {
        employeeId,
        imageBase64
    });
    return response.data;
};
