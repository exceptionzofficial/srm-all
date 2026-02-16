import { useState, useEffect } from 'react';
import { getPendingFundRequests, processFundRequest, getEmployees } from '../../services/api';
import { FiCheck, FiX, FiRefreshCw, FiDollarSign, FiSearch, FiCreditCard } from 'react-icons/fi';

const FinanceDashboard = () => {
    const [activeTab, setActiveTab] = useState('payroll'); // 'requests' or 'payroll'
    const [requests, setRequests] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [reqRes, empRes] = await Promise.all([
                getPendingFundRequests('CFO').catch(() => ({ data: [] })),
                getEmployees().catch(() => ({ employees: [] }))
            ]);
            setRequests(reqRes.data || []);
            setEmployees(empRes.employees || []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (id, action) => {
        try {
            await processFundRequest({ id, action, actorRole: 'CFO' });
            // Refresh logic could be better but simple fetch works
            const reqRes = await getPendingFundRequests('CFO');
            setRequests(reqRes.data || []);
        } catch (error) {
            alert('Error processing request');
        }
    };

    const totalAmount = requests.reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0);
    const totalMonthlyPayroll = employees.reduce((sum, e) => sum + (parseFloat(e.fixedSalary) || 0), 0);

    const filteredEmployees = employees.filter(emp =>
        emp.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.employeeId?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Finance Department (CFO)</h1>
                <button onClick={loadData} className="p-2 bg-white rounded-full shadow-sm hover:shadow text-gray-600">
                    <FiRefreshCw />
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Pending Fund Requests</h3>
                    <p className="text-3xl font-bold text-gray-900">{requests.length}</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Requested Amount</h3>
                    <p className="text-3xl font-bold text-red-600">₹{totalAmount.toLocaleString()}</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Est. Monthly Payroll</h3>
                    <p className="text-3xl font-bold text-green-600">₹{totalMonthlyPayroll.toLocaleString()}</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 mb-6 border-b border-gray-200">
                <button
                    onClick={() => setActiveTab('payroll')}
                    className={`pb-3 px-4 font-medium transition-colors border-b-2 ${activeTab === 'payroll' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                    Payroll & Bank Data
                </button>
                <button
                    onClick={() => setActiveTab('requests')}
                    className={`pb-3 px-4 font-medium transition-colors border-b-2 ${activeTab === 'requests' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                    Fund Requests
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden min-h-[400px]">
                {loading ? <div className="p-8 text-center text-gray-500">Loading data...</div> : (
                    <>
                        {activeTab === 'requests' && (
                            <div className="p-6">
                                {requests.length === 0 ? <p className="text-gray-500 text-center py-8">No pending requests.</p> : (
                                    <table className="w-full text-left">
                                        <thead className="bg-gray-50 text-gray-600 text-sm">
                                            <tr>
                                                <th className="p-3">Requester</th>
                                                <th className="p-3">Amount</th>
                                                <th className="p-3">Reason</th>
                                                <th className="p-3">Type</th>
                                                <th className="p-3">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {requests.map(req => (
                                                <tr key={req.id}>
                                                    <td className="p-3 font-medium">{req.requesterName}</td>
                                                    <td className="p-3">₹{req.amount}</td>
                                                    <td className="p-3 text-gray-600">{req.reason}</td>
                                                    <td className="p-3"><span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs">{req.requesterRole}</span></td>
                                                    <td className="p-3 flex gap-2">
                                                        <button className="text-green-600 hover:bg-green-50 p-2 rounded" onClick={() => handleAction(req.id, 'APPROVE')} title="Approve">
                                                            <FiCheck />
                                                        </button>
                                                        <button className="text-red-600 hover:bg-red-50 p-2 rounded" onClick={() => handleAction(req.id, 'REJECT')} title="Reject">
                                                            <FiX />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        )}

                        {activeTab === 'payroll' && (
                            <div>
                                <div className="p-4 border-b border-gray-100 flex justify-end">
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
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead className="bg-gray-50 text-gray-600 text-sm">
                                            <tr>
                                                <th className="p-4 font-medium">Employee</th>
                                                <th className="p-4 font-medium">Bank Details</th>
                                                <th className="p-4 font-medium">Account No.</th>
                                                <th className="p-4 font-medium">IFSC</th>
                                                <th className="p-4 font-medium">Fixed Salary (CTC)</th>
                                                <th className="p-4 font-medium">Pay Mode</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {filteredEmployees.map(emp => (
                                                <tr key={emp.employeeId} className="hover:bg-gray-50 transition-colors">
                                                    <td className="p-4">
                                                        <div className="font-medium text-gray-900">{emp.name}</div>
                                                        <div className="text-xs text-gray-500">{emp.employeeId}</div>
                                                    </td>
                                                    <td className="p-4">
                                                        {emp.bankDetails?.bankName ? (
                                                            <div className="flex items-center gap-2">
                                                                <FiCreditCard className="text-gray-400" />
                                                                <span>{emp.bankDetails.bankName}</span>
                                                            </div>
                                                        ) : <span className="text-gray-400 italic">Not set</span>}
                                                    </td>
                                                    <td className="p-4 font-mono text-sm text-gray-700">
                                                        {emp.bankDetails?.accountNumber || '-'}
                                                    </td>
                                                    <td className="p-4 font-mono text-sm text-gray-700">
                                                        {emp.bankDetails?.ifscCode || '-'}
                                                    </td>
                                                    <td className="p-4 font-medium text-gray-900">
                                                        {emp.fixedSalary ? `₹${Number(emp.fixedSalary).toLocaleString()}` : '-'}
                                                    </td>
                                                    <td className="p-4">
                                                        <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs">
                                                            {emp.bankDetails?.paymentMode || 'Transfer'}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default FinanceDashboard;
