import { useState, useEffect } from 'react';
import { getEmployeeRules, updateEmployeeRules } from '../services/api';
import './EmployeeRules.css';
import { FiSave, FiAlertCircle } from 'react-icons/fi';

const EmployeeRules = () => {
    const [rules, setRules] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState(null);

    useEffect(() => {
        fetchRules();
    }, []);

    const fetchRules = async () => {
        try {
            setLoading(true);
            const data = await getEmployeeRules();
            if (data.success && data.rules) {
                setRules(data.rules.rules || '');
            }
        } catch (error) {
            console.error("Error fetching rules:", error);
            setMessage({ type: 'error', text: 'Failed to load rules.' });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            setMessage(null);
            const response = await updateEmployeeRules(rules, 'Super Admin');
            if (response.success) {
                setMessage({ type: 'success', text: 'Rules updated successfully!' });
            }
        } catch (error) {
            console.error("Error updating rules:", error);
            setMessage({ type: 'error', text: 'Failed to update rules.' });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="rules-page">
            <header className="page-header">
                <h1>Employee Rules & Guidelines</h1>
                <p>Define the rules and policies visible to all employees.</p>
            </header>

            {message && (
                <div className={`message-banner ${message.type}`}>
                    <FiAlertCircle /> {message.text}
                </div>
            )}

            <div className="rules-editor-container">
                {loading ? (
                    <div className="loading-state">Loading rules...</div>
                ) : (
                    <div className="editor-wrapper">
                        <textarea
                            className="rules-textarea"
                            value={rules}
                            onChange={(e) => setRules(e.target.value)}
                            placeholder="Enter company rules here... (e.g. 1. Office hours are 9-6...)"
                        />
                        <div className="actions-bar">
                            <button
                                className="save-btn"
                                onClick={handleSave}
                                disabled={saving}
                            >
                                <FiSave /> {saving ? 'Saving...' : 'Save Rules'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default EmployeeRules;
