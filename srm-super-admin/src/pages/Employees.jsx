import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiPlus, FiEdit2, FiTrash2, FiUser, FiMapPin, FiSearch } from 'react-icons/fi';
import { getEmployees, deleteEmployee, getBranches } from '../services/api';
import './Employees.css';

const Employees = () => {
    const navigate = useNavigate();
    const [employees, setEmployees] = useState([]);
    const [branches, setBranches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [empResponse, branchResponse] = await Promise.all([
                getEmployees(),
                getBranches().catch(() => ({ branches: [] })),
            ]);
            setEmployees(empResponse.employees || []);
            setBranches(branchResponse.branches || []);
        } catch (error) {
            console.error('Error loading data:', error);
            setError('Failed to load employees');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (employeeId) => {
        if (!confirm('Are you sure you want to delete this employee?')) return;
        try {
            await deleteEmployee(employeeId);
            setSuccess('Employee deleted successfully');
            loadData();
            setTimeout(() => setSuccess(''), 3000);
        } catch (error) {
            setError(error.response?.data?.message || 'Error deleting employee');
        }
    };

    const getBranchName = (branchId) => {
        const branch = branches.find(b => b.branchId === branchId);
        return branch?.name || '-';
    };

    const filteredEmployees = employees
        .filter(emp => {
            const searchLower = searchTerm.toLowerCase();
            return (
                emp.name?.toLowerCase().includes(searchLower) ||
                emp.employeeId?.toLowerCase().includes(searchLower) ||
                emp.associateCode?.toLowerCase().includes(searchLower)
            );
        })
        .sort((a, b) => a.name.localeCompare(b.name));

    const mobileEmployees = filteredEmployees.filter(emp => emp.employeeType !== 'kiosk');
    const kioskEmployees = filteredEmployees.filter(emp => emp.employeeType === 'kiosk');

    if (loading) {
        return <div className="loading-container"><div className="spinner"></div></div>;
    }

    return (
        <div className="employees-page">
            <div className="page-header">
                <h1 className="page-title">Employees</h1>
                <div className="header-actions">
                    <div className="search-wrapper">
                        <FiSearch className="search-icon" />
                        <input
                            type="text"
                            placeholder="Search by name, ID or code..."
                            className="search-input"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button className="btn btn-primary" onClick={() => navigate('/employees/add')}>
                        <FiPlus /> Add Employee
                    </button>
                </div>
            </div>

            {success && <div className="alert alert-success">{success}</div>}
            {error && <div className="alert alert-danger">{error}</div>}

            <h2 className="section-title" style={{ marginTop: '20px', marginBottom: '10px', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                📱 Mobile App Employees ({mobileEmployees.length})
            </h2>
            <div className="card">
                {mobileEmployees.length > 0 ? (
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Employee ID</th>
                                    <th>Name</th>
                                    <th>Branch</th>
                                    <th>Work Mode</th>
                                    <th>Face Status</th>
                                    <th>Added By</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {mobileEmployees.map((emp) => (
                                    <tr key={emp.employeeId} onClick={() => navigate(`/attendance/view/${emp.employeeId}`)} style={{ cursor: 'pointer' }}>
                                        <td><strong>{emp.employeeId}</strong></td>
                                        <td>
                                            <div className="employee-info">
                                                <div className={`employee-avatar ${emp.photoUrl ? 'has-photo' : ''}`}>
                                                    {emp.photoUrl ? <img src={emp.photoUrl} alt={emp.name} /> : <FiUser />}
                                                </div>
                                                <div>
                                                    <span className="employee-name">{emp.name}</span>
                                                    <span className="employee-email">{emp.email || emp.phone}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="branch-cell">
                                                <FiMapPin className="branch-icon-small" />
                                                <span>{getBranchName(emp.branchId)}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`badge ${emp.workMode === 'OFFICE' ? 'badge-secondary' : 'badge-warning'}`}>
                                                {emp.workMode?.replace('_', ' ') || 'OFFICE'}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`badge ${emp.faceId ? 'badge-success' : 'badge-warning'}`}>
                                                {emp.faceId ? 'Registered' : 'Not Registered'}
                                            </span>
                                        </td>
                                        <td>
                                            <span className="badge badge-secondary" style={{ background: '#e2e8f0', color: '#475569' }}>
                                                {emp.addedBy || 'N/A'}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`badge ${emp.status === 'active' ? 'badge-success' : 'badge-danger'}`}>
                                                {emp.status}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="action-buttons">
                                                <button className="action-btn edit" onClick={(e) => { e.stopPropagation(); navigate(`/employees/edit/${emp.employeeId}`); }}><FiEdit2 /></button>
                                                <button className="action-btn delete" onClick={(e) => { e.stopPropagation(); handleDelete(emp.employeeId); }}><FiTrash2 /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p className="empty-message">No mobile app employees found.</p>
                )}
            </div>

            <h2 className="section-title" style={{ marginTop: '30px', marginBottom: '10px', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                🖥️ Kiosk / Common Employees ({kioskEmployees.length})
            </h2>
            <div className="card">
                {kioskEmployees.length > 0 ? (
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Employee ID</th>
                                    <th>Name</th>
                                    <th>Branch</th>
                                    <th>Face Status</th>
                                    <th>Added By</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {kioskEmployees.map((emp) => (
                                    <tr key={emp.employeeId} onClick={() => navigate(`/attendance/view/${emp.employeeId}`)} style={{ cursor: 'pointer' }}>
                                        <td><strong>{emp.employeeId}</strong></td>
                                        <td>
                                            <div className="employee-info">
                                                <div className={`employee-avatar ${emp.photoUrl ? 'has-photo' : ''}`}>
                                                    {emp.photoUrl ? <img src={emp.photoUrl} alt={emp.name} /> : <FiUser />}
                                                </div>
                                                <div>
                                                    <span className="employee-name">{emp.name}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="branch-cell">
                                                <FiMapPin className="branch-icon-small" />
                                                <span>{getBranchName(emp.branchId)}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`badge ${emp.faceId ? 'badge-success' : 'badge-warning'}`}>
                                                {emp.faceId ? 'Registered' : 'Not Registered'}
                                            </span>
                                        </td>
                                        <td>
                                            <span className="badge badge-secondary" style={{ background: '#e2e8f0', color: '#475569' }}>
                                                {emp.addedBy || 'N/A'}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`badge ${emp.status === 'active' ? 'badge-success' : 'badge-danger'}`}>
                                                {emp.status}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="action-buttons">
                                                <button className="action-btn edit" onClick={(e) => { e.stopPropagation(); navigate(`/employees/edit/${emp.employeeId}`); }}><FiEdit2 /></button>
                                                <button className="action-btn delete" onClick={(e) => { e.stopPropagation(); handleDelete(emp.employeeId); }}><FiTrash2 /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p className="empty-message">No kiosk employees found.</p>
                )}
            </div>
        </div>
    );
};

export default Employees;
