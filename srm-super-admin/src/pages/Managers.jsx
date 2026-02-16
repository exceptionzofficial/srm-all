import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiPlus, FiSearch, FiBriefcase, FiMail, FiMapPin, FiTrash2, FiEdit2 } from 'react-icons/fi';
import { getEmployees, createEmployee, getBranches, deleteEmployee, updateEmployee } from '../services/api';
import './Employees.css'; // Reusing Employees CSS for consistency

const Managers = () => {
    const navigate = useNavigate();
    const [managers, setManagers] = useState([]);
    const [branches, setBranches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [empRes, branchRes] = await Promise.all([
                getEmployees(),
                getBranches()
            ]);

            const managersList = (empRes.employees || []).filter(e =>
                ['BRANCH_MANAGER', 'CLUSTER_MANAGER', 'RETAIL_MANAGER', 'HR_ADMIN', 'FINANCE_ADMIN', 'LEGAL_ADMIN', 'PRODUCTION_ADMIN', 'QUALITY_ADMIN'].includes(e.role)
            );
            setManagers(managersList);
            setBranches(branchRes.branches || []);
        } catch (error) {
            console.error(error);
            setError('Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
    };

    const filteredManagers = managers.filter(m =>
        m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.employeeId.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleNavigate = (id = null) => {
        if (id) {
            navigate(`/managers/edit/${id}`);
        } else {
            navigate('/managers/add');
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to remove this manager?')) return;
        try {
            await deleteEmployee(id);
            setSuccess('Manager removed');
            loadData();
        } catch (err) {
            setError('Failed to delete manager');
        }
    };

    const getBranchName = (id) => {
        const b = branches.find(b => b.branchId === id);
        return b ? b.name : 'Unassigned';
    };

    if (loading) return <div className="loading-container"><div className="spinner"></div></div>;

    return (
        <div className="employees-page"> {/* Reusing class for layout */}
            <div className="page-header">
                <h1 className="page-title">Branch Managers</h1>
                <div className="header-actions">
                    <div className="search-wrapper">
                        <FiSearch className="search-icon" />
                        <input
                            type="text"
                            placeholder="Search managers..."
                            className="search-input"
                            value={searchTerm}
                            onChange={handleSearch}
                        />
                    </div>
                    <button className="btn btn-primary" onClick={() => handleNavigate()}>
                        <FiPlus /> Add Manager
                    </button>
                </div>
            </div>

            {success && <div className="alert alert-success">{success}</div>}
            {error && <div className="alert alert-danger">{error}</div>}

            <div className="card">
                <div className="table-responsive">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Name</th>
                                <th>Branch</th>
                                <th>Contact</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredManagers.map(manager => (
                                <tr key={manager.employeeId}>
                                    <td>{manager.employeeId}</td>
                                    <td>
                                        <div style={{ fontWeight: 500 }}>{manager.name}</div>
                                        <div style={{ fontSize: '12px', color: '#666' }}>Joined: {manager.joinedDate ? manager.joinedDate.split('T')[0] : 'N/A'}</div>
                                    </td>
                                    <td>
                                        <div className="badge badge-main" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                            <FiBriefcase /> {manager.role ? manager.role.replace('_', ' ') : 'Manager'}
                                        </div>
                                        <div style={{ fontSize: '11px', marginTop: '4px', color: '#666' }}>
                                            <FiMapPin style={{ marginRight: '2px' }} /> {getBranchName(manager.branchId)}
                                        </div>
                                    </td>
                                    <td>
                                        <div><FiMail style={{ marginRight: 4 }} /> {manager.email}</div>
                                        {manager.phone && <div><FiBriefcase style={{ marginRight: 4 }} /> {manager.phone}</div>}
                                    </td>
                                    <td>
                                        <span className={`badge ${manager.isBlocked ? 'badge-danger' : 'badge-success'}`}>
                                            {manager.isBlocked ? 'Blocked' : 'Active'}
                                        </span>
                                    </td>
                                    <td>
                                        <button className="action-btn edit" onClick={() => handleNavigate(manager.employeeId)} title="Edit">
                                            <FiEdit2 />
                                        </button>
                                        <button className="action-btn delete" onClick={() => handleDelete(manager.employeeId)} title="Delete">
                                            <FiTrash2 />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {filteredManagers.length === 0 && (
                                <tr>
                                    <td colSpan="6" className="text-center" style={{ padding: '40px' }}>
                                        No managers found. Add one to get started.
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

export default Managers;
