import React, { useState, useEffect } from 'react';
import { FiUsers, FiUserCheck, FiClock, FiMapPin, FiDollarSign } from 'react-icons/fi';
import { getPendingFundRequests, processFundRequest, getBranches, getEmployees, getAttendanceByDate } from '../../services/api';
import '../Dashboard.css'; // Use shared dashboard styles

const BranchManagerDashboard = () => {
    const [user, setUser] = useState(null);
    const [branch, setBranch] = useState(null);
    const [employees, setEmployees] = useState([]);
    const [todayAttendance, setTodayAttendance] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        total: 0,
        present: 0,
        registered: 0,
        revenue: 0
    });

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);
            if (parsedUser.branchId) {
                loadBranchData(parsedUser.branchId);
            } else {
                setLoading(false);
            }
        }
    }, []);

    const loadBranchData = async (branchId) => {
        try {
            setLoading(true);

            // 1. Get Branch Info
            const branchRes = await getBranches();
            const currentBranch = branchRes.branches.find(b => b.branchId === branchId);
            setBranch(currentBranch);

            // 2. Get Employees for this branch
            const empRes = await getEmployees();
            const branchEmployees = empRes.employees.filter(e => e.branchId === branchId);
            setEmployees(branchEmployees);

            // 3. Get Today's Attendance
            const today = new Date().toISOString().split('T')[0];
            const attRes = await getAttendanceByDate(today);
            const records = attRes.records || [];

            // Filter attendance for this branch's employees
            const branchEmployeeIds = new Set(branchEmployees.map(e => e.employeeId));
            const branchRecords = records.filter(r => branchEmployeeIds.has(r.employeeId));
            setTodayAttendance(branchRecords);

            // 4. Calculate Stats & Mock Revenue
            const presentIds = new Set(branchRecords.map(r => r.employeeId));

            // Mock Revenue Calculation (e.g. Random validation or based on sales branch type)
            // Ideally this comes from an API
            const mockRevenue = Math.floor(Math.random() * 50000) + 20000;

            setStats({
                total: branchEmployees.length,
                registered: branchEmployees.filter(e => e.faceId).length,
                present: presentIds.size,
                revenue: mockRevenue
            });

        } catch (error) {
            console.error('Error loading branch details:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatTime = (isoString) => {
        if (!isoString) return '--:--';
        return new Date(isoString).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    if (loading) {
        return <div className="loading-container"><div className="spinner"></div></div>;
    }

    if (!user?.branchId || !branch) {
        return (
            <div className="dashboard-container" style={{ padding: '20px' }}>
                <h1>Branch Manager Dashboard</h1>
                <div className="alert alert-warning">
                    No branch assigned to your account. Please contact Super Admin.
                </div>
            </div>
        );
    }

    return (
        <div className="dashboard">
            <div className="page-header">
                <div>
                    <h1 className="page-title">{branch.name} Dashboard</h1>
                    <span className="date-display">
                        <FiMapPin style={{ marginRight: '6px' }} />
                        {branch.address || 'No address provided'}
                    </span>
                </div>
                <div className="header-actions">
                    <div className="badge badge-main" style={{ fontSize: '14px', padding: '8px 16px' }}>
                        ID: {branch.branchId}
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                <div className="stat-card">
                    <div className="stat-icon revenue" style={{ background: 'rgba(255, 193, 7, 0.1)', color: '#ffc107' }}>
                        <FiDollarSign />
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">₹{stats.revenue.toLocaleString()}</span>
                        <span className="stat-label">Today's Revenue</span>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon employees">
                        <FiUsers />
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">{stats.total}</span>
                        <span className="stat-label">Total Employees</span>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon registered">
                        <FiUserCheck />
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">{stats.registered}</span>
                        <span className="stat-label">Faces Registered</span>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon present">
                        <FiClock />
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">{stats.present}</span>
                        <span className="stat-label">Present Today</span>
                    </div>
                </div>
            </div>

            {/* Employee List */}
            <div className="card">
                <div className="section-header">
                    <h2 className="section-title">Branch Employees</h2>
                    <div className="branch-count-badge">
                        {Math.round((stats.present / (stats.total || 1)) * 100)}% Attendance
                    </div>
                </div>

                <div className="table-container">
                    <table className="table branch-table">
                        <thead>
                            <tr>
                                <th>Employee</th>
                                <th>Designation</th>
                                <th>Status</th>
                                <th>Check In</th>
                                <th>Check Out</th>
                            </tr>
                        </thead>
                        <tbody>
                            {employees.map(emp => {
                                const attendance = todayAttendance.find(r => r.employeeId === emp.employeeId);
                                return (
                                    <tr key={emp.employeeId} style={{ backgroundColor: attendance ? 'rgba(76,175,80,0.05)' : 'transparent' }}>
                                        <td>
                                            <div style={{ fontWeight: '500' }}>{emp.name}</div>
                                            <div style={{ fontSize: '11px', color: '#888' }}>{emp.employeeId}</div>
                                        </td>
                                        <td>{emp.designation || '-'}</td>
                                        <td>
                                            {attendance ? (
                                                <span className="badge badge-success">Present</span>
                                            ) : (
                                                <span className="badge badge-danger">Absent</span>
                                            )}
                                        </td>
                                        <td>{attendance ? formatTime(attendance.checkInTime) : '-'}</td>
                                        <td>{attendance ? formatTime(attendance.checkOutTime) : '-'}</td>
                                    </tr>
                                );
                            })}
                            {employees.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="text-center" style={{ padding: '30px', color: '#888' }}>
                                        No employees found in this branch.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default BranchManagerDashboard;
