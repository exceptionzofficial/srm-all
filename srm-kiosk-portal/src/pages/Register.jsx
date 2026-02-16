/**
 * Face Registration Page
 */
import { useState, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Webcam from 'react-webcam';
import { registerFace } from '../services/api';

const Register = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const employee = location.state?.employee;

    const webcamRef = useRef(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [capturedImage, setCapturedImage] = useState(null);

    // Redirect if no employee data
    if (!employee) {
        navigate('/');
        return null;
    }

    const capturePhoto = useCallback(() => {
        if (webcamRef.current) {
            const imageSrc = webcamRef.current.getScreenshot();
            setCapturedImage(imageSrc);
        }
    }, []);

    const retakePhoto = () => {
        setCapturedImage(null);
        setError('');
    };

    const handleRegister = async () => {
        if (!capturedImage) {
            setError('Please capture a photo first');
            return;
        }

        setLoading(true);
        setError('');

        // Skip Geolocation for Kiosk - It's fixed location
        // We still try to get it if available, but don't block
        let latitude = 0, longitude = 0;

        try {
            // Optional: Try to get location with short timeout
            // const pos = await new Promise((resolve, reject) => {
            //     navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 3000 });
            // });
            // latitude = pos.coords.latitude;
            // longitude = pos.coords.longitude;
        } catch (e) {
            console.log('Location ignored for kiosk');
        }

        try {
            const response = await registerFace(employee.employeeId, capturedImage, latitude, longitude);

            if (response.success) {
                setSuccess('✓ Face registered! You can now check in.');
                // Auto-redirect to Attendance to allow immediate check-in
                setTimeout(() => {
                    navigate('/attendance', {
                        state: { employee: employee }
                    });
                }, 1500);
            }
        } catch (err) {
            console.error('Registration error:', err);
            setError(err.response?.data?.message || 'Failed to register face. Please try again.');
            setCapturedImage(null);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <header className="header">
                <h1>Face Registration</h1>
                <p>Register your face for attendance</p>
            </header>

            <div className="container">
                <button className="back-btn" onClick={() => navigate('/')}>
                    ← Back
                </button>

                {/* Employee Info */}
                <div className="employee-info">
                    <div className="row">
                        <span className="label">Employee ID</span>
                        <span className="value">{employee.employeeId}</span>
                    </div>
                    <div className="row">
                        <span className="label">Name</span>
                        <span className="value">{employee.name}</span>
                    </div>
                </div>

                <div className="card">
                    <h2 className="card-title">📸 Capture Your Face</h2>
                    <p style={{ marginBottom: '16px', color: '#666', fontSize: '14px' }}>
                        Position your face in the center and look at the camera
                    </p>

                    {/* Webcam or Captured Image */}
                    <div className="webcam-container">
                        {capturedImage ? (
                            <img
                                src={capturedImage}
                                alt="Captured"
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                        ) : (
                            <>
                                <Webcam
                                    ref={webcamRef}
                                    audio={false}
                                    screenshotFormat="image/jpeg"
                                    screenshotQuality={0.8}
                                    videoConstraints={{
                                        facingMode: 'user',
                                        width: 640,
                                        height: 640,
                                    }}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />
                                <div className="webcam-overlay"></div>
                            </>
                        )}
                    </div>

                    {/* Messages */}
                    {error && <div className="status-box error">{error}</div>}
                    {success && <div className="status-box success">{success}</div>}

                    {/* Action Buttons */}
                    <div style={{ marginTop: '16px' }}>
                        {capturedImage ? (
                            <div className="action-buttons">
                                <button
                                    className="btn btn-secondary"
                                    onClick={retakePhoto}
                                    disabled={loading}
                                >
                                    Retake
                                </button>
                                <button
                                    className="btn btn-success"
                                    onClick={handleRegister}
                                    disabled={loading}
                                >
                                    {loading ? 'Registering...' : 'Register Face'}
                                </button>
                            </div>
                        ) : (
                            <button
                                className="btn btn-primary"
                                onClick={capturePhoto}
                            >
                                📷 Capture Photo
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;
