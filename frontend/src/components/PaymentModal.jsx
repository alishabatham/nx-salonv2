import React, { useState } from 'react';
import Modal from './Modal';
import { fetchAPI } from '../services/api';
import { CreditCard, AlertCircle, CheckCircle, Wallet, QrCode } from 'lucide-react';

export default function PaymentModal({ isOpen, onClose, bill, onSuccess }) {
  const [amount, setAmount] = useState(bill?.pendingAmount || '');
  const [method, setMethod] = useState('Cash');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [notes, setNotes] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  if (!bill) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const payAmt = Number(amount);
    if (!payAmt || payAmt <= 0) {
      setError('Payment amount must be greater than 0');
      return;
    }

    if (payAmt > bill.pendingAmount + 0.01) {
      setError(`Payment amount cannot exceed remaining pending amount (₹${bill.pendingAmount})`);
      return;
    }

    setLoading(true);

    try {
      await fetchAPI(`/billing/${bill._id}/payments`, {
        method: 'POST',
        body: {
          amount: payAmt,
          method,
          referenceNumber,
          notes
        }
      });

      setDone(true);
      if (onSuccess) onSuccess();
      setTimeout(() => {
        setDone(false);
        onClose();
      }, 1500);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Collect Payment • Invoice ${bill.invoiceNumber}`}>
      {done ? (
        <div className="text-center py-8 space-y-3">
          <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle className="w-6 h-6" />
          </div>
          <h4 className="text-lg font-bold text-slate-800">Payment Recorded Successfully!</h4>
          <p className="text-xs text-slate-500">The invoice status and customer history have been updated.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Invoice Summary Box */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500">Customer</p>
              <p className="text-sm font-bold text-slate-800">{bill.customerDetails?.name}</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-semibold text-slate-500">Grand Total / Pending</p>
              <p className="text-sm font-extrabold text-indigo-700">
                ₹{bill.grandTotal} <span className="text-rose-600 font-bold text-xs">(Pending: ₹{bill.pendingAmount})</span>
              </p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Payment Amount (₹) *</label>
            <input
              type="number"
              step="0.01"
              required
              max={bill.pendingAmount}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-3 py-2 text-sm font-bold text-slate-800 bg-white rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Payment Method *</label>
            <div className="grid grid-cols-3 gap-2">
              {['Cash', 'UPI', 'Card', 'Bank Transfer', 'Other'].map(m => (
                <button
                  type="button"
                  key={m}
                  onClick={() => setMethod(m)}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                    method === m
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {(method === 'UPI' || method === 'Card' || method === 'Bank Transfer') && (
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Transaction / Reference Number</label>
              <input
                type="text"
                placeholder="e.g. UPI/123456 or Card Txn ID"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Payment Notes (Optional)</label>
            <input
              type="text"
              placeholder="e.g. Partial payment / Paid via GPay"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-200"
            >
              {loading ? 'Recording...' : `Record ₹${amount || 0} Payment`}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}
