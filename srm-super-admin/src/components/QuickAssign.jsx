
import { useState, useEffect } from 'react';
import { initiateRegistration, createEmployee, getBranches } from '../services/api'; // Importing existing APIs
import { FiUserPlus, FiSend } from 'react-icons/fi';
import './QuickAssign.css';

const QuickAssign = () => {
    const [email, setEmail] = useState('');
    const [role, setRole] = useState('BRANCH_MANAGER');
    const [branchId, setBranchId] = useState('');
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);
    const [branches, setBranches] = useState([]);

    useEffect(() => {
        loadBranches();
    }, []);

    const loadBranches = async () => {
        try {
            const data = await getBranches();
            if (data && data.branches) {
                setBranches(data.branches);
            }
        } catch (error) {
            console.error('Failed to load branches for QuickAssign', error);
        }
    };

    const handleAssign = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            // 1. Create the Employee Record with Role
            const payload = {
                firstName: name.split(' ')[0],
                lastName: name.split(' ')[1] || '',
                officialEmail: email,
                role: role,
                branchId: branchId,
                status: 'active',
                employeeId: 'TEMP' + Math.floor(Math.random() * 1000) // Temporary ID generation
            };

            await createEmployee(payload);

            // 2. Trigger the Auth Flow (Send OTP/Invite)
            await initiateRegistration(email);

            alert(`Invitation sent to ${email} for role ${role}`);
            setEmail('');
            setName('');
        } catch (error) {
            alert('Error assigning manager: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="quick-assign-card">
            <div className="card-header">
                <FiUserPlus />
                <h3>Quick Assign Manager</h3>
            </div>
            <form onSubmit={handleAssign}>
                <div className="form-row">
                    <input
                        type="text"
                        placeholder="Manager Name"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        required
                    />
                    <input
                        type="email"
                        placeholder="Email Address"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        required
                    />
                </div>
                <div className="form-row">
                    <select value={role} onChange={e => setRole(e.target.value)}>
                        <option value="BRANCH_MANAGER">Branch Manager</option>
                        <option value="HR_ADMIN">HR Manager</option>
                        <option value="FINANCE_ADMIN">Finance Admin (CFO)</option>
                        <option value="LEGAL_ADMIN">Legal Admin (CLO)</option>
                        <option value="PRODUCTION_ADMIN">Production Admin (CPO)</option>
                        <option value="QUALITY_ADMIN">Quality Admin (QO)</option>
                    </select>
                    <select
                        value={branchId}
                        onChange={e => setBranchId(e.target.value)}
                        disabled={loading}
                    >
                        <option value="">Select Branch (Optional)</option>
                        {branches.map(b => (
                            <option key={b.branchId} value={b.branchId}>
                                {b.name} ({b.branchId})
                            </option>
                        ))}
                    </select>
                </div>
                <button type="submit" disabled={loading}>
                    <FiSend /> {loading ? 'Sending...' : 'Assign & Invite'}
                </button>
            </form>
        </div>
    );
};

export default QuickAssign;
