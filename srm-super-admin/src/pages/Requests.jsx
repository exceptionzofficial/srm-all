import React, { useState, useEffect } from 'react';
import { getAllRequests } from '../services/api';
import './Requests.css'; // We'll create this or reuse styles

const Requests = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('APPROVED'); // Default to APPROVED for Admin

    useEffect(() => {
        loadRequests();
    }, [filter]);

    const loadRequests = async () => {
        setLoading(true);
        try {
            const data = await getAllRequests(filter === 'ALL' ? null : filter);
            // sort by date desc
            const sorted = data.requests.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            setRequests(sorted);
        } catch (error) {
            console.error('Failed to load requests:', error);
        } finally {
            setLoading(false);
        }
    };

    const getTypeColor = (type) => {
        switch (type) {
            case 'ADVANCE': return '#2196F3'; // Blue
            case 'LEAVE': return '#FF9800'; // Orange
            case 'PERMISSION': return '#9C27B0'; // Purple
            default: return '#757575';
        }
    };

    const getStatusBadge = (status) => {
        const colors = {
            'APPROVED': '#4CAF50',
            'PENDING': '#FF9800',
            'REJECTED': '#F44336'
        };
        return (
            <span style={{
                backgroundColor: colors[status] || '#757575',
                color: 'white',
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: 'bold'
            }}>
                {status}
            </span>
        );
    };

    return (
        <div className="page-container">
            <div className="page-header">
                <h1 className="page-title">Request History</h1>
                <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="filter-select"
                >
                    <option value="APPROVED">Approved Only</option>
                    <option value="PENDING">Pending Only</option>
                    <option value="REJECTED">Rejected Only</option>
                    <option value="ALL">All Requests</option>
                </select>
            </div>

            {loading ? (
                <p>Loading requests...</p>
            ) : requests.length === 0 ? (
                <div className="empty-state">No requests found for this filter.</div>
            ) : (
                <div className="requests-grid">
                    {requests.map((req) => (
                        <div key={req.requestId} className={`request-card type-${req.type.toLowerCase()}`}>
                            <div className="card-header">
                                <span className={`request-badge badge-${req.type.toLowerCase()}`}>
                                    {req.type}
                                </span>
                                <span className={`status-badge status-${req.status.toLowerCase()}`}>
                                    {req.status}
                                </span>
                            </div>

                            <div className="employee-info">
                                <h3>{req.employeeName || req.employeeId}</h3>
                                <div className="employee-meta">
                                    <span>{req.department}</span>
                                    {req.branchId && (
                                        <>
                                            <span>•</span>
                                            <span>{req.branchId}</span>
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="detail-box">
                                {req.type === 'ADVANCE' && (
                                    <div className="detail-row">
                                        <span className="label">Amount</span>
                                        <span className="value">₹{req.data?.amount}</span>
                                    </div>
                                )}
                                {(req.type === 'LEAVE' || req.type === 'PERMISSION') && (
                                    <>
                                        <div className="detail-row">
                                            <span className="label">Date</span>
                                            <span className="value">{req.data?.date}</span>
                                        </div>
                                        <div className="detail-row">
                                            <span className="label">Reason</span>
                                            <span className="value">{req.data?.reason}</span>
                                        </div>
                                        {req.type === 'PERMISSION' && (
                                            <div className="detail-row">
                                                <span className="label">Duration</span>
                                                <span className="value">{req.data?.duration} mins</span>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>

                            <div className="card-footer">
                                <span>Requested: {new Date(req.createdAt).toLocaleDateString()}</span>
                                {req.hrActionBy && <span>Action by HR</span>}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Requests;
