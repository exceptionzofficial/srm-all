
import React from 'react';

const ProductionDashboard = () => {
    return (
        <div className="dashboard-container">
            <h1>Production Department (CPO)</h1>
            <div className="dashboard-stats">
                <div className="stat-card">
                    <h3>Units Produced</h3>
                    <p className="stat-value">0</p>
                </div>
                <div className="stat-card">
                    <h3>Stock Transfers</h3>
                    <p className="stat-value">0</p>
                </div>
            </div>

            <div className="content-section">
                <h2>Factory Output</h2>
                <div className="placeholder-box">
                    <p>Production data will appear here.</p>
                </div>
            </div>
        </div>
    );
};

export default ProductionDashboard;
