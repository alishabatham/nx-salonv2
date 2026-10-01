import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { fetchAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import Modal from '../components/Modal';
import PaymentModal from '../components/PaymentModal';
import PrintableInvoiceModal from '../components/PrintableInvoiceModal';

import { Receipt, Plus, Search, Printer, CreditCard, AlertCircle, Trash2 } from 'lucide-react';

export default function BillingPage() {
  const { currentRole, t, business } = useAuth();
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('');
  const [search, setSearch] = useState('');

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [paymentModalBill, setPaymentModalBill] = useState(null);
  const [invoiceModalId, setInvoiceModalId] = useState(null);

  // Create Bill Form State
  const [customers, setCustomers] = useState([]);
  const [services, setServices] = useState([]);
  const [products, setProducts] = useState([]);

  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [billItems, setBillItems] = useState([
    { itemType: 'service', itemId: '', name: '', qty: 1, unitPrice: 0, discount: 0 }
  ]);
  const [discountType, setDiscountType] = useState('fixed');
  const [discountValue, setDiscountValue] = useState(0);

  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState('');

  useEffect(() => {
    loadBills();
    loadCatalogOptions();
  }, [paymentStatusFilter, search]);

  const loadBills = async () => {
    setLoading(true);
    try {
      let query = `?search=${encodeURIComponent(search)}`;
      if (paymentStatusFilter) query += `&paymentStatus=${paymentStatusFilter}`;

      const data = await fetchAPI(`/billing${query}`);
      setBills(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadCatalogOptions = async () => {
    try {
      const [cData, sData, pData] = await Promise.all([
        fetchAPI('/customers'),
        fetchAPI('/services?activeOnly=true'),
        fetchAPI('/inventory/products')
      ]);
      setCustomers(cData.customers || []);
      setServices(sData);
      setProducts(pData);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddItem = () => {
    setBillItems([...billItems, { itemType: 'service', itemId: '', name: '', qty: 1, unitPrice: 0, discount: 0 }]);
  };

  const handleRemoveItem = (idx) => {
    setBillItems(billItems.filter((_, i) => i !== idx));
  };

  const handleItemSelect = (idx, type, itemId) => {
    const updated = [...billItems];
    updated[idx].itemType = type;
    updated[idx].itemId = itemId;

    if (type === 'service') {
      const sv = services.find(s => s._id === itemId);
      if (sv) {
        updated[idx].name = sv.name;
        updated[idx].unitPrice = sv.price;
      }
    } else {
      const pr = products.find(p => p._id === itemId);
      if (pr) {
        updated[idx].name = pr.name;
        updated[idx].unitPrice = pr.sellingPrice;
      }
    }

    setBillItems(updated);
  };

  const handleCreateBill = async (e) => {
    e.preventDefault();
    setCreateError('');

    const validItems = billItems.filter(i => i.itemId);
    if (!selectedCustomerId || !validItems.length) {
      setCreateError('Customer and at least one bill item are required.');
      return;
    }

    setCreateLoading(true);
    try {
      const bill = await fetchAPI('/billing', {
        method: 'POST',
        body: {
          customerId: selectedCustomerId,
          items: validItems,
          discountType,
          discountValue: Number(discountValue)
        }
      });

      setIsCreateOpen(false);
      resetForm();
      loadBills();

      // Open payment modal for newly created bill immediately
      setPaymentModalBill(bill);

    } catch (err) {
      setCreateError(err.message);
    } finally {
      setCreateLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedCustomerId('');
    setBillItems([{ itemType: 'service', itemId: '', name: '', qty: 1, unitPrice: 0, discount: 0 }]);
    setDiscountValue(0);
    setCreateError('');
  };

  const currency = business?.currency || 'INR ₹';

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Billing & Invoices Hub
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Generate itemized tax invoices, collect partial payments, and print receipts
          </p>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-200 flex items-center space-x-1.5 self-start"
        >
          <Plus className="w-4 h-4" />
          <span>Create Invoice / Bill</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Search</label>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2" />
            <input
              type="text"
              placeholder="Search by invoice # or customer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1 text-xs bg-slate-50 rounded-xl border border-slate-200"
            />
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Filter Payment Status</label>
          <select
            value={paymentStatusFilter}
            onChange={(e) => setPaymentStatusFilter(e.target.value)}
            className="px-3 py-1 text-xs bg-slate-50 rounded-xl border border-slate-200 font-medium"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="partially_paid">Partially Paid</option>
            <option value="paid">Paid</option>
          </select>
        </div>
      </div>

      {/* Bills List Table */}
      {loading ? (
        <LoadingSpinner text="Loading billing transactions..." />
      ) : bills.length === 0 ? (
        <EmptyState
          title="No Bills Found"
          description="Create your first bill to generate itemized invoices."
          action={
            <button onClick={() => setIsCreateOpen(true)} className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-xl text-xs">
              Create First Invoice
            </button>
          }
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">{t('customer', 'Customer')}</th>
                  <th className="py-3 px-4 text-right">Grand Total</th>
                  <th className="py-3 px-4 text-right">Paid</th>
                  <th className="py-3 px-4 text-right">Pending</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {bills.map(b => (
                  <tr key={b._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-bold text-indigo-700">
                      #{b.invoiceNumber}
                    </td>

                    <td className="py-3 px-4 text-slate-500">
                      {new Date(b.createdAt).toLocaleDateString()}
                    </td>

                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-800">{b.customerDetails?.name}</p>
                      <p className="text-[11px] text-slate-500">{b.customerDetails?.mobile}</p>
                    </td>

                    <td className="py-3 px-4 text-right font-extrabold text-slate-900">
                      {currency} {b.grandTotal}
                    </td>

                    <td className="py-3 px-4 text-right font-bold text-emerald-600">
                      {currency} {b.paidAmount}
                    </td>

                    <td className="py-3 px-4 text-right font-bold text-rose-600">
                      {currency} {b.pendingAmount}
                    </td>

                    <td className="py-3 px-4 text-center">
                      <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full uppercase tracking-wider ${
                        b.paymentStatus === 'paid' ? 'bg-emerald-100 text-emerald-800' :
                        b.paymentStatus === 'partially_paid' ? 'bg-amber-100 text-amber-800' :
                        'bg-rose-100 text-rose-800'
                      }`}>
                        {b.paymentStatus.replace('_', ' ')}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right space-x-1">
                      {b.pendingAmount > 0 && (
                        <button
                          onClick={() => setPaymentModalBill(b)}
                          className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-[11px] inline-flex items-center space-x-1"
                        >
                          <CreditCard className="w-3 h-3" />
                          <span>Collect</span>
                        </button>
                      )}

                      <button
                        onClick={() => setInvoiceModalId(b._id)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-[11px] inline-flex items-center space-x-1"
                      >
                        <Printer className="w-3 h-3" />
                        <span>Print</span>
                      </button>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE BILL MODAL */}
      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Create New Tax Invoice" maxWidth="max-w-2xl">
        <form onSubmit={handleCreateBill} className="space-y-4">
          
          {createError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{createError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Select {t('customer', 'Customer')} *</label>
            <select
              required
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white rounded-lg border border-slate-200"
            >
              <option value="">-- Choose Customer --</option>
              {customers.map(c => (
                <option key={c._id} value={c._id}>{c.name} ({c.mobile})</option>
              ))}
            </select>
          </div>

          {/* Line Items */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Line Items (Services & Retail Products)</label>
            {billItems.map((item, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-2 items-center bg-slate-50 p-2 rounded-xl border border-slate-200">
                <div className="col-span-3">
                  <select
                    value={item.itemType}
                    onChange={(e) => handleItemSelect(idx, e.target.value, '')}
                    className="w-full px-2 py-1.5 text-xs bg-white rounded-lg border border-slate-200"
                  >
                    <option value="service">{t('service', 'Service')}</option>
                    <option value="product">Retail Product</option>
                  </select>
                </div>

                <div className="col-span-5">
                  <select
                    required
                    value={item.itemId}
                    onChange={(e) => handleItemSelect(idx, item.itemType, e.target.value)}
                    className="w-full px-2 py-1.5 text-xs bg-white rounded-lg border border-slate-200"
                  >
                    <option value="">-- Choose Item --</option>
                    {item.itemType === 'service' ? (
                      services.map(s => <option key={s._id} value={s._id}>{s.name} ({currency} {s.price})</option>)
                    ) : (
                      products.map(p => <option key={p._id} value={p._id}>{p.name} ({currency} {p.sellingPrice})</option>)
                    )}
                  </select>
                </div>

                <div className="col-span-2">
                  <input
                    type="number"
                    min="1"
                    value={item.qty}
                    onChange={(e) => {
                      const updated = [...billItems];
                      updated[idx].qty = Number(e.target.value);
                      setBillItems(updated);
                    }}
                    className="w-full px-2 py-1.5 text-xs bg-white rounded-lg border border-slate-200 text-center font-bold"
                  />
                </div>

                <div className="col-span-2 flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-700">{currency} {item.qty * item.unitPrice}</span>
                  {billItems.length > 1 && (
                    <button type="button" onClick={() => handleRemoveItem(idx)} className="text-rose-500 p-1">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={handleAddItem}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-indigo-700 text-xs font-semibold rounded-lg flex items-center space-x-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Line Item</span>
            </button>
          </div>

          {/* Discount Section */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Discount Type</label>
              <select
                value={discountType}
                onChange={(e) => setDiscountType(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white rounded-lg border border-slate-200"
              >
                <option value="fixed">Fixed Amount (₹)</option>
                <option value="percentage">Percentage (%)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Discount Value</label>
              <input
                type="number"
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white rounded-lg border border-slate-200"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
            <button type="button" onClick={() => setIsCreateOpen(false)} className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl">Cancel</button>
            <button type="submit" disabled={createLoading} className="px-5 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-200">
              {createLoading ? 'Generating...' : 'Generate Invoice & Collect Payment'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Payment Modal */}
      <PaymentModal
        isOpen={!!paymentModalBill}
        onClose={() => setPaymentModalBill(null)}
        bill={paymentModalBill}
        onSuccess={loadBills}
      />

      {/* Printable Invoice Modal */}
      <PrintableInvoiceModal
        isOpen={!!invoiceModalId}
        onClose={() => setInvoiceModalId(null)}
        billId={invoiceModalId}
      />

    </div>
  );
}
