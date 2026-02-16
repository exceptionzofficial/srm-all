
import { useState, useEffect } from 'react';
import { FiUsers, FiDollarSign, FiClock, FiActivity } from 'react-icons/fi';
import { getPendingFundRequests, processFundRequest } from '../services/api';

import './Dashboard.css';

const Dashboard = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [branchId, setBranchId] = useState(null);
    const [stats, setStats] = useState({
        present: 0,
        total: 0,
        revenue: 0
    });

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        try {
            // Get Current User
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const branchId = user.branchId;
            setBranchId(branchId);

            // 1. Fetch Requests & Filter by Branch (if API returns all)
            // Note: getPendingFundRequests might return all requests for ROLE. 
            // We should filter client-side if backend doesn't support branch filter yet.
            const reqResponse = await getPendingFundRequests('BRANCH_MANAGER');
            let branchRequests = reqResponse.data || [];
            if (branchId) {
                // Filter by branchId if present in request data or assume all if not
                // Safest approach: filter strictly if field exists
                branchRequests = branchRequests.filter(req => req.branchId === branchId);
            }
            setRequests(branchRequests);

            // 2. Fetch Employees & Attendance for Stats
            if (branchId) {
                const { getEmployees, getAttendanceReport } = await import('../services/api');

                // Employees
                const empRes = await getEmployees();
                const branchEmployees = (empRes.employees || []).filter(e => e.branchId === branchId);

                // Today's Attendance
                const today = new Date().toISOString().split('T')[0];
                const attRes = await getAttendanceReport(today);
                const records = attRes.records || [];
                const branchRecords = records.filter(r => branchEmployees.some(e => e.employeeId === r.employeeId));

                // Calculate Stats
                const presentCount = new Set(branchRecords.map(r => r.employeeId)).size;
                const totalCount = branchEmployees.length;
                setStats({
                    present: presentCount,
                    total: totalCount,
                    revenue: 0 // Default to 0 until API is available
                });
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleForward = async (id) => {
        if (!window.confirm('Forward this request to MD?')) return;
        try {
            await processFundRequest({ id, action: 'FORWARD', actorRole: 'BRANCH_MANAGER' });
            fetchRequests();
        } catch (error) {
            alert('Error forwarding request');
        }
    };

    const handleReject = async (id) => {
        if (!window.confirm('Reject this request?')) return;
        try {
            await processFundRequest({ id, action: 'REJECT', actorRole: 'BRANCH_MANAGER' });
            fetchRequests();
        } catch (error) {
            alert('Error rejecting request');
        }
    };

    return (
        <div className="dashboard-container">
            <div className="dashboard-header">
                <h1>Branch Manager Dashboard</h1>
            </div>

            <div className="dashboard-stats">
                <div className="stat-card">
                    <h3>Staff Present</h3>
                    <p className="stat-value">{stats.present}/{stats.total}</p>
                </div>
                <div className="stat-card">
                    <h3>Today's Sales</h3>
                    <p className="stat-value">₹{stats.revenue.toLocaleString()}</p>
                </div>
                <div className="stat-card">
                    <h3>Pending Requests</h3>
                    <p className="stat-value">{requests.length}</p>
                </div>
                <div className="stat-card">
                    <h3>Overall Health</h3>
                    <p className="stat-value success">Good</p>
                </div>
            </div>

            <div className="content-section">
                <h2>Pending Reviews & Approvals</h2>
                {loading ? <p>Loading...</p> : (
                    <div className="table-responsive">
                        {requests.length === 0 ? <p>No pending items.</p> : (
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Employee</th>
                                        <th>Reason</th>
                                        <th>Amount</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {requests.map(req => (
                                        <tr key={req.id}>
                                            <td>{req.requesterName}</td>
                                            <td>{req.reason}</td>
                                            <td>₹{req.amount}</td>
                                            <td>
                                                <button className="btn-action forward" onClick={() => handleForward(req.id)}>Forward to MD</button>
                                                <button className="btn-action reject" onClick={() => handleReject(req.id)}>Reject</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;
