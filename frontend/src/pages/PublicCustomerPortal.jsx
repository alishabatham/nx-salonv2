import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { fetchAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import { 
  Calendar, 
  Clock, 
  User, 
  CheckCircle2, 
  AlertCircle, 
  Search, 
  Sparkles, 
  Building2,
  ShieldCheck
} from 'lucide-react';

export default function PublicCustomerPortal() {
  const { id: routeBusinessId } = useParams();
  
  // Default to public business or fallback
  const businessId = routeBusinessId || 'demo';

  const [activeTab, setActiveTab] = useState('book'); // 'book' | 'lookup'

  const [publicData, setPublicData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Booking Form State
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [selectedStaffId, setSelectedStaffId] = useState('any');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState('');
  
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');

  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingResult, setBookingResult] = useState(null);
  const [bookingError, setBookingError] = useState('');

  // Lookup Form State
  const [lookupApptNo, setLookupApptNo] = useState('');
  const [lookupPasscode, setLookupPasscode] = useState('');
  const [lookupResult, setLookupResult] = useState(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState('');

  useEffect(() => {
    loadPublicInfo();
  }, [businessId]);

  const loadPublicInfo = async () => {
    setLoading(true);
    try {
      if (businessId && businessId !== 'demo') {
        const info = await fetchAPI(`/public/business/${businessId}`);
        setPublicData(info);
      } else {
        // Fetch first business from public or demo
        const info = await fetchAPI('/public/business/650000000000000000000000');
        setPublicData(info);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch dynamic slots when service, date, or staff changes
  useEffect(() => {
    if (selectedServiceId && date && publicData?.business?._id) {
      fetchSlots();
    }
  }, [selectedServiceId, date, selectedStaffId, publicData]);

  const fetchSlots = async () => {
    try {
      const bizId = publicData.business._id;
      const data = await fetchAPI(`/appointments/slots?businessId=${bizId}&serviceId=${selectedServiceId}&date=${date}&staffId=${selectedStaffId}`);
      if (data.slots) {
        setAvailableSlots(data.slots);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleBookAppointment = async (e) => {
    e.preventDefault();
    setBookingError('');
    setBookingLoading(true);

    try {
      const result = await fetchAPI('/public/book', {
        method: 'POST',
        body: {
          businessId: publicData.business._id,
          name,
          mobile,
          email,
          serviceId: selectedServiceId,
          staffId: selectedStaffId,
          date,
          startTime: selectedSlot,
          notes
        }
      });

      setBookingResult(result);
    } catch (err) {
      setBookingError(err.message);
    } finally {
      setBookingLoading(false);
    }
  };

  const handleLookupAppointment = async (e) => {
    e.preventDefault();
    setLookupError('');
    setLookupLoading(true);
    try {
      const result = await fetchAPI('/public/lookup', {
        method: 'POST',
        body: {
          appointmentNumber: lookupApptNo,
          passcode: lookupPasscode
        }
      });
      setLookupResult(result);
    } catch (err) {
      setLookupError(err.message);
    } finally {
      setLookupLoading(false);
    }
  };

  const handlePublicCancel = async () => {
    if (!confirm('Are you sure you want to cancel this appointment?')) return;
    try {
      await fetchAPI('/public/cancel', {
        method: 'POST',
        body: {
          appointmentNumber: lookupResult.appointmentNumber,
          passcode: lookupResult.passcode,
          reason: 'Cancelled via public portal'
        }
      });
      alert('Appointment cancelled successfully.');
      setLookupResult(null);
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) return <LoadingSpinner text="Loading business booking portal..." />;

  const business = publicData?.business;
  const services = publicData?.services || [];
  const currency = business?.currency || 'INR ₹';

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-6">
        
        {/* Business Header Banner */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-md text-center space-y-2">
          <div className="w-16 h-16 rounded-2xl bg-indigo-600 text-white font-extrabold text-2xl flex items-center justify-center mx-auto shadow-lg shadow-indigo-100">
            {business?.name ? business.name.charAt(0) : 'A'}
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">{business?.name || 'Aura Wellness'}</h1>
          <p className="text-xs font-semibold text-indigo-700 bg-indigo-50 inline-block px-3 py-1 rounded-full border border-indigo-200/60">
            {business?.type || 'Appointment Studio'}
          </p>
          <p className="text-xs text-slate-500">{business?.address}, {business?.city} • Call: {business?.phone}</p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex bg-slate-200/70 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('book')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'book' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600'
            }`}
          >
            Book Appointment
          </button>
          <button
            onClick={() => setActiveTab('lookup')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'lookup' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600'
            }`}
          >
            Manage / Lookup Booking
          </button>
        </div>

        {/* TAB 1: SELF-SERVICE BOOKING WIZARD */}
        {activeTab === 'book' && (
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-xl space-y-6">
            
            {bookingResult ? (
              <div className="text-center py-8 space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-extrabold text-slate-900">Appointment Booked Successfully!</h3>
                <p className="text-xs text-slate-500">Your appointment has been confirmed.</p>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs max-w-sm mx-auto text-left space-y-1">
                  <p>Booking Number: <strong className="text-indigo-700 font-bold">{bookingResult.appointmentNumber}</strong></p>
                  <p>Passcode Token: <strong className="text-emerald-700 font-bold">{bookingResult.passcode}</strong></p>
                  <p className="text-[11px] text-slate-400 pt-1">Keep your passcode token safe to check status or cancel anytime.</p>
                </div>

                <button
                  onClick={() => {
                    setBookingResult(null);
                    setSelectedServiceId('');
                    setSelectedSlot('');
                  }}
                  className="px-6 py-2 bg-indigo-600 text-white font-bold text-xs rounded-xl shadow-md"
                >
                  Book Another Appointment
                </button>
              </div>
            ) : (
              <form onSubmit={handleBookAppointment} className="space-y-6">
                
                {bookingError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{bookingError}</span>
                  </div>
                )}

                {/* Step 1: Select Service */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">1. Select Service</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {services.map(s => (
                      <button
                        type="button"
                        key={s._id}
                        onClick={() => setSelectedServiceId(s._id)}
                        className={`p-3.5 rounded-xl border text-left transition-all ${
                          selectedServiceId === s._id
                            ? 'bg-indigo-50 border-indigo-600 ring-2 ring-indigo-500/20 shadow-xs'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <h4 className="text-xs font-bold text-slate-900">{s.name}</h4>
                          <span className="text-xs font-extrabold text-indigo-700">{currency} {s.price}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1">{s.duration} mins duration</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Step 2: Date & Available Time Slots */}
                {selectedServiceId && (
                  <div className="space-y-3 pt-4 border-t border-slate-100">
                    <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">2. Select Date & Time Slot</h3>
                    
                    <div className="w-48">
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">Date</label>
                      <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs bg-slate-50 rounded-xl border border-slate-200"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1.5 flex items-center space-x-1">
                        <Clock className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Available Realtime Slots</span>
                      </label>

                      {availableSlots.length === 0 ? (
                        <p className="text-xs text-rose-500 italic p-3 bg-rose-50 rounded-xl">No available slots for selected date.</p>
                      ) : (
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                          {availableSlots.map(slot => (
                            <button
                              type="button"
                              key={slot.startTime}
                              onClick={() => setSelectedSlot(slot.startTime)}
                              className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                                selectedSlot === slot.startTime
                                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs font-bold'
                                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                              }`}
                            >
                              {slot.startTime}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Step 3: Contact Details */}
                {selectedSlot && (
                  <div className="space-y-3 pt-4 border-t border-slate-100">
                    <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">3. Customer Information</h3>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">Your Name *</label>
                        <input
                          type="text"
                          required
                          placeholder="Full Name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="w-full px-3 py-2 text-xs bg-slate-50 rounded-xl border border-slate-200"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">Mobile Number *</label>
                        <input
                          type="text"
                          required
                          placeholder="9876543210"
                          value={mobile}
                          onChange={(e) => setMobile(e.target.value)}
                          className="w-full px-3 py-2 text-xs bg-slate-50 rounded-xl border border-slate-200"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {selectedSlot && (
                  <button
                    type="submit"
                    disabled={bookingLoading}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-200"
                  >
                    {bookingLoading ? 'Processing Booking...' : 'Confirm Self-Service Booking'}
                  </button>
                )}

              </form>
            )}

          </div>
        )}

        {/* TAB 2: SECURE APPOINTMENT LOOKUP */}
        {activeTab === 'lookup' && (
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-xl space-y-6">
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-indigo-600" />
              <span>Secure Booking Lookup</span>
            </h3>

            {lookupError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{lookupError}</span>
              </div>
            )}

            <form onSubmit={handleLookupAppointment} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input
                type="text"
                required
                placeholder="Appt # (e.g. APP-1001)"
                value={lookupApptNo}
                onChange={(e) => setLookupApptNo(e.target.value)}
                className="px-3 py-2 text-xs bg-slate-50 rounded-xl border border-slate-200"
              />

              <input
                type="text"
                required
                placeholder="Passcode Token (e.g. AURA01)"
                value={lookupPasscode}
                onChange={(e) => setLookupPasscode(e.target.value)}
                className="px-3 py-2 text-xs bg-slate-50 rounded-xl border border-slate-200 font-mono uppercase"
              />

              <button
                type="submit"
                disabled={lookupLoading}
                className="py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl shadow-md"
              >
                {lookupLoading ? 'Searching...' : 'Lookup Booking'}
              </button>
            </form>

            {lookupResult && (
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3 text-xs">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{lookupResult.serviceDetails?.name}</h4>
                    <p className="text-slate-500">Date: {lookupResult.date} at {lookupResult.startTime}</p>
                    <p className="text-slate-500">Staff: {lookupResult.staffDetails?.name}</p>
                  </div>
                  <span className="px-2.5 py-1 text-[10px] font-bold rounded-full uppercase bg-indigo-100 text-indigo-800">
                    {lookupResult.status}
                  </span>
                </div>

                {lookupResult.status !== 'completed' && lookupResult.status !== 'cancelled' && (
                  <button
                    onClick={handlePublicCancel}
                    className="px-3 py-1.5 bg-rose-50 text-rose-600 border border-rose-200 rounded-lg font-bold text-xs hover:bg-rose-100"
                  >
                    Cancel Appointment
                  </button>
                )}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
