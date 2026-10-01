import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { fetchAPI } from '../services/api';
import { Package, Plus, Trash2, AlertCircle, CheckCircle } from 'lucide-react';

export default function ServiceConsumptionModal({ isOpen, onClose, appointment, onSuccess }) {
  const [products, setProducts] = useState([]);
  const [selectedItems, setSelectedItems] = useState([{ productId: '', qty: 1 }]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadProducts();
    }
  }, [isOpen]);

  const loadProducts = async () => {
    try {
      const data = await fetchAPI('/inventory/products');
      setProducts(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddItem = () => {
    setSelectedItems([...selectedItems, { productId: '', qty: 1 }]);
  };

  const handleRemoveItem = (index) => {
    setSelectedItems(selectedItems.filter((_, i) => i !== index));
  };

  const handleItemChange = (index, field, value) => {
    const updated = [...selectedItems];
    updated[index][field] = value;
    setSelectedItems(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const validItems = selectedItems.filter(i => i.productId);
    if (!validItems.length) {
      setError('Please select at least one consumed product.');
      return;
    }

    setLoading(true);

    try {
      await fetchAPI(`/appointments/${appointment._id}/consume-products`, {
        method: 'POST',
        body: { items: validItems }
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

  if (!appointment) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Record Service Consumption • Appt ${appointment.appointmentNumber}`}>
      {done ? (
        <div className="text-center py-8 space-y-3">
          <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle className="w-6 h-6" />
          </div>
          <h4 className="text-lg font-bold text-slate-800">Consumption Recorded & Stock Updated!</h4>
          <p className="text-xs text-slate-500">Stock levels have been automatically updated in inventory history.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-xs">
            <p className="font-semibold text-slate-500">Service Delivered:</p>
            <p className="font-bold text-slate-800 text-sm">{appointment.serviceDetails?.name}</p>
            <p className="text-slate-600">Customer: {appointment.customerDetails?.name}</p>
          </div>

          <div className="space-y-3">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Consumed Products & Quantities
            </label>

            {selectedItems.map((item, index) => (
              <div key={index} className="flex items-center space-x-2">
                <select
                  required
                  value={item.productId}
                  onChange={(e) => handleItemChange(index, 'productId', e.target.value)}
                  className="flex-1 px-3 py-2 text-xs bg-white rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">-- Choose Consumed Product --</option>
                  {products.map(p => (
                    <option key={p._id} value={p._id}>
                      {p.name} (Available: {p.currentStock} {p.unit})
                    </option>
                  ))}
                </select>

                <input
                  type="number"
                  min="1"
                  required
                  value={item.qty}
                  onChange={(e) => handleItemChange(index, 'qty', e.target.value)}
                  className="w-20 px-3 py-2 text-xs bg-white rounded-lg border border-slate-200 text-center font-bold"
                />

                {selectedItems.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(index)}
                    className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}

            <button
              type="button"
              onClick={handleAddItem}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-indigo-700 text-xs font-semibold rounded-lg flex items-center space-x-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Another Consumed Product</span>
            </button>
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
              {loading ? 'Updating Stock...' : 'Save & Deduct Stock'}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}
