import { useState, useEffect, useCallback } from 'react';
import { pharmacistAPI } from '../../api/pharmacist.api';
import { referenceAPI } from '../../api/reference.api';
import { toast } from 'react-toastify';
import { FiSearch, FiPlus, FiEdit2, FiTrash2, FiPackage, FiAlertTriangle, FiX, FiFilter } from 'react-icons/fi';

const BLUE = '#4A90D9';

// ── Stock badge ───────────────────────────────────────────────────────────────
const StockBadge = ({ qty, reorder = 10 }) => {
  if (qty === 0)    return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-600">Out of Stock</span>;
  if (qty <= reorder) return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-600">Low Stock</span>;
  return               <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-600">In Stock</span>;
};

// ── Input helper ─────────────────────────────────────────────────────────────
const Field = ({ label, required, children }) => (
  <div>
    <label className="block text-xs font-medium text-gray-500 mb-1">{label}{required && <span className="text-red-400 ml-0.5">*</span>}</label>
    {children}
  </div>
);

const inputCls = "w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 outline-none transition focus:border-blue-400 focus:bg-white";

// ── Modal wrapper ─────────────────────────────────────────────────────────────
const Modal = ({ title, onClose, children }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.4)' }}>
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <h2 className="text-base font-bold text-gray-800">{title}</h2>
        <button onClick={onClose} className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition">
          <FiX className="w-5 h-5" />
        </button>
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  </div>
);

// ── Main component ────────────────────────────────────────────────────────────
const MedicineSearch = () => {
  const [medicines, setMedicines]       = useState([]);
  const [categories, setCategories]     = useState([]);
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState('');
  const [filterCat, setFilterCat]       = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showAdd, setShowAdd]           = useState(false);
  const [showStock, setShowStock]       = useState(false);
  const [selected, setSelected]         = useState(null);

  const emptyForm = {
    name: '', category_id: '', type: '', manufacturer: '',
    price: '', quantity_in_stock: '', expiry_date: '', barcode: '', description: ''
  };
  const [form, setForm]           = useState(emptyForm);
  const [stockForm, setStockForm] = useState({ quantity: '', action: 'add', notes: '' });

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchMedicines = useCallback(async () => {
    setLoading(true);
    try {
      const res = await pharmacistAPI.getAllMedicines();
      const data = res?.medicines || res?.data?.medicines || res?.data || res || [];
      setMedicines(Array.isArray(data) ? data : []);
    } catch {
      toast.error('Failed to load medicines');
      setMedicines([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await referenceAPI.getCategories();
      const data = res?.data || res || [];
      setCategories(Array.isArray(data) ? data : []);
    } catch {
      setCategories([
        { category_id: 1, category_name: 'Antibiotics' },
        { category_id: 2, category_name: 'Painkillers' },
        { category_id: 3, category_name: 'Vitamins' },
        { category_id: 4, category_name: 'Antacids' },
        { category_id: 5, category_name: 'Cough & Cold' },
      ]);
    }
  }, []);

  useEffect(() => {
    fetchMedicines();
    fetchCategories();
  }, [fetchMedicines, fetchCategories]);

  // ── Add medicine ───────────────────────────────────────────────────────────
  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      await pharmacistAPI.addMedicine({
        ...form,
        category_id: parseInt(form.category_id),
        price: parseFloat(form.price),
        quantity_in_stock: parseInt(form.quantity_in_stock) || 0,
      });
      toast.success('Medicine added successfully');
      setShowAdd(false);
      setForm(emptyForm);
      fetchMedicines();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to add medicine');
    }
  };

  // ── Update stock ───────────────────────────────────────────────────────────
  const handleStockUpdate = async (e) => {
    e.preventDefault();
    try {
      await pharmacistAPI.updateMedicineStock(selected.medicine_id, {
        quantity_change: parseInt(stockForm.quantity),
        action: stockForm.action,
        notes: stockForm.notes,
      });
      toast.success(`Stock ${stockForm.action === 'add' ? 'added' : 'removed'} successfully`);
      setShowStock(false);
      setStockForm({ quantity: '', action: 'add', notes: '' });
      setSelected(null);
      fetchMedicines();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to update stock');
    }
  };

  // ── Remove medicine ────────────────────────────────────────────────────────
  const handleRemove = async (id) => {
    if (!window.confirm('Remove this medicine? This cannot be undone.')) return;
    try {
      await pharmacistAPI.removeMedicine(id);
      toast.success('Medicine removed');
      fetchMedicines();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to remove medicine');
    }
  };

  // ── Filter ─────────────────────────────────────────────────────────────────
  const filtered = medicines.filter(m => {
    const q = search.toLowerCase();
    const matchSearch = !q || m.name?.toLowerCase().includes(q) || m.manufacturer?.toLowerCase().includes(q) || m.barcode?.includes(q);
    const matchCat    = !filterCat || String(m.category_id) === filterCat;
    const matchStatus = !filterStatus ||
      (filterStatus === 'in_stock'   && m.quantity_in_stock > 10) ||
      (filterStatus === 'low_stock'  && m.quantity_in_stock > 0 && m.quantity_in_stock <= 10) ||
      (filterStatus === 'out_stock'  && m.quantity_in_stock === 0);
    return matchSearch && matchCat && matchStatus;
  });

  // ── Summary counts ─────────────────────────────────────────────────────────
  const total   = medicines.length;
  const inStock = medicines.filter(m => m.quantity_in_stock > 10).length;
  const lowStock = medicines.filter(m => m.quantity_in_stock > 0 && m.quantity_in_stock <= 10).length;
  const outStock = medicines.filter(m => m.quantity_in_stock === 0).length;

  return (
    <div className="space-y-5">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Medicine Inventory</h1>
          <p className="text-sm text-gray-400 mt-0.5">Search, manage and update medicine stock</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold shadow transition hover:opacity-90 active:scale-95"
          style={{ background: `linear-gradient(135deg, ${BLUE}, #2d6fad)` }}
        >
          <FiPlus className="w-4 h-4" />
          Add Medicine
        </button>
      </div>

      {/* ── Summary mini-cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Medicines', value: total,    color: BLUE,      bg: '#eff6ff' },
          { label: 'In Stock',        value: inStock,  color: '#22c55e', bg: '#f0fdf4' },
          { label: 'Low Stock',       value: lowStock, color: '#f59e0b', bg: '#fffbeb' },
          { label: 'Out of Stock',    value: outStock, color: '#ef4444', bg: '#fef2f2' },
        ].map(c => (
          <div key={c.label} className="bg-white rounded-xl px-5 py-4 shadow-sm border border-gray-100 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: c.bg }}>
              <FiPackage style={{ color: c.color }} className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-800">{c.value}</p>
              <p className="text-xs text-gray-400">{c.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Search & Filters ── */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 px-5 py-4">
        <div className="flex flex-wrap gap-3 items-end">
          {/* Search */}
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Search</label>
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Name, manufacturer, barcode..."
                className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 outline-none transition focus:border-blue-400 focus:bg-white"
              />
            </div>
          </div>
          {/* Category */}
          <div className="min-w-[160px]">
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Category</label>
            <select
              value={filterCat}
              onChange={e => setFilterCat(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 outline-none transition focus:border-blue-400 focus:bg-white"
            >
              <option value="">All Categories</option>
              {categories.map(c => (
                <option key={c.category_id} value={String(c.category_id)}>{c.category_name}</option>
              ))}
            </select>
          </div>
          {/* Status */}
          <div className="min-w-[140px]">
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Stock Status</label>
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 outline-none transition focus:border-blue-400 focus:bg-white"
            >
              <option value="">All Status</option>
              <option value="in_stock">In Stock</option>
              <option value="low_stock">Low Stock</option>
              <option value="out_stock">Out of Stock</option>
            </select>
          </div>
          {/* Clear */}
          {(search || filterCat || filterStatus) && (
            <button
              onClick={() => { setSearch(''); setFilterCat(''); setFilterStatus(''); }}
              className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
            >
              <FiX className="w-3.5 h-3.5" /> Clear
            </button>
          )}
        </div>
      </div>

      {/* ── Table ── */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-10 flex flex-col items-center gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: `${BLUE} transparent ${BLUE} ${BLUE}` }} />
            <p className="text-sm text-gray-400">Loading medicines...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 flex flex-col items-center gap-3 text-gray-400">
            <FiPackage className="w-10 h-10 opacity-40" />
            <p className="text-sm">No medicines found</p>
            {(search || filterCat || filterStatus) && (
              <button onClick={() => { setSearch(''); setFilterCat(''); setFilterStatus(''); }}
                className="text-xs underline" style={{ color: BLUE }}>
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {['Medicine', 'Category', 'Type', 'Stock', 'Price (ETB)', 'Expiry', 'Status', 'Actions'].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(med => {
                  const expiring = med.expiry_date && new Date(med.expiry_date) < new Date(Date.now() + 30 * 86400000);
                  return (
                    <tr key={med.medicine_id} className="hover:bg-blue-50/40 transition-colors">
                      <td className="px-5 py-3.5">
                        <p className="font-semibold text-gray-800">{med.name}</p>
                        {med.manufacturer && <p className="text-xs text-gray-400">{med.manufacturer}</p>}
                      </td>
                      <td className="px-5 py-3.5 text-gray-500">{med.category_name || '—'}</td>
                      <td className="px-5 py-3.5 text-gray-500">{med.type || '—'}</td>
                      <td className="px-5 py-3.5">
                        <span className="font-semibold text-gray-800">{med.quantity_in_stock}</span>
                        <span className="text-xs text-gray-400 ml-1">units</span>
                      </td>
                      <td className="px-5 py-3.5 font-medium text-gray-700">
                        {parseFloat(med.price).toFixed(2)}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`text-sm ${expiring ? 'text-red-500 font-medium' : 'text-gray-500'}`}>
                          {med.expiry_date ? new Date(med.expiry_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                        </span>
                        {expiring && <FiAlertTriangle className="inline w-3.5 h-3.5 text-red-400 ml-1" />}
                      </td>
                      <td className="px-5 py-3.5">
                        <StockBadge qty={med.quantity_in_stock} />
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => { setSelected(med); setShowStock(true); }}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition hover:opacity-90"
                            style={{ background: '#eff6ff', color: BLUE }}
                          >
                            <FiEdit2 className="w-3 h-3" /> Stock
                          </button>
                          <button
                            onClick={() => handleRemove(med.medicine_id)}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-red-50 text-red-500 hover:bg-red-100 transition"
                          >
                            <FiTrash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {/* Row count */}
            <div className="px-5 py-3 border-t border-gray-100 text-xs text-gray-400">
              Showing {filtered.length} of {total} medicines
            </div>
          </div>
        )}
      </div>

      {/* ── Add Medicine Modal ── */}
      {showAdd && (
        <Modal title="Add New Medicine" onClose={() => { setShowAdd(false); setForm(emptyForm); }}>
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Medicine Name" required>
                <input required type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className={inputCls} placeholder="e.g., Amoxicillin 500mg" />
              </Field>
              <Field label="Category" required>
                <select required value={form.category_id} onChange={e => setForm({...form, category_id: e.target.value})} className={inputCls}>
                  <option value="">Select category</option>
                  {categories.map(c => <option key={c.category_id} value={c.category_id}>{c.category_name}</option>)}
                </select>
              </Field>
              <Field label="Type">
                <input type="text" value={form.type} onChange={e => setForm({...form, type: e.target.value})} className={inputCls} placeholder="Tablet, Syrup, Capsule..." />
              </Field>
              <Field label="Manufacturer">
                <input type="text" value={form.manufacturer} onChange={e => setForm({...form, manufacturer: e.target.value})} className={inputCls} />
              </Field>
              <Field label="Unit Price (ETB)" required>
                <input required type="number" step="0.01" min="0" value={form.price} onChange={e => setForm({...form, price: e.target.value})} className={inputCls} />
              </Field>
              <Field label="Quantity in Stock" required>
                <input required type="number" min="0" value={form.quantity_in_stock} onChange={e => setForm({...form, quantity_in_stock: e.target.value})} className={inputCls} />
              </Field>
              <Field label="Expiry Date">
                <input type="date" value={form.expiry_date} onChange={e => setForm({...form, expiry_date: e.target.value})} className={inputCls} />
              </Field>
              <Field label="Barcode">
                <input type="text" value={form.barcode} onChange={e => setForm({...form, barcode: e.target.value})} className={inputCls} />
              </Field>
            </div>
            <Field label="Description">
              <textarea rows={2} value={form.description} onChange={e => setForm({...form, description: e.target.value})} className={inputCls} />
            </Field>
            <div className="flex gap-3 pt-2">
              <button type="submit" className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold transition hover:opacity-90"
                style={{ background: `linear-gradient(135deg, ${BLUE}, #2d6fad)` }}>
                Add Medicine
              </button>
              <button type="button" onClick={() => { setShowAdd(false); setForm(emptyForm); }}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition">
                Cancel
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── Update Stock Modal ── */}
      {showStock && selected && (
        <Modal title="Update Stock" onClose={() => { setShowStock(false); setSelected(null); }}>
          <div className="mb-4 p-4 rounded-xl border border-blue-100" style={{ background: '#eff6ff' }}>
            <p className="text-xs text-gray-500">Medicine</p>
            <p className="font-semibold text-gray-800">{selected.name}</p>
            <p className="text-sm text-gray-500 mt-1">Current stock: <span className="font-bold text-gray-800">{selected.quantity_in_stock} units</span></p>
          </div>
          <form onSubmit={handleStockUpdate} className="space-y-4">
            <Field label="Action">
              <select value={stockForm.action} onChange={e => setStockForm({...stockForm, action: e.target.value})} className={inputCls}>
                <option value="add">Add Stock</option>
                <option value="remove">Remove Stock</option>
              </select>
            </Field>
            <Field label="Quantity" required>
              <input required type="number" min="1" value={stockForm.quantity} onChange={e => setStockForm({...stockForm, quantity: e.target.value})} className={inputCls} />
            </Field>
            <Field label="Notes">
              <textarea rows={2} value={stockForm.notes} onChange={e => setStockForm({...stockForm, notes: e.target.value})} className={inputCls} placeholder="Optional reason for this update..." />
            </Field>
            <div className="flex gap-3 pt-2">
              <button type="submit" className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold transition hover:opacity-90"
                style={{ background: `linear-gradient(135deg, ${BLUE}, #2d6fad)` }}>
                Update Stock
              </button>
              <button type="button" onClick={() => { setShowStock(false); setSelected(null); }}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition">
                Cancel
              </button>
            </div>
          </form>
        </Modal>
      )}

    </div>
  );
};

export default MedicineSearch;
