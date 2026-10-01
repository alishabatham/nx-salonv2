import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { fetchAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

import { BarChart3, TrendingUp, DollarSign, Calendar, Users, Award, ShieldCheck } from 'lucide-react';

export default function ReportsPage() {
  const { business, t } = useAuth();
  const [range, setRange] = useState('thisMonth');
  const [salesData, setSalesData] = useState(null);
  const [apptData, setApptData] = useState(null);
  const [staffData, setStaffData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReports();
  }, [range]);

  const loadReports = async () => {
    setLoading(true);
    try {
      const [sRes, aRes, stRes] = await Promise.all([
        fetchAPI(`/reports/sales?range=${range}`),
        fetchAPI(`/reports/appointments?range=${range}`),
        fetchAPI(`/reports/staff?range=${range}`)
      ]);
      setSalesData(sRes);
      setApptData(aRes);
      setStaffData(stRes);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const currency = business?.currency || 'INR ₹';

  return (
    <div className="space-y-6">
      
      {/* Header & Date Range Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Business Reports & Analytics
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Realtime database-driven revenue, sales method splits, and staff productivity
          </p>
        </div>

        <div className="flex items-center space-x-1 bg-white p-1 rounded-xl border border-slate-200 shadow-xs self-start">
          {[
            { id: 'today', label: 'Today' },
            { id: 'yesterday', label: 'Yesterday' },
            { id: 'last7', label: 'Last 7 Days' },
            { id: 'thisMonth', label: 'This Month' }
          ].map(r => (
            <button
              key={r.id}
              onClick={() => setRange(r.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                range === r.id ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <LoadingSpinner text="Generating business intelligence reports..." />
      ) : (
        <div className="space-y-6">
          
          {/* Sales Metric Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-xs font-bold text-slate-500 uppercase">Gross Sales</span>
              <p className="text-2xl font-extrabold text-slate-900 mt-2">{currency} {salesData?.summary?.grossSales || 0}</p>
              <p className="text-[11px] text-slate-400 mt-1">Total list price before discounts</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-xs font-bold text-slate-500 uppercase">Total Discounts</span>
              <p className="text-2xl font-extrabold text-emerald-600 mt-2">{currency} {salesData?.summary?.totalDiscounts || 0}</p>
              <p className="text-[11px] text-slate-400 mt-1">Discounts & promotional reductions</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-xs font-bold text-slate-500 uppercase">Net Collected Paid</span>
              <p className="text-2xl font-extrabold text-indigo-700 mt-2">{currency} {salesData?.summary?.totalPaid || 0}</p>
              <p className="text-[11px] text-slate-400 mt-1">Actual money received in bank/cash</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-xs font-bold text-slate-500 uppercase">Pending Outstanding</span>
              <p className="text-2xl font-extrabold text-rose-600 mt-2">{currency} {salesData?.summary?.totalPending || 0}</p>
              <p className="text-[11px] text-slate-400 mt-1">Remaining unpaid bill balances</p>
            </div>
          </div>

          {/* Payment Method Breakdown */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-800">Payment Collection Method Split</h3>
            
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {Object.entries(salesData?.paymentMethods || {}).map(([method, amt]) => (
                <div key={method} className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 text-center">
                  <span className="text-xs font-bold text-slate-500 uppercase">{method}</span>
                  <p className="text-base font-extrabold text-slate-800 mt-1">{currency} {amt}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Staff Performance Leaderboard */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <Award className="w-5 h-5 text-indigo-600" />
              <span>{t('staff', 'Staff')} Performance & Revenue Breakdown</span>
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                    <th className="py-3 px-4">{t('staff', 'Staff')} Member</th>
                    <th className="py-3 px-4">Role Title</th>
                    <th className="py-3 px-4 text-center">Appointments Handled</th>
                    <th className="py-3 px-4 text-center">Completed Services</th>
                    <th className="py-3 px-4 text-right">Service Revenue Generated</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {staffData.map(s => (
                    <tr key={s.staffId} className="hover:bg-slate-50/80">
                      <td className="py-3 px-4 font-bold text-slate-900">{s.name}</td>
                      <td className="py-3 px-4 text-slate-500">{s.roleTitle}</td>
                      <td className="py-3 px-4 text-center font-bold text-slate-700">{s.totalAppointments}</td>
                      <td className="py-3 px-4 text-center font-bold text-emerald-600">{s.completedServices}</td>
                      <td className="py-3 px-4 text-right font-extrabold text-indigo-700">
                        {currency} {s.revenueGenerated}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
