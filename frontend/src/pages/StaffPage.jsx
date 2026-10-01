import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { fetchAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import Modal from '../components/Modal';

import { UserCheck, Plus, Edit3, Check, AlertCircle, Clock, Calendar } from 'lucide-react';

export default function StaffPage() {
  const { currentRole, t } = useAuth();
  const [staffList, setStaffList] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);

  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [roleTitle, setRoleTitle] = useState('Service Provider');
  const [workingHoursStart, setWorkingHoursStart] = useState('10:00');
  const [workingHoursEnd, setWorkingHoursEnd] = useState('20:00');
  const [assignedServiceIds, setAssignedServiceIds] = useState([]);
  const [workingDays, setWorkingDays] = useState(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']);

  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [st, sv] = await Promise.all([
        fetchAPI('/staff'),
        fetchAPI('/services?activeOnly=true')
      ]);
      setStaffList(st);
      setServices(sv);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (st = null) => {
    setModalError('');
    if (st) {
      setEditingStaff(st);
      setName(st.name);
      setMobile(st.mobile);
      setEmail(st.email || '');
      setRoleTitle(st.roleTitle || 'Service Provider');
      setWorkingHoursStart(st.workingHours?.start || '10:00');
      setWorkingHoursEnd(st.workingHours?.end || '20:00');
      setWorkingDays(st.workingDays || daysOfWeek.slice(0, 6));
      setAssignedServiceIds(st.assignedServiceIds?.map(s => s._id || s) || []);
    } else {
      setEditingStaff(null);
      setName('');
      setMobile('');
      setEmail('');
      setRoleTitle('Service Provider');
      setWorkingHoursStart('10:00');
      setWorkingHoursEnd('20:00');
      setWorkingDays(daysOfWeek.slice(0, 6));
      setAssignedServiceIds([]);
    }
    setIsModalOpen(true);
  };

  const handleSaveStaff = async (e) => {
    e.preventDefault();
    setModalError('');
    setModalLoading(true);

    try {
      const body = {
        name,
        mobile,
        email,
        roleTitle,
        workingHours: { start: workingHoursStart, end: workingHoursEnd },
        workingDays,
        assignedServiceIds
      };

      if (editingStaff) {
        await fetchAPI(`/staff/${editingStaff._id}`, { method: 'PUT', body });
      } else {
        await fetchAPI('/staff', { method: 'POST', body });
      }

      setIsModalOpen(false);
      loadData();
    } catch (err) {
      setModalError(err.message);
    } finally {
      setModalLoading(false);
    }
  };

  const handleToggleActive = async (id) => {
    try {
      await fetchAPI(`/staff/${id}`, { method: 'DELETE' });
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
            {t('staff', 'Team')} & Service Mapping
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Manage staff profiles, custom role titles, working hours, and service capabilities
          </p>
        </div>

        <button
          onClick={() => handleOpenModal()}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-200 flex items-center space-x-1.5 self-start"
        >
          <Plus className="w-4 h-4" />
          <span>Add Staff Member</span>
        </button>
      </div>

      {/* Staff Grid */}
      {loading ? (
        <LoadingSpinner text="Loading team members..." />
      ) : staffList.length === 0 ? (
        <EmptyState
          title="No Staff Members Found"
          description="Add your team members to enable appointment slot calculations."
          action={
            <button onClick={() => handleOpenModal()} className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-xl text-xs">
              Add First Staff Member
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {staffList.map(st => (
            <div
              key={st._id}
              className={`p-5 rounded-2xl bg-white border transition-all space-y-3 flex flex-col justify-between ${
                st.isActive ? 'border-slate-200/80 shadow-xs' : 'border-slate-200 bg-slate-50/70 opacity-60'
              }`}
            >
              <div>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-sm">
                    {st.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{st.name}</h3>
                    <span className="px-2 py-0.5 text-[10px] font-bold bg-slate-100 text-slate-600 rounded-md">
                      {st.roleTitle}
                    </span>
                  </div>
                </div>

                <div className="mt-3 text-xs space-y-1 text-slate-600">
                  <p>Mobile: <strong className="text-slate-800">{st.mobile}</strong></p>
                  <p>Hours: <strong className="text-slate-800">{st.workingHours?.start} - {st.workingHours?.end}</strong></p>
                  <p>Working Days: <strong className="text-slate-800">{st.workingDays?.length || 0} days/week</strong></p>
                  <p>Assigned Services: <strong className="text-indigo-700 font-bold">{st.assignedServiceIds?.length || 0} services</strong></p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <button
                  onClick={() => handleToggleActive(st._id)}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border transition-all ${
                    st.isActive
                      ? 'bg-slate-100 text-slate-600 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  }`}
                >
                  {st.isActive ? 'Deactivate' : 'Activate'}
                </button>

                <button
                  onClick={() => handleOpenModal(st)}
                  className="px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-lg text-xs flex items-center space-x-1"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Profile</span>
                </button>
              </div>

            </div>
          ))}
        </div>
      )}

      {/* CREATE / EDIT STAFF MODAL */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingStaff ? 'Edit Staff Profile' : 'Add New Staff Member'} maxWidth="max-w-xl">
        <form onSubmit={handleSaveStaff} className="space-y-4">
          {modalError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{modalError}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Full Name *</label>
              <input
                type="text"
                required
                placeholder="Elena Vance"
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
                placeholder="+91 98765 43210"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white rounded-lg border border-slate-200"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Role Title (Configurable)</label>
              <input
                type="text"
                placeholder="e.g. Senior Hair Specialist"
                value={roleTitle}
                onChange={(e) => setRoleTitle(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white rounded-lg border border-slate-200"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Email (Optional)</label>
              <input
                type="email"
                placeholder="staff@business.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white rounded-lg border border-slate-200"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Shift Start Time</label>
              <input
                type="time"
                value={workingHoursStart}
                onChange={(e) => setWorkingHoursStart(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white rounded-lg border border-slate-200"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Shift End Time</label>
              <input
                type="time"
                value={workingHoursEnd}
                onChange={(e) => setWorkingHoursEnd(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white rounded-lg border border-slate-200"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Working Days</label>
            <div className="flex flex-wrap gap-1.5">
              {daysOfWeek.map(day => {
                const isSelected = workingDays.includes(day);
                return (
                  <button
                    type="button"
                    key={day}
                    onClick={() => {
                      if (isSelected) setWorkingDays(workingDays.filter(d => d !== day));
                      else setWorkingDays([...workingDays, day]);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                      isSelected ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-200'
                    }`}
                  >
                    {day.substring(0, 3)}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Assigned Services</label>
            <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto p-2 bg-slate-50 rounded-xl border border-slate-200">
              {services.map(sv => {
                const isAssigned = assignedServiceIds.includes(sv._id);
                return (
                  <button
                    type="button"
                    key={sv._id}
                    onClick={() => {
                      if (isAssigned) setAssignedServiceIds(assignedServiceIds.filter(id => id !== sv._id));
                      else setAssignedServiceIds([...assignedServiceIds, sv._id]);
                    }}
                    className={`p-2 rounded-lg text-left text-xs font-semibold border transition-all flex items-center justify-between ${
                      isAssigned ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-700 border-slate-200'
                    }`}
                  >
                    <span className="truncate">{sv.name}</span>
                    {isAssigned && <Check className="w-3.5 h-3.5 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl">Cancel</button>
            <button type="submit" disabled={modalLoading} className="px-5 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-200">Save Staff Member</button>
          </div>
        </form>
      </Modal>

    </div>
  );
}
