import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { fetchAPI } from '../services/api';
import { 
  Building2, 
  Clock, 
  Scissors, 
  UserCheck, 
  Receipt, 
  Bell, 
  CheckCircle, 
  ArrowRight, 
  ArrowLeft,
  Wand2,
  Plus
} from 'lucide-react';

export default function SetupWizard() {
  const { business, refreshProfile } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);

  // Form states
  const [type, setType] = useState(business?.type || 'Salon');
  const [customTypeName, setCustomTypeName] = useState(business?.customTypeName || '');
  const [phone, setPhone] = useState(business?.phone || '');
  const [email, setEmail] = useState(business?.email || '');
  const [address, setAddress] = useState(business?.address || '');
  const [city, setCity] = useState(business?.city || '');
  const [taxId, setTaxId] = useState(business?.taxId || '');
  const [currency, setCurrency] = useState(business?.currency || 'INR ₹');

  // Terminology
  const [customerTerm, setCustomerTerm] = useState('Customer');
  const [staffTerm, setStaffTerm] = useState('Staff');
  const [serviceTerm, setServiceTerm] = useState('Service');

  // Starter Categories & Services
  const [catName, setCatName] = useState('');
  const [serviceName, setServiceName] = useState('');
  const [servicePrice, setServicePrice] = useState('');
  const [serviceDuration, setServiceDuration] = useState('30');
  const [addedServices, setAddedServices] = useState([]);

  // Starter Staff
  const [staffName, setStaffName] = useState('');
  const [staffRole, setStaffRole] = useState('Specialist');
  const [staffMobile, setStaffMobile] = useState('');
  const [addedStaff, setAddedStaff] = useState([]);

  // Billing & Tax
  const [invoicePrefix, setInvoicePrefix] = useState('INV-');
  const [taxRate, setTaxRate] = useState(18);
  const [taxName, setTaxName] = useState('GST');

  const [loading, setLoading] = useState(false);

  const businessTypes = [
    'Salon', 'Beauty Parlour', 'Unisex Salon', 'Spa', 
    'Nail Studio', 'Makeup Studio', 'Hair Studio', 
    'Beauty Studio', 'Grooming Studio', 'Skin Clinic', 'Custom'
  ];

  const handleNextStep = async () => {
    if (step === 1) {
      // Save profile & terminology
      await fetchAPI('/business/profile', {
        method: 'PUT',
        body: {
          type,
          customTypeName,
          phone,
          email,
          address,
          city,
          taxId,
          currency,
          terminology: {
            customer: customerTerm,
            staff: staffTerm,
            service: serviceTerm
          }
        }
      });
    }

    if (step === 4) {
      // Create category & services if added
      if (addedServices.length > 0) {
        const cat = await fetchAPI('/services/categories', {
          method: 'POST',
          body: { name: catName || 'General Services', rebookingDaysInterval: 30 }
        });
        for (const s of addedServices) {
          await fetchAPI('/services', {
            method: 'POST',
            body: {
              categoryId: cat._id,
              name: s.name,
              price: s.price,
              duration: s.duration
            }
          });
        }
      }
    }

    if (step === 5) {
      // Create staff members
      for (const st of addedStaff) {
        await fetchAPI('/staff', {
          method: 'POST',
          body: {
            name: st.name,
            mobile: st.mobile,
            roleTitle: st.roleTitle
          }
        });
      }
    }

    if (step === 6) {
      // Save Billing settings
      await fetchAPI('/business/billing-settings', {
        method: 'PUT',
        body: { invoicePrefix, taxRate, taxName, isTaxEnabled: true }
      });
    }

    if (step < 7) {
      setStep(step + 1);
    } else {
      // Complete Setup
      setLoading(true);
      await fetchAPI('/business/complete-wizard', { method: 'POST' });
      await refreshProfile();
      setLoading(false);
      navigate('/dashboard');
    }
  };

  const handleAddServiceLocal = () => {
    if (!serviceName || !servicePrice) return;
    setAddedServices([...addedServices, { name: serviceName, price: servicePrice, duration: serviceDuration }]);
    setServiceName('');
    setServicePrice('');
  };

  const handleAddStaffLocal = () => {
    if (!staffName || !staffMobile) return;
    setAddedStaff([...addedStaff, { name: staffName, roleTitle: staffRole, mobile: staffMobile }]);
    setStaffName('');
    setStaffMobile('');
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        
        {/* Wizard Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center space-x-2 px-3 py-1 bg-indigo-50 border border-indigo-200/60 rounded-full text-indigo-700 text-xs font-bold mb-2">
            <Wand2 className="w-4 h-4" />
            <span>Business Setup Wizard</span>
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900">Configure Your Business System</h2>
          <p className="text-xs text-slate-500">Step {step} of 7 • Set up your terminology, services, team and rules</p>
        </div>

        {/* Step Indicators */}
        <div className="flex justify-between items-center mb-8 px-4">
          {[1, 2, 3, 4, 5, 6, 7].map(s => (
            <div
              key={s}
              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                s === step
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200 scale-110'
                  : s < step
                  ? 'bg-emerald-500 text-white'
                  : 'bg-slate-200 text-slate-500'
              }`}
            >
              {s < step ? '✓' : s}
            </div>
          ))}
        </div>

        {/* Step Card */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-xl border border-slate-200/80 space-y-6">
          
          {/* STEP 1: Business Type & Custom Terminology */}
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-indigo-600" />
                <span>1. Business Type & Terminology</span>
              </h3>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Select Business Type</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {businessTypes.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Customer Label</label>
                  <input
                    type="text"
                    placeholder="e.g. Guest / Client"
                    value={customerTerm}
                    onChange={(e) => setCustomerTerm(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Staff Label</label>
                  <input
                    type="text"
                    placeholder="e.g. Team / Specialist"
                    value={staffTerm}
                    onChange={(e) => setStaffTerm(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Service Label</label>
                  <input
                    type="text"
                    placeholder="e.g. Treatment / Experience"
                    value={serviceTerm}
                    onChange={(e) => setServiceTerm(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 rounded-xl border border-slate-200"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Profile Details */}
          {step === 2 && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-slate-800">2. Business Profile Details</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                  <label className="block text-xs font-semibold text-slate-700 mb-1">City</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 rounded-xl border border-slate-200"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">GST / Tax Number</label>
                  <input
                    type="text"
                    placeholder="e.g. 27AAAAA0000A1Z5"
                    value={taxId}
                    onChange={(e) => setTaxId(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 rounded-xl border border-slate-200"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Currency</label>
                  <input
                    type="text"
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 rounded-xl border border-slate-200"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Working Hours */}
          {step === 3 && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Clock className="w-5 h-5 text-indigo-600" />
                <span>3. Business Working Hours</span>
              </h3>
              <p className="text-xs text-slate-500">Default working hours set to Mon–Sat 10:00 AM – 8:00 PM, Sun 10:00 AM – 6:00 PM. You can refine these anytime in settings.</p>
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-semibold flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Default weekly schedule loaded automatically.</span>
              </div>
            </div>
          )}

          {/* STEP 4: Services */}
          {step === 4 && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Scissors className="w-5 h-5 text-indigo-600" />
                <span>4. Create Starter Category & Services</span>
              </h3>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Category Name</label>
                <input
                  type="text"
                  placeholder="e.g. Hair Care / Skin Care / Spa"
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 rounded-xl border border-slate-200"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <input
                  type="text"
                  placeholder="Service Name"
                  value={serviceName}
                  onChange={(e) => setServiceName(e.target.value)}
                  className="px-3 py-2 text-xs bg-slate-50 rounded-xl border border-slate-200"
                />
                <input
                  type="number"
                  placeholder="Price (₹)"
                  value={servicePrice}
                  onChange={(e) => setServicePrice(e.target.value)}
                  className="px-3 py-2 text-xs bg-slate-50 rounded-xl border border-slate-200"
                />
                <button
                  type="button"
                  onClick={handleAddServiceLocal}
                  className="px-3 py-2 bg-indigo-600 text-white font-bold text-xs rounded-xl flex items-center justify-center space-x-1"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Service</span>
                </button>
              </div>

              {addedServices.length > 0 && (
                <div className="space-y-1 pt-2">
                  <p className="text-xs font-bold text-slate-700">Added Services Preview:</p>
                  {addedServices.map((s, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs bg-slate-50 p-2 rounded-lg border">
                      <span className="font-semibold text-slate-800">{s.name}</span>
                      <span className="font-bold text-indigo-700">₹{s.price} ({s.duration}m)</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* STEP 5: Staff */}
          {step === 5 && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-indigo-600" />
                <span>5. Add Starter Staff / Team Members</span>
              </h3>

              <div className="grid grid-cols-3 gap-2">
                <input
                  type="text"
                  placeholder="Staff Name"
                  value={staffName}
                  onChange={(e) => setStaffName(e.target.value)}
                  className="px-3 py-2 text-xs bg-slate-50 rounded-xl border border-slate-200"
                />
                <input
                  type="text"
                  placeholder="Mobile Number"
                  value={staffMobile}
                  onChange={(e) => setStaffMobile(e.target.value)}
                  className="px-3 py-2 text-xs bg-slate-50 rounded-xl border border-slate-200"
                />
                <button
                  type="button"
                  onClick={handleAddStaffLocal}
                  className="px-3 py-2 bg-indigo-600 text-white font-bold text-xs rounded-xl flex items-center justify-center space-x-1"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Member</span>
                </button>
              </div>

              {addedStaff.length > 0 && (
                <div className="space-y-1 pt-2">
                  <p className="text-xs font-bold text-slate-700">Added Staff Preview:</p>
                  {addedStaff.map((st, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs bg-slate-50 p-2 rounded-lg border">
                      <span className="font-semibold text-slate-800">{st.name}</span>
                      <span className="text-slate-500">{st.mobile}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* STEP 6: Billing & Tax */}
          {step === 6 && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Receipt className="w-5 h-5 text-indigo-600" />
                <span>6. Tax & Billing Settings</span>
              </h3>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Invoice Prefix</label>
                  <input
                    type="text"
                    value={invoicePrefix}
                    onChange={(e) => setInvoicePrefix(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tax Rate (%)</label>
                  <input
                    type="number"
                    value={taxRate}
                    onChange={(e) => setTaxRate(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs bg-slate-50 rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tax Label</label>
                  <input
                    type="text"
                    value={taxName}
                    onChange={(e) => setTaxName(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 rounded-xl border border-slate-200"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 7: Complete Setup */}
          {step === 7 && (
            <div className="text-center py-6 space-y-4">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-extrabold text-slate-900">Setup Complete!</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Your business operating system is now configured and ready to run daily operations!
              </p>
            </div>
          )}

          {/* Navigation Controls */}
          <div className="flex justify-between items-center pt-6 border-t border-slate-100">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl flex items-center space-x-1"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>
            ) : <div />}

            <button
              type="button"
              onClick={handleNextStep}
              disabled={loading}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-200 flex items-center space-x-2"
            >
              <span>{step === 7 ? (loading ? 'Launching OS...' : 'Enter Business OS Dashboard') : 'Continue to Next Step'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
