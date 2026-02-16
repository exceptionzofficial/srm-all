import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    BuildingOffice2Icon,
    PlusIcon,
    MagnifyingGlassIcon,
    XMarkIcon
} from '@heroicons/react/24/outline';
import { FiEdit2, FiTrash2 } from 'react-icons/fi';

const API_BASE_URL = 'https://srm-backend-lake.vercel.app';

const PayGroups = () => {
    const [payGroups, setPayGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        isActive: true
    });
    const [editingId, setEditingId] = useState(null);

    useEffect(() => {
        fetchPayGroups();
    }, []);

    const fetchPayGroups = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/pay-groups`);
            const data = await response.json();
            if (data.success) {
                setPayGroups(data.payGroups);
            }
        } catch (error) {
            console.error('Error fetching pay groups:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const url = editingId
                ? `${API_BASE_URL}/api/pay-groups/${editingId}`
                : `${API_BASE_URL}/api/pay-groups`;

            const method = editingId ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            const data = await response.json();
            if (data.success) {
                fetchPayGroups();
                setShowModal(false);
                resetForm();
            } else {
                alert('Failed to save pay group: ' + data.message);
            }
        } catch (error) {
            console.error('Error saving pay group:', error);
            alert('Error saving pay group');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this pay group?')) return;

        try {
            const response = await fetch(`${API_BASE_URL}/api/pay-groups/${id}`, {
                method: 'DELETE',
            });
            const data = await response.json();
            if (data.success) {
                fetchPayGroups();
            } else {
                alert('Failed to delete pay group: ' + data.message);
            }
        } catch (error) {
            console.error('Error deleting pay group:', error);
            alert('Error deleting pay group');
        }
    };

    const resetForm = () => {
        setFormData({ name: '', description: '', isActive: true });
        setEditingId(null);
    };

    const openEditModal = (group) => {
        setFormData({
            name: group.name,
            description: group.description,
            isActive: group.isActive
        });
        setEditingId(group.payGroupId);
        setShowModal(true);
    };

    const filteredGroups = payGroups.filter(group =>
        group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        group.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div style={{ padding: '24px', maxWidth: '1280px', margin: '0 auto', fontFamily: 'sans-serif' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                    <h1 style={{ fontSize: '24px', fontWeight: 'bold', background: 'linear-gradient(to right, #111827, #4B5563)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: 0 }}>
                        Pay Groups
                    </h1>
                    <p style={{ color: '#6B7280', marginTop: '4px', fontSize: '14px' }}>Manage payroll groups and entities</p>
                </div>
                <button
                    onClick={() => {
                        resetForm();
                        setShowModal(true);
                    }}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '10px 20px',
                        backgroundColor: '#000',
                        color: '#fff',
                        borderRadius: '12px',
                        border: 'none',
                        cursor: 'pointer',
                        fontWeight: 500,
                        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                    }}
                >
                    <PlusIcon style={{ width: '20px', height: '20px' }} />
                    <span>Create Group</span>
                </button>
            </div>

            {/* Search Bar */}
            <div style={{ position: 'relative', marginBottom: '32px' }}>
                <MagnifyingGlassIcon style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '20px', height: '20px', color: '#9CA3AF' }} />
                <input
                    type="text"
                    placeholder="Search pay groups..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{
                        width: '100%',
                        padding: '12px 16px 12px 40px',
                        borderRadius: '12px',
                        border: '1px solid #F3F4F6',
                        fontSize: '16px',
                        outline: 'none',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                        boxSizing: 'border-box'
                    }}
                />
            </div>

            {/* Content - List View */}
            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '48px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', borderBottom: '2px solid #000', animation: 'spin 1s linear infinite' }} />
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <AnimatePresence>
                        {filteredGroups.map((group) => (
                            <motion.div
                                key={group.payGroupId}
                                layout
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                style={{
                                    backgroundColor: '#fff',
                                    borderRadius: '16px',
                                    border: '1px solid #F3F4F6',
                                    padding: '16px 24px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                                    transition: 'box-shadow 0.2s',
                                    gap: '24px'
                                }}
                                whileHover={{ boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
                                    <div style={{ padding: '10px', backgroundColor: '#F9FAFB', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <BuildingOffice2Icon style={{ width: '24px', height: '24px', color: '#4B5563' }} />
                                    </div>
                                    <div>
                                        <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#111827', margin: '0 0 2px 0' }}>{group.name}</h3>
                                        {group.description && (
                                            <p style={{ fontSize: '14px', color: '#6B7280', margin: 0 }}>
                                                {group.description}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                                    <span style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        padding: '4px 12px',
                                        borderRadius: '9999px',
                                        fontSize: '12px',
                                        fontWeight: '500',
                                        backgroundColor: group.isActive ? '#DCFCE7' : '#FEE2E2',
                                        color: group.isActive ? '#15803D' : '#B91C1C'
                                    }}>
                                        {group.isActive ? 'Active' : 'Inactive'}
                                    </span>

                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button
                                            onClick={() => openEditModal(group)}
                                            style={{ padding: '8px', color: '#2563EB', background: '#EFF6FF', borderRadius: '8px', border: 'none', cursor: 'pointer', transition: 'background-color 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                            title="Edit"
                                        >
                                            <FiEdit2 style={{ width: '18px', height: '18px' }} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(group.payGroupId)}
                                            style={{ padding: '8px', color: '#DC2626', background: '#FEF2F2', borderRadius: '8px', border: 'none', cursor: 'pointer', transition: 'background-color 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                            title="Delete"
                                        >
                                            <FiTrash2 style={{ width: '18px', height: '18px' }} />
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}

            {/* Modal */}
            <AnimatePresence>
                {showModal && (
                    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowModal(false)}
                            style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(4px)' }}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            style={{
                                position: 'relative',
                                width: '100%',
                                maxWidth: '450px',
                                backgroundColor: '#fff',
                                borderRadius: '24px',
                                padding: '32px',
                                margin: '16px',
                                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
                                zIndex: 1001
                            }}
                        >
                            <button
                                onClick={() => setShowModal(false)}
                                style={{ position: 'absolute', top: '24px', right: '24px', border: 'none', background: 'none', cursor: 'pointer', color: '#9CA3AF' }}
                            >
                                <XMarkIcon style={{ width: '24px', height: '24px' }} />
                            </button>

                            <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#111827', marginBottom: '24px' }}>
                                {editingId ? 'Edit Pay Group' : 'New Pay Group'}
                            </h2>

                            <form onSubmit={handleSubmit}>
                                <div style={{ marginBottom: '20px' }}>
                                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                                        Group Name
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        style={{ width: '100%', padding: '10px 16px', borderRadius: '12px', border: '1px solid #E5E7EB', outline: 'none', fontSize: '14px', boxSizing: 'border-box' }}
                                        placeholder="e.g. SRM Sweets"
                                    />
                                </div>

                                <div style={{ marginBottom: '20px' }}>
                                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                                        Description
                                    </label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        style={{ width: '100%', padding: '10px 16px', borderRadius: '12px', border: '1px solid #E5E7EB', outline: 'none', fontSize: '14px', minHeight: '100px', resize: 'none', boxSizing: 'border-box' }}
                                        placeholder="Brief description..."
                                    />
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '32px' }}>
                                    <input
                                        type="checkbox"
                                        id="isActive"
                                        checked={formData.isActive}
                                        onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                        style={{ width: '18px', height: '18px', borderRadius: '4px', accentColor: '#000' }}
                                    />
                                    <label htmlFor="isActive" style={{ fontSize: '14px', color: '#374151' }}>
                                        Active Status
                                    </label>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                                    <button
                                        type="button"
                                        onClick={() => setShowModal(false)}
                                        style={{ padding: '10px 20px', fontSize: '14px', fontWeight: '500', color: '#4B5563', backgroundColor: '#F9FAFB', borderRadius: '12px', border: 'none', cursor: 'pointer' }}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        style={{ padding: '10px 20px', fontSize: '14px', fontWeight: '500', backgroundColor: '#000', color: '#fff', borderRadius: '12px', border: 'none', cursor: 'pointer' }}
                                    >
                                        {editingId ? 'Save Changes' : 'Create Group'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default PayGroups;
