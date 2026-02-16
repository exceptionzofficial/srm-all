/**
 * Attendance Page - Face Verification + Check In/Out
 */
import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Webcam from 'react-webcam';
import { verifyFace, checkIn, checkOut, getAttendanceStatus } from '../services/api';

const Attendance = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const employee = location.state?.employee;

    const webcamRef = useRef(null);
    const [loading, setLoading] = useState(false);
    const [verifying, setVerifying] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [status, setStatus] = useState(null);
    const [verified, setVerified] = useState(false);
    const [capturedImage, setCapturedImage] = useState(null);

    // Redirect if no employee data
    if (!employee) {
        navigate('/');
        return null;
    }

    // Load attendance status
    useEffect(() => {
        loadStatus();
    }, [employee.employeeId]);

    const loadStatus = async () => {
        try {
            const response = await getAttendanceStatus(employee.employeeId);
            setStatus(response);
        } catch (err) {
            console.error('Status error:', err);
        }
    };

    const handleCheckIn = useCallback(async (imageOverride) => {
        setLoading(true);
        setError('');

        try {
            // Use passed image or state image
            const imageToUse = typeof imageOverride === 'string' ? imageOverride : capturedImage;

            if (!imageToUse) {
                setError('Image is required for check-in');
                setLoading(false);
                return;
            }

            // KIOSK: Location is optional or fixed
            let latitude = 0, longitude = 0;
            // We can skip asking for location to speed up the process for Kiosk users
            // If needed, we can enable it silently, but for now we send 0,0 as per requirement

            const response = await checkIn(employee.employeeId, imageToUse, latitude, longitude);

            if (response.success) {
                setSuccess('✓ Checked in successfully!');
                // Auto-return to home after 2 seconds for next employee
                setTimeout(() => {
                    navigate('/');
                }, 2000);
            }
        } catch (err) {
            console.error('Check-in error:', err);
            setError(err.response?.data?.message || 'Check-in failed');
        } finally {
            setLoading(false);
        }
    }, [employee.employeeId, navigate, capturedImage]);

    const handleCheckOut = useCallback(async (imageOverride) => {
        setLoading(true);
        setError('');

        try {
            // Use passed image or state image
            const imageToUse = typeof imageOverride === 'string' ? imageOverride : capturedImage;

            if (!imageToUse) {
                setError('Image is required for check-out');
                setLoading(false);
                return;
            }

            let latitude = 0, longitude = 0;
            // Location not needed for Kiosk check-out

            const response = await checkOut(employee.employeeId, imageToUse, latitude, longitude);

            if (response.success) {
                setSuccess('✓ Checked out successfully!');
                // Auto-return to home after 2 seconds for next employee
                setTimeout(() => {
                    navigate('/');
                }, 2000);
            }
        } catch (err) {
            console.error('Check-out error:', err);
            setError(err.response?.data?.message || 'Check-out failed');
        } finally {
            setLoading(false);
        }
    }, [employee.employeeId, navigate, capturedImage]);

    const captureAndVerify = useCallback(async () => {
        if (!webcamRef.current) return;

        const imageSrc = webcamRef.current.getScreenshot();
        if (!imageSrc) {
            setError('Failed to capture image');
            return;
        }

        setCapturedImage(imageSrc);
        setVerifying(true);
        setError('');

        try {
            const response = await verifyFace(imageSrc, employee.employeeId);

            if (response.verified) {
                setVerified(true);

                // AUTO ACTION: Check In or Check Out based on status
                // Pass imageSrc directly because state update might be async
                if (status?.isCheckedIn) {
                    setSuccess('Face verified! Checking out...');
                    await handleCheckOut(imageSrc);
                } else {
                    setSuccess('Face verified! Checking in...');
                    await handleCheckIn(imageSrc);
                }

            } else {
                setError('Face not recognized. Please go back and Register first.');
                setCapturedImage(null);
            }
        } catch (err) {
            console.error('Verification error:', err);
            const msg = err.response?.data?.message || 'Face verification failed';

            if (msg.includes('Face not recognized') || err.response?.status === 404) {
                setError('Face not recognized. Please go back and Register first.');
            } else {
                setError(msg);
            }
            setCapturedImage(null);
        } finally {
            setVerifying(false);
        }
    }, [employee.employeeId, status, handleCheckIn, handleCheckOut]);

    const resetVerification = () => {
        setVerified(false);
        setCapturedImage(null);
        setSuccess('');
        setError('');
    };

    const formatTime = (isoString) => {
        if (!isoString) return '--:--';
        return new Date(isoString).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <div>
            <header className="header">
                <h1>Attendance</h1>
                <p>{employee.name}</p>
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
                        <span className="label">Department</span>
                        <span className="value">{employee.department || 'N/A'}</span>
                    </div>
                </div>

                {/* Current Status */}
                {status && (
                    <div className="card">
                        <h2 className="card-title">📊 Today's Status</h2>
                        <div className="attendance-status">
                            {status.isCheckedIn ? (
                                <>
                                    <div className="time checked-in">
                                        {formatTime(status.checkInTime)}
                                    </div>
                                    <div className="duration">
                                        Checked in • {status.workDuration || '0h 0m'}
                                    </div>
                                </>
                            ) : status.checkOutTime ? (
                                <>
                                    <div className="time checked-out">
                                        {formatTime(status.checkOutTime)}
                                    </div>
                                    <div className="duration">
                                        Checked out • {status.totalDuration || '0h 0m'} worked
                                    </div>
                                </>
                            ) : (
                                <div className="duration">Not checked in yet</div>
                            )}
                        </div>
                    </div>
                )}

                {/* Face Verification / Actions */}
                <div className="card">
                    {!verified ? (
                        <>
                            <h2 className="card-title">🔐 Verify Your Face</h2>
                            <p style={{ marginBottom: '16px', color: '#666', fontSize: '14px' }}>
                                Look at the camera to verify your identity
                            </p>

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

                            {error && <div className="status-box error">{error}</div>}

                            <button
                                className="btn btn-primary"
                                onClick={captureAndVerify}
                                disabled={verifying}
                                style={{ marginTop: '16px' }}
                            >
                                {verifying ? 'Verifying...' : '📷 Verify Face'}
                            </button>
                        </>
                    ) : (
                        <>
                            <h2 className="card-title">✓ Verified</h2>

                            {success && <div className="status-box success">{success}</div>}
                            {error && <div className="status-box error">{error}</div>}

                            <div className="action-buttons">
                                <button
                                    className="btn btn-success"
                                    onClick={handleCheckIn}
                                    disabled={loading || status?.isCheckedIn}
                                >
                                    {loading ? '...' : '✓ Check In'}
                                </button>
                                <button
                                    className="btn btn-danger"
                                    onClick={handleCheckOut}
                                    disabled={loading || !status?.isCheckedIn}
                                >
                                    {loading ? '...' : '✗ Check Out'}
                                </button>
                            </div>

                            <button
                                className="btn btn-secondary"
                                onClick={resetVerification}
                                style={{ marginTop: '12px' }}
                            >
                                Verify Again
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Attendance;
