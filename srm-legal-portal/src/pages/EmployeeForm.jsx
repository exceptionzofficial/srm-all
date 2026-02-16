import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiUser, FiMail, FiPhone, FiCreditCard, FiUpload, FiImage, FiCheck } from 'react-icons/fi';
import { getEmployees, createEmployee, updateEmployee, getBranches, deleteFaceRegistration, sendOTP, verifyOTP, sendSMSOTP, verifySMSOTP } from '../services/api';

const EmployeeForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(id ? true : false);
    const [branches, setBranches] = useState([]);
    const [formData, setFormData] = useState({
        employeeId: '',
        name: '',
        email: '',
        phone: '',
        department: '',
        designation: '',
        branchId: '',
        workMode: 'OFFICE',
        platformAccess: 'Mobile', // Default to Mobile
        // Documents
        panNumber: '',
        aadharNumber: '',
        // Statutory & Bank
        uan: '',
        esicIP: '',
        bankAccount: '',
        ifscCode: '',
        paymentMode: 'CASH',
        fixedSalary: '',
        joinedDate: '',
        // Associate Master Fields
        firstName: '',
        middleName: '',
        lastName: '',
        gender: '',
        fatherName: '',
        dob: '',
        grade: '',
        costCentre: '',
        taxDeductionPlace: '',
        reportingManager: '',
        jobResponsibility: '',
        paygroup: '',
        associateCode: '',
        location: '',
        // Salary & PF Details
        isPfEligible: false,
        fixedBasic: '',
        fixedHra: '',
        fixedSplAllowance: '',
        fixedDa: '',
        fixedOtherAllowance: '',
        fixedGross: '',
        agp: '',
        pfContribution: '',
        esiContribution: '',
    });
    const [photoFile, setPhotoFile] = useState(null);
    const [photoPreview, setPhotoPreview] = useState(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [existingEmployee, setExistingEmployee] = useState(null);

    // OTP Verification States
    const [otpSent, setOtpSent] = useState(false);
    const [otp, setOtp] = useState('');
    const [isVerified, setIsVerified] = useState(false);
    const [otpLoading, setOtpLoading] = useState(false);
    const [verifyLoading, setVerifyLoading] = useState(false);

    // Phone OTP Verification States
    const [phoneOtpSent, setPhoneOtpSent] = useState(false);
    const [phoneOtp, setPhoneOtp] = useState('');
    const [isPhoneVerified, setIsPhoneVerified] = useState(false);
    const [phoneOtpLoading, setPhoneOtpLoading] = useState(false);
    const [phoneVerifyLoading, setPhoneVerifyLoading] = useState(false);

    // Resend Timer State
    const [resendTimer, setResendTimer] = useState(0);
    const [canResend, setCanResend] = useState(true);

    useEffect(() => {
        loadData();
    }, [id]);

    const loadData = async () => {
        try {
            const branchResponse = await getBranches().catch(() => ({ branches: [] }));
            setBranches(branchResponse.branches || []);

            if (id) {
                const empResponse = await getEmployees();
                const employee = empResponse.employees?.find(emp => emp.employeeId === id);
                if (employee) {
                    setExistingEmployee(employee);
                    setFormData({
                        employeeId: employee.employeeId,
                        name: employee.name || '',
                        email: employee.email || '',
                        phone: employee.phone || '',
                        department: employee.department || '',
                        designation: employee.designation || '',
                        branchId: employee.branchId || '',
                        workMode: employee.workMode || 'OFFICE',
                        panNumber: employee.panNumber || '',
                        aadharNumber: employee.aadharNumber || '',
                        uan: employee.uan || '',
                        esicIP: employee.esicIP || '',
                        bankAccount: employee.bankAccount || '',
                        ifscCode: employee.ifscCode || '',
                        paymentMode: employee.paymentMode || 'CASH',
                        fixedSalary: employee.fixedSalary || '',
                        joinedDate: employee.joinedDate ? employee.joinedDate.split('T')[0] : '',
                        firstName: employee.firstName || '',
                        middleName: employee.middleName || '',
                        lastName: employee.lastName || '',
                        gender: employee.gender || '',
                        fatherName: employee.fatherName || '',
                        dob: employee.dob || '',
                        grade: employee.grade || '',
                        costCentre: employee.costCentre || '',
                        taxDeductionPlace: employee.taxDeductionPlace || '',
                        reportingManager: employee.reportingManager || '',
                        jobResponsibility: employee.jobResponsibility || '',
                        paygroup: employee.paygroup || '',
                        associateCode: employee.associateCode || '',
                        location: employee.location || '',
                        isPfEligible: employee.isPfEligible || false,
                        fixedBasic: employee.fixedBasic || '',
                        fixedHra: employee.fixedHra || '',
                        fixedSplAllowance: employee.fixedSplAllowance || '',
                        fixedDa: employee.fixedDa || '',
                        fixedOtherAllowance: employee.fixedOtherAllowance || '',
                        fixedGross: employee.fixedGross || '',
                        agp: employee.agp || '',
                        pfContribution: employee.pfContribution || '',
                        esiContribution: employee.esiContribution || '',
                    });
                    setPhotoPreview(employee.photoUrl || null);
                    // If editing, assume verified (or not needed)
                    setIsVerified(true);
                    setIsPhoneVerified(true);
                } else {
                    setError('Employee not found');
                }
            }
        } catch (error) {
            console.error('Error loading data:', error);
            setError('Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    const handlePhotoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setPhotoFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPhotoPreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSendOTP = async () => {
        if (!formData.email) {
            setError('Please enter an email address');
            return;
        }
        setOtpLoading(true);
        setError('');
        try {
            const response = await sendOTP(formData.email, formData.name || 'Employee');
            setOtpSent(true);
            setSuccess('OTP sent successfully!');
            setTimeout(() => setSuccess(''), 5000);
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

    const handleSendPhoneOTP = async () => {
        if (!formData.phone) {
            setError('Please enter a phone number');
            return;
        }
        setPhoneOtpLoading(true);
        setError('');
        try {
            const response = await sendSMSOTP(formData.phone, formData.name || 'Employee');
            setPhoneOtpSent(true);
            setSuccess('SMS OTP sent successfully!');
            setTimeout(() => setSuccess(''), 5000);
        } catch (error) {
            setError(error.response?.data?.message || 'Failed to send SMS OTP');
        } finally {
            setPhoneOtpLoading(false);
        }
    };

    const handleVerifyPhoneOTP = async () => {
        if (!phoneOtp) {
            setError('Please enter the OTP');
            return;
        }
        setPhoneVerifyLoading(true);
        setError('');
        try {
            await verifySMSOTP(formData.phone, phoneOtp);
            setIsPhoneVerified(true);
            setSuccess('Phone verified successfully!');
        } catch (error) {
            setError(error.response?.data?.message || 'Invalid OTP');
        } finally {
            setPhoneVerifyLoading(false);
        }
    };

    // Timer for Resend OTP
    useEffect(() => {
        let interval;
        if (resendTimer > 0) {
            interval = setInterval(() => {
                setResendTimer(prev => prev - 1);
            }, 1000);
        } else {
            setCanResend(true);
        }
        return () => clearInterval(interval);
    }, [resendTimer]);

    const handleResendOTP = async (type) => {
        if (!canResend) return;

        setCanResend(false);
        setResendTimer(30);

        if (type === 'email') {
            await handleSendOTP();
        } else {
            await handleSendPhoneOTP();
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!formData.employeeId || !formData.name) {
            setError('Employee ID and Name are required');
            return;
        }

        if (!id && formData.email && !isVerified) {
            setError('Please verify the email with OTP before creating employee');
            return;
        }

        try {
            let dataToSend;
            if (photoFile) {
                dataToSend = new FormData();
                Object.entries(formData).forEach(([key, value]) => {
                    if (value !== null && value !== undefined) {
                        dataToSend.append(key, value);
                    }
                });
                dataToSend.append('photo', photoFile);
            } else {
                dataToSend = formData;
            }

            if (id) {
                await updateEmployee(id, dataToSend);
                setSuccess('Employee updated successfully');
            } else {
                await createEmployee(dataToSend);
                setSuccess('Employee created successfully');
            }
            setTimeout(() => navigate('/'), 2000);
        } catch (error) {
            setError(error.response?.data?.message || 'Error saving employee');
        }
    };

    if (loading) {
        return <div className="loading-container"><div className="spinner"></div></div>;
    }

    return (
        <div className="employee-form-page" style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                <button className="btn btn-secondary" onClick={() => navigate('/')} style={{ padding: '8px 12px', display: 'flex', alignItems: 'center' }}>
                    <FiArrowLeft style={{ marginRight: '6px' }} /> Back
                </button>
                <h1 style={{ margin: 0, fontSize: '24px' }}>{id ? 'Edit Employee' : 'Add New Employee'}</h1>
            </div>

            <div className="card" style={{ padding: '32px' }}>
                <form onSubmit={handleSubmit}>
                    {error && <div className="badge badge-danger" style={{ display: 'block', marginBottom: '20px', padding: '12px' }}>{error}</div>}
                    {success && <div className="badge badge-success" style={{ display: 'block', marginBottom: '20px', padding: '12px' }}>{success}</div>}

                    {/* Section 1: Basic Info */}
                    <h4 style={{ color: 'var(--primary)', fontSize: '14px', marginBottom: '20px', textTransform: 'uppercase', letterSpacing: '1px' }}>Basic Information</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginBottom: '32px' }}>
                        {/* Employee ID is auto-generated, so we don't need an input for it */}
                        <div className="form-group">
                            <label className="form-label">Full Name *</label>
                            <input
                                type="text"
                                className="form-input"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Enter full name"
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">First Name</label>
                            <input
                                type="text"
                                className="form-input"
                                value={formData.firstName}
                                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                placeholder="First name"
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Last Name</label>
                            <input
                                type="text"
                                className="form-input"
                                value={formData.lastName}
                                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                placeholder="Last name"
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Gender</label>
                            <select
                                className="form-input"
                                value={formData.gender}
                                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                            >
                                <option value="">Select Gender</option>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Father's Name</label>
                            <input
                                type="text"
                                className="form-input"
                                value={formData.fatherName}
                                onChange={(e) => setFormData({ ...formData, fatherName: e.target.value })}
                                placeholder="Father's name"
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Date of Birth</label>
                            <input
                                type="date"
                                className="form-input"
                                value={formData.dob}
                                onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label"><FiMail style={{ marginRight: '6px' }} />Email</label>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <input
                                    type="email"
                                    className="form-input"
                                    value={formData.email}
                                    onChange={(e) => {
                                        setFormData({ ...formData, email: e.target.value });
                                        if (otpSent || isVerified) {
                                            setOtpSent(false);
                                            setOtp('');
                                            setIsVerified(false);
                                        }
                                    }}
                                    placeholder="Email address"
                                    disabled={!!id}
                                />
                                {!id && formData.email && !isVerified && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        {!otpSent ? (
                                            <button type="button" className="btn btn-secondary" onClick={handleSendOTP} disabled={otpLoading}>
                                                {otpLoading ? 'Sending...' : 'Send OTP'}
                                            </button>
                                        ) : (
                                            <button
                                                type="button"
                                                className="btn btn-secondary"
                                                onClick={() => handleResendOTP('email')}
                                                disabled={!canResend || otpLoading}
                                                style={{ fontSize: '12px', padding: '4px 8px' }}
                                            >
                                                {canResend ? 'Resend OTP' : `Resend in ${resendTimer}s`}
                                            </button>
                                        )}
                                    </div>
                                )}
                                {isVerified && <div style={{ display: 'flex', alignItems: 'center', color: '#10b981', fontWeight: '500' }}>Verified</div>}
                            </div>
                            {!id && otpSent && !isVerified && (
                                <div style={{ marginTop: '12px' }}>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <input
                                            type="text"
                                            className="form-input"
                                            value={otp}
                                            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                            placeholder="Enter 6-digit OTP"
                                        />
                                        <button type="button" className="btn btn-primary" onClick={handleVerifyOTP} disabled={verifyLoading}>Verify</button>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="form-group">
                            <label className="form-label"><FiPhone style={{ marginRight: '6px' }} />Phone</label>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <input
                                    type="tel"
                                    className="form-input"
                                    value={formData.phone}
                                    onChange={(e) => {
                                        setFormData({ ...formData, phone: e.target.value });
                                        if (phoneOtpSent || isPhoneVerified) {
                                            setPhoneOtpSent(false);
                                            setPhoneOtp('');
                                            setIsPhoneVerified(false);
                                        }
                                    }}
                                    placeholder="Phone number"
                                    disabled={!!id}
                                />
                                {!id && formData.phone && !isPhoneVerified && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        {!phoneOtpSent ? (
                                            <button type="button" className="btn btn-secondary" onClick={handleSendPhoneOTP} disabled={phoneOtpLoading}>
                                                {phoneOtpLoading ? 'Sending...' : 'Send OTP'}
                                            </button>
                                        ) : (
                                            <button
                                                type="button"
                                                className="btn btn-secondary"
                                                onClick={() => handleResendOTP('mobile')}
                                                disabled={!canResend || phoneOtpLoading}
                                                style={{ fontSize: '12px', padding: '4px 8px' }}
                                            >
                                                {canResend ? 'Resend OTP' : `Resend in ${resendTimer}s`}
                                            </button>
                                        )}
                                    </div>
                                )}
                                {isPhoneVerified && <div style={{ display: 'flex', alignItems: 'center', color: '#10b981', fontWeight: '500' }}>Verified</div>}
                            </div>
                            {!id && phoneOtpSent && !isPhoneVerified && (
                                <div style={{ marginTop: '12px' }}>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <input
                                            type="text"
                                            className="form-input"
                                            value={phoneOtp}
                                            onChange={(e) => setPhoneOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                            placeholder="Enter OTP"
                                        />
                                        <button type="button" className="btn btn-primary" onClick={handleVerifyPhoneOTP} disabled={phoneVerifyLoading}>Verify</button>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="form-group">
                            <label className="form-label">Department</label>
                            <input
                                type="text"
                                className="form-input"
                                value={formData.department}
                                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                placeholder="Department"
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Designation</label>
                            <input
                                type="text"
                                className="form-input"
                                value={formData.designation}
                                onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                                placeholder="Job title"
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Work Mode</label>
                            <select
                                className="form-input"
                                value={formData.workMode}
                                onChange={(e) => setFormData({ ...formData, workMode: e.target.value })}
                            >
                                <option value="OFFICE">Office Based</option>
                                <option value="FIELD_SALES">Field Sales</option>
                                <option value="REMOTE">Remote</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Platform Access</label>
                            <select
                                className="form-input"
                                value={formData.platformAccess}
                                onChange={(e) => setFormData({ ...formData, platformAccess: e.target.value })}
                            >
                                <option value="Mobile">Mobile App</option>
                                <option value="Kiosk">Kiosk Mode</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Branch *</label>
                            <select
                                className="form-input"
                                value={formData.branchId}
                                onChange={(e) => setFormData({ ...formData, branchId: e.target.value })}
                            >
                                <option value="">Select a branch</option>
                                {branches.map((branch) => (
                                    <option key={branch.branchId} value={branch.branchId}>{branch.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Date of Joining</label>
                            <input
                                type="date"
                                className="form-input"
                                value={formData.joinedDate}
                                onChange={(e) => setFormData({ ...formData, joinedDate: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Associate Code</label>
                            <input
                                type="text"
                                className="form-input"
                                value={formData.associateCode}
                                onChange={(e) => setFormData({ ...formData, associateCode: e.target.value })}
                                placeholder="SRM-XXXX"
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Paygroup</label>
                            <input
                                type="text"
                                className="form-input"
                                value={formData.paygroup}
                                onChange={(e) => setFormData({ ...formData, paygroup: e.target.value })}
                                placeholder="e.g. Management"
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Location</label>
                            <input
                                type="text"
                                className="form-input"
                                value={formData.location}
                                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                placeholder="Work location"
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Grade</label>
                            <input
                                type="text"
                                className="form-input"
                                value={formData.grade}
                                onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                                placeholder="e.g. A, B, C"
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Reporting Manager</label>
                            <input
                                type="text"
                                className="form-input"
                                value={formData.reportingManager}
                                onChange={(e) => setFormData({ ...formData, reportingManager: e.target.value })}
                                placeholder="Manager name"
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Cost Centre</label>
                            <input
                                type="text"
                                className="form-input"
                                value={formData.costCentre}
                                onChange={(e) => setFormData({ ...formData, costCentre: e.target.value })}
                                placeholder="Cost centre"
                            />
                        </div>
                    </div>

                    <div className="form-group" style={{ marginBottom: '32px' }}>
                        <label className="form-label">Job Responsibility</label>
                        <textarea
                            className="form-input"
                            value={formData.jobResponsibility}
                            onChange={(e) => setFormData({ ...formData, jobResponsibility: e.target.value })}
                            placeholder="Describe job responsibilities..."
                            rows="3"
                        ></textarea>
                    </div>

                    {/* Section 2: Documents */}
                    <h4 style={{ color: 'var(--primary)', fontSize: '14px', marginBottom: '20px', textTransform: 'uppercase', borderTop: '1px solid #eee', paddingTop: '32px' }}>Documents & Identity</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginBottom: '32px' }}>
                        <div className="form-group">
                            <label className="form-label">PAN Number</label>
                            <input
                                type="text"
                                className="form-input"
                                value={formData.panNumber}
                                onChange={(e) => setFormData({ ...formData, panNumber: e.target.value.toUpperCase() })}
                                placeholder="ABCDE1234F"
                                maxLength={10}
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Aadhar Number</label>
                            <input
                                type="text"
                                className="form-input"
                                value={formData.aadharNumber}
                                onChange={(e) => setFormData({ ...formData, aadharNumber: e.target.value.replace(/\D/g, '') })}
                                placeholder="12-digit number"
                                maxLength={12}
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Place of Tax Deduction</label>
                            <input
                                type="text"
                                className="form-input"
                                value={formData.taxDeductionPlace}
                                onChange={(e) => setFormData({ ...formData, taxDeductionPlace: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="form-group" style={{ marginBottom: '32px' }}>
                        <label className="form-label">Employee Photo</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                            {photoPreview ? (
                                <div style={{ position: 'relative', width: '100px', height: '100px' }}>
                                    <img src={photoPreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px', border: '1px solid #ddd' }} />
                                    <button type="button" onClick={() => { setPhotoFile(null); setPhotoPreview(null); }} style={{ position: 'absolute', top: '-8px', right: '-8px', width: '24px', height: '24px', borderRadius: '50%', background: '#ff4444', color: 'white', border: 'none', cursor: 'pointer' }}>×</button>
                                </div>
                            ) : (
                                <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100px', height: '100px', border: '2px dashed #ddd', borderRadius: '8px', cursor: 'pointer', background: '#f9f9f9', gap: '4px' }}>
                                    <FiUpload size={20} color="#666" />
                                    <span style={{ fontSize: '12px', color: '#666' }}>Upload</span>
                                    <input type="file" accept="image/*" onChange={handlePhotoChange} style={{ display: 'none' }} />
                                </label>
                            )}
                        </div>
                    </div>

                    {/* Section 3: Statutory & Bank */}
                    <h4 style={{ color: 'var(--primary)', fontSize: '14px', marginBottom: '20px', textTransform: 'uppercase', borderTop: '1px solid #eee', paddingTop: '32px' }}>Statutory & Bank</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginBottom: '32px' }}>
                        <div className="form-group">
                            <label className="form-label">UAN (PF)</label>
                            <input type="text" className="form-input" value={formData.uan} onChange={(e) => setFormData({ ...formData, uan: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">ESIC IP No</label>
                            <input type="text" className="form-input" value={formData.esicIP} onChange={(e) => setFormData({ ...formData, esicIP: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Bank Account No</label>
                            <input type="text" className="form-input" value={formData.bankAccount} onChange={(e) => setFormData({ ...formData, bankAccount: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">IFSC Code</label>
                            <input type="text" className="form-input" value={formData.ifscCode} onChange={(e) => setFormData({ ...formData, ifscCode: e.target.value.toUpperCase() })} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Payment Mode</label>
                            <select className="form-input" value={formData.paymentMode} onChange={(e) => setFormData({ ...formData, paymentMode: e.target.value })}>
                                <option value="CASH">CASH</option>
                                <option value="BANK">BANK TRANSFER</option>
                            </select>
                        </div>
                        <div className="form-group" style={{ display: 'none' }}>
                            <label className="form-label">Fixed Salary (₹)</label>
                            <input type="number" className="form-input" value={formData.fixedSalary} onChange={(e) => setFormData({ ...formData, fixedSalary: e.target.value })} />
                        </div>
                    </div>

                    {/* Section 4: Salary Details (Excel Style) */}
                    <h4 style={{ color: 'var(--primary)', fontSize: '14px', marginBottom: '20px', textTransform: 'uppercase', borderTop: '1px solid #eee', paddingTop: '32px' }}>Salary Details & PF Eligibility</h4>
                    <div style={{ marginBottom: '24px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: '500' }}>
                            <input
                                type="checkbox"
                                checked={formData.isPfEligible}
                                onChange={(e) => setFormData({ ...formData, isPfEligible: e.target.checked })}
                                style={{ width: '18px', height: '18px' }}
                            />
                            Eligible for PF (Provident Fund)
                        </label>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', background: '#f8f9fa', padding: '24px', borderRadius: '8px', border: '1px solid #e9ecef' }}>
                        <div className="form-group">
                            <label className="form-label">Fixed Basic</label>
                            <input type="number" className="form-input" value={formData.fixedBasic} onChange={(e) => setFormData({ ...formData, fixedBasic: e.target.value })} placeholder="0.00" />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Fixed HRA</label>
                            <input type="number" className="form-input" value={formData.fixedHra} onChange={(e) => setFormData({ ...formData, fixedHra: e.target.value })} placeholder="0.00" />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Fixed Spl Allowance</label>
                            <input type="number" className="form-input" value={formData.fixedSplAllowance} onChange={(e) => setFormData({ ...formData, fixedSplAllowance: e.target.value })} placeholder="0.00" />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Fixed DA</label>
                            <input type="number" className="form-input" value={formData.fixedDa} onChange={(e) => setFormData({ ...formData, fixedDa: e.target.value })} placeholder="0.00" />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Fixed Other Allowance</label>
                            <input type="number" className="form-input" value={formData.fixedOtherAllowance} onChange={(e) => setFormData({ ...formData, fixedOtherAllowance: e.target.value })} placeholder="0.00" />
                        </div>
                        <div className="form-group">
                            <label className="form-label" style={{ fontWeight: '600' }}>Fixed Gross</label>
                            <input type="number" className="form-input" value={formData.fixedGross} onChange={(e) => setFormData({ ...formData, fixedGross: e.target.value })} placeholder="0.00" style={{ fontWeight: '600', borderColor: 'var(--primary)' }} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">AGP</label>
                            <input type="number" className="form-input" value={formData.agp} onChange={(e) => setFormData({ ...formData, agp: e.target.value })} placeholder="0.00" />
                        </div>
                        <div className="form-group">
                            <label className="form-label">PF Contribution</label>
                            <input type="number" className="form-input" value={formData.pfContribution} onChange={(e) => setFormData({ ...formData, pfContribution: e.target.value })} placeholder="0.00" />
                        </div>
                        <div className="form-group">
                            <label className="form-label">EmpESI</label>
                            <input type="number" className="form-input" value={formData.esiContribution} onChange={(e) => setFormData({ ...formData, esiContribution: e.target.value })} placeholder="0.00" />
                        </div>
                    </div>

                    {/* Face Reset */}
                    {id && existingEmployee?.faceId && (
                        <div style={{ background: '#fff5f5', padding: '20px', borderRadius: '8px', border: '1px solid #fed7d7', marginBottom: '32px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <h5 style={{ margin: '0 0 4px 0', color: '#c53030' }}>Face Registration</h5>
                                    <p style={{ margin: 0, fontSize: '13px', color: '#742a2a' }}>Employee has registered their face. Reset if they need to re-register.</p>
                                </div>
                                <button
                                    type="button"
                                    className="btn"
                                    style={{ background: '#c53030', color: 'white', padding: '8px 16px' }}
                                    onClick={async () => {
                                        if (!confirm('Are you sure you want to RESET face registration?')) return;
                                        try {
                                            await deleteFaceRegistration(id);
                                            alert('Face registration reset successfully!');
                                            loadData();
                                        } catch (err) {
                                            alert('Failed to reset: ' + err.message);
                                        }
                                    }}
                                >
                                    Reset Face ID
                                </button>
                            </div>
                        </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px', marginTop: '32px', borderTop: '1px solid #eee', paddingTop: '32px' }}>
                        <button type="button" className="btn btn-secondary" onClick={() => navigate('/')}>Cancel</button>
                        <button type="submit" className="btn btn-primary" style={{ padding: '12px 32px' }}>{id ? 'Update Employee' : 'Create Employee'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EmployeeForm;
