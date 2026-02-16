import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FiArrowLeft, FiSave, FiMapPin, FiMail, FiUser, FiBriefcase, FiCheckCircle } from 'react-icons/fi';
import { createEmployee, updateEmployee, getEmployee, getBranches, sendOTP, verifyOTP } from '../services/api';

const ManagerForm = () => {
    const navigate = useNavigate();
    const { id } = useParams(); // For edit mode

    const [loading, setLoading] = useState(false);
    const [branches, setBranches] = useState([]);
    const [formData, setFormData] = useState({
        employeeId: '',
        name: '',
        email: '',
        branchId: '',
        phone: '',
        role: 'BRANCH_MANAGER',
        password: '',
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // OTP State
    const [otp, setOtp] = useState('');
    const [otpSent, setOtpSent] = useState(false);
    const [isVerified, setIsVerified] = useState(false);
    const [otpLoading, setOtpLoading] = useState(false);
    const [verifyLoading, setVerifyLoading] = useState(false);

    useEffect(() => {
        loadData();
    }, [id]);

    const loadData = async () => {
        try {
            setLoading(true);
            const branchRes = await getBranches();
            setBranches(branchRes.branches || []);

            if (id) {
                const emp = await getEmployee(id);
                // Check if it's one of the allowed manager roles
                const allowedRoles = ['BRANCH_MANAGER', 'CLUSTER_MANAGER', 'RETAIL_MANAGER', 'HR_ADMIN', 'FINANCE_ADMIN', 'LEGAL_ADMIN', 'PRODUCTION_ADMIN', 'QUALITY_ADMIN'];
                if (!allowedRoles.includes(emp.role)) {
                    setError('This employee is not a manager');
                    return;
                }
                setFormData({
                    employeeId: emp.employeeId,
                    name: emp.name,
                    email: emp.email,
                    branchId: emp.branchId || '',
                    phone: emp.phone || '',
                    phone: emp.phone || '',
                    role: emp.role || 'BRANCH_MANAGER',
                    password: '' // Don't show existing password
                });
                setIsVerified(true); // Existing managers are already verified
            }
        } catch (err) {
            console.error(err);
            setError('Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    const handleSendOTP = async () => {
        if (!formData.email) {
            setError('Please enter an email address first');
            return;
        }
        setOtpLoading(true);
        setError('');
        try {
            await sendOTP(formData.email, formData.name || 'Manager');
            setOtpSent(true);
            setSuccess('OTP sent successfully to ' + formData.email);
        } catch (error) {
            setError(error.response?.data?.message || 'Failed to send OTP');
        } finally {
            setOtpLoading(false);
        }
    };

    const handleVerifyOTP = async () => {
        if (!otp) {
            setError('Please enter the OTP');
            return;
        }
        setVerifyLoading(true);
        setError('');
        try {
            await verifyOTP(formData.email, otp);
            setIsVerified(true);
            setSuccess('Email verified successfully!');
        } catch (error) {
            setError(error.response?.data?.message || 'Invalid OTP');
        } finally {
            setVerifyLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        // Verification Check for New Managers
        if (!id && !isVerified) {
            setError('Please verify the email address before creating the manager account.');
            return;
        }

        setLoading(true);

        try {
            if (!formData.branchId) throw new Error('Please select a branch');
            if (!formData.name) throw new Error('Name is required');
            if (!formData.employeeId) throw new Error('Employee ID is required');
            if (!formData.email) throw new Error('Email is required');
            if (!id && !formData.password) throw new Error('Initial password is required');

            const payload = {
                ...formData,
                employeeId: formData.employeeId.toUpperCase(),
                addedBy: 'Super Admin'
            };

            if (id) {
                const { password, ...updateData } = payload;
                await updateEmployee(id, updateData);
                setSuccess('Manager updated successfully');
            } else {
                console.log('Creating Manager with Payload:', payload);
                if (payload.password) console.log('Password is present in payload');
                else console.warn('WARNING: Password missing from payload!');

                await createEmployee(payload);
                setSuccess('Manager created successfully');
            }

            setTimeout(() => {
                navigate('/managers');
            }, 1500);

        } catch (err) {
            setError(err.message || err.response?.data?.message || 'Operation failed');
        } finally {
            setLoading(false);
        }
    };

    if (loading && !branches.length) return <div className="loading-container"><div className="spinner"></div></div>;

    return (
        <div className="employee-form-page" style={{ maxWidth: '800px', margin: '0 auto', padding: '24px' }}>
            <div className="page-header">
                <button className="btn btn-secondary" onClick={() => navigate('/managers')}>
                    <FiArrowLeft /> Back
                </button>
                <h1 className="page-title">{id ? 'Edit Manager' : 'Add New Manager'}</h1>
            </div>

            {error && <div className="alert alert-danger">{error}</div>}
            {success && <div className="alert alert-success">{success}</div>}

            <div className="card">
                <form onSubmit={handleSubmit}>
                    <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>

                        {/* ID */}
                        <div className="form-group">
                            <label className="form-label">Manager ID *</label>
                            <input
                                type="text"
                                className="form-input"
                                value={formData.employeeId}
                                onChange={e => setFormData({ ...formData, employeeId: e.target.value.toUpperCase() })}
                                disabled={!!id}
                                placeholder="MGR-001"
                            />
                        </div>

                        {/* Role Selection */}
                        <div className="form-group">
                            <label className="form-label">Assign Role *</label>
                            <div className="input-icon-wrapper">
                                <FiBriefcase className="input-icon" />
                                <select
                                    className="form-input has-icon"
                                    value={formData.role}
                                    onChange={e => setFormData({ ...formData, role: e.target.value })}
                                >
                                    <option value="BRANCH_MANAGER">Branch Manager</option>
                                    <option value="CLUSTER_MANAGER">Cluster Manager</option>
                                    <option value="RETAIL_MANAGER">Retail Manager</option>
                                    <option value="HR_ADMIN">HR Admin</option>
                                    <option value="FINANCE_ADMIN">Finance Admin</option>
                                    <option value="LEGAL_ADMIN">Legal Admin</option>
                                    <option value="PRODUCTION_ADMIN">Production Admin</option>
                                    <option value="QUALITY_ADMIN">Quality Admin</option>
                                </select>
                            </div>
                        </div>

                        {/* Name */}
                        <div className="form-group">
                            <label className="form-label">Full Name *</label>
                            <div className="input-icon-wrapper">
                                <FiUser className="input-icon" />
                                <input
                                    type="text"
                                    className="form-input has-icon"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="John Doe"
                                />
                            </div>
                        </div>

                        {/* Email Verification Section */}
                        <div className="form-group" style={{ gridColumn: 'span 2' }}>
                            <label className="form-label">Email Address *</label>
                            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                <div className="input-icon-wrapper" style={{ flex: 1 }}>
                                    <FiMail className="input-icon" />
                                    <input
                                        type="email"
                                        className="form-input has-icon"
                                        value={formData.email}
                                        onChange={e => {
                                            setFormData({ ...formData, email: e.target.value });
                                            if (!id) setIsVerified(false); // Reset verification if email changes
                                        }}
                                        placeholder="john@srmsweets.com"
                                        disabled={!!id || isVerified} // Lock if already verified
                                    />
                                    {isVerified && <FiCheckCircle style={{ position: 'absolute', right: '10px', top: '12px', color: 'green' }} />}
                                </div>
                                {!id && !isVerified && !otpSent && (
                                    <button
                                        type="button"
                                        className="btn btn-primary"
                                        onClick={handleSendOTP}
                                        disabled={otpLoading || !formData.email}
                                        style={{ height: '42px' }}
                                    >
                                        {otpLoading ? 'Sending...' : 'Send OTP'}
                                    </button>
                                )}
                            </div>

                            {/* OTP Input Fields */}
                            {!id && !isVerified && otpSent && (
                                <div style={{ marginTop: '10px', display: 'flex', gap: '10px', alignItems: 'center' }}>
                                    <input
                                        type="text"
                                        className="form-input"
                                        style={{ width: '150px' }}
                                        placeholder="Enter OTP"
                                        value={otp}
                                        onChange={e => setOtp(e.target.value)}
                                    />
                                    <button
                                        type="button"
                                        className="btn btn-success"
                                        onClick={handleVerifyOTP}
                                        disabled={verifyLoading}
                                    >
                                        {verifyLoading ? 'Verifying...' : 'Verify'}
                                    </button>
                                    <button
                                        type="button"
                                        className="btn btn-secondary"
                                        onClick={handleSendOTP} // Resend logic
                                        style={{ fontSize: '12px' }}
                                    >
                                        Resend
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Phone */}
                        <div className="form-group">
                            <label className="form-label">Phone Number</label>
                            <input
                                type="tel"
                                className="form-input"
                                value={formData.phone}
                                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                placeholder="+91 9876543210"
                            />
                        </div>

                        {/* Branch */}
                        <div className="form-group">
                            <label className="form-label">Assign Branch *</label>
                            <div className="input-icon-wrapper">
                                <FiMapPin className="input-icon" />
                                <select
                                    className="form-input has-icon"
                                    value={formData.branchId}
                                    onChange={e => setFormData({ ...formData, branchId: e.target.value })}
                                >
                                    <option value="">Select Branch</option>
                                    {branches.map(b => (
                                        <option key={b.branchId} value={b.branchId}>{b.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Password - Only for Create */}
                        {!id && (
                            <div className="form-group">
                                <label className="form-label">Initial Password *</label>
                                <input
                                    type="password"
                                    className="form-input"
                                    value={formData.password}
                                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                                    placeholder="Create password"
                                    minLength={6}
                                />
                                <small className="text-muted">Manager can change this later.</small>
                            </div>
                        )}
                    </div>

                    <div className="form-actions" style={{ marginTop: '32px', display: 'flex', justifyContent: 'flex-end', gap: '16px' }}>
                        <button type="button" className="btn btn-secondary" onClick={() => navigate('/managers')}>Cancel</button>
                        <button type="submit" className="btn btn-primary" disabled={loading || (!id && !isVerified)}>
                            <FiSave /> {id ? 'Update Manager' : 'Create Manager'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ManagerForm;
