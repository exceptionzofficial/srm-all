
import { FiBox, FiActivity, FiTrendingUp, FiAlertTriangle } from 'react-icons/fi';
import './Dashboard.css';

const Dashboard = () => {
    return (
        <div className="dashboard-container">
            <div className="dashboard-header">
                <h1>Production Department (CPO)</h1>
            </div>

            <div className="dashboard-stats">
                <div className="stat-card">
                    <h3>Daily Output</h3>
                    <p className="stat-value">1,250 kg</p>
                    <p className="stat-trend positive"><FiTrendingUp /> +5% vs yesterday</p>
                </div>
                <div className="stat-card">
                    <h3>Active Shifts</h3>
                    <p className="stat-value">3</p>
                    <p className="stat-sub">Morning, Afternoon, Night</p>
                </div>
                <div className="stat-card warning">
                    <h3>Low Stock Alerts</h3>
                    <p className="stat-value">2 Items</p>
                    <p className="stat-sub">Sugar, Cardamom</p>
                </div>
                <div className="stat-card">
                    <h3>Efficiency</h3>
                    <p className="stat-value success">94%</p>
                </div>
            </div>

            <div className="content-grid">
                <div className="content-section">
                    <h2>Live Production Status</h2>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Unit</th>
                                <th>Item</th>
                                <th>Target</th>
                                <th>Actual</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>Unit A (Mixing)</td>
                                <td>Mysore Pak</td>
                                <td>500 kg</td>
                                <td>450 kg</td>
                                <td><span className="badge badge-success">On Track</span></td>
                            </tr>
                            <tr>
                                <td>Unit B (Frying)</td>
                                <td>Murukku</td>
                                <td>300 kg</td>
                                <td>280 kg</td>
                                <td><span className="badge badge-warning">Slow</span></td>
                            </tr>
                            <tr>
                                <td>Unit C (Packing)</td>
                                <td>Laddoo</td>
                                <td>200 boxes</td>
                                <td>200 boxes</td>
                                <td><span className="badge badge-success">Completed</span></td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div className="content-section">
                    <h2>Inventory Alerts</h2>
                    <div className="alert-list">
                        <div className="alert-item high">
                            <FiAlertTriangle />
                            <div>
                                <h4>Sugar Stock Low</h4>
                                <p>Remaining: 50kg (Threshold: 100kg)</p>
                            </div>
                            <button className="btn-small">Order</button>
                        </div>
                        <div className="alert-item medium">
                            <FiActivity />
                            <div>
                                <h4>Machine B Maintenance</h4>
                                <p>Due in 2 days</p>
                            </div>
                            <button className="btn-small">View</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
