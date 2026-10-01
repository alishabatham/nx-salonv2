import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { fetchAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import Modal from '../components/Modal';

import { Package, Plus, AlertTriangle, History, ArrowDownRight, ArrowUpRight, Edit3, AlertCircle } from 'lucide-react';

export default function InventoryPage() {
  const { currentRole, business } = useAuth();
  const [products, setProducts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState('products'); // 'products' | 'transactions'
  const [lowStockFilter, setLowStockFilter] = useState(false);
  const [search, setSearch] = useState('');

  // Add Product Modal
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('General');
  const [sellingPrice, setSellingPrice] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [currentStock, setCurrentStock] = useState('10');
  const [minStock, setMinStock] = useState('5');
  const [unit, setUnit] = useState('pcs');

  // Stock Adjust Modal
  const [adjustingProduct, setAdjustingProduct] = useState(null);
  const [adjustQty, setAdjustQty] = useState('');
  const [adjustType, setAdjustType] = useState('stock_in');
  const [adjustReason, setAdjustReason] = useState('');

  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');

  useEffect(() => {
    loadInventoryData();
  }, [lowStockFilter, search, activeTab]);

  const loadInventoryData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'products') {
        let query = `?search=${encodeURIComponent(search)}`;
        if (lowStockFilter) query += '&lowStockOnly=true';
        const data = await fetchAPI(`/inventory/products${query}`);
        setProducts(data);
      } else {
        const data = await fetchAPI('/inventory/transactions');
        setTransactions(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    setModalError('');
    setModalLoading(true);
    try {
      const body = {
        name,
        category,
        sellingPrice: Number(sellingPrice),
        costPrice: Number(costPrice || 0),
        currentStock: Number(currentStock),
        minStock: Number(minStock || 5),
        unit
      };

      if (editingProduct) {
        await fetchAPI(`/inventory/products/${editingProduct._id}`, { method: 'PUT', body });
      } else {
        await fetchAPI('/inventory/products', { method: 'POST', body });
      }

      setIsProductModalOpen(false);
      loadInventoryData();
    } catch (err) {
      setModalError(err.message);
    } finally {
      setModalLoading(false);
    }
  };

  const handleAdjustStockSubmit = async (e) => {
    e.preventDefault();
    setModalError('');
    setModalLoading(true);

    const qty = adjustType === 'stock_in' ? Math.abs(Number(adjustQty)) : -Math.abs(Number(adjustQty));

    try {
      await fetchAPI(`/inventory/products/${adjustingProduct._id}/adjust`, {
        method: 'POST',
        body: {
          quantity: qty,
          type: adjustType,
          reason: adjustReason
        }
      });

      setAdjustingProduct(null);
      setAdjustQty('');
      setAdjustReason('');
      loadInventoryData();
    } catch (err) {
      setModalError(err.message);
    } finally {
      setModalLoading(false);
    }
  };

  const currency = business?.currency || 'INR ₹';

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Inventory & Stock Movement Control
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Manage retail products, consumables, minimum stock thresholds, and stock movements
          </p>
        </div>

        <button
          onClick={() => {
            setEditingProduct(null);
            setName('');
            setSellingPrice('');
            setCurrentStock('10');
            setIsProductModalOpen(true);
          }}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-200 flex items-center space-x-1.5 self-start"
        >
          <Plus className="w-4 h-4" />
          <span>Add Product</span>
        </button>
      </div>

      {/* Tabs & Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveTab('products')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border ${
              activeTab === 'products' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-200'
            }`}
          >
            Products Catalog
          </button>
          <button
            onClick={() => setActiveTab('transactions')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border ${
              activeTab === 'transactions' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-200'
            }`}
          >
            Stock Movement History
          </button>
        </div>

        {activeTab === 'products' && (
          <button
            onClick={() => setLowStockFilter(!lowStockFilter)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center space-x-1 ${
              lowStockFilter ? 'bg-amber-500 text-white border-amber-500' : 'bg-white text-amber-700 border-amber-300'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Low Stock Items Only</span>
          </button>
        )}
      </div>

      {/* TAB 1: Products Grid */}
      {activeTab === 'products' && (
        loading ? (
          <LoadingSpinner text="Loading inventory items..." />
        ) : products.length === 0 ? (
          <EmptyState
            title="No Products Found"
            description="Add products to track inventory and retail sales."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map(p => {
              const isLowStock = p.currentStock <= p.minStock;
              return (
                <div
                  key={p._id}
                  className={`p-5 rounded-2xl bg-white border transition-all space-y-3 flex flex-col justify-between ${
                    isLowStock ? 'border-amber-300 bg-amber-50/20 shadow-xs' : 'border-slate-200/80 shadow-xs'
                  }`}
                >
                  <div>
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="px-2 py-0.5 text-[10px] font-bold bg-slate-100 text-slate-600 rounded-md">
                          {p.category}
                        </span>
                        <h3 className="text-sm font-bold text-slate-900 mt-1.5">{p.name}</h3>
                      </div>

                      <span className="text-base font-extrabold text-indigo-700">
                        {currency} {p.sellingPrice}
                      </span>
                    </div>

                    <div className="mt-4 p-3 bg-slate-50 rounded-xl flex items-center justify-between text-xs">
                      <div>
                        <p className="text-slate-500">Current Stock:</p>
                        <p className={`text-base font-extrabold ${isLowStock ? 'text-amber-600' : 'text-slate-900'}`}>
                          {p.currentStock} <span className="text-xs font-medium text-slate-500">{p.unit}</span>
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-slate-500">Min Threshold:</p>
                        <p className="text-xs font-bold text-slate-700">{p.minStock} {p.unit}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                    <button
                      onClick={() => setAdjustingProduct(p)}
                      className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs"
                    >
                      Adjust Stock
                    </button>

                    <button
                      onClick={() => {
                        setEditingProduct(p);
                        setName(p.name);
                        setCategory(p.category);
                        setSellingPrice(p.sellingPrice);
                        setCostPrice(p.costPrice || '');
                        setCurrentStock(p.currentStock);
                        setMinStock(p.minStock);
                        setUnit(p.unit);
                        setIsProductModalOpen(true);
                      }}
                      className="px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-lg text-xs flex items-center space-x-1"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                  </div>

                </div>
              );
            })}
          </div>
        )
      )}

      {/* TAB 2: Stock Transactions Table */}
      {activeTab === 'transactions' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-4">Product</th>
                <th className="py-3 px-4 text-center">Type</th>
                <th className="py-3 px-4 text-center">Qty Change</th>
                <th className="py-3 px-4 text-center">Stock Level</th>
                <th className="py-3 px-4">Reason / Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {transactions.map(t => (
                <tr key={t._id} className="hover:bg-slate-50/80">
                  <td className="py-3 px-4 text-slate-500">
                    {new Date(t.createdAt).toLocaleString()}
                  </td>
                  <td className="py-3 px-4 font-bold text-slate-800">
                    {t.productId?.name}
                  </td>
                  <td className="py-3 px-4 text-center uppercase text-[10px] font-bold">
                    <span className="px-2 py-0.5 bg-slate-100 rounded-md text-slate-700">
                      {t.type.replace('_', ' ')}
                    </span>
                  </td>
                  <td className={`py-3 px-4 text-center font-extrabold ${t.quantity > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {t.quantity > 0 ? `+${t.quantity}` : t.quantity}
                  </td>
                  <td className="py-3 px-4 text-center text-slate-600 font-bold">
                    {t.previousStock} → {t.newStock}
                  </td>
                  <td className="py-3 px-4 text-slate-500 italic">
                    {t.reason || 'No details'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* CREATE / EDIT PRODUCT MODAL */}
      <Modal isOpen={isProductModalOpen} onClose={() => setIsProductModalOpen(false)} title={editingProduct ? 'Edit Product' : 'Add New Inventory Product'}>
        <form onSubmit={handleSaveProduct} className="space-y-4">
          {modalError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{modalError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Product Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Argan Hair Serum (100ml)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white rounded-lg border border-slate-200"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Selling Price (₹) *</label>
              <input
                type="number"
                required
                value={sellingPrice}
                onChange={(e) => setSellingPrice(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white rounded-lg border border-slate-200 font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Cost Price (₹)</label>
              <input
                type="number"
                value={costPrice}
                onChange={(e) => setCostPrice(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white rounded-lg border border-slate-200"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Current Stock *</label>
              <input
                type="number"
                required
                value={currentStock}
                onChange={(e) => setCurrentStock(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white rounded-lg border border-slate-200 font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Min Threshold</label>
              <input
                type="number"
                value={minStock}
                onChange={(e) => setMinStock(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white rounded-lg border border-slate-200"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Unit</label>
              <input
                type="text"
                placeholder="pcs / ml / bottle"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white rounded-lg border border-slate-200"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
            <button type="button" onClick={() => setIsProductModalOpen(false)} className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl">Cancel</button>
            <button type="submit" disabled={modalLoading} className="px-5 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-200">Save Product</button>
          </div>
        </form>
      </Modal>

      {/* ADJUST STOCK MODAL */}
      <Modal isOpen={!!adjustingProduct} onClose={() => setAdjustingProduct(null)} title={`Stock Adjustment • ${adjustingProduct?.name}`}>
        <form onSubmit={handleAdjustStockSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Adjustment Type *</label>
            <select
              value={adjustType}
              onChange={(e) => setAdjustType(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white rounded-lg border border-slate-200"
            >
              <option value="stock_in">Stock In (+ Add Stock)</option>
              <option value="adjustment">Stock Deduction / Damage (- Remove Stock)</option>
              <option value="correction">Correction</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Quantity *</label>
            <input
              type="number"
              min="1"
              required
              value={adjustQty}
              onChange={(e) => setAdjustQty(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white rounded-lg border border-slate-200 font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Reason / Notes</label>
            <input
              type="text"
              placeholder="e.g. New shipment / Damaged bottle / Correction"
              value={adjustReason}
              onChange={(e) => setAdjustReason(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white rounded-lg border border-slate-200"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
            <button type="button" onClick={() => setAdjustingProduct(null)} className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl">Cancel</button>
            <button type="submit" disabled={modalLoading} className="px-5 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-200">Confirm Adjustment</button>
          </div>
        </form>
      </Modal>

    </div>
  );
}
