import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  CalendarCheck,
  Scissors,
  Users,
  UserCheck,
  Receipt,
  Package,
  BarChart3,
  History,
  Settings,
  Wand2,
  Calendar,
  Sparkles
} from 'lucide-react';

export default function Sidebar() {
  const { currentRole, t } = useAuth();

  const getNavItems = () => {
    if (currentRole === 'customer') {
      return [
        { path: '/customer-portal', label: 'My Bookings & History', icon: Calendar },
        { path: '/public/book', label: 'Book New Service', icon: Sparkles }
      ];
    }

    if (currentRole === 'staff') {
      return [
        { path: '/dashboard', label: 'My Queue & Schedule', icon: LayoutDashboard },
        { path: '/appointments', label: 'My Appointments', icon: CalendarCheck },
        { path: '/customers', label: `${t('customer', 'Customer')} Directory`, icon: Users },
        { path: '/inventory', label: 'Product Consumption', icon: Package }
      ];
    }

    if (currentRole === 'receptionist') {
      return [
        { path: '/dashboard', label: 'Front Desk Overview', icon: LayoutDashboard },
        { path: '/appointments', label: 'Today\'s Schedule', icon: CalendarCheck },
        { path: '/customers', label: `${t('customer', 'Customers')}`, icon: Users },
        { path: '/billing', label: 'Billing & Invoices', icon: Receipt },
        { path: '/inventory', label: 'Stock & Products', icon: Package }
      ];
    }

    // Default: Owner / Admin full suite
    return [
      { path: '/dashboard', label: 'Business Overview', icon: LayoutDashboard },
      { path: '/appointments', label: 'Appointments', icon: CalendarCheck },
      { path: '/services', label: `${t('service', 'Services')} & Categories`, icon: Scissors },
      { path: '/staff', label: `${t('staff', 'Team')} Management`, icon: UserCheck },
      { path: '/customers', label: `${t('customer', 'Customers')} CRM`, icon: Users },
      { path: '/billing', label: 'Billing & Payments', icon: Receipt },
      { path: '/inventory', label: 'Inventory Control', icon: Package },
      { path: '/reports', label: 'Reports & Analytics', icon: BarChart3 },
      { path: '/audit-logs', label: 'Audit Trail', icon: History },
      { path: '/settings', label: 'Settings', icon: Settings },
      { path: '/setup-wizard', label: 'Setup Wizard', icon: Wand2 }
    ];
  };

  const navItems = getNavItems();

  return (
    <aside className="w-64 bg-white border-r border-slate-200/80 hidden md:flex flex-col min-h-[calc(100vh-65px)] p-4 shrink-0">
      <div className="space-y-1">
        <p className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
          {currentRole === 'customer' ? 'Customer Portal' : 'Operational Navigation'}
        </p>

        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700 font-bold border border-indigo-200/60 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`
              }
            >
              <Icon className="w-4 h-4 text-slate-500" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </aside>
  );
}
