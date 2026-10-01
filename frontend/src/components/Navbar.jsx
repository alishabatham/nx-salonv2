import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Building2, 
  User, 
  LogOut, 
  ExternalLink, 
  ShieldCheck, 
  UserCheck, 
  Briefcase, 
  Sparkles,
  ChevronDown,
  UserCircle
} from 'lucide-react';

export default function Navbar({ onOpenWalkIn }) {
  const { user, business, currentRole, activeRoleOverride, setActiveRoleOverride, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleSelectRole = (role) => {
    setActiveRoleOverride(role);
    if (role === 'customer') {
      navigate('/customer-portal');
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 lg:px-8 py-3 transition-all">
      <div className="flex items-center justify-between gap-4">
        
        {/* Left: Brand / Business Title */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg shadow-md shadow-indigo-100">
            {business?.logo ? (
              <img src={business.logo} alt="Logo" className="w-full h-full object-cover rounded-xl" />
            ) : (
              business?.name ? business.name.charAt(0) : 'A'
            )}
          </div>

          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-base font-bold text-slate-800 tracking-tight leading-tight">
                {business?.name || 'Beauty & Wellness Business OS'}
              </h1>
              <span className="px-2 py-0.5 text-xs font-semibold bg-indigo-50 text-indigo-700 rounded-full border border-indigo-200/60">
                {business?.type || 'Business OS'}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium hidden sm:block">
              {business?.city ? `${business.city}, ${business.country}` : 'Appointment Operating System'}
            </p>
          </div>
        </div>

        {/* Center: Interactive Role Switcher Demo Toolbar */}
        <div className="hidden md:flex items-center bg-slate-100/90 p-1 rounded-xl border border-slate-200/60">
          <span className="text-xs font-bold text-slate-400 px-2 uppercase tracking-wider flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Mode:
          </span>

          <button
            onClick={() => handleSelectRole('owner')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center space-x-1.5 ${
              currentRole === 'owner'
                ? 'bg-white text-indigo-700 shadow-xs border border-slate-200/80 font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Owner</span>
          </button>

          <button
            onClick={() => handleSelectRole('receptionist')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center space-x-1.5 ${
              currentRole === 'receptionist'
                ? 'bg-white text-indigo-700 shadow-xs border border-slate-200/80 font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Reception Desk</span>
          </button>

          <button
            onClick={() => handleSelectRole('staff')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center space-x-1.5 ${
              currentRole === 'staff'
                ? 'bg-white text-indigo-700 shadow-xs border border-slate-200/80 font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>Staff Portal</span>
          </button>

          <button
            onClick={() => handleSelectRole('customer')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center space-x-1.5 ${
              currentRole === 'customer'
                ? 'bg-indigo-600 text-white shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserCircle className="w-3.5 h-3.5 text-amber-300" />
            <span>Customer Portal</span>
          </button>
        </div>

        {/* Right Actions */}
        <div className="flex items-center space-x-3">
          
          {/* Fast Walk-In Action for Reception/Owner */}
          {['owner', 'receptionist'].includes(currentRole) && onOpenWalkIn && (
            <button
              onClick={onOpenWalkIn}
              className="hidden sm:flex items-center space-x-2 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-200 active:scale-98"
            >
              <Sparkles className="w-4 h-4" />
              <span>Fast Walk-in Check-in</span>
            </button>
          )}

          {/* Public Customer Self-Service Booking Link */}
          {business?._id && (
            <Link
              to={`/public/business/${business._id}`}
              target="_blank"
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors flex items-center space-x-1.5 border border-slate-200"
              title="Open Public Customer Self-Service Booking Link"
            >
              <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden xl:inline">Booking Page</span>
            </Link>
          )}

          {/* User Profile Menu */}
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center space-x-2 p-1.5 rounded-xl hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200"
            >
              <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-xs">
                {user?.name ? user.name.charAt(0) : 'U'}
              </div>
              <span className="text-xs font-bold text-slate-700 hidden md:inline">{user?.name}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-fade-in">
                <div className="px-4 py-2 border-b border-slate-100">
                  <p className="text-xs font-bold text-slate-800">{user?.name}</p>
                  <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
                  <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide bg-slate-100 text-slate-600 rounded-md">
                    Actual Role: {user?.role}
                  </span>
                </div>

                <div className="py-1">
                  <Link
                    to="/customer-portal"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center space-x-2 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                  >
                    <UserCircle className="w-4 h-4 text-indigo-600" />
                    <span>My Customer Portal</span>
                  </Link>

                  <Link
                    to="/settings"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center space-x-2 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                  >
                    <Building2 className="w-4 h-4 text-slate-400" />
                    <span>Business Profile & Settings</span>
                  </Link>

                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center space-x-2 px-4 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 text-left"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>

      </div>
    </header>
  );
}
