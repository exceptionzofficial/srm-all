
import { useState } from 'react';
import { FiFile, FiUpload, FiDownload, FiTrash2, FiSearch, FiFolder } from 'react-icons/fi';
import './Dashboard.css';

const Dashboard = () => {
    const [documents, setDocuments] = useState([
        { id: 1, name: 'Employee Contracts 2025.pdf', type: 'contract', date: '2025-01-15', size: '2.4 MB' },
        { id: 2, name: 'NDA Template v2.docx', type: 'template', date: '2025-01-10', size: '1.1 MB' },
        { id: 3, name: 'Compliance Report Q4 2024.pdf', type: 'report', date: '2024-12-30', size: '5.6 MB' },
        { id: 4, name: 'Partnership Agreement - Vendor A.pdf', type: 'contract', date: '2025-01-20', size: '3.2 MB' },
    ]);
    const [searchTerm, setSearchTerm] = useState('');

    const handleDelete = (id) => {
        if (window.confirm('Delete this document?')) {
            setDocuments(documents.filter(d => d.id !== id));
        }
    };

    const filteredDocs = documents.filter(d => d.name.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div className="dashboard-container">
            <div className="dashboard-header">
                <h1>Legal Department (CLO)</h1>
                <button className="primary-btn"><FiUpload /> Upload Document</button>
            </div>

            <div className="dashboard-stats">
                <div className="stat-card">
                    <h3>Total Documents</h3>
                    <p className="stat-value">{documents.length}</p>
                </div>
                <div className="stat-card">
                    <h3>Pending Reviews</h3>
                    <p className="stat-value">3</p>
                </div>
                <div className="stat-card">
                    <h3>Compliance Status</h3>
                    <p className="stat-value success">98%</p>
                </div>
            </div>

            <div className="content-section">
                <div className="section-header">
                    <h2>Document Repository</h2>
                    <div className="search-box">
                        <FiSearch />
                        <input
                            type="text"
                            placeholder="Search documents..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="table-container">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Type</th>
                                <th>Date Modified</th>
                                <th>Size</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredDocs.map(doc => (
                                <tr key={doc.id}>
                                    <td>
                                        <div className="file-info">
                                            <FiFile className="file-icon" />
                                            <span>{doc.name}</span>
                                        </div>
                                    </td>
                                    <td><span className="badge badge-gray">{doc.type}</span></td>
                                    <td>{doc.date}</td>
                                    <td>{doc.size}</td>
                                    <td>
                                        <div className="action-buttons">
                                            <button className="btn-icon" title="Download"><FiDownload /></button>
                                            <button className="btn-icon danger" onClick={() => handleDelete(doc.id)} title="Delete"><FiTrash2 /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
