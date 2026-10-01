import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { fetchAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import PrintableInvoiceModal from '../components/PrintableInvoiceModal';

import { 
  Calendar, 
  Clock, 
  UserCheck, 
  Phone, 
  Sparkles, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Printer, 
  Plus, 
  RefreshCw,
  Search,
  Building2,
  Receipt,
  Ticket
} from 'lucide-react';

export default function CustomerPortal() {
  const { business, t } = useAuth();
  
  // Default to sample mobile from seed (e.g. 9876543210 - Rohan Verma)
  const [mobile, setMobile] = useState('9876543210');
  const [customerData, setCustomerData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Reschedule Modal state
  const [rescheduleAppt, setRescheduleAppt] = useState(null);
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [newSlot, setNewSlot] = useState('');
  const [rescheduleLoading, setRescheduleLoading] = useState(false);
  const [rescheduleError, setRescheduleError] = useState('');

  // Invoice Modal state
  const [invoiceModalId, setInvoiceModalId] = useState(null);

  useEffect(() => {
    if (mobile && mobile.length >= 8) {
      loadCustomerBookings();
    }
  }, []);

  const loadCustomerBookings = async () => {
    if (!mobile || mobile.length < 8) return;
    setLoading(true);
    setError('');
    try {
      const data = await fetchAPI('/public/customer-bookings', {
        method: 'POST',
        body: { mobile: mobile.trim() }
      });

      if (data.found) {
        setCustomerData(data);
      } else {
        setCustomerData({ found: false, appointments: [], bills: [] });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleMobileSubmit = (e) => {
    e.preventDefault();
    loadCustomerBookings();
  };

  // Fetch slot options for rescheduling
  useEffect(() => {
    if (rescheduleAppt && newDate) {
      fetchRescheduleSlots();
    }
  }, [rescheduleAppt, newDate]);

  const fetchRescheduleSlots = async () => {
    try {
      const data = await fetchAPI(`/appointments/slots?businessId=${rescheduleAppt.businessId._id || rescheduleAppt.businessId}&serviceId=${rescheduleAppt.serviceId._id || rescheduleAppt.serviceId}&date=${newDate}&staffId=${rescheduleAppt.staffId._id || rescheduleAppt.staffId}`);
      if (data.slots) {
        setAvailableSlots(data.slots);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleConfirmReschedule = async (e) => {
    e.preventDefault();
    setRescheduleError('');
    if (!newSlot) {
      setRescheduleError('Please select a new time slot.');
      return;
    }

    setRescheduleLoading(true);
    try {
      await fetchAPI('/public/reschedule', {
        method: 'POST',
        body: {
          appointmentNumber: rescheduleAppt.appointmentNumber,
          passcode: rescheduleAppt.passcode,
          newDate,
          newStartTime: newSlot
        }
      });

      setRescheduleAppt(null);
      setNewSlot('');
      loadCustomerBookings();
      alert('Appointment rescheduled successfully!');
    } catch (err) {
      setRescheduleError(err.message);
    } finally {
      setRescheduleLoading(false);
    }
  };

  const handleCancelBooking = async (appt) => {
    const reason = prompt('Please specify cancellation reason:');
    if (reason === null) return;

    try {
      await fetchAPI('/public/cancel', {
        method: 'POST',
        body: {
          appointmentNumber: appt.appointmentNumber,
          passcode: appt.passcode,
          reason: reason || 'Cancelled by customer'
        }
      });

      loadCustomerBookings();
      alert('Appointment cancelled successfully.');
    } catch (err) {
      alert(err.message);
    }
  };

  const currency = business?.currency || 'INR ₹';

  const upcomingAppts = customerData?.appointments?.filter(a => ['booked', 'confirmed', 'checked_in', 'in_service'].includes(a.status)) || [];
  const pastAppts = customerData?.appointments?.filter(a => ['completed', 'cancelled', 'no_show'].includes(a.status)) || [];
  const bills = customerData?.bills || [];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      
      {/* Customer Header Banner */}
      <div className="bg-gradient-to-tr from-indigo-600 via-indigo-700 to-purple-700 p-6 rounded-3xl text-white shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold text-white mb-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Customer Self-Service Portal</span>
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight">My Bookings & Appointment History</h1>
            <p className="text-xs text-indigo-100 font-medium">
              View upcoming visits, reschedule timeslots, access passcode passes & print tax receipts
            </p>
          </div>

          {/* Quick Lookup Input */}
          <form onSubmit={handleMobileSubmit} className="bg-white/10 p-1.5 rounded-2xl backdrop-blur-md border border-white/20 flex items-center space-x-2">
            <Phone className="w-4 h-4 text-indigo-200 ml-2" />
            <input
              type="text"
              required
              placeholder="Enter Mobile #"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              className="bg-transparent text-xs font-bold text-white placeholder-indigo-200 focus:outline-none w-32"
            />
            <button
              type="submit"
              className="px-3 py-1.5 bg-white text-indigo-700 rounded-xl text-xs font-bold shadow-xs hover:bg-indigo-50"
            >
              Lookup
            </button>
          </form>
        </div>

        {/* Preset Mobile Shortcuts */}
        <div className="flex items-center space-x-2 text-xs pt-1 border-t border-white/10">
          <span className="text-indigo-200 font-semibold text-[11px]">Quick Demo Customers:</span>
          <button
            type="button"
            onClick={() => { setMobile('9876543210'); loadCustomerBookings(); }}
            className="px-2.5 py-0.5 bg-white/20 hover:bg-white/30 rounded-full font-bold text-[11px]"
          >
            Rohan Verma (9876543210)
          </button>
          <button
            type="button"
            onClick={() => { setMobile('9899988877'); loadCustomerBookings(); }}
            className="px-2.5 py-0.5 bg-white/20 hover:bg-white/30 rounded-full font-bold text-[11px]"
          >
            Ananya Roy (9899988877)
          </button>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner text="Fetching your appointments & bills..." />
      ) : !customerData?.found ? (
        <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center space-y-3">
          <p className="text-sm font-bold text-slate-800">No Booking Record Found for {mobile}</p>
          <p className="text-xs text-slate-500">Please enter a registered mobile number or book a new service.</p>
        </div>
      ) : (
        <div className="space-y-6">
          
          {/* Customer Profile Banner */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-700 font-extrabold text-lg flex items-center justify-center">
                {customerData.customer?.name ? customerData.customer.name.charAt(0) : 'C'}
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">{customerData.customer?.name}</h3>
                <p className="text-xs text-slate-500">Mobile: {customerData.customer?.mobile} • Email: {customerData.customer?.email || 'N/A'}</p>
              </div>
            </div>

            <div className="flex items-center space-x-4 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100">
              <div>
                <p className="text-slate-400 font-semibold text-[10px] uppercase">Total Visits</p>
                <p className="font-bold text-slate-800 text-sm">{customerData.customer?.totalVisits || upcomingAppts.length} visits</p>
              </div>
              <div className="border-r border-slate-200 h-6" />
              <div>
                <p className="text-slate-400 font-semibold text-[10px] uppercase">Total Spent</p>
                <p className="font-extrabold text-indigo-700 text-sm">{currency} {customerData.customer?.totalSpent || 0}</p>
              </div>
            </div>
          </div>

          {/* SECTION 1: UPCOMING APPOINTMENTS */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-600" />
                <span>Upcoming Appointments ({upcomingAppts.length})</span>
              </h3>
            </div>

            {upcomingAppts.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-4">No upcoming appointments scheduled.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {upcomingAppts.map(appt => (
                  <div key={appt._id} className="p-4 rounded-xl bg-slate-50/80 border border-slate-200 space-y-3 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="px-2 py-0.5 text-[10px] font-extrabold bg-indigo-100 text-indigo-800 rounded-md">
                            #{appt.appointmentNumber}
                          </span>
                          <h4 className="text-sm font-bold text-slate-900 mt-1.5">{appt.serviceId?.name || appt.serviceDetails?.name}</h4>
                        </div>

                        <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full uppercase tracking-wider ${
                          appt.status === 'in_service' ? 'bg-indigo-600 text-white animate-pulse' :
                          appt.status === 'checked_in' ? 'bg-blue-100 text-blue-800' :
                          'bg-amber-100 text-amber-800'
                        }`}>
                          {appt.status.replace('_', ' ')}
                        </span>
                      </div>

                      <div className="mt-3 text-xs text-slate-600 space-y-1">
                        <p className="flex items-center space-x-1.5 text-indigo-700 font-bold">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{appt.date} at {appt.startTime} ({appt.serviceDetails?.duration} mins)</span>
                        </p>
                        <p className="flex items-center space-x-1.5 text-slate-600">
                          <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                          <span>{t('staff', 'Staff')}: {appt.staffId?.name || appt.staffDetails?.name || 'Assigned Specialist'}</span>
                        </p>
                        <p className="flex items-center space-x-1.5 text-slate-600">
                          <Ticket className="w-3.5 h-3.5 text-slate-400" />
                          <span>Passcode Pass Token: <strong className="font-mono bg-slate-200 px-1.5 py-0.5 rounded text-slate-800">{appt.passcode}</strong></span>
                        </p>
                      </div>
                    </div>

                    {/* Customer Action Controls */}
                    <div className="flex items-center justify-between pt-3 border-t border-slate-200/60">
                      <button
                        onClick={() => handleCancelBooking(appt)}
                        className="px-3 py-1 text-rose-600 hover:bg-rose-50 font-bold rounded-lg text-xs"
                      >
                        Cancel
                      </button>

                      <button
                        onClick={() => setRescheduleAppt(appt)}
                        className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs flex items-center space-x-1 shadow-xs"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Reschedule Slot</span>
                      </button>
                    </div>

                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SECTION 2: PAST APPOINTMENTS HISTORY */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-800">Past Appointment History ({pastAppts.length})</h3>

            {pastAppts.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No completed or past appointments yet.</p>
            ) : (
              <div className="space-y-2">
                {pastAppts.map(a => (
                  <div key={a._id} className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 flex justify-between items-center text-xs">
                    <div>
                      <p className="font-bold text-slate-800">{a.serviceDetails?.name}</p>
                      <p className="text-[11px] text-slate-500">{a.date} at {a.startTime} • Staff: {a.staffDetails?.name}</p>
                    </div>

                    <div className="text-right">
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md uppercase ${
                        a.status === 'completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {a.status}
                      </span>
                      <p className="font-bold text-indigo-700 text-xs mt-0.5">{currency} {a.serviceDetails?.price}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SECTION 3: MY BILLS & INVOICES */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <Receipt className="w-5 h-5 text-indigo-600" />
              <span>My Invoices & Payment Receipts ({bills.length})</span>
            </h3>

            {bills.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No invoices issued yet.</p>
            ) : (
              <div className="space-y-2">
                {bills.map(b => (
                  <div key={b._id} className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 flex justify-between items-center text-xs">
                    <div>
                      <p className="font-bold text-slate-800">Invoice #{b.invoiceNumber}</p>
                      <p className="text-[11px] text-slate-500">{new Date(b.createdAt).toLocaleDateString()}</p>
                    </div>

                    <div className="flex items-center space-x-3">
                      <div className="text-right">
                        <p className="font-extrabold text-indigo-700">{currency} {b.grandTotal}</p>
                        <span className={`text-[10px] font-bold uppercase ${b.paymentStatus === 'paid' ? 'text-emerald-600' : 'text-amber-600'}`}>
                          {b.paymentStatus}
                        </span>
                      </div>

                      <button
                        onClick={() => setInvoiceModalId(b._id)}
                        className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-bold rounded-lg text-[11px] flex items-center space-x-1"
                      >
                        <Printer className="w-3.5 h-3.5 text-slate-500" />
                        <span>Receipt</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}

      {/* RESCHEDULE MODAL */}
      {rescheduleAppt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 shadow-2xl border border-slate-100 max-w-md w-full space-y-4">
            <h3 className="text-base font-bold text-slate-800">Reschedule Appointment #{rescheduleAppt.appointmentNumber}</h3>

            {rescheduleError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium">
                {rescheduleError}
              </div>
            )}

            <form onSubmit={handleConfirmReschedule} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Select New Date *</label>
                <input
                  type="date"
                  required
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Select Available Time Slot *</label>
                {availableSlots.length === 0 ? (
                  <p className="text-xs text-rose-500 italic p-2 bg-rose-50 rounded-lg">No free slots on this date.</p>
                ) : (
                  <div className="grid grid-cols-3 gap-2 max-h-36 overflow-y-auto p-1">
                    {availableSlots.map(slot => (
                      <button
                        type="button"
                        key={slot.startTime}
                        onClick={() => setNewSlot(slot.startTime)}
                        className={`px-2 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                          newSlot === slot.startTime ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-700 border-slate-200'
                        }`}
                      >
                        {slot.startTime}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button type="button" onClick={() => setRescheduleAppt(null)} className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl">Cancel</button>
                <button type="submit" disabled={rescheduleLoading || !newSlot} className="px-5 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl shadow-md">
                  {rescheduleLoading ? 'Updating...' : 'Confirm Reschedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invoice Modal */}
      <PrintableInvoiceModal
        isOpen={!!invoiceModalId}
        onClose={() => setInvoiceModalId(null)}
        billId={invoiceModalId}
      />

    </div>
  );
}
