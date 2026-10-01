import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { fetchAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import Modal from '../components/Modal';

import { Scissors, Plus, FolderPlus, Edit3, Trash2, Check, AlertCircle } from 'lucide-react';

export default function ServicesPage() {
  const { currentRole, t, business } = useAuth();
  const [categories, setCategories] = useState([]);
  const [services, setServices] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedCatId, setSelectedCatId] = useState('');

  // Modals
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [catName, setCatName] = useState('');
  const [catDesc, setCatDesc] = useState('');
  const [catRebooking, setCatRebooking] = useState(30);

  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [price, setPrice] = useState('');
  const [duration, setDuration] = useState('45');
  const [description, setDescription] = useState('');
  const [assignedStaffIds, setAssignedStaffIds] = useState([]);

  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [cats, svs, stf] = await Promise.all([
        fetchAPI('/services/categories'),
        fetchAPI('/services'),
        fetchAPI('/staff?activeOnly=true')
      ]);
      setCategories(cats);
      setServices(svs);
      setStaffList(stf);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    setModalError('');
    setModalLoading(true);
    try {
      await fetchAPI('/services/categories', {
        method: 'POST',
        body: { name: catName, description: catDesc, rebookingDaysInterval: Number(catRebooking) }
      });
      setIsCatModalOpen(false);
      setCatName('');
      setCatDesc('');
      loadData();
    } catch (err) {
      setModalError(err.message);
    } finally {
      setModalLoading(false);
    }
  };

  const handleOpenServiceModal = (sv = null) => {
    setModalError('');
    if (sv) {
      setEditingService(sv);
      setName(sv.name);
      setCategoryId(sv.categoryId?._id || sv.categoryId);
      setPrice(sv.price);
      setDuration(sv.duration);
      setDescription(sv.description || '');
      setAssignedStaffIds(sv.assignedStaffIds?.map(s => s._id || s) || []);
    } else {
      setEditingService(null);
      setName('');
      setCategoryId(categories[0]?._id || '');
      setPrice('');
      setDuration('45');
      setDescription('');
      setAssignedStaffIds([]);
    }
    setIsServiceModalOpen(true);
  };

  const handleSaveService = async (e) => {
    e.preventDefault();
    setModalError('');
    setModalLoading(true);
    try {
      const body = {
        categoryId,
        name,
        description,
        price: Number(price),
        duration: Number(duration),
        assignedStaffIds
      };

      if (editingService) {
        await fetchAPI(`/services/${editingService._id}`, {
          method: 'PUT',
          body
        });
      } else {
        await fetchAPI('/services', {
          method: 'POST',
          body
        });
      }

      setIsServiceModalOpen(false);
      loadData();
    } catch (err) {
      setModalError(err.message);
    } finally {
      setModalLoading(false);
    }
  };

  const handleToggleActive = async (id) => {
    try {
      await fetchAPI(`/services/${id}`, { method: 'DELETE' });
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const filteredServices = selectedCatId
    ? services.filter(s => (s.categoryId?._id || s.categoryId) === selectedCatId)
    : services;

  const currency = business?.currency || 'INR ₹';

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
            {t('service', 'Services')} & Categories Management
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Configure unlimited business services, pricing, durations, and team mappings
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsCatModalOpen(true)}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-all border border-slate-200 flex items-center space-x-1"
          >
            <FolderPlus className="w-4 h-4" />
            <span>New Category</span>
          </button>

          <button
            onClick={() => handleOpenServiceModal()}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-200 flex items-center space-x-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Add Service</span>
          </button>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-2">
        <button
          onClick={() => setSelectedCatId('')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap border ${
            selectedCatId === ''
              ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
          }`}
        >
          All Categories ({services.length})
        </button>

        {categories.map(c => (
          <button
            key={c._id}
            onClick={() => setSelectedCatId(c._id)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap border ${
              selectedCatId === c._id
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>

      {/* Services Table */}
      {loading ? (
        <LoadingSpinner text="Loading business services catalog..." />
      ) : filteredServices.length === 0 ? (
        <EmptyState
          title="No Services Found"
          description="Create your business services and assign prices and durations."
          action={
            <button onClick={() => handleOpenServiceModal()} className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-xl text-xs">
              Add First Service
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredServices.map(sv => (
            <div
              key={sv._id}
              className={`p-5 rounded-2xl bg-white border transition-all space-y-3 flex flex-col justify-between ${
                sv.isActive ? 'border-slate-200/80 shadow-xs' : 'border-slate-200 bg-slate-50/70 opacity-60'
              }`}
            >
              <div>
                <div className="flex justify-between items-start">
                  <div>
                    <span className="px-2 py-0.5 text-[10px] font-bold bg-indigo-50 text-indigo-700 rounded-md border border-indigo-200/50">
                      {sv.categoryId?.name || 'General'}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 mt-1.5">{sv.name}</h3>
                  </div>

                  <span className="text-base font-extrabold text-indigo-700">
                    {currency} {sv.price}
                  </span>
                </div>

                {sv.description && (
                  <p className="text-xs text-slate-500 mt-2 line-clamp-2">{sv.description}</p>
                )}

                <div className="mt-3 text-xs text-slate-500 flex items-center justify-between pt-2 border-t border-slate-100">
                  <span>Duration: <strong className="text-slate-800">{sv.duration} mins</strong></span>
                  <span>Assigned: <strong className="text-slate-800">{sv.assignedStaffIds?.length || 0} staff</strong></span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <button
                  onClick={() => handleToggleActive(sv._id)}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border transition-all ${
                    sv.isActive
                      ? 'bg-slate-100 text-slate-600 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  }`}
                >
                  {sv.isActive ? 'Deactivate' : 'Activate'}
                </button>

                <button
                  onClick={() => handleOpenServiceModal(sv)}
                  className="px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-lg text-xs flex items-center space-x-1"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Service</span>
                </button>
              </div>

            </div>
          ))}
        </div>
      )}

      {/* CREATE CATEGORY MODAL */}
      <Modal isOpen={isCatModalOpen} onClose={() => setIsCatModalOpen(false)} title="Create Service Category">
        <form onSubmit={handleCreateCategory} className="space-y-4">
          {modalError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{modalError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Category Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Skin Care / Spa Treatments / Hair Styling"
              value={catName}
              onChange={(e) => setCatName(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white rounded-lg border border-slate-200"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Default Rebooking Reminder Cycle (Days)</label>
            <input
              type="number"
              value={catRebooking}
              onChange={(e) => setCatRebooking(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white rounded-lg border border-slate-200"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
            <button type="button" onClick={() => setIsCatModalOpen(false)} className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl">Cancel</button>
            <button type="submit" disabled={modalLoading} className="px-5 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-200">Save Category</button>
          </div>
        </form>
      </Modal>

      {/* CREATE / EDIT SERVICE MODAL */}
      <Modal isOpen={isServiceModalOpen} onClose={() => setIsServiceModalOpen(false)} title={editingService ? 'Edit Service' : 'Add New Service'} maxWidth="max-w-xl">
        <form onSubmit={handleSaveService} className="space-y-4">
          {modalError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{modalError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Category *</label>
            <select
              required
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white rounded-lg border border-slate-200"
            >
              <option value="">-- Choose Category --</option>
              {categories.map(c => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Service Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Hydra-Glow Facial"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white rounded-lg border border-slate-200"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Price (₹) *</label>
              <input
                type="number"
                required
                placeholder="850"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white rounded-lg border border-slate-200 font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Duration (Minutes) *</label>
              <input
                type="number"
                required
                placeholder="45"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white rounded-lg border border-slate-200"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Assign {t('staff', 'Staff')} Members</label>
            <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto p-2 bg-slate-50 rounded-xl border border-slate-200">
              {staffList.map(st => {
                const isAssigned = assignedStaffIds.includes(st._id);
                return (
                  <button
                    type="button"
                    key={st._id}
                    onClick={() => {
                      if (isAssigned) {
                        setAssignedStaffIds(assignedStaffIds.filter(id => id !== st._id));
                      } else {
                        setAssignedStaffIds([...assignedStaffIds, st._id]);
                      }
                    }}
                    className={`p-2 rounded-lg text-left text-xs font-semibold border transition-all flex items-center justify-between ${
                      isAssigned ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-700 border-slate-200'
                    }`}
                  >
                    <span>{st.name}</span>
                    {isAssigned && <Check className="w-3.5 h-3.5" />}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
            <button type="button" onClick={() => setIsServiceModalOpen(false)} className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl">Cancel</button>
            <button type="submit" disabled={modalLoading} className="px-5 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-200">Save Service</button>
          </div>
        </form>
      </Modal>

    </div>
  );
}
