/**
 * Home Page - Employee ID Entry
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { verifyEmployeeId } from '../services/api';

const Home = () => {
    const navigate = useNavigate();
    const [employeeId, setEmployeeId] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!employeeId.trim()) {
            setError('Please enter your Employee ID');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const response = await verifyEmployeeId(employeeId.trim().toUpperCase());

            if (response.success) {
                // Employee found, check if face is registered
                if (response.alreadyRegistered) {
                    // Face registered - go to attendance
                    navigate('/attendance', {
                        state: { employee: response.employee }
                    });
                } else {
                    // No face - go to registration
                    navigate('/register', {
                        state: { employee: response.employee }
                    });
                }
            }
        } catch (err) {
            console.error('Verification error:', err);

            // Check if it's the "Already Registered" case
            if (err.response && err.response.status === 400 && err.response.data.alreadyRegistered) {
                // Determine work mode or other details if needed
                const employee = err.response.data.employee;
                // Redirect to Attendance
                navigate('/attendance', {
                    state: { employee }
                });
                return;
            }

            const message = err.response?.data?.message || 'Failed to verify Employee ID';
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <header className="header">
                <h1>SRM Kiosk</h1>
                <p>Employee Attendance System</p>
            </header>

            <div className="container">
                <div className="card">
                    <h2 className="card-title">👋 Welcome</h2>
                    <p style={{ marginBottom: '20px', color: '#666' }}>
                        Enter your Employee ID to check in or register
                    </p>

                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label className="form-label">Employee ID</label>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="e.g., SRM001"
                                value={employeeId}
                                onChange={(e) => setEmployeeId(e.target.value.toUpperCase())}
                                autoFocus
                                disabled={loading}
                            />
                        </div>

                        {error && (
                            <div className="status-box error">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={loading || !employeeId.trim()}
                        >
                            {loading ? (
                                <>
                                    <span className="spinner" style={{ width: 20, height: 20 }}></span>
                                    Verifying...
                                </>
                            ) : (
                                'Continue →'
                            )}
                        </button>
                    </form>
                </div>

                <div className="card" style={{ textAlign: 'center' }}>
                    <p style={{ fontSize: '14px', color: '#999' }}>
                        New employee? Contact your admin to get your Employee ID
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Home;
