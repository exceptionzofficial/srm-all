
import { useState, useEffect } from 'react';
import { getPendingFundRequests, processFundRequest } from '../services/api';
import { FiCheck, FiX, FiRefreshCw } from 'react-icons/fi';
import './Dashboard.css';

const Dashboard = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        setLoading(true);
        try {
            const response = await getPendingFundRequests('CFO');
            setRequests(response.data || []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (id, action) => {
        if (!window.confirm(`Are you sure you want to ${action} this request?`)) return;
        try {
            await processFundRequest({ id, action, actorRole: 'CFO' });
            fetchRequests(); // Refresh
        } catch (error) {
            alert('Error processing request: ' + (error.response?.data?.message || error.message));
        }
    };

    const totalAmount = requests.reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0);

    return (
        <div className="dashboard-container">
            <div className="dashboard-header">
                <h1>Finance Overview</h1>
                <button className="refresh-btn" onClick={fetchRequests}><FiRefreshCw /> Refresh</button>
            </div>

            <div className="dashboard-stats">
                <div className="stat-card">
                    <h3>Pending Requests</h3>
                    <p className="stat-value">{requests.length}</p>
                </div>
                <div className="stat-card">
                    <h3>Total Requested Value</h3>
                    <p className="stat-value">₹{totalAmount.toLocaleString()}</p>
                </div>
            </div>

            <div className="content-section">
                <h2>Fund Requests (Pending Approval)</h2>
                {loading ? <div className="loading">Loading...</div> : (
                    <div className="table-container">
                        {requests.length === 0 ? <p className="empty-state">No pending requests found.</p> : (
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Requester</th>
                                        <th>Type</th>
                                        <th>Amount</th>
                                        <th>Reason</th>
                                        <th>Role</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {requests.map(req => (
                                        <tr key={req.id}>
                                            <td>{req.requesterName}</td>
                                            <td><span className="badge badge-info">{req.type || 'Advance'}</span></td>
                                            <td className="amount">₹{req.amount}</td>
                                            <td>{req.reason}</td>
                                            <td>{req.requesterRole}</td>
                                            <td>
                                                <div className="action-buttons">
                                                    <button className="btn-icon success" onClick={() => handleAction(req.id, 'APPROVE')} title="Approve">
                                                        <FiCheck />
                                                    </button>
                                                    <button className="btn-icon danger" onClick={() => handleAction(req.id, 'REJECT')} title="Reject">
                                                        <FiX />
                                                    </button>
                                                </div>
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
