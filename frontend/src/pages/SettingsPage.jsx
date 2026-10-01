import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { fetchAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

import { Building2, Clock, Receipt, Bell, Sparkles, CheckCircle, AlertCircle } from 'lucide-react';

export default function SettingsPage() {
  const { business, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // General Profile
  const [name, setName] = useState('');
  const [type, setType] = useState('Salon');
  const [customTypeName, setCustomTypeName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('India');
  const [taxId, setTaxId] = useState('');
  const [currency, setCurrency] = useState('INR ₹');
  const [timezone, setTimezone] = useState('Asia/Kolkata');

  // Terminology
  const [customerTerm, setCustomerTerm] = useState('Customer');
  const [staffTerm, setStaffTerm] = useState('Staff');
  const [serviceTerm, setServiceTerm] = useState('Service');

  // Working Hours
  const [workingHours, setWorkingHours] = useState([]);

  // Billing & Tax
  const [invoicePrefix, setInvoicePrefix] = useState('INV-');
  const [taxRate, setTaxRate] = useState(18);
  const [taxName, setTaxName] = useState('GST');

  useEffect(() => {
    if (business) {
      setName(business.name || '');
      setType(business.type || 'Salon');
      setCustomTypeName(business.customTypeName || '');
      setPhone(business.phone || '');
      setEmail(business.email || '');
      setAddress(business.address || '');
      setCity(business.city || '');
      setCountry(business.country || 'India');
      setTaxId(business.taxId || '');
      setCurrency(business.currency || 'INR ₹');
      setTimezone(business.timezone || 'Asia/Kolkata');

      setCustomerTerm(business.terminology?.customer || 'Customer');
      setStaffTerm(business.terminology?.staff || 'Staff');
      setServiceTerm(business.terminology?.service || 'Service');

      setWorkingHours(business.workingHours || []);

      setInvoicePrefix(business.billingSettings?.invoicePrefix || 'INV-');
      setTaxRate(business.billingSettings?.taxRate ?? 18);
      setTaxName(business.billingSettings?.taxName || 'GST');
    }
  }, [business]);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');
    setLoading(true);

    try {
      await fetchAPI('/business/profile', {
        method: 'PUT',
        body: {
          name,
          type,
          customTypeName,
          phone,
          email,
          address,
          city,
          country,
          taxId,
          currency,
          timezone,
          terminology: {
            customer: customerTerm,
            staff: staffTerm,
            service: serviceTerm
          }
        }
      });

      await fetchAPI('/business/working-hours', {
        method: 'PUT',
        body: { workingHours }
      });

      await fetchAPI('/business/billing-settings', {
        method: 'PUT',
        body: { invoicePrefix, taxRate: Number(taxRate), taxName, isTaxEnabled: true }
      });

      await refreshProfile();
      setSuccessMsg('Business settings updated successfully!');
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const businessTypes = [
    'Salon', 'Beauty Parlour', 'Unisex Salon', 'Spa', 
    'Nail Studio', 'Makeup Studio', 'Hair Studio', 
    'Beauty Studio', 'Grooming Studio', 'Skin Clinic', 'Custom'
  ];

  return (
    <div className="space-y-6 max-w-4xl">
      
      {/* Header */}
      <div>
        <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
          Business Operating System Settings
        </h1>
        <p className="text-xs text-slate-500 font-medium">
          Configure business profile, working hours, tax rules, invoice prefixes, and custom terminology
        </p>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-bold flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-bold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSaveProfile} className="space-y-6">
        
        {/* SECTION 1: Business Profile */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-indigo-600" />
            <span>Business Profile & Information</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Business Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 rounded-xl border border-slate-200"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Business Type *</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 rounded-xl border border-slate-200"
              >
                {businessTypes.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 rounded-xl border border-slate-200"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 rounded-xl border border-slate-200"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Address</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 rounded-xl border border-slate-200"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">City & Country</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 rounded-xl border border-slate-200"
              />
            </div>
          </div>
        </div>

        {/* SECTION 2: Dynamic Terminology Overrides */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            <span>Customizable System Terminology</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Customer Label</label>
              <input
                type="text"
                value={customerTerm}
                onChange={(e) => setCustomerTerm(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 rounded-xl border border-slate-200"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Staff / Team Label</label>
              <input
                type="text"
                value={staffTerm}
                onChange={(e) => setStaffTerm(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 rounded-xl border border-slate-200"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Service / Treatment Label</label>
              <input
                type="text"
                value={serviceTerm}
                onChange={(e) => setServiceTerm(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 rounded-xl border border-slate-200"
              />
            </div>
          </div>
        </div>

        {/* SECTION 3: Tax & Billing Settings */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <Receipt className="w-5 h-5 text-indigo-600" />
            <span>Tax & Invoice Rules</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">GST / Tax Number</label>
              <input
                type="text"
                value={taxId}
                onChange={(e) => setTaxId(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 rounded-xl border border-slate-200"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Tax Percentage (%)</label>
              <input
                type="number"
                value={taxRate}
                onChange={(e) => setTaxRate(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 rounded-xl border border-slate-200"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Invoice Number Prefix</label>
              <input
                type="text"
                value={invoicePrefix}
                onChange={(e) => setInvoicePrefix(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 rounded-xl border border-slate-200"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-200"
          >
            {loading ? 'Saving...' : 'Save Settings'}
          </button>
        </div>

      </form>
    </div>
  );
}
