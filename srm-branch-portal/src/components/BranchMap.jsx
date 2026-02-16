
import { useState, useEffect, useRef } from 'react';
import { getEmployeeLocations, getBranchById } from '../services/api';
import './BranchMap.css'; // We'll move styles to a CSS file

const BranchMap = ({ branchId, height = '400px', searchTerm = '' }) => {
    const mapRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const markersRef = useRef([]);
    const employeeMarkersRef = useRef([]);
    const circleRef = useRef(null);

    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ total: 0, inside: 0, outside: 0 });
    const [mapReady, setMapReady] = useState(false);
    const [branchData, setBranchData] = useState(null);
    const [employees, setEmployees] = useState([]);

    // Initialize Map
    useEffect(() => {
        const checkGoogleMaps = () => {
            if (window.google && window.google.maps && mapRef.current) {
                mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
                    center: { lat: 20.5937, lng: 78.9629 }, // Default India
                    zoom: 5,
                    styles: [
                        {
                            featureType: 'poi',
                            stylers: [{ visibility: 'off' }],
                        },
                    ],
                });
                setMapReady(true);
            } else {
                setTimeout(checkGoogleMaps, 200);
            }
        };
        checkGoogleMaps();
    }, []);

    // Load Data
    useEffect(() => {
        if (!branchId) return;

        const fetchData = async () => {
            try {
                setLoading(true);

                // 1. Fetch Branch Details
                const branchRes = await getBranchById(branchId);
                if (branchRes.success && branchRes.branch) {
                    setBranchData(branchRes.branch);
                }

                // 2. Fetch Employees
                await loadEmployeeLocations();

            } catch (error) {
                console.error('Error loading map data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
        const interval = setInterval(loadEmployeeLocations, 30000); // Live updates
        return () => clearInterval(interval);
    }, [branchId]);

    const loadEmployeeLocations = async () => {
        try {
            const empRes = await getEmployeeLocations();
            if (empRes.success) {
                const branchEmployees = empRes.employees.filter(e => e.branchId === branchId);
                setEmployees(branchEmployees);

                // Stats
                const insideCount = branchEmployees.filter(e => e.isInsideGeofence).length;
                setStats({
                    total: branchEmployees.length,
                    inside: insideCount,
                    outside: branchEmployees.length - insideCount
                });
            }
        } catch (error) {
            console.error('Error refreshing employee locations:', error);
        }
    };

    // Update Map Elements
    useEffect(() => {
        if (mapReady && branchData) {
            updateBranchMarker();
        }
    }, [mapReady, branchData]);

    useEffect(() => {
        if (mapReady && employees.length > 0) {
            updateEmployeeMarkers();
        }
    }, [mapReady, employees, searchTerm]);

    const updateBranchMarker = () => {
        if (!mapInstanceRef.current || !branchData) return;

        const position = {
            lat: parseFloat(branchData.latitude),
            lng: parseFloat(branchData.longitude)
        };

        // Clear existing branch marker/circle
        // (Assuming simple case where we only show ONE branch for the manager)
        if (circleRef.current) circleRef.current.setMap(null);

        // Center map
        mapInstanceRef.current.panTo(position);
        mapInstanceRef.current.setZoom(16);

        // Create Branch Marker using standard clean style
        new window.google.maps.Marker({
            position,
            map: mapInstanceRef.current,
            title: branchData.name,
            icon: {
                path: window.google.maps.SymbolPath.CIRCLE,
                scale: 10,
                fillColor: '#2196F3', // Blue
                fillOpacity: 1,
                strokeColor: '#fff',
                strokeWeight: 2,
            },
        });

        // Create Radius Circle
        circleRef.current = new window.google.maps.Circle({
            map: mapInstanceRef.current,
            center: position,
            radius: parseFloat(branchData.radiusMeters) || 100, // Default 100m if missing
            fillColor: '#2196F3',
            fillOpacity: 0.15,
            strokeColor: '#2196F3',
            strokeOpacity: 0.5,
            strokeWeight: 1,
            clickable: false
        });
    };

    const updateEmployeeMarkers = () => {
        if (!mapInstanceRef.current) return;

        // Clear existing
        employeeMarkersRef.current.forEach(m => m.setMap(null));
        employeeMarkersRef.current = [];

        // Filter employees based on search term
        const filteredEmployees = employees.filter(emp => {
            if (!searchTerm) return true;
            const term = searchTerm.toLowerCase();
            return (
                emp.name?.toLowerCase().includes(term) ||
                emp.employeeId?.toLowerCase().includes(term) ||
                emp.designation?.toLowerCase().includes(term)
            );
        });

        filteredEmployees.forEach(emp => {
            if (!emp.lastLocation) return;
            // ... (rest of marker creation logic remains the same)
            const position = {
                lat: parseFloat(emp.lastLocation.latitude),
                lng: parseFloat(emp.lastLocation.longitude)
            };

            const isOnline = emp.isOnline;
            const isInside = emp.isInsideGeofence;

            // Color Logic Matches Super Admin
            let markerColor = '#999999'; // Offline/Unknown
            if (isOnline) {
                markerColor = isInside ? '#4CAF50' : '#EF4136'; // Green : Red
            }

            const marker = new window.google.maps.Marker({
                position,
                map: mapInstanceRef.current,
                title: emp.name,
                icon: {
                    path: window.google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
                    scale: 5,
                    fillColor: markerColor,
                    fillOpacity: 1,
                    strokeColor: '#fff',
                    strokeWeight: 1.5,
                    rotation: 0,
                },
                zIndex: 100,
            });

            // Info Window
            const infoWindow = new window.google.maps.InfoWindow({
                content: `
                    <div style="padding: 8px; font-family: sans-serif;">
                        <strong>${emp.name}</strong><br/>
                        <small style="color: ${markerColor}; font-weight: 600;">
                            ${isOnline ? (isInside ? '✓ Inside' : '⚠ Outside') : '○ Offline'}
                        </small><br/>
                        <small>${emp.designation || 'Employee'}</small><br/>
                        <small>Last seen: ${new Date(emp.lastLocation.timestamp).toLocaleTimeString()}</small>
                    </div>
                `,
            });

            marker.addListener('click', () => {
                infoWindow.open(mapInstanceRef.current, marker);
            });

            employeeMarkersRef.current.push(marker);
        });
    };

    return (
        <div className="branch-map-wrapper" style={{ height: height }}>
            <div className="map-stats-overlay">
                <div className="stat-item total">
                    <span className="label">Total Staff</span>
                    <span className="value">{stats.total}</span>
                </div>
                <div className="stat-item in">
                    <span className="label">In Branch</span>
                    <span className="value">{stats.inside}</span>
                </div>
                <div className="stat-item out">
                    <span className="label">Out / Field</span>
                    <span className="value">{stats.outside}</span>
                </div>
            </div>

            <div ref={mapRef} style={{ height: '100%', width: '100%', borderRadius: '12px' }} />
        </div>
    );
};

export default BranchMap;
