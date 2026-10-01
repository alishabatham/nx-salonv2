import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { fetchAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import Modal from '../components/Modal';
import ServiceConsumptionModal from '../components/ServiceConsumptionModal';

import {
  Calendar,
  Clock,
  UserCheck,
  Plus,
  Play,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Receipt,
  Search,
  Sparkles
} from 'lucide-react';

export default function AppointmentsPage() {
  const { currentRole, t, business } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [statusFilter, setStatusFilter] = useState('');
  const [staffFilter, setStaffFilter] = useState('');

  // Dropdown options
  const [staffList, setStaffList] = useState([]);
  const [serviceList, setServiceList] = useState([]);
  const [customerList, setCustomerList] = useState([]);

  // Create Appointment Modal state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [selectedStaffId, setSelectedStaffId] = useState('any');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [notes, setNotes] = useState('');

  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState('');

  // Consumption Modal
  const [consumptionAppt, setConsumptionAppt] = useState(null);

  useEffect(() => {
    loadAppointments();
    loadDropdownOptions();
  }, [date, statusFilter, staffFilter]);

  const loadAppointments = async () => {
    setLoading(true);
    try {
      let query = `?date=${date}`;
      if (statusFilter) query += `&status=${statusFilter}`;
      if (staffFilter) query += `&staffId=${staffFilter}`;

      const data = await fetchAPI(`/appointments${query}`);
      setAppointments(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadDropdownOptions = async () => {
    try {
      const [sData, svData, cData] = await Promise.all([
        fetchAPI('/staff?activeOnly=true'),
        fetchAPI('/services?activeOnly=true'),
        fetchAPI('/customers')
      ]);
      setStaffList(sData);
      setServiceList(svData);
      setCustomerList(cData.customers || []);
    } catch (err) {
      console.error(err);
    }
  };

  // Dynamically calculate slot options
  useEffect(() => {
    if (selectedServiceId && selectedDate) {
      fetchSlots();
    }
  }, [selectedServiceId, selectedDate, selectedStaffId]);

  const fetchSlots = async () => {
    try {
      const data = await fetchAPI(`/appointments/slots?serviceId=${selectedServiceId}&date=${selectedDate}&staffId=${selectedStaffId}`);
      if (data.slots) {
        setAvailableSlots(data.slots);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateAppointment = async (e) => {
    e.preventDefault();
    setCreateError('');
    setCreateLoading(true);

    try {
      await fetchAPI('/appointments', {
        method: 'POST',
        body: {
          customerId: selectedCustomerId,
          serviceId: selectedServiceId,
          staffId: selectedStaffId,
          date: selectedDate,
          startTime: selectedSlot,
          notes,
          bookingSource: 'Reception'
        }
      });

      setIsCreateOpen(false);
      resetCreateForm();
      loadAppointments();

    } catch (err) {
      setCreateError(err.message);
    } finally {
      setCreateLoading(false);
    }
  };

  const handleStatusChange = async (id, newStatus, reason = '') => {
    try {
      await fetchAPI(`/appointments/${id}/status`, {
        method: 'PUT',
        body: { status: newStatus, cancellationReason: reason }
      });
      loadAppointments();
    } catch (err) {
      alert(err.message);
    }
  };

  const resetCreateForm = () => {
    setSelectedCustomerId('');
    setSelectedServiceId('');
    setSelectedStaffId('any');
    setSelectedSlot('');
    setNotes('');
    setCreateError('');
  };

  const currency = business?.currency || 'INR ₹';

  return (
    <div className="space-y-6">
      
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Appointments Management & Slot Engine
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Dynamic available slots calculation with atomic double-booking protection
          </p>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-200 flex items-center space-x-1.5 self-start"
        >
          <Plus className="w-4 h-4" />
          <span>New Appointment</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center gap-3">
        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Select Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-50 rounded-xl border border-slate-200 font-medium"
          />
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Filter Status</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-50 rounded-xl border border-slate-200 font-medium"
          >
            <option value="">All Statuses</option>
            <option value="booked">Booked</option>
            <option value="confirmed">Confirmed</option>
            <option value="checked_in">Checked In</option>
            <option value="in_service">In Service</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Filter {t('staff', 'Staff')}</label>
          <select
            value={staffFilter}
            onChange={(e) => setStaffFilter(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-50 rounded-xl border border-slate-200 font-medium"
          >
            <option value="">All {t('staff', 'Staff')}</option>
            {staffList.map(st => (
              <option key={st._id} value={st._id}>{st.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Appointments List */}
      {loading ? (
        <LoadingSpinner text="Loading appointment bookings..." />
      ) : appointments.length === 0 ? (
        <EmptyState
          title="No Appointments Found"
          description={`No appointments booked for ${date} matching selected filters.`}
          action={
            <button
              onClick={() => setIsCreateOpen(true)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold"
            >
              Book New Appointment
            </button>
          }
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                  <th className="py-3 px-4">Appt #</th>
                  <th className="py-3 px-4">Time</th>
                  <th className="py-3 px-4">{t('customer', 'Customer')}</th>
                  <th className="py-3 px-4">{t('service', 'Service')}</th>
                  <th className="py-3 px-4">{t('staff', 'Staff')}</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {appointments.map((appt) => (
                  <tr key={appt._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {appt.appointmentNumber}
                      <span className="block text-[10px] text-slate-400 font-normal">Token: {appt.passcode}</span>
                    </td>

                    <td className="py-3 px-4 font-bold text-indigo-700">
                      {appt.startTime} - {appt.endTime}
                    </td>

                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-800">{appt.customerDetails?.name}</p>
                      <p className="text-[11px] text-slate-500">{appt.customerDetails?.mobile}</p>
                    </td>

                    <td className="py-3 px-4 font-semibold text-slate-700">
                      {appt.serviceDetails?.name}
                      <span className="block text-[11px] text-slate-400">{currency} {appt.serviceDetails?.price} • {appt.serviceDetails?.duration}m</span>
                    </td>

                    <td className="py-3 px-4 font-medium text-slate-700">
                      {appt.staffDetails?.name || 'Assigned Staff'}
                    </td>

                    <td className="py-3 px-4 text-center">
                      <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full uppercase tracking-wider ${
                        appt.status === 'completed' ? 'bg-emerald-100 text-emerald-800' :
                        appt.status === 'in_service' ? 'bg-indigo-100 text-indigo-800 animate-pulse' :
                        appt.status === 'checked_in' ? 'bg-blue-100 text-blue-800' :
                        appt.status === 'cancelled' ? 'bg-rose-100 text-rose-800' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        {appt.status.replace('_', ' ')}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right space-x-1">
                      {appt.status === 'booked' && (
                        <button
                          onClick={() => handleStatusChange(appt._id, 'checked_in')}
                          className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-[11px]"
                        >
                          Check-in
                        </button>
                      )}

                      {appt.status === 'checked_in' && (
                        <button
                          onClick={() => handleStatusChange(appt._id, 'in_service')}
                          className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-[11px]"
                        >
                          Start
                        </button>
                      )}

                      {appt.status === 'in_service' && (
                        <>
                          <button
                            onClick={() => setConsumptionAppt(appt)}
                            className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-[11px]"
                            title="Record consumed products"
                          >
                            + Consume
                          </button>
                          <button
                            onClick={() => handleStatusChange(appt._id, 'completed')}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-[11px]"
                          >
                            Complete
                          </button>
                        </>
                      )}

                      {appt.status !== 'completed' && appt.status !== 'cancelled' && (
                        <button
                          onClick={() => {
                            const reason = prompt('Cancellation reason:');
                            if (reason !== null) handleStatusChange(appt._id, 'cancelled', reason);
                          }}
                          className="px-2 py-1 text-rose-600 hover:bg-rose-50 font-semibold rounded-lg text-[11px]"
                        >
                          Cancel
                        </button>
                      )}
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE APPOINTMENT MODAL */}
      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Create New Appointment" maxWidth="max-w-2xl">
        <form onSubmit={handleCreateAppointment} className="space-y-4">
          
          {createError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{createError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Select {t('customer', 'Customer')} *</label>
              <select
                required
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">-- Choose Customer --</option>
                {customerList.map(c => (
                  <option key={c._id} value={c._id}>{c.name} ({c.mobile})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Select {t('service', 'Service')} *</label>
              <select
                required
                value={selectedServiceId}
                onChange={(e) => setSelectedServiceId(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">-- Choose Service --</option>
                {serviceList.map(s => (
                  <option key={s._id} value={s._id}>{s.name} ({currency} {s.price} • {s.duration}m)</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Appointment Date *</label>
              <input
                type="date"
                required
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Select {t('staff', 'Staff')}</label>
              <select
                value={selectedStaffId}
                onChange={(e) => setSelectedStaffId(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="any">✨ Any Available Staff</option>
                {staffList.map(st => (
                  <option key={st._id} value={st._id}>{st.name} ({st.roleTitle})</option>
                ))}
              </select>
            </div>
          </div>

          {/* Slots Calculator Grid */}
          {selectedServiceId && (
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 flex items-center space-x-1">
                <Clock className="w-3.5 h-3.5 text-indigo-600" />
                <span>Calculated Free Slots (Double Booking Protected) *</span>
              </label>

              {availableSlots.length === 0 ? (
                <p className="text-xs text-rose-500 italic p-3 bg-rose-50 rounded-xl">No available slots found for this selection.</p>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-36 overflow-y-auto p-1">
                  {availableSlots.map(slot => (
                    <button
                      type="button"
                      key={slot.startTime}
                      onClick={() => setSelectedSlot(slot.startTime)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                        selectedSlot === slot.startTime
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {slot.startTime}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Notes / Preferences</label>
            <textarea
              rows="2"
              placeholder="e.g. Requested quiet session / specific hair style"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white rounded-lg border border-slate-200"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createLoading || !selectedSlot}
              className="px-5 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-200 disabled:opacity-50"
            >
              {createLoading ? 'Booking...' : 'Confirm Appointment'}
            </button>
          </div>

        </form>
      </Modal>

      <ServiceConsumptionModal
        isOpen={!!consumptionAppt}
        onClose={() => setConsumptionAppt(null)}
        appointment={consumptionAppt}
        onSuccess={loadAppointments}
      />

    </div>
  );
}
