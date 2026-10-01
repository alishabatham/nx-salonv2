import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { fetchAPI } from '../services/api';
import { Printer, Download, Share2, CheckCircle2, Clock } from 'lucide-react';

export default function PrintableInvoiceModal({ isOpen, onClose, billId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && billId) {
      loadBillDetails();
    }
  }, [isOpen, billId]);

  const loadBillDetails = async () => {
    setLoading(true);
    try {
      const result = await fetchAPI(`/billing/${billId}`);
      setData(result);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (!isOpen) return null;

  const bill = data?.bill;
  const payments = data?.payments || [];
  const business = data?.business;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Tax Invoice & Receipt" maxWidth="max-w-2xl">
      {loading || !bill ? (
        <div className="py-12 text-center text-xs text-slate-500">Loading invoice data...</div>
      ) : (
        <div>
          {/* Printable Invoice Container */}
          <div id="printable-invoice" className="bg-white p-6 rounded-xl border border-slate-200/80 space-y-6 text-slate-800">
            
            {/* Header: Business & Invoice Info */}
            <div className="flex justify-between items-start border-b border-slate-200 pb-4">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">{business?.name || 'Aura Wellness'}</h2>
                <p className="text-xs text-slate-500">{business?.address}, {business?.city}</p>
                <p className="text-xs text-slate-500">Phone: {business?.phone} | Email: {business?.email}</p>
                {business?.taxId && (
                  <p className="text-xs font-semibold text-slate-600 mt-1">GST/Tax ID: {business.taxId}</p>
                )}
              </div>

              <div className="text-right">
                <span className={`inline-block px-2.5 py-1 text-xs font-extrabold rounded-md uppercase tracking-wider ${
                  bill.paymentStatus === 'paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  {bill.paymentStatus.replace('_', ' ')}
                </span>
                <p className="text-sm font-bold text-slate-800 mt-2">Invoice: #{bill.invoiceNumber}</p>
                <p className="text-xs text-slate-500">Date: {new Date(bill.createdAt).toLocaleDateString()}</p>
              </div>
            </div>

            {/* Billed To Customer */}
            <div className="p-3 bg-slate-50 rounded-lg text-xs space-y-1">
              <p className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Billed To:</p>
              <p className="font-bold text-slate-900 text-sm">{bill.customerDetails?.name}</p>
              <p className="text-slate-600">Mobile: {bill.customerDetails?.mobile}</p>
              {bill.customerDetails?.email && <p className="text-slate-600">Email: {bill.customerDetails.email}</p>}
            </div>

            {/* Items Table */}
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                  <th className="py-2">Item Description</th>
                  <th className="py-2 text-center">Type</th>
                  <th className="py-2 text-center">Qty</th>
                  <th className="py-2 text-right">Unit Price</th>
                  <th className="py-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {bill.items.map((item, idx) => (
                  <tr key={idx}>
                    <td className="py-2.5 font-semibold text-slate-800">{item.name}</td>
                    <td className="py-2.5 text-center capitalize text-slate-500 text-[11px]">{item.itemType}</td>
                    <td className="py-2.5 text-center">{item.qty}</td>
                    <td className="py-2.5 text-right">₹{item.unitPrice}</td>
                    <td className="py-2.5 text-right font-bold">₹{item.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Calculation Totals */}
            <div className="border-t border-slate-200 pt-3 space-y-1.5 text-xs text-right">
              <div className="flex justify-end space-x-6 text-slate-600">
                <span>Subtotal:</span>
                <span className="font-semibold w-24">₹{bill.subtotal}</span>
              </div>
              {bill.discountAmount > 0 && (
                <div className="flex justify-end space-x-6 text-emerald-600 font-medium">
                  <span>Discount:</span>
                  <span className="w-24">- ₹{bill.discountAmount}</span>
                </div>
              )}
              {bill.taxAmount > 0 && (
                <div className="flex justify-end space-x-6 text-slate-600">
                  <span>{bill.taxName} (18%):</span>
                  <span className="font-semibold w-24">+ ₹{bill.taxAmount}</span>
                </div>
              )}
              <div className="flex justify-end space-x-6 text-base font-extrabold text-slate-900 border-t border-slate-200 pt-2">
                <span>Grand Total:</span>
                <span className="text-indigo-700 w-24">₹{bill.grandTotal}</span>
              </div>
              <div className="flex justify-end space-x-6 text-xs text-slate-600 pt-1">
                <span>Amount Paid:</span>
                <span className="font-bold text-emerald-700 w-24">₹{bill.paidAmount}</span>
              </div>
              {bill.pendingAmount > 0 && (
                <div className="flex justify-end space-x-6 text-xs font-bold text-rose-600">
                  <span>Balance Due:</span>
                  <span className="w-24">₹{bill.pendingAmount}</span>
                </div>
              )}
            </div>

            {/* Payment History Log */}
            {payments.length > 0 && (
              <div className="border-t border-slate-100 pt-3 text-xs">
                <p className="font-bold text-slate-700 text-[10px] uppercase mb-2">Payment Transactions History:</p>
                <div className="space-y-1">
                  {payments.map(p => (
                    <div key={p._id} className="flex justify-between text-[11px] text-slate-600 bg-slate-50 p-2 rounded-md">
                      <span>Receipt #{p.receiptNumber} ({p.method})</span>
                      <span className="font-bold text-slate-800">₹{p.amount} on {new Date(p.createdAt).toLocaleDateString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="text-center border-t border-slate-100 pt-4 text-[11px] text-slate-400">
              Thank you for visiting {business?.name}! Please visit again soon.
            </div>

          </div>

          {/* Modal Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100 print:hidden">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl"
            >
              Close
            </button>
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center space-x-1.5 shadow-md shadow-indigo-200"
            >
              <Printer className="w-4 h-4" />
              <span>Print Invoice / Receipt</span>
            </button>
          </div>

        </div>
      )}
    </Modal>
  );
}
