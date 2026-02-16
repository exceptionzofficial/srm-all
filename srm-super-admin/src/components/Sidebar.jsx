/**
 * Sidebar Component for Super Admin Panel
 */

import { NavLink, useNavigate } from 'react-router-dom';
import {
    FiHome,
    FiUsers,
    FiMapPin,
    FiCalendar,
    FiSettings,
    FiLogOut,
    FiDollarSign,
    FiFileText,
    FiMessageSquare,
    FiBriefcase,
    FiBox,
    FiCheckCircle,
    FiPieChart,
    FiLayers
} from 'react-icons/fi';
import './Sidebar.css';
import srmLogo from '../assets/srm-logo.png';

const Sidebar = ({ userRole }) => {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem('user');
        navigate('/login');
    };

    let menuItems = [];

    if (userRole === 'SUPER_ADMIN' || !userRole) { // Default to Super Admin view if undefined (dev)
        menuItems = [
            { path: '/', icon: <FiHome />, label: 'Dashboard' },
            { path: '/employees', icon: <FiUsers />, label: 'Employees' },
            { path: '/branches', icon: <FiMapPin />, label: 'Branches' },
            { path: '/managers', icon: <FiBriefcase />, label: 'Managers' },
            { path: '/attendance', icon: <FiCalendar />, label: 'Attendance' },
            { path: '/requests', icon: <FiFileText />, label: 'Requests' },
            { path: '/chat', icon: <FiMessageSquare />, label: 'Chat Groups' }, // Moved up
            { path: '/salary', icon: <FiDollarSign />, label: 'Salary' },
            { path: '/rules', icon: <FiFileText />, label: 'Rules' },
            { path: '/pay-groups', icon: <FiLayers />, label: 'Pay Groups' },
            // Super Admin Access to Role Dashboards
            { path: '/finance', icon: <FiPieChart />, label: 'Finance' },
            { path: '/legal', icon: <FiBriefcase />, label: 'Legal' },
            { path: '/production', icon: <FiBox />, label: 'Production' },
            { path: '/quality', icon: <FiCheckCircle />, label: 'Quality' },
            { path: '/branch', icon: <FiMapPin />, label: 'Branch Mgr' },

        ];
    } else {
        // Role Specific Menus
        if (userRole === 'LEGAL_ADMIN') {
            menuItems.push({ path: '/legal', icon: <FiHome />, label: 'Legal Dashboard' });
            menuItems.push({ path: '/requests', icon: <FiFileText />, label: 'Requests' });
        }
        if (userRole === 'FINANCE_ADMIN') {
            menuItems.push({ path: '/finance', icon: <FiHome />, label: 'Finance Dashboard' });
            menuItems.push({ path: '/salary', icon: <FiDollarSign />, label: 'Salary' });
            menuItems.push({ path: '/requests', icon: <FiFileText />, label: 'Requests' });
        }
        if (userRole === 'PRODUCTION_ADMIN') {
            menuItems.push({ path: '/production', icon: <FiHome />, label: 'Production' });
        }
        if (userRole === 'QUALITY_ADMIN') {
            menuItems.push({ path: '/quality', icon: <FiHome />, label: 'Quality' });
            menuItems.push({ path: '/employees', icon: <FiUsers />, label: 'Employees' });
        }
        if (userRole === 'BRANCH_MANAGER') {
            menuItems.push({ path: '/branch', icon: <FiHome />, label: 'Branch Dashboard' });
            menuItems.push({ path: '/attendance', icon: <FiCalendar />, label: 'Attendance' });
            menuItems.push({ path: '/requests', icon: <FiFileText />, label: 'Requests' });
        }
        // Common for all admins
        menuItems.push({ path: '/chat', icon: <FiMessageSquare />, label: 'Chat' });
    }

    return (
        <aside className="sidebar">
            {/* Logo */}
            <div className="sidebar-header">
                <div className="logo">
                    <img src={srmLogo} alt="SRM Sweets" className="logo-image" />
                    <span className="logo-subtitle">{userRole ? userRole.replace('_', ' ') : 'Super Admin'}</span>
                </div>
            </div>

            {/* Navigation */}
            <nav className="sidebar-nav">
                {menuItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                            `nav-link ${isActive ? 'active' : ''}`
                        }
                    >
                        <span className="nav-icon">{item.icon}</span>
                        <span className="nav-label">{item.label}</span>
                    </NavLink>
                ))}
            </nav>

            {/* Footer */}
            <div className="sidebar-footer">
                <button className="logout-btn" onClick={handleLogout}>
                    <FiLogOut />
                    <span>Logout</span>
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
