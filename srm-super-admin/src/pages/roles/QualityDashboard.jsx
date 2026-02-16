import { useState, useEffect } from 'react';
import { getEmployees, sendSMSOTP } from '../../services/api'; // re-using sendSMS for notification mock or similar
// We might need a new API for "RequestEmployees"
import { FiCheckSquare, FiSquare, FiSend } from 'react-icons/fi';

const QualityDashboard = () => {
    const [employees, setEmployees] = useState([]);
    const [selectedIds, setSelectedIds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [requestStatus, setRequestStatus] = useState('');

    useEffect(() => {
        fetchEmployees();
    }, []);

    const fetchEmployees = async () => {
        try {
            const data = await getEmployees();
            // Handle both array and object returns depending on API structure
            const list = Array.isArray(data) ? data : (data.employees || []);
            setEmployees(list);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const toggleSelect = (id) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(selectedIds.filter(pid => pid !== id));
        } else {
            setSelectedIds([...selectedIds, id]);
        }
    };

    const selectRandom = (count) => {
        // Shuffle and pick
        const shuffled = [...employees].sort(() => 0.5 - Math.random());
        const selected = shuffled.slice(0, count).map(e => e.employeeId);
        setSelectedIds(selected);
    };

    const handleRequest = async () => {
        if (selectedIds.length === 0) return;
        setRequestStatus('Sending requests...');

        // Logic to notify these employees (mock for now, or use chatbot/notification API)
        // For now, we'll simulate a success
        setTimeout(() => {
            setRequestStatus(`Successfully requested ${selectedIds.length} employees for Quality Testing.`);
            setSelectedIds([]);
        }, 1500);
    };

    return (
        <div className="dashboard-container">
            <h1>Quality Assurance (QO)</h1>

            <div className="dashboard-stats">
                <div className="stat-card">
                    <h3>Available Employees</h3>
                    <p className="stat-value">{employees.length}</p>
                </div>
                <div className="stat-card">
                    <h3>Selected</h3>
                    <p className="stat-value">{selectedIds.length}</p>
                </div>
            </div>

            <div className="content-section">
                <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h2>Request Employees for Testing</h2>
                    <div className="actions">
                        <button className="btn-secondary" onClick={() => selectRandom(50)} style={{ marginRight: '10px' }}>Auto-Select 50</button>
                        <button className="btn-primary" onClick={handleRequest} disabled={selectedIds.length === 0}>
                            <FiSend /> Send Request
                        </button>
                    </div>
                </div>

                {requestStatus && <div className="alert-success" style={{ padding: '10px', background: '#d4edda', color: '#155724', borderRadius: '4px', marginBottom: '10px' }}>{requestStatus}</div>}

                <div className="employee-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px', maxHeight: '500px', overflowY: 'auto' }}>
                    {loading ? <p>Loading...</p> : employees.map(emp => (
                        <div
                            key={emp.employeeId}
                            onClick={() => toggleSelect(emp.employeeId)}
                            style={{
                                border: selectedIds.includes(emp.employeeId) ? '2px solid #0056b3' : '1px solid #ddd',
                                background: selectedIds.includes(emp.employeeId) ? '#f0f7ff' : '#fff',
                                padding: '10px',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center'
                            }}
                        >
                            <div style={{ marginRight: '10px' }}>
                                {selectedIds.includes(emp.employeeId) ? <FiCheckSquare color="#0056b3" /> : <FiSquare color="#ccc" />}
                            </div>
                            <div>
                                <div style={{ fontWeight: '600' }}>{emp.name || emp.firstName}</div>
                                <div style={{ fontSize: '0.8rem', color: '#666' }}>{emp.employeeId}</div>
                                <div style={{ fontSize: '0.75rem', color: '#888' }}>{emp.role}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default QualityDashboard;
