
import { useState, useEffect } from 'react';
import { FiCheckCircle, FiAlertCircle, FiSearch, FiSend } from 'react-icons/fi';
import { getEmployees } from '../services/api'; // Make sure this exists
import './Dashboard.css';

const Dashboard = () => {
    const [employees, setEmployees] = useState([]);
    const [selectedEmployees, setSelectedEmployees] = useState([]);
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const loadEmployees = async () => {
            try {
                // Fetch only active employees
                const res = await getEmployees();
                if (res.data) {
                    setEmployees(res.data.filter(e => e.status === 'active'));
                }
            } catch (err) {
                console.error("Failed to load employees", err);
            } finally {
                setLoading(false);
            }
        };
        loadEmployees();
    }, []);

    const toggleSelection = (id) => {
        if (selectedEmployees.includes(id)) {
            setSelectedEmployees(selectedEmployees.filter(eid => eid !== id));
        } else {
            setSelectedEmployees([...selectedEmployees, id]);
        }
    };

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedEmployees(filteredEmployees.map(e => e.id));
        } else {
            setSelectedEmployees([]);
        }
    };

    const handleSendNotification = () => {
        if (selectedEmployees.length === 0) return alert('Select employees first');
        if (!message.trim()) return alert('Enter a message');

        // In real app, call API here
        alert(`Sending "${message}" to ${selectedEmployees.length} employees.`);
        setMessage('');
        setSelectedEmployees([]);
    };

    const filteredEmployees = employees.filter(e =>
        e.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.employeeId.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="dashboard-container">
            <div className="dashboard-header">
                <h1>Quality Department (QO)</h1>
                <div className="header-status success">
                    <FiCheckCircle /> System Operational
                </div>
            </div>

            <div className="quality-stats">
                <div className="stat-card">
                    <h3>Hygiene Score</h3>
                    <p className="stat-value">98/100</p>
                </div>
                <div className="stat-card">
                    <h3>Pending Audits</h3>
                    <p className="stat-value">2</p>
                </div>
                <div className="stat-card">
                    <h3>Issues Reported</h3>
                    <p className="stat-value warning">5</p>
                </div>
            </div>

            <div className="notification-section">
                <h2>Broadcast Quality Alert</h2>
                <div className="notification-composer">
                    <textarea
                        className="message-input"
                        placeholder="Type alert message (e.g., 'Health Inspection in 30 mins, please adhere to protocols')..."
                        value={message}
                        onChange={e => setMessage(e.target.value)}
                    ></textarea>

                    <div className="recipient-selector">
                        <div className="selector-header">
                            <div className="search-bar">
                                <FiSearch />
                                <input
                                    type="text"
                                    placeholder="Search employees..."
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <div className="selection-info">
                                <label>
                                    <input
                                        type="checkbox"
                                        checked={filteredEmployees.length > 0 && selectedEmployees.length === filteredEmployees.length}
                                        onChange={handleSelectAll}
                                    /> Select All Visible
                                </label>
                                <span>{selectedEmployees.length} Selected</span>
                            </div>
                        </div>

                        <div className="employee-list">
                            {loading ? <p>Loading staff...</p> : filteredEmployees.map(emp => (
                                <div
                                    key={emp.id}
                                    className={`employee-item ${selectedEmployees.includes(emp.id) ? 'selected' : ''}`}
                                    onClick={() => toggleSelection(emp.id)}
                                >
                                    <input
                                        type="checkbox"
                                        checked={selectedEmployees.includes(emp.id)}
                                        readOnly
                                    />
                                    <div className="emp-details">
                                        <strong>{emp.fullName}</strong>
                                        <span>{emp.designation}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="composer-actions">
                        <button className="send-btn" onClick={handleSendNotification} disabled={selectedEmployees.length === 0}>
                            <FiSend /> Send Alert
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
