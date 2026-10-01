import React, { createContext, useContext, useState, useEffect } from 'react';
import { fetchAPI } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [business, setBusiness] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeRoleOverride, setActiveRoleOverride] = useState(null); // 'owner' | 'receptionist' | 'staff' | 'customer'

  const loadProfile = async () => {
    const token = localStorage.getItem('nx_token');
    if (!token) {
      setUser(null);
      setBusiness(null);
      setLoading(false);
      return;
    }

    try {
      const data = await fetchAPI('/auth/me');
      setUser(data.user);
      setBusiness(data.business);
    } catch (err) {
      console.error('Failed to load profile:', err.message);
      localStorage.removeItem('nx_token');
      setUser(null);
      setBusiness(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const login = async (email, password) => {
    const data = await fetchAPI('/auth/login', {
      method: 'POST',
      body: { email, password }
    });
    localStorage.setItem('nx_token', data.token);
    setUser({ _id: data._id, name: data.name, email: data.email, role: data.role });
    setBusiness(data.business);
    setActiveRoleOverride(null);
    return data;
  };

  const register = async (businessData) => {
    const data = await fetchAPI('/auth/register', {
      method: 'POST',
      body: businessData
    });
    localStorage.setItem('nx_token', data.token);
    setUser({ _id: data._id, name: data.name, email: data.email, role: data.role });
    setBusiness(data.business);
    setActiveRoleOverride(null);
    return data;
  };

  const logout = () => {
    localStorage.removeItem('nx_token');
    setUser(null);
    setBusiness(null);
    setActiveRoleOverride(null);
  };

  // Effective role considering interactive role switcher
  const currentRole = activeRoleOverride || user?.role || 'owner';

  // Dynamic terminology helper
  const t = (key, fallback) => {
    if (business?.terminology?.[key]) {
      return business.terminology[key];
    }
    return fallback;
  };

  return (
    <AuthContext.Provider value={{
      user,
      business,
      loading,
      currentRole,
      activeRoleOverride,
      setActiveRoleOverride,
      login,
      register,
      logout,
      refreshProfile: loadProfile,
      t
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
