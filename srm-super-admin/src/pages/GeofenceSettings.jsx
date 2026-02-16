/**
 * Geo-fence Settings Page
 * Configure office location and allowed radius
 */

import { useState, useEffect } from 'react';
import { FiMapPin, FiSave, FiRefreshCw } from 'react-icons/fi';
import { getGeofenceSettings, updateGeofenceSettings } from '../services/api';
import './GeofenceSettings.css';

const GeofenceSettings = () => {
    const [settings, setSettings] = useState({
        officeLat: '',
        officeLng: '',
        radiusMeters: 100,
        officeAddress: '',
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');
    const [isConfigured, setIsConfigured] = useState(false);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const response = await getGeofenceSettings();
            if (response.settings) {
                setSettings({
                    officeLat: response.settings.officeLat || '',
                    officeLng: response.settings.officeLng || '',
                    radiusMeters: response.settings.radiusMeters || 100,
                    officeAddress: response.settings.officeAddress || '',
                });
                setIsConfigured(response.settings.isConfigured || false);
            }
        } catch (error) {
            console.error('Error loading settings:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setError('');
        setSuccess('');

        if (!settings.officeLat || !settings.officeLng) {
            setError('Office coordinates are required');
            return;
        }

        if (settings.radiusMeters < 10 || settings.radiusMeters > 10000) {
            setError('Radius must be between 10 and 10000 meters');
            return;
        }

        setSaving(true);
        try {
            await updateGeofenceSettings({
                officeLat: parseFloat(settings.officeLat),
                officeLng: parseFloat(settings.officeLng),
                radiusMeters: parseInt(settings.radiusMeters),
                officeAddress: settings.officeAddress,
                updatedBy: 'admin',
            });
            setSuccess('Geo-fence settings saved successfully!');
            setIsConfigured(true);
            setTimeout(() => setSuccess(''), 3000);
        } catch (error) {
            setError(error.response?.data?.message || 'Error saving settings');
        } finally {
            setSaving(false);
        }
    };

    const getCurrentLocation = () => {
        if (!navigator.geolocation) {
            setError('Geolocation is not supported by your browser');
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                setSettings({
                    ...settings,
                    officeLat: position.coords.latitude.toFixed(6),
                    officeLng: position.coords.longitude.toFixed(6),
                });
                setSuccess('Location retrieved! Don\'t forget to save.');
                setTimeout(() => setSuccess(''), 3000);
            },
            (error) => {
                setError('Unable to retrieve location: ' + error.message);
            }
        );
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
            </div>
        );
    }

    return (
        <div className="geofence-page">
            <div className="page-header">
                <h1 className="page-title">Geo-fence Settings</h1>
                <span className={`config-status ${isConfigured ? 'configured' : ''}`}>
                    <FiMapPin />
                    {isConfigured ? 'Configured' : 'Not Configured'}
                </span>
            </div>

            {success && <div className="alert alert-success">{success}</div>}
            {error && <div className="alert alert-danger">{error}</div>}

            <div className="settings-grid">
                {/* Settings Form */}
                <div className="card settings-card">
                    <h2 className="card-title">
                        <FiMapPin /> Office Location Configuration
                    </h2>
                    <p className="card-description">
                        Set the office coordinates and allowed radius for employee attendance.
                        Employees can only register face and mark attendance within this radius.
                    </p>

                    <div className="form-section">
                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Latitude</label>
                                <input
                                    type="number"
                                    step="0.000001"
                                    className="form-input"
                                    value={settings.officeLat}
                                    onChange={(e) => setSettings({ ...settings, officeLat: e.target.value })}
                                    placeholder="e.g., 19.0760"
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Longitude</label>
                                <input
                                    type="number"
                                    step="0.000001"
                                    className="form-input"
                                    value={settings.officeLng}
                                    onChange={(e) => setSettings({ ...settings, officeLng: e.target.value })}
                                    placeholder="e.g., 72.8777"
                                />
                            </div>
                        </div>

                        <button
                            type="button"
                            className="btn btn-secondary location-btn"
                            onClick={getCurrentLocation}
                        >
                            <FiRefreshCw /> Use Current Location
                        </button>

                        <div className="form-group">
                            <label className="form-label">Allowed Radius (meters)</label>
                            <input
                                type="number"
                                min="10"
                                max="10000"
                                className="form-input"
                                value={settings.radiusMeters}
                                onChange={(e) => setSettings({ ...settings, radiusMeters: e.target.value })}
                            />
                            <div className="radius-slider">
                                <input
                                    type="range"
                                    min="10"
                                    max="500"
                                    value={settings.radiusMeters}
                                    onChange={(e) => setSettings({ ...settings, radiusMeters: e.target.value })}
                                />
                                <span className="radius-labels">
                                    <span>10m</span>
                                    <span>250m</span>
                                    <span>500m</span>
                                </span>
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Office Address (Optional)</label>
                            <input
                                type="text"
                                className="form-input"
                                value={settings.officeAddress}
                                onChange={(e) => setSettings({ ...settings, officeAddress: e.target.value })}
                                placeholder="e.g., SRM Sweets, 123 Main Street, Mumbai"
                            />
                        </div>

                        <button
                            className="btn btn-primary save-btn"
                            onClick={handleSave}
                            disabled={saving}
                        >
                            <FiSave /> {saving ? 'Saving...' : 'Save Settings'}
                        </button>
                    </div>
                </div>

                {/* Info Card */}
                <div className="card info-card">
                    <h3 className="info-title">How Geo-fencing Works</h3>
                    <ul className="info-list">
                        <li>
                            <strong>Face Registration:</strong> Employees must be within the
                            specified radius to register their face.
                        </li>
                        <li>
                            <strong>Attendance Marking:</strong> Check-in and check-out only
                            work within the geo-fence boundary.
                        </li>
                        <li>
                            <strong>Warning Message:</strong> Employees outside the radius will
                            see "You are too far from office" message.
                        </li>
                        <li>
                            <strong>Distance Display:</strong> The app shows exactly how far
                            the employee is from the office.
                        </li>
                    </ul>

                    {isConfigured && (
                        <div className="current-config">
                            <h4>Current Configuration</h4>
                            <p><strong>Coordinates:</strong> {settings.officeLat}, {settings.officeLng}</p>
                            <p><strong>Radius:</strong> {settings.radiusMeters} meters</p>
                            {settings.officeAddress && (
                                <p><strong>Address:</strong> {settings.officeAddress}</p>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default GeofenceSettings;
