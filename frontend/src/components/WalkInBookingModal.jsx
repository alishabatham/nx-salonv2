import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { fetchAPI } from '../services/api';
import { Search, UserCheck, AlertCircle, CheckCircle, Clock, Calendar } from 'lucide-react';

export default function WalkInBookingModal({ isOpen, onClose, onRefresh }) {
  const [mobile, setMobile] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [duplicateFound, setDuplicateFound] = useState(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  
  const [services, setServices] = useState([]);
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [selectedStaffId, setSelectedStaffId] = useState('any');
  const [eligibleStaff, setEligibleStaff] = useState([]);

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadServices();
    }
  }, [isOpen]);

  const loadServices = async () => {
    try {
      const data = await fetchAPI('/services?activeOnly=true');
      setServices(data);
    } catch (err) {
      console.error(err);
    }
  };

  // Check customer duplicate by mobile
  const handleMobileBlur = async () => {
    if (!mobile || mobile.length < 8) return;
    try {
      const data = await fetchAPI(`/customers/check-duplicate?mobile=${mobile.trim()}`);
      if (data.exists) {
        setDuplicateFound(data.customer);
        setSelectedCustomerId(data.customer._id);
        setName(data.customer.name);
        setEmail(data.customer.email || '');
      } else {
        setDuplicateFound(null);
        setSelectedCustomerId(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Load slots when service or date changes
  useEffect(() => {
    if (selectedServiceId && date) {
      fetchSlots();
    }
  }, [selectedServiceId, date]);

  const fetchSlots = async () => {
    try {
      const data = await fetchAPI(`/appointments/slots?serviceId=${selectedServiceId}&date=${date}&staffId=${selectedStaffId}`);
      if (data.slots) {
        setAvailableSlots(data.slots);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let custId = selectedCustomerId;

      // 1. Create customer if not selected from existing
      if (!custId) {
        const custData = await fetchAPI('/customers', {
          method: 'POST',
          body: { name, mobile, email }
        });
        custId = custData._id;
      }

      // 2. Create appointment
      const appt = await fetchAPI('/appointments', {
        method: 'POST',
        body: {
          customerId: custId,
          serviceId: selectedServiceId,
          staffId: selectedStaffId,
          date,
          startTime: selectedSlot,
          notes,
          bookingSource: 'Walk-in'
        }
      });

      // 3. Auto Check-in for walk-in flow
      await fetchAPI(`/appointments/${appt._id}/status`, {
        method: 'PUT',
        body: { status: 'checked_in' }
      });

      setSuccess(true);
      if (onRefresh) onRefresh();
      setTimeout(() => {
        resetForm();
        onClose();
      }, 1500);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setMobile('');
    setName('');
    setEmail('');
    setDuplicateFound(null);
    setSelectedCustomerId(null);
    setSelectedServiceId('');
    setSelectedSlot('');
    setSelectedStaffId('any');
    setError('');
    setSuccess(false);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Fast Walk-in Check-in" maxWidth="max-w-2xl">
      {success ? (
        <div className="text-center py-8 space-y-3">
          <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle className="w-6 h-6" />
          </div>
          <h4 className="text-lg font-bold text-slate-800">Walk-in Checked-in Successfully!</h4>
          <p className="text-xs text-slate-500">Customer has been checked-in and added to the service queue.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Customer Search / Details */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-3">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">1. Customer Information</h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Mobile Number *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 9876543210"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  onBlur={handleMobileBlur}
                  className="w-full px-3 py-2 text-xs bg-white rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Customer Name *</label>
                <input
                  type="text"
                  required
                  placeholder="Full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Duplicate Notice Banner */}
            {duplicateFound && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2">
                  <UserCheck className="w-4 h-4 text-amber-600 shrink-0" />
                  <div>
                    <p className="font-bold text-amber-900">Existing Customer Found</p>
                    <p className="text-amber-700 text-[11px]">{duplicateFound.name} ({duplicateFound.mobile})</p>
                  </div>
                </div>
                <span className="px-2 py-1 bg-amber-200/70 text-amber-900 font-bold rounded-md text-[10px]">
                  Existing Linked
                </span>
              </div>
            )}
          </div>

          {/* Service & Slot Selection */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-3">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">2. Service & Slot Selection</h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Select Service *</label>
                <select
                  required
                  value={selectedServiceId}
                  onChange={(e) => setSelectedServiceId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">-- Choose Service --</option>
                  {services.map(s => (
                    <option key={s._id} value={s._id}>
                      {s.name} (₹{s.price} • {s.duration}m)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Time Slot Picker */}
            {selectedServiceId && (
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 flex items-center space-x-1">
                  <Clock className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Available Time Slots *</span>
                </label>

                {availableSlots.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">No available slots for selected date.</p>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-36 overflow-y-auto p-1">
                    {availableSlots.map(slot => (
                      <button
                        type="button"
                        key={slot.startTime}
                        onClick={() => {
                          setSelectedSlot(slot.startTime);
                          if (slot.availableStaff && slot.availableStaff.length > 0) {
                            setSelectedStaffId(slot.availableStaff[0].id);
                          }
                        }}
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
          </div>

          <div className="flex justify-end space-x-3 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading || !selectedSlot}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-200 disabled:opacity-50"
            >
              {loading ? 'Processing...' : 'Confirm Walk-in & Check-in'}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}
