
import { useState, useEffect } from 'react';
import { getBranchById, updateBranch } from '../services/api';
import './BranchSettings.css';

const BranchSettings = () => {
    const [branch, setBranch] = useState(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [formData, setFormData] = useState({
        latitude: '',
        longitude: '',
        radiusMeters: 100
    });

    useEffect(() => {
        fetchBranchDetails();
    }, []);

    const fetchBranchDetails = async () => {
        try {
            setLoading(true);
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const branchId = user.branchId;

            if (!branchId) {
                setError('No Branch Assigned to this User');
                setLoading(false);
                return;
            }

            const response = await getBranchById(branchId);
            if (response.success && response.branch) {
                setBranch(response.branch);
                setFormData({
                    latitude: response.branch.latitude || '',
                    longitude: response.branch.longitude || '',
                    radiusMeters: response.branch.radiusMeters || 100
                });
            }
        } catch (err) {
            console.error(err);
            setError('Failed to fetch branch details');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setUpdating(true);
        setError('');
        setSuccess('');

        try {
            if (!branch?.branchId) return;

            const updates = {
                latitude: parseFloat(formData.latitude),
                longitude: parseFloat(formData.longitude),
                radiusMeters: parseInt(formData.radiusMeters)
            };

            const response = await updateBranch(branch.branchId, updates);
            if (response.success) {
                setSuccess('Branch geofence updated successfully!');
                setBranch(response.branch);
            }
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || 'Failed to update geofence');
        } finally {
            setUpdating(false);
        }
    };

    const openInMaps = () => {
        if (formData.latitude && formData.longitude) {
            window.open(`https://www.google.com/maps/search/?api=1&query=${formData.latitude},${formData.longitude}`, '_blank');
        }
    };

    if (loading) return <div className="loading">Loading branch details...</div>;

    return (
        <div className="branch-settings-container">
            <div className="settings-header">
                <h1>Branch Settings</h1>
                <p>Manage geofence and location settings for {branch?.name || 'your branch'}</p>
            </div>

            {error && <div className="alert error">{error}</div>}
            {success && <div className="alert success">{success}</div>}

            <div className="settings-card">
                <h2>Geofence Configuration</h2>
                <div className="info-box">
                    <p>
                        Set the central latitude and longitude for your branch.
                        Employees can only mark attendance within the specified radius.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="settings-form">
                    <div className="form-row">
                        <div className="form-group">
                            <label>Latitude</label>
                            <input
                                type="number"
                                step="any"
                                name="latitude"
                                value={formData.latitude}
                                onChange={handleChange}
                                placeholder="e.g. 12.9716"
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Longitude</label>
                            <input
                                type="number"
                                step="any"
                                name="longitude"
                                value={formData.longitude}
                                onChange={handleChange}
                                placeholder="e.g. 77.5946"
                                required
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Radius (meters)</label>
                        <input
                            type="number"
                            name="radiusMeters"
                            value={formData.radiusMeters}
                            onChange={handleChange}
                            min="10"
                            max="10000"
                            required
                        />
                        <span className="help-text">Recommended: 100m - 500m</span>
                    </div>

                    <div className="form-actions">
                        <button type="button" className="btn-secondary" onClick={openInMaps} disabled={!formData.latitude || !formData.longitude}>
                            Preview on Map
                        </button>
                        <button type="submit" className="btn-primary" disabled={updating}>
                            {updating ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>

            <div className="settings-card">
                <h2>Current Location Details</h2>
                <div className="details-grid">
                    <div className="detail-item">
                        <span className="label">Branch Name:</span>
                        <span className="value">{branch?.name}</span>
                    </div>
                    <div className="detail-item">
                        <span className="label">Address:</span>
                        <span className="value">{branch?.address || 'N/A'}</span>
                    </div>
                    <div className="detail-item">
                        <span className="label">Type:</span>
                        <span className="value">{branch?.branchType}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BranchSettings;
