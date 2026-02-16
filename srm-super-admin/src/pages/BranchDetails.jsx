/**
 * Branch Details Page
 * Shows detailed attendance for a specific branch
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiMapPin, FiUsers, FiUserCheck, FiClock, FiDownload } from 'react-icons/fi';
import * as XLSX from 'xlsx';
import { getEmployees, getAttendanceByDate, getBranches } from '../services/api';
import './Dashboard.css'; // Reusing dashboard styles

const BranchDetails = () => {
    const { branchId } = useParams();
    const navigate = useNavigate();

    const [branch, setBranch] = useState(null);
    const [employees, setEmployees] = useState([]);
    const [todayAttendance, setTodayAttendance] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        total: 0,
        present: 0,
        registered: 0
    });

    useEffect(() => {
        loadBranchData();
    }, [branchId]);

    const loadBranchData = async () => {
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

            // 4. Calculate Stats
            const presentIds = new Set(branchRecords.map(r => r.employeeId));
            setStats({
                total: branchEmployees.length,
                registered: branchEmployees.filter(e => e.faceId).length,
                present: presentIds.size
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

    const exportToExcel = () => {
        const data = employees.map(emp => {
            const attendance = todayAttendance.find(r => r.employeeId === emp.employeeId);
            return {
                'Employee ID': emp.employeeId,
                'Name': emp.name,
                'Designation': emp.designation || '-',
                'Status': attendance ? 'Present' : 'Absent',
                'Check In': attendance ? formatTime(attendance.checkInTime) : '-',
                'Check Out': attendance ? formatTime(attendance.checkOutTime) : '-',
            };
        });

        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Branch_Attendance');
        XLSX.writeFile(workbook, `${branch?.name || 'Branch'}_Attendance_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
            </div>
        );
    }

    if (!branch) {
        return (
            <div className="dashboard">
                <div className="page-header">
                    <button className="btn btn-secondary" onClick={() => navigate('/')}>
                        <FiArrowLeft /> Back to Dashboard
                    </button>
                </div>
                <div className="card">
                    <p className="empty-message">Branch not found.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="dashboard">
            <div className="page-header">
                <div>
                    <button
                        className="btn btn-link"
                        onClick={() => navigate('/')}
                        style={{ padding: 0, marginBottom: '10px', color: 'var(--text-secondary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                        <FiArrowLeft /> Back to Dashboard
                    </button>
                    <h1 className="page-title">{branch.name}</h1>
                    <span className="date-display">
                        <FiMapPin style={{ marginRight: '6px' }} />
                        {branch.address || 'No address provided'}
                    </span>
                </div>
                <div className="header-actions">
                    <button className="btn btn-secondary" onClick={exportToExcel}>
                        <FiDownload /> Export Report
                    </button>
                </div>
            </div>

            {/* Branch Stats Cards */}
            <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
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

            {/* Attendance Table */}
            <div className="card">
                <div className="section-header">
                    <h2 className="section-title">Employee Attendance</h2>
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
                            {employees
                                .sort((a, b) => {
                                    // Sort: Present first, then by name
                                    const aAtt = todayAttendance.find(r => r.employeeId === a.employeeId);
                                    const bAtt = todayAttendance.find(r => r.employeeId === b.employeeId);
                                    if (aAtt && !bAtt) return -1;
                                    if (!aAtt && bAtt) return 1;
                                    return a.name.localeCompare(b.name);
                                })
                                .map(emp => {
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
                                        No employees assigned to this branch.
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

export default BranchDetails;
