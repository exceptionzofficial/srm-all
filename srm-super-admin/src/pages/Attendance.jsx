/**
 * Attendance Reports Page - View Only (Work time from GPS tracking)
 */

import { useState, useEffect } from 'react';
import { FiCalendar, FiDownload, FiClock, FiMapPin } from 'react-icons/fi';
import * as XLSX from 'xlsx';
import { getAttendanceByDate, getEmployees, getBranches } from '../services/api';
import './Attendance.css';

const Attendance = () => {
    const [selectedDate, setSelectedDate] = useState(
        new Date().toISOString().split('T')[0]
    );
    const [attendance, setAttendance] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [branches, setBranches] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();

        // Auto-refresh every 60 seconds for real-time updates
        const refreshInterval = setInterval(() => {
            console.log('[Attendance] Auto-refreshing data...');
            loadData();
        }, 60000);

        return () => clearInterval(refreshInterval);
    }, [selectedDate]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [attResponse, empResponse, branchResponse] = await Promise.all([
                getAttendanceByDate(selectedDate).catch(() => ({ records: [] })),
                getEmployees().catch(() => ({ employees: [] })),
                getBranches().catch(() => ({ branches: [] })),
            ]);

            setAttendance(attResponse.records || []);
            setEmployees(empResponse.employees || []);
            setBranches(branchResponse.branches || []);
        } catch (error) {
            console.error('Error loading data:', error);
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

    const getEmployeeName = (employeeId) => {
        const emp = employees.find(e => e.employeeId === employeeId);
        return emp?.name || employeeId;
    };

    const getEmployeeBranch = (employeeId) => {
        const emp = employees.find(e => e.employeeId === employeeId);
        const branch = branches.find(b => b.branchId === emp?.branchId);
        return branch?.name || '-';
    };

    const getStatusBadgeClass = (status) => {
        switch (status) {
            case 'present': return 'badge-success';
            case 'late': return 'badge-warning';
            case 'half-day': return 'badge-danger';
            default: return 'badge-secondary';
        }
    };

    const calculateDuration = (checkIn, checkOut) => {
        if (!checkIn || !checkOut) return '--';
        const start = new Date(checkIn);
        const end = new Date(checkOut);
        const diff = Math.abs(end - start);
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        return `${hours}h ${minutes}m`;
    };

    // Export to Excel
    const exportToExcel = () => {
        const data = attendance.map(record => ({
            'Employee ID': record.employeeId,
            'Employee Name': getEmployeeName(record.employeeId),
            'Branch': getEmployeeBranch(record.employeeId),
            'Check In': formatTime(record.checkInTime),
            'Check Out': formatTime(record.checkOutTime),
            'Duration': calculateDuration(record.checkInTime, record.checkOutTime),
            'Status': record.status,
            'Date': selectedDate,
        }));

        if (data.length === 0) {
            alert('No data to export');
            return;
        }

        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Attendance');
        XLSX.writeFile(workbook, `Attendance_${selectedDate}.xlsx`);
    };

    // Calculate unique employees who have attendance
    const uniqueEmployeeIds = [...new Set(attendance.map(a => a.employeeId))];

    // Stats - based on unique employees
    const stats = {
        total: employees.length,
        present: uniqueEmployeeIds.length, // Unique employees who checked in
        absent: Math.max(0, employees.length - uniqueEmployeeIds.length), // Employees who didn't check in
        sessions: attendance.length, // Total check-in sessions
        onTime: attendance.filter(a => a.status === 'present').length,
        late: attendance.filter(a => a.status === 'late').length,
    };

    return (
        <div className="attendance-page">
            <div className="page-header">
                <h1 className="page-title">Attendance Report</h1>
                <div className="header-actions">
                    <div className="date-picker">
                        <FiCalendar />
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            max={new Date().toISOString().split('T')[0]}
                        />
                    </div>
                    <button className="btn btn-primary" onClick={exportToExcel}>
                        <FiDownload /> Export Excel
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="attendance-stats">
                <div className="stat-item">
                    <span className="stat-number">{stats.total}</span>
                    <span className="stat-text">Total Employees</span>
                </div>
                <div className="stat-item present">
                    <span className="stat-number">{stats.present}</span>
                    <span className="stat-text">Present</span>
                </div>
                <div className="stat-item absent">
                    <span className="stat-number">{stats.absent}</span>
                    <span className="stat-text">Absent</span>
                </div>
                <div className="stat-item">
                    <span className="stat-number">{stats.sessions}</span>
                    <span className="stat-text">Sessions</span>
                </div>
                <div className="stat-item late">
                    <span className="stat-number">{stats.late}</span>
                    <span className="stat-text">Late</span>
                </div>
            </div>

            {/* Attendance Table */}
            <div className="card">
                <div className="card-header">
                    <h2 className="card-title">
                        <FiClock style={{ marginRight: '8px' }} />
                        {new Date(selectedDate).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                        })}
                    </h2>
                </div>

                {loading ? (
                    <div className="loading-container">
                        <div className="spinner"></div>
                    </div>
                ) : attendance.length > 0 ? (
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Employee</th>
                                    <th>Branch</th>
                                    <th>Check In</th>
                                    <th>Check Out</th>
                                    <th>Work Time</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {uniqueEmployeeIds.map((employeeId, index) => {
                                    // Get all sessions for this employee, sorted by checkInTime
                                    const sessions = attendance
                                        .filter(a => a.employeeId === employeeId)
                                        .sort((a, b) => new Date(b.checkInTime) - new Date(a.checkInTime)); // Newest first
                                    // Get latest session (first after sorting by newest)
                                    const latestSession = sessions[0];

                                    // Calculate total work time from all sessions
                                    let totalMinutes = 0;
                                    sessions.forEach(s => {
                                        if (s.checkInTime && s.checkOutTime) {
                                            const diff = new Date(s.checkOutTime) - new Date(s.checkInTime);
                                            totalMinutes += Math.floor(diff / (1000 * 60));
                                        }
                                    });
                                    const totalHours = Math.floor(totalMinutes / 60);
                                    const remainingMins = totalMinutes % 60;
                                    const totalDuration = `${totalHours}h ${remainingMins}m`;

                                    return (
                                        <tr key={employeeId}>
                                            <td>{index + 1}</td>
                                            <td>
                                                <div className="employee-cell">
                                                    <strong>{employeeId}</strong>
                                                    <span>{getEmployeeName(employeeId)}</span>
                                                </div>
                                            </td>
                                            <td>{getEmployeeBranch(employeeId)}</td>
                                            <td>{formatTime(latestSession.checkInTime)}</td>
                                            <td>{formatTime(latestSession.checkOutTime)}</td>
                                            <td>
                                                <span className="work-time">
                                                    <FiMapPin style={{ marginRight: '4px', fontSize: '12px' }} />
                                                    {totalDuration} ({sessions.length} session{sessions.length > 1 ? 's' : ''})
                                                </span>
                                            </td>
                                            <td>
                                                <span className={`badge ${getStatusBadgeClass(latestSession.status)}`}>
                                                    {latestSession.status}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="empty-state">
                        <FiCalendar className="empty-icon" />
                        <p>No attendance records for this date</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Attendance;
