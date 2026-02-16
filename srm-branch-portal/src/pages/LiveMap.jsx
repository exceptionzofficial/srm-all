
import { useState, useEffect } from 'react';
import BranchMap from '../components/BranchMap';

const LiveMap = () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const branchId = user.branchId;
    const [searchTerm, setSearchTerm] = useState('');

    if (!branchId) {
        return <div style={{ padding: '20px' }}>Loading Branch Data...</div>;
    }

    return (
        <div style={{
            height: 'calc(100vh - 80px)',
            width: '100%',
            display: 'flex',
            flexDirection: 'column'
        }}>
            <div style={{
                padding: '15px 20px',
                background: 'white',
                borderBottom: '1px solid #e5e7eb',
                flexShrink: 0,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <h2 style={{ margin: 0, fontSize: '18px', color: '#111827' }}>Live Branch Map</h2>

                <input
                    type="text"
                    placeholder="Search Employee..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{
                        padding: '8px 12px',
                        border: '1px solid #e5e7eb',
                        borderRadius: '6px',
                        width: '250px',
                        fontSize: '14px',
                        outline: 'none'
                    }}
                />
            </div>

            <div style={{ flex: 1, position: 'relative' }}>
                <BranchMap branchId={branchId} height="100%" searchTerm={searchTerm} />
            </div>
        </div>
    );
};

export default LiveMap;
