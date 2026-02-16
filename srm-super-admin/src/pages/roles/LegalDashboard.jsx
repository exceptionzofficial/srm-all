import { useState, useEffect } from 'react';
import { getEmployees } from '../../services/api';
import { FiFileText, FiCheck, FiX, FiExternalLink, FiSearch, FiAlertCircle } from 'react-icons/fi';

const LegalDashboard = () => {
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const res = await getEmployees();
            setEmployees(res.employees || []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const filteredEmployees = employees.filter(emp =>
        emp.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.employeeId?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const renderDocStatus = (url, label) => {
        if (!url) return <span className="text-gray-400 text-xs flex items-center gap-1"><FiX className="text-red-400" /> Missing</span>;
        return (
            <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 text-xs flex items-center gap-1 font-medium bg-blue-50 px-2 py-1 rounded">
                <FiFileText /> {label} <FiExternalLink className="w-3 h-3" />
            </a>
        );
    };

    const getDocCount = (emp) => {
        const docs = emp.documents || {};
        let count = 0;
        if (docs.aadharUrl) count++;
        if (docs.panUrl) count++;
        if (docs.marksheetUrl) count++;
        if (docs.licenseUrl) count++;
        // Photo is less critical for "Legal" compliance usually, but good to have
        return count;
    };

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6 text-gray-800">Legal Department (CLO) - Reference Check</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Total Employees</h3>
                    <p className="text-3xl font-bold text-gray-900">{employees.length}</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Documents Pending</h3>
                    <p className="text-3xl font-bold text-orange-600">
                        {employees.filter(e => getDocCount(e) < 4).length}
                    </p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Compliance Rate</h3>
                    <p className="text-3xl font-bold text-green-600">
                        {employees.length ? Math.round((employees.filter(e => getDocCount(e) >= 4).length / employees.length) * 100) : 0}%
                    </p>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
                    <h2 className="text-lg font-semibold text-gray-800">Employee Documents</h2>
                    <div className="relative w-full md:w-64">
                        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search employee..."
                            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {loading ? <div className="p-8 text-center text-gray-500">Loading data...</div> : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-gray-50 text-gray-600 text-sm">
                                <tr>
                                    <th className="p-4 font-medium">Employee</th>
                                    <th className="p-4 font-medium">Aadhar Card</th>
                                    <th className="p-4 font-medium">PAN Card</th>
                                    <th className="p-4 font-medium">Education</th>
                                    <th className="p-4 font-medium">License/Passport</th>
                                    <th className="p-4 font-medium">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredEmployees.length === 0 ? (
                                    <tr><td colSpan="6" className="p-8 text-center text-gray-500">No employees found</td></tr>
                                ) : filteredEmployees.map(emp => (
                                    <tr key={emp.employeeId} className="hover:bg-gray-50 transition-colors">
                                        <td className="p-4">
                                            <div className="font-medium text-gray-900">{emp.name}</div>
                                            <div className="text-xs text-gray-500">{emp.employeeId}</div>
                                            <div className="text-xs text-gray-400">{emp.designation}</div>
                                        </td>
                                        <td className="p-4">
                                            {renderDocStatus(emp.documents?.aadharUrl, "Aadhar")}
                                            {emp.documents?.aadharUrl && <div className="text-[10px] text-gray-400 mt-1">{emp.statutoryDetails?.aadharNumber || "No No."}</div>}
                                        </td>
                                        <td className="p-4">
                                            {renderDocStatus(emp.documents?.panUrl, "PAN")}
                                            {emp.documents?.panUrl && <div className="text-[10px] text-gray-400 mt-1">{emp.statutoryDetails?.panNumber || "No No."}</div>}
                                        </td>
                                        <td className="p-4">
                                            {renderDocStatus(emp.documents?.marksheetUrl, "Cert")}
                                        </td>
                                        <td className="p-4">
                                            {renderDocStatus(emp.documents?.licenseUrl, "ID")}
                                        </td>
                                        <td className="p-4">
                                            {getDocCount(emp) >= 4 ? (
                                                <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium">
                                                    <FiCheck className="w-3 h-3" /> Complete
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 bg-orange-100 text-orange-700 px-2 py-1 rounded-full text-xs font-medium">
                                                    <FiAlertCircle className="w-3 h-3" /> Incomplete
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LegalDashboard;
