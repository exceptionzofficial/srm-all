/**
 * SRM Sweets Super Admin Panel
 * Main App with React Router
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import NotificationHandler from './components/NotificationHandler';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Employees from './pages/Employees';
import EmployeeWizard from './pages/EmployeeWizard';
import Branches from './pages/Branches';
import Attendance from './pages/Attendance';
import AttendanceView from './pages/AttendanceView';
import Salary from './pages/Salary';
import Analytics from './pages/Analytics';
import BranchDetails from './pages/BranchDetails';
import Requests from './pages/Requests';
import EmployeeRules from './pages/EmployeeRules';
import ChatGroups from './pages/ChatGroups';
import PayGroups from './pages/PayGroups';
import LegalDashboard from './pages/roles/LegalDashboard';
import FinanceDashboard from './pages/roles/FinanceDashboard';
import ProductionDashboard from './pages/roles/ProductionDashboard';
import QualityDashboard from './pages/roles/QualityDashboard';
import BranchManagerDashboard from './pages/roles/BranchManagerDashboard';
import Managers from './pages/Managers';
import ManagerForm from './pages/ManagerForm';
import './index.css';

const ProtectedLayout = ({ children }) => {
  // Auth Bypassed for Super Admin
  return (
    <div className="app-layout">
      <Sidebar userRole="SUPER_ADMIN" />
      <main className="main-content">
        <NotificationHandler />
        {children}
      </main>
    </div>
  );
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        {/* Protected Routes */}
        <Route path="/*" element={
          <ProtectedLayout>
            <Routes>
              <Route path="/" element={<Dashboard />} />

              {/* Role Dashboards */}
              <Route path="/legal" element={<LegalDashboard />} />
              <Route path="/finance" element={<FinanceDashboard />} />
              <Route path="/production" element={<ProductionDashboard />} />
              <Route path="/quality" element={<QualityDashboard />} />
              <Route path="/branch" element={<BranchManagerDashboard />} />
              <Route path="/managers" element={<Managers />} />
              <Route path="/managers/add" element={<ManagerForm />} />
              <Route path="/managers/edit/:id" element={<ManagerForm />} />

              <Route path="/employees" element={<Employees />} />
              <Route path="/employees/add" element={<EmployeeWizard />} />
              <Route path="/employees/edit/:id" element={<EmployeeWizard />} />
              <Route path="/branches" element={<Branches />} />
              <Route path="/branches/:branchId" element={<BranchDetails />} />
              <Route path="/attendance" element={<Attendance />} />
              <Route path="/attendance/view/:id" element={<AttendanceView />} />
              <Route path="/requests" element={<Requests />} />
              <Route path="/salary" element={<Salary />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/rules" element={<EmployeeRules />} />
              <Route path="/chat" element={<ChatGroups />} />
              <Route path="/pay-groups" element={<PayGroups />} />
            </Routes>
          </ProtectedLayout>
        } />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
