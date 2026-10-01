import React, { useState, useEffect } from 'react';
import { fetchAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import { History, ShieldCheck, User } from 'lucide-react';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAuditLogs();
  }, []);

  const loadAuditLogs = async () => {
    setLoading(true);
    try {
      const data = await fetchAPI('/audit-logs?limit=100');
      setLogs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div>
        <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          <History className="w-6 h-6 text-indigo-600" />
          <span>Immutable Audit Log Trail</span>
        </h1>
        <p className="text-xs text-slate-500 font-medium">
          Comprehensive compliance tracking for security, business entity updates, appointments, billing, and inventory changes
        </p>
      </div>

      {loading ? (
        <LoadingSpinner text="Fetching security audit trail..." />
      ) : logs.length === 0 ? (
        <EmptyState title="No Audit Logs" description="Audit events will appear here as business actions take place." />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Entity</th>
                  <th className="py-3 px-4">Details / Changes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map(log => (
                  <tr key={log._id} className="hover:bg-slate-50/80">
                    <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>

                    <td className="py-3 px-4 font-semibold text-slate-800 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span>{log.userName}</span>
                    </td>

                    <td className="py-3 px-4 font-bold text-indigo-700">
                      <span className="px-2 py-0.5 bg-indigo-50 border border-indigo-200/60 rounded-md text-[11px]">
                        {log.action}
                      </span>
                    </td>

                    <td className="py-3 px-4 font-semibold text-slate-700">
                      {log.entity}
                    </td>

                    <td className="py-3 px-4 text-slate-600">
                      {log.newValue && <p className="truncate max-w-xs">{log.newValue}</p>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
