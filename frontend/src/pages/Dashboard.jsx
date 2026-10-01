import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { fetchAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import WalkInBookingModal from '../components/WalkInBookingModal';
import PaymentModal from '../components/PaymentModal';
import ServiceConsumptionModal from '../components/ServiceConsumptionModal';
import PrintableInvoiceModal from '../components/PrintableInvoiceModal';

import {
  DollarSign,
  Calendar,
  Users,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Play,
  Scissors,
  Plus,
  ArrowUpRight,
  TrendingUp,
  Receipt,
  UserCheck
} from 'lucide-react';

export default function Dashboard() {
  const { currentRole, business, t } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modals
  const [walkInOpen, setWalkInOpen] = useState(false);
  const [paymentModalBill, setPaymentModalBill] = useState(null);
  const [consumptionAppt, setConsumptionAppt] = useState(null);
  const [invoiceModalId, setInvoiceModalId] = useState(null);

  useEffect(() => {
    loadDashboardData();
  }, [currentRole]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const summary = await fetchAPI('/reports/dashboard');
      setData(summary);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (apptId, newStatus) => {
    try {
      await fetchAPI(`/appointments/${apptId}/status`, {
        method: 'PUT',
        body: { status: newStatus }
      });
      loadDashboardData();
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) return <LoadingSpinner text="Loading business operational dashboard..." />;

  const currency = business?.currency || 'INR ₹';

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
            {currentRole === 'owner' && 'Owner Business Dashboard'}
            {currentRole === 'receptionist' && 'Front Desk Operations'}
            {currentRole === 'staff' && 'Staff Queue & Schedule'}
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Realtime operational stats for {business?.name || 'Business'} • {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setWalkInOpen(true)}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-200 flex items-center space-x-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Fast Walk-in</span>
          </button>
        </div>
      </div>

      {/* Low Stock Alert Banner if any */}
      {data?.lowStockCount > 0 && (
        <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <p className="text-xs font-bold text-amber-900">Low Stock Alert ({data.lowStockCount} items)</p>
              <p className="text-[11px] text-amber-700">Some inventory products are below minimum thresholds.</p>
            </div>
          </div>
          <span className="px-2.5 py-1 bg-amber-200/80 text-amber-900 font-bold rounded-lg text-xs">
            Review Stock
          </span>
        </div>
      )}

      {/* TOP METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Today's Sales */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Today's Sales</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-slate-900 mt-2">{currency} {data?.todaySales || 0}</p>
          <p className="text-[11px] text-slate-400 font-medium mt-1">Directly recorded payments today</p>
        </div>

        {/* Card 2: Today's Appointments */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Today's Appointments</span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-slate-900 mt-2">{data?.todayAppointmentsCount || 0}</p>
          <div className="flex items-center space-x-2 text-[11px] text-slate-500 mt-1">
            <span className="text-emerald-600 font-bold">{data?.apptBreakdown?.completed || 0} completed</span>
            <span>•</span>
            <span className="text-indigo-600 font-bold">{data?.apptBreakdown?.in_service || 0} in service</span>
          </div>
        </div>

        {/* Card 3: New Customers */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Today's New {t('customer', 'Customers')}</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-slate-900 mt-2">{data?.todayNewCustomersCount || 0}</p>
          <p className="text-[11px] text-slate-400 font-medium mt-1">First-time visitors added today</p>
        </div>

        {/* Card 4: Pending Payments */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pending Payments</span>
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <Receipt className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-rose-600 mt-2">{currency} {data?.totalPendingPayment || 0}</p>
          <p className="text-[11px] text-slate-400 font-medium mt-1">Outstanding unpaid invoice balance</p>
        </div>

      </div>

      {/* MAIN LAYOUT: Today's Appointments Timeline + Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column (2 cols): Today's Schedule & Actionable Queue */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <Clock className="w-5 h-5 text-indigo-600" />
              <span>Today's Appointment Schedule & Operations</span>
            </h3>
            <span className="text-xs font-bold bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full border border-indigo-200/60">
              {data?.todayAppointments?.length || 0} Total
            </span>
          </div>

          {data?.todayAppointments?.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">
              No appointments booked for today yet.
            </div>
          ) : (
            <div className="space-y-3">
              {data?.todayAppointments?.map((appt) => (
                <div
                  key={appt._id}
                  className="p-4 rounded-xl border border-slate-200/80 hover:border-slate-300 transition-all bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-0.5 text-xs font-extrabold bg-indigo-100 text-indigo-800 rounded-md">
                        {appt.startTime} - {appt.endTime}
                      </span>
                      <span className="text-xs font-bold text-slate-900">{appt.customerDetails?.name}</span>
                      <span className="text-xs text-slate-500">({appt.customerDetails?.mobile})</span>
                    </div>

                    <p className="text-xs font-semibold text-slate-700">
                      {appt.serviceDetails?.name} • <span className="text-indigo-600">{currency} {appt.serviceDetails?.price}</span>
                    </p>

                    <p className="text-[11px] text-slate-500 flex items-center gap-1">
                      <UserCheck className="w-3 h-3 text-slate-400" />
                      <span>{t('staff', 'Staff')}: {appt.staffDetails?.name || 'Assigned Staff'}</span>
                    </p>
                  </div>

                  {/* Status & Operational Actions */}
                  <div className="flex items-center space-x-2">
                    <span className={`px-2.5 py-1 text-[11px] font-bold rounded-lg uppercase tracking-wider ${
                      appt.status === 'completed' ? 'bg-emerald-100 text-emerald-800' :
                      appt.status === 'in_service' ? 'bg-indigo-100 text-indigo-800 animate-pulse' :
                      appt.status === 'checked_in' ? 'bg-blue-100 text-blue-800' :
                      appt.status === 'cancelled' ? 'bg-rose-100 text-rose-800' :
                      'bg-amber-100 text-amber-800'
                    }`}>
                      {appt.status.replace('_', ' ')}
                    </span>

                    {/* Operational Buttons */}
                    {appt.status === 'booked' && (
                      <button
                        onClick={() => handleStatusChange(appt._id, 'checked_in')}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold"
                      >
                        Check-in
                      </button>
                    )}

                    {appt.status === 'checked_in' && (
                      <button
                        onClick={() => handleStatusChange(appt._id, 'in_service')}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center space-x-1"
                      >
                        <Play className="w-3 h-3" />
                        <span>Start</span>
                      </button>
                    )}

                    {appt.status === 'in_service' && (
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => setConsumptionAppt(appt)}
                          className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold"
                          title="Record consumed products"
                        >
                          + Consume
                        </button>
                        <button
                          onClick={() => handleStatusChange(appt._id, 'completed')}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center space-x-1"
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Complete</span>
                        </button>
                      </div>
                    )}
                  </div>

                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column (1 col): Recent Transactions Log */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <Receipt className="w-5 h-5 text-indigo-600" />
            <span>Recent Payment Transactions</span>
          </h3>

          {data?.recentPayments?.length === 0 ? (
            <p className="text-xs text-slate-500 py-6 text-center">No payment transactions today.</p>
          ) : (
            <div className="space-y-3">
              {data?.recentPayments?.map((p) => (
                <div key={p._id} className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-bold text-slate-800">{p.billId?.customerDetails?.name || 'Customer'}</p>
                    <p className="text-[11px] text-slate-500">Invoice: #{p.billId?.invoiceNumber || 'INV'} • {p.method}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-extrabold text-emerald-600">+{currency} {p.amount}</p>
                    <p className="text-[10px] text-slate-400">{new Date(p.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* MODALS */}
      <WalkInBookingModal
        isOpen={walkInOpen}
        onClose={() => setWalkInOpen(false)}
        onRefresh={loadDashboardData}
      />

      <PaymentModal
        isOpen={!!paymentModalBill}
        onClose={() => setPaymentModalBill(null)}
        bill={paymentModalBill}
        onSuccess={loadDashboardData}
      />

      <ServiceConsumptionModal
        isOpen={!!consumptionAppt}
        onClose={() => setConsumptionAppt(null)}
        appointment={consumptionAppt}
        onSuccess={loadDashboardData}
      />

      <PrintableInvoiceModal
        isOpen={!!invoiceModalId}
        onClose={() => setInvoiceModalId(null)}
        billId={invoiceModalId}
      />

    </div>
  );
}
