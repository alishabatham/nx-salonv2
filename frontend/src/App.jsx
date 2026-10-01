import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Components & Modals
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import WalkInBookingModal from './components/WalkInBookingModal';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import SetupWizard from './pages/SetupWizard';
import Dashboard from './pages/Dashboard';
import AppointmentsPage from './pages/AppointmentsPage';
import ServicesPage from './pages/ServicesPage';
import StaffPage from './pages/StaffPage';
import CustomersPage from './pages/CustomersPage';
import BillingPage from './pages/BillingPage';
import InventoryPage from './pages/InventoryPage';
import ReportsPage from './pages/ReportsPage';
import AuditLogsPage from './pages/AuditLogsPage';
import SettingsPage from './pages/SettingsPage';
import PublicCustomerPortal from './pages/PublicCustomerPortal';
import CustomerPortal from './pages/CustomerPortal';

function ProtectedLayout() {
  const { user, loading } = useAuth();
  const [walkInOpen, setWalkInOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-xs text-slate-500 font-bold">
        Initializing Business Operating System...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
      <Navbar onOpenWalkIn={() => setWalkInOpen(true)} />
      
      <div className="flex flex-1">
        <Sidebar />
        
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
          <Routes>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/appointments" element={<AppointmentsPage />} />
            <Route path="/services" element={<ServicesPage />} />
            <Route path="/staff" element={<StaffPage />} />
            <Route path="/customers" element={<CustomersPage />} />
            <Route path="/billing" element={<BillingPage />} />
            <Route path="/inventory" element={<InventoryPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/audit-logs" element={<AuditLogsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/customer-portal" element={<CustomerPortal />} />
            <Route path="/my-bookings" element={<CustomerPortal />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>

      <WalkInBookingModal
        isOpen={walkInOpen}
        onClose={() => setWalkInOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Authentication Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/setup-wizard" element={<SetupWizard />} />

          {/* Public Customer Self-Service Booking Portal */}
          <Route path="/public/business/:id" element={<PublicCustomerPortal />} />
          <Route path="/public/book" element={<PublicCustomerPortal />} />

          {/* Dedicated Customer Portal Shortcut */}
          <Route path="/customer/portal" element={<CustomerPortal />} />

          {/* Protected Application Routes */}
          <Route path="/*" element={<ProtectedLayout />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
