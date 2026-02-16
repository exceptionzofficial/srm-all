/**
 * Dashboard Page - Stats and Live Status
 */

import { useState, useEffect } from 'react';
import { FiUsers, FiUserCheck, FiClock, FiMapPin, FiDownload, FiRefreshCw, FiPieChart, FiCalendar, FiDollarSign } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { getEmployees, getAttendanceByDate, getBranches, getDashboardStats } from '../services/api';
import QuickAssign from '../components/QuickAssign';
import './Dashboard.css';

const Dashboard = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        totalEmployees: 0,
        registeredFaces: 0,
        todayPresent: 0,
        totalBranches: 0,
    });
    // New stats state for QuickAssign context, merging with existing stats if needed, but keeping separate for now based on instruction
    const [quickAssignStats, setQuickAssignStats] = useState({
        employees: 0,
        branches: 0,
        presentToday: 0,
        totalSalary: 0
    });
    const [branches, setBranches] = useState([]);
    const [branchStats, setBranchStats] = useState([]);
    const [todayAttendance, setTodayAttendance] = useState([]);
    const [loading, setLoading] = useState(true);
    const [employees, setEmployees] = useState([]);

    useEffect(() => {
        loadDashboardData();

        // Auto-refresh every 60 seconds for real-time updates
        const refreshInterval = setInterval(() => {
            console.log('[Dashboard] Auto-refreshing data...');
            loadDashboardData();
        }, 60000); // 60 seconds

        return () => clearInterval(refreshInterval);
    }, []);

    const loadDashboardData = async () => {
        setLoading(true);
        try {
            // Get employees
            const empResponse = await getEmployees();
            const allEmployees = empResponse.employees || [];
            setEmployees(allEmployees);

            // Get branches
            let allBranches = [];
            try {
                const branchResponse = await getBranches();
                allBranches = branchResponse.branches || [];
                setBranches(allBranches);
            } catch (e) {
                console.log('No branches found');
            }

            // Get today's attendance
            const today = new Date().toISOString().split('T')[0];
            let todayRecords = [];
            try {
                const attResponse = await getAttendanceByDate(today);
                todayRecords = attResponse.records || [];
            } catch (e) {
                console.log('No attendance records yet');
            }

            // --- LOGIC FIX: Count UNIQUE employees ---
            // Create a Set of unique employee IDs present today
            const presentEmployeeIds = new Set(todayRecords.map(r => r.employeeId));
            const uniquePresentCount = presentEmployeeIds.size;

            // Calculate branch-wise stats with UNIQUE logic
            const branchStatsData = allBranches.map(branch => {
                const branchEmployees = allEmployees.filter(e => e.branchId === branch.branchId);

                // Count how many unique employees from this branch are present
                const branchPresentCount = branchEmployees.filter(e => presentEmployeeIds.has(e.employeeId)).length;

                return {
                    ...branch,
                    totalEmployees: branchEmployees.length,
                    registeredFaces: branchEmployees.filter(e => e.faceId).length,
                    presentToday: branchPresentCount, // Fixed logic
                    attendanceRate: branchEmployees.length > 0
                        ? Math.round((branchPresentCount / branchEmployees.length) * 100)
                        : 0,
                };
            });
            setBranchStats(branchStatsData);

            setStats({
                totalEmployees: allEmployees.length,
                registeredFaces: allEmployees.filter(e => e.faceId).length,
                todayPresent: uniquePresentCount, // Fixed logic
                totalBranches: allBranches.length,
            });
            setTodayAttendance(todayRecords);
        } catch (error) {
            console.error('Error loading dashboard:', error);
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

    const handleBranchClick = (branch) => {
        navigate(`/branches/${branch.branchId}`);
    };

    // Export to Excel
    const exportToExcel = (type = 'daily') => {
        let data = [];
        let filename = '';

        if (type === 'daily') {
            filename = `Attendance_Report_${new Date().toISOString().split('T')[0]}.xlsx`;
            data = todayAttendance.map(record => ({
                'Employee ID': record.employeeId,
                'Check In': formatTime(record.checkInTime),
                'Check Out': formatTime(record.checkOutTime),
                'Status': record.status,
                'Date': new Date().toLocaleDateString(),
            }));
        } else if (type === 'branch') {
            filename = `Branch_Report_${new Date().toISOString().split('T')[0]}.xlsx`;
            data = branchStats.map(b => ({
                'Branch Name': b.name,
                'Address': b.address || '-',
                'Total Employees': b.totalEmployees,
                'Faces Registered': b.registeredFaces,
                'Present Today': b.presentToday,
                'Attendance Rate': `${b.attendanceRate}%`,
            }));
        } else if (type === 'employees') {
            filename = `Employee_Report_${new Date().toISOString().split('T')[0]}.xlsx`;
            data = employees.map(emp => {
                const branch = branches.find(b => b.branchId === emp.branchId);
                return {
                    'Employee ID': emp.employeeId,
                    'Name': emp.name,
                    'Email': emp.email || '-',
                    'Phone': emp.phone || '-',
                    'Department': emp.department || '-',
                    'Designation': emp.designation || '-',
                    'Branch': branch?.name || '-',
                    'Face Registered': emp.faceId ? 'Yes' : 'No',
                    'Status': emp.status,
                };
            });
        }

        if (data.length === 0) {
            alert('No data to export');
            return;
        }

        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Report');
        XLSX.writeFile(workbook, filename);
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
            </div>
        );
    }

    return (
        <div className="dashboard">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Dashboard</h1>
                    <span className="date-display">
                        {new Date().toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                        })}
                    </span>
                </div>
                <div className="header-actions">
                    <button className="btn btn-secondary" onClick={loadDashboardData}>
                        <FiRefreshCw /> Refresh
                    </button>
                    <button className="btn btn-primary btn-analytics" onClick={() => navigate('/analytics')}>
                        <FiPieChart /> View Analytics
                    </button>
                    <div className="export-dropdown">
                        <button className="btn btn-secondary">
                            <FiDownload /> Export
                        </button>
                        <div className="dropdown-content">
                            <button onClick={() => exportToExcel('daily')}>📅 Daily Attendance</button>
                            <button onClick={() => exportToExcel('branch')}>🏢 Branch Report</button>
                            <button onClick={() => exportToExcel('employees')}>👥 Employee List</button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Assign Manager */}
            <QuickAssign />

            {/* Stats Grid */}
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon employees">
                        <FiUsers />
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">{stats.totalEmployees}</span>
                        <span className="stat-label">Total Employees</span>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon registered">
                        <FiUserCheck />
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">{stats.registeredFaces}</span>
                        <span className="stat-label">Faces Registered</span>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon present">
                        <FiClock />
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">{stats.todayPresent}</span>
                        <span className="stat-label">Present Today</span>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon branches">
                        <FiMapPin />
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">{stats.totalBranches}</span>
                        <span className="stat-label">Active Branches</span>
                    </div>
                </div>
            </div>

            {/* Branch-wise Stats */}
            {branchStats.length > 0 && (
                <div className="card branch-overview-card">
                    <div className="section-header">
                        <h2 className="section-title">
                            <FiMapPin style={{ marginRight: '8px' }} />
                            Branch-wise Statistics
                        </h2>
                        <span className="branch-count-badge">{branchStats.length} Branches</span>
                    </div>

                    <div className="branch-table-container">
                        <table className="branch-table">
                            <thead>
                                <tr>
                                    <th>Branch Name</th>
                                    <th>Address</th>
                                    <th className="text-center">Total Employees</th>
                                    <th className="text-center">Faces Registered</th>
                                    <th className="text-center">Present Today</th>
                                    <th className="text-center">Attendance Rate</th>
                                </tr>
                            </thead>
                            <tbody>
                                {branchStats.map((branch) => (
                                    <tr
                                        key={branch.branchId}
                                        onClick={() => handleBranchClick(branch)}
                                        style={{ cursor: 'pointer', transition: 'background 0.2s' }}
                                        className="branch-row"
                                    >
                                        <td>
                                            <div className="branch-name-cell">
                                                <strong>{branch.name}</strong>
                                            </div>
                                        </td>
                                        <td className="branch-address">{branch.address || '-'}</td>
                                        <td className="text-center">
                                            <span className="stat-badge employees-badge">{branch.totalEmployees}</span>
                                        </td>
                                        <td className="text-center">
                                            <span className="stat-badge registered-badge">{branch.registeredFaces}</span>
                                        </td>
                                        <td className="text-center">
                                            <span className="stat-badge present-badge">{branch.presentToday}</span>
                                        </td>
                                        <td className="text-center">
                                            <span className={`rate-badge ${branch.attendanceRate >= 80 ? 'rate-good' : branch.attendanceRate >= 50 ? 'rate-medium' : 'rate-low'}`}>
                                                {branch.attendanceRate}%
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr className="totals-row">
                                    <td colSpan="2"><strong>Total (All Branches)</strong></td>
                                    <td className="text-center">
                                        <strong>{branchStats.reduce((sum, b) => sum + b.totalEmployees, 0)}</strong>
                                    </td>
                                    <td className="text-center">
                                        <strong>{branchStats.reduce((sum, b) => sum + b.registeredFaces, 0)}</strong>
                                    </td>
                                    <td className="text-center">
                                        <strong>{branchStats.reduce((sum, b) => sum + b.presentToday, 0)}</strong>
                                    </td>
                                    <td className="text-center">
                                        <strong>
                                            {branchStats.reduce((sum, b) => sum + b.totalEmployees, 0) > 0
                                                ? Math.round((branchStats.reduce((sum, b) => sum + b.presentToday, 0) / branchStats.reduce((sum, b) => sum + b.totalEmployees, 0)) * 100)
                                                : 0}%
                                        </strong>
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
            )}

            {/* Today's Attendance Table */}
            <div className="card">
                <div className="section-header">
                    <h2 className="section-title">Today's Attendance</h2>
                    <button className="btn btn-sm btn-secondary" onClick={() => exportToExcel('daily')}>
                        <FiDownload /> Export
                    </button>
                </div>
                {todayAttendance.length > 0 ? (
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Employee ID</th>
                                    <th>Check In</th>
                                    <th>Check Out</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {todayAttendance.map((record) => (
                                    <tr key={record.attendanceId}>
                                        <td>{record.employeeId}</td>
                                        <td>{formatTime(record.checkInTime)}</td>
                                        <td>{formatTime(record.checkOutTime)}</td>
                                        <td>
                                            <span className={`badge badge-${record.status === 'present' ? 'success' : record.status === 'late' ? 'warning' : 'danger'}`}>
                                                {record.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p className="empty-message">No attendance records for today yet.</p>
                )}
            </div>
        </div>
    );
};

export default Dashboard;
