import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { fetchAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import Modal from '../components/Modal';

import { Users, Search, Plus, UserCheck, Calendar, Receipt, Edit3, AlertCircle } from 'lucide-react';

export default function CustomersPage() {
  const { t, business } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Customer Detail Drawer Modal
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerHistory, setCustomerHistory] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Create/Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [gender, setGender] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');

  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');

  useEffect(() => {
    loadCustomers();
  }, [search]);

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const data = await fetchAPI(`/customers?search=${encodeURIComponent(search)}`);
      setCustomers(data.customers || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCustomerHistory = async (cust) => {
    setSelectedCustomer(cust);
    setHistoryLoading(true);
    try {
      const details = await fetchAPI(`/customers/${cust._id}`);
      setCustomerHistory(details);
    } catch (err) {
      console.error(err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleOpenCreateEditModal = (cust = null) => {
    setModalError('');
    if (cust) {
      setEditingCustomer(cust);
      setName(cust.name);
      setMobile(cust.mobile);
      setEmail(cust.email || '');
      setGender(cust.gender || '');
      setAddress(cust.address || '');
      setNotes(cust.notes || '');
    } else {
      setEditingCustomer(null);
      setName('');
      setMobile('');
      setEmail('');
      setGender('');
      setAddress('');
      setNotes('');
    }
    setIsModalOpen(true);
  };

  const handleSaveCustomer = async (e) => {
    e.preventDefault();
    setModalError('');
    setModalLoading(true);
    try {
      const body = { name, mobile, email, gender, address, notes };
      if (editingCustomer) {
        await fetchAPI(`/customers/${editingCustomer._id}`, { method: 'PUT', body });
      } else {
        await fetchAPI('/customers', { method: 'POST', body });
      }
      setIsModalOpen(false);
      loadCustomers();
    } catch (err) {
      setModalError(err.message);
    } finally {
      setModalLoading(false);
    }
  };

  const currency = business?.currency || 'INR ₹';

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
            {t('customer', 'Customer')} CRM & History
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Search customer records, duplicate mobile protection, visit frequencies, and past billing history
          </p>
        </div>

        <button
          onClick={() => handleOpenCreateEditModal()}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-200 flex items-center space-x-1.5 self-start"
        >
          <Plus className="w-4 h-4" />
          <span>New Customer Profile</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs max-w-md">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by name, mobile, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Customer Grid */}
      {loading ? (
        <LoadingSpinner text="Loading customer profiles..." />
      ) : customers.length === 0 ? (
        <EmptyState
          title="No Customers Found"
          description="Create customer profiles or search with a different mobile number."
          action={
            <button onClick={() => handleOpenCreateEditModal()} className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-xl text-xs">
              Add Customer Profile
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {customers.map(cust => (
            <div key={cust._id} className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-3 flex flex-col justify-between hover:border-slate-300 transition-all">
              <div>
                <div className="flex justify-between items-start">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-sm">
                      {cust.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">{cust.name}</h3>
                      <p className="text-xs text-slate-500 font-semibold">{cust.mobile}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-3 text-xs text-slate-600 space-y-1 bg-slate-50 p-2.5 rounded-xl">
                  <div className="flex justify-between">
                    <span>Total Visits:</span>
                    <strong className="text-slate-800">{cust.totalVisits || 0} visits</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Spent:</span>
                    <strong className="text-indigo-700">{currency} {cust.totalSpent || 0}</strong>
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-200/60">
                    <span>Last Visit:</span>
                    <span>{cust.lastVisitDate ? new Date(cust.lastVisitDate).toLocaleDateString() : 'Never'}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <button
                  onClick={() => handleOpenCreateEditModal(cust)}
                  className="px-2.5 py-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg text-xs font-semibold"
                >
                  Edit Profile
                </button>

                <button
                  onClick={() => handleOpenCustomerHistory(cust)}
                  className="px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-lg text-xs flex items-center space-x-1"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>View History</span>
                </button>
              </div>

            </div>
          ))}
        </div>
      )}

      {/* CUSTOMER HISTORY MODAL */}
      <Modal isOpen={!!selectedCustomer} onClose={() => setSelectedCustomer(null)} title={`Customer History • ${selectedCustomer?.name}`} maxWidth="max-w-2xl">
        {historyLoading || !customerHistory ? (
          <div className="py-8 text-center text-xs text-slate-500">Loading history details...</div>
        ) : (
          <div className="space-y-4">
            
            {/* Customer Summary Bar */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 flex justify-between items-center text-xs">
              <div>
                <p className="font-bold text-slate-800 text-sm">{customerHistory.customer.name}</p>
                <p className="text-slate-500">Mobile: {customerHistory.customer.mobile} | Email: {customerHistory.customer.email || 'N/A'}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-500">Total Spent</p>
                <p className="text-base font-extrabold text-indigo-700">{currency} {customerHistory.customer.totalSpent || 0}</p>
              </div>
            </div>

            {/* Past Appointments */}
            <div>
              <h4 className="text-xs font-bold text-slate-700 uppercase mb-2">Past Appointments ({customerHistory.appointments?.length || 0})</h4>
              {customerHistory.appointments?.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No past appointments recorded.</p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {customerHistory.appointments.map(a => (
                    <div key={a._id} className="p-2.5 bg-white border border-slate-200/80 rounded-xl flex justify-between items-center text-xs">
                      <div>
                        <p className="font-bold text-slate-800">{a.serviceDetails?.name}</p>
                        <p className="text-[11px] text-slate-500">{a.date} at {a.startTime} • Staff: {a.staffDetails?.name}</p>
                      </div>
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded-md uppercase bg-slate-100 text-slate-700">
                        {a.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Past Bills */}
            <div>
              <h4 className="text-xs font-bold text-slate-700 uppercase mb-2">Past Bills & Invoices ({customerHistory.bills?.length || 0})</h4>
              {customerHistory.bills?.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No past bills recorded.</p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {customerHistory.bills.map(b => (
                    <div key={b._id} className="p-2.5 bg-white border border-slate-200/80 rounded-xl flex justify-between items-center text-xs">
                      <div>
                        <p className="font-bold text-slate-800">Invoice #{b.invoiceNumber}</p>
                        <p className="text-[11px] text-slate-500">{new Date(b.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-indigo-700">{currency} {b.grandTotal}</p>
                        <span className={`text-[10px] font-bold uppercase ${b.paymentStatus === 'paid' ? 'text-emerald-600' : 'text-amber-600'}`}>
                          {b.paymentStatus}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}
      </Modal>

      {/* CREATE / EDIT CUSTOMER MODAL */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingCustomer ? 'Edit Customer Profile' : 'New Customer Profile'}>
        <form onSubmit={handleSaveCustomer} className="space-y-4">
          {modalError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{modalError}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Customer Name *</label>
              <input
                type="text"
                required
                placeholder="Rohan Verma"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white rounded-lg border border-slate-200"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Mobile Number *</label>
              <input
                type="text"
                required
                placeholder="9876543210"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white rounded-lg border border-slate-200"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Email Address</label>
              <input
                type="email"
                placeholder="customer@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white rounded-lg border border-slate-200"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Gender</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white rounded-lg border border-slate-200"
              >
                <option value="">Select Gender</option>
                <option value="Female">Female</option>
                <option value="Male">Male</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Address</label>
            <input
              type="text"
              placeholder="e.g. Bandra West, Mumbai"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white rounded-lg border border-slate-200"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl">Cancel</button>
            <button type="submit" disabled={modalLoading} className="px-5 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-200">Save Customer Profile</button>
          </div>
        </form>
      </Modal>

    </div>
  );
}
