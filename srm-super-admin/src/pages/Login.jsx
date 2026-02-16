
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { checkUserStatus, initiateRegistration, verifyRegistryOTP, completeRegistration, login } from '../services/api';
import srmLogo from '../assets/srm-logo.png'; // Make sure this path is correct
import './Login.css';

const Login = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1); // 1: Email, 2: OTP/Setup, 3: Password
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [userName, setUserName] = useState('');
    const [isNewUser, setIsNewUser] = useState(false);

    const handleEmailSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const status = await checkUserStatus(email);
            if (!status.success || !status.registered) {
                setError('Email not found. Please contact Administrator.');
                setLoading(false);
                return;
            }

            setUserName(status.employeeName);
            if (!status.hasPassword) {
                // New User -> Send OTP and go to Setup
                setIsNewUser(true);
                await initiateRegistration(email); // Autosend OTP
                setStep(2);
            } else {
                // Existing User -> Go to Password
                setStep(3);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Server error');
        } finally {
            setLoading(false);
        }
    };

    const handleSetup = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }
        setLoading(true);
        setError('');
        try {
            // Verify OTP first
            const verifyRes = await verifyRegistryOTP(email, otp);
            if (!verifyRes.success) {
                throw new Error(verifyRes.message);
            }

            // Complete Registration
            await completeRegistration(email, password);

            // Auto Login or Go to Password step? Let's just login
            const loginRes = await login(email, password);
            handleLoginSuccess(loginRes.employee);

        } catch (err) {
            setError(err.response?.data?.message || err.message || 'Setup failed');
        } finally {
            setLoading(false);
        }
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const response = await login(email, password);
            handleLoginSuccess(response.employee);
        } catch (err) {
            setError('Invalid password');
        } finally {
            setLoading(false);
        }
    };

    const handleLoginSuccess = (employee) => {
        localStorage.setItem('user', JSON.stringify(employee));
        // Redirect based on Role
        switch (employee.role) {
            case 'LEGAL_ADMIN': navigate('/legal'); break;
            case 'FINANCE_ADMIN': navigate('/finance'); break;
            case 'PRODUCTION_ADMIN': navigate('/production'); break;
            case 'QUALITY_ADMIN': navigate('/quality'); break;
            case 'BRANCH_MANAGER': navigate('/branch'); break;
            default: navigate('/'); // Super Admin or Employee
        }
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <div className="logo-section">
                    <img src={srmLogo} alt="SRM Sweets" className="login-logo" />
                    <h2>Admin Portal</h2>
                </div>

                {error && <div className="login-error">{error}</div>}

                {step === 1 && (
                    <form onSubmit={handleEmailSubmit}>
                        <div className="form-group">
                            <label>Email Address</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Enter your work email"
                                required
                                autoFocus
                            />
                        </div>
                        <button type="submit" className="login-btn" disabled={loading}>
                            {loading ? 'Checking...' : 'Next'}
                        </button>

                        {/* DEV BYPASS */}
                        <div style={{ marginTop: '20px', borderTop: '1px solid #eee', paddingTop: '10px' }}>
                            <button
                                type="button"
                                style={{ background: '#333', color: 'white', width: '100%', padding: '10px', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                onClick={() => navigate('/')}
                            >
                                ⚡ Dev Bypass (Super Admin)
                            </button>
                        </div>
                    </form>
                )}

                {step === 2 && (
                    <form onSubmit={handleSetup}>
                        <h3>Welcome, {userName || 'User'}!</h3>
                        <p className="subtitle">Please update your credentials to continue.</p>

                        <div className="form-group">
                            <label>OTP Sent to {email}</label>
                            <input
                                type="text"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                                placeholder="Enter OTP"
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Create Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="New Password"
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Confirm Password</label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Confirm Password"
                                required
                            />
                        </div>
                        <button type="submit" className="login-btn" disabled={loading}>
                            {loading ? 'Setting up...' : 'Create Account & Login'}
                        </button>
                        <button type="button" className="link-btn" onClick={() => setStep(1)}>Back</button>
                    </form>
                )}

                {step === 3 && (
                    <form onSubmit={handleLogin}>
                        <h3>Welcome Back,</h3>
                        <p className="user-name-display">{userName}</p>

                        <div className="form-group">
                            <label>Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter your password"
                                required
                                autoFocus
                            />
                        </div>
                        <button type="submit" className="login-btn" disabled={loading}>
                            {loading ? 'Logging in...' : 'Login'}
                        </button>
                        <button type="button" className="link-btn" onClick={() => setStep(1)}>Back</button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default Login;
