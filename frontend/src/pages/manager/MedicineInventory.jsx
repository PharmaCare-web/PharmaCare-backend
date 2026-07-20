import { useState, useEffect } from 'react';
import { managerAPI } from '../../api/manager.api';
import { referenceAPI } from '../../api/reference.api';

const MedicineInventory = () => {
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState(null);

  // Form states
  const [newMedicine, setNewMedicine] = useState({
    name: '',
    generic_name: '',
    category_id: '',
    type: '',
    manufacturer: '',
    price: '',
    quantity_in_stock: '',
    reorder_level: '',
    expiry_date: '',
    batch_number: '',
    barcode: '',
    description: ''
  });

  const [categories, setCategories] = useState([]);

  const [stockUpdate, setStockUpdate] = useState({
    quantity: '',
    action: 'add',
    notes: ''
  });

  useEffect(() => {
    fetchMedicines();
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await referenceAPI.getCategories();
      const categoryData = response.data || [];
      setCategories(Array.isArray(categoryData) ? categoryData : []);
    } catch (err) {
      console.error('Fetch categories error:', err);
      // Set default categories if API fails
      setCategories([
        { category_id: 1, category_name: 'Antibiotics' },
        { category_id: 2, category_name: 'Painkillers' },
        { category_id: 3, category_name: 'Vitamins' },
        { category_id: 4, category_name: 'Antacids' },
        { category_id: 5, category_name: 'Cough & Cold' }
      ]);
    }
  };

  const fetchMedicines = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await managerAPI.getAllMedicines();
      // Handle different response structures
      const medicineData = response.medicines || response.data?.medicines || response.data || [];
      setMedicines(Array.isArray(medicineData) ? medicineData : []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch medicines');
      console.error('Fetch medicines error:', err);
      setMedicines([]); // Ensure medicines is always an array
    } finally {
      setLoading(false);
    }
  };

  const handleAddMedicine = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      // Ensure category_id is a number and price is properly formatted
      const medicineData = {
        ...newMedicine,
        category_id: parseInt(newMedicine.category_id),
        price: parseFloat(newMedicine.price),
        quantity_in_stock: parseInt(newMedicine.quantity_in_stock) || 0,
        reorder_level: parseInt(newMedicine.reorder_level) || 0
      };

      await managerAPI.addMedicine(medicineData);
      setSuccess('Medicine added successfully');
      setShowAddModal(false);
      setNewMedicine({
        name: '',
        generic_name: '',
        category_id: '',
        type: '',
        manufacturer: '',
        price: '',
        quantity_in_stock: '',
        reorder_level: '',
        expiry_date: '',
        batch_number: '',
        barcode: '',
        description: ''
      });
      fetchMedicines();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add medicine');
    }
  };

  const handleUpdateStock = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      await managerAPI.updateMedicineStock(selectedMedicine.medicine_id, {
        quantity: parseInt(stockUpdate.quantity),
        action: stockUpdate.action,
        notes: stockUpdate.notes
      });
      setSuccess(`Stock ${stockUpdate.action === 'add' ? 'added' : 'removed'} successfully`);
      setShowStockModal(false);
      setStockUpdate({ quantity: '', action: 'add', notes: '' });
      setSelectedMedicine(null);
      fetchMedicines();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update stock');
    }
  };

  const handleRemoveMedicine = async (medicine_id) => {
    if (!confirm('Are you sure you want to remove this medicine?')) return;

    try {
      await managerAPI.removeMedicine(medicine_id);
      setSuccess('Medicine removed successfully');
      fetchMedicines();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to remove medicine');
    }
  };

  const handleExportMedicines = async () => {
    try {
      setError('');
      const response = await managerAPI.exportMedicines();
      
      // Create a download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `medicines-export-${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      setSuccess('Medicines exported successfully');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to export medicines');
    }
  };

  const openStockModal = (medicine) => {
    setSelectedMedicine(medicine);
    setShowStockModal(true);
  };

  // Filter medicines
  const filteredMedicines = Array.isArray(medicines) ? medicines.filter(med => {
    const matchesSearch = 
      med.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      med.generic_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      med.batch_number?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !filterCategory || med.category_id === parseInt(filterCategory);
    return matchesSearch && matchesCategory;
  }) : [];

  // Get unique categories - no longer needed since we fetch from backend
  // Kept for reference in case API fails
  const categoryOptions = categories.length > 0 ? categories : [];

  // Check stock status
  const getStockStatus = (medicine) => {
    if (medicine.quantity_in_stock === 0) return { text: 'Out of Stock', color: 'text-red-600 bg-red-100' };
    if (medicine.quantity_in_stock <= medicine.reorder_level) return { text: 'Low Stock', color: 'text-yellow-600 bg-yellow-100' };
    return { text: 'In Stock', color: 'text-green-600 bg-green-100' };
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Medicine Inventory</h1>
        <div className="flex gap-3">
          <button
            onClick={handleExportMedicines}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export CSV
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Medicine
          </button>
        </div>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          {success}
        </div>
      )}
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Search and Filter */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <input
              type="text"
              placeholder="Search by name, generic name, or batch number"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Category</label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Categories</option>
              {categoryOptions.map(cat => (
                <option key={cat.category_id} value={cat.category_id}>
                  {cat.category_name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Medicines Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading medicines...</p>
          </div>
        ) : filteredMedicines.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No medicines found. Add your first medicine to get started.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Generic Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unit Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expiry</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredMedicines.map((medicine) => {
                  const stockStatus = getStockStatus(medicine);
                  return (
                    <tr key={medicine.medicine_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{medicine.name}</div>
                        <div className="text-sm text-gray-500">Batch: {medicine.batch_number || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {medicine.generic_name || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {medicine.category_name || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{medicine.quantity_in_stock}</div>
                        <div className="text-xs text-gray-500">Reorder: {medicine.reorder_level || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        ${parseFloat(medicine.price).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${stockStatus.color}`}>
                          {stockStatus.text}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {medicine.expiry_date ? new Date(medicine.expiry_date).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => openStockModal(medicine)}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                        >
                          Update Stock
                        </button>
                        <button
                          onClick={() => handleRemoveMedicine(medicine.medicine_id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Medicine Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-900">Add New Medicine</h2>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleAddMedicine} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Medicine Name *</label>
                    <input
                      type="text"
                      required
                      value={newMedicine.name}
                      onChange={(e) => setNewMedicine({ ...newMedicine, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Generic Name</label>
                    <input
                      type="text"
                      value={newMedicine.generic_name}
                      onChange={(e) => setNewMedicine({ ...newMedicine, generic_name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                    <select
                      required
                      value={newMedicine.category_id}
                      onChange={(e) => setNewMedicine({ ...newMedicine, category_id: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Category</option>
                      {categoryOptions.map(cat => (
                        <option key={cat.category_id} value={cat.category_id}>
                          {cat.category_name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                    <input
                      type="text"
                      value={newMedicine.type}
                      onChange={(e) => setNewMedicine({ ...newMedicine, type: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., Tablet, Syrup"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Manufacturer</label>
                    <input
                      type="text"
                      value={newMedicine.manufacturer}
                      onChange={(e) => setNewMedicine({ ...newMedicine, manufacturer: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Unit Price *</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={newMedicine.price}
                      onChange={(e) => setNewMedicine({ ...newMedicine, price: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Quantity in Stock *</label>
                    <input
                      type="number"
                      required
                      value={newMedicine.quantity_in_stock}
                      onChange={(e) => setNewMedicine({ ...newMedicine, quantity_in_stock: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Reorder Level *</label>
                    <input
                      type="number"
                      required
                      value={newMedicine.reorder_level}
                      onChange={(e) => setNewMedicine({ ...newMedicine, reorder_level: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
                    <input
                      type="date"
                      value={newMedicine.expiry_date}
                      onChange={(e) => setNewMedicine({ ...newMedicine, expiry_date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Batch Number</label>
                    <input
                      type="text"
                      value={newMedicine.batch_number}
                      onChange={(e) => setNewMedicine({ ...newMedicine, batch_number: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Barcode</label>
                    <input
                      type="text"
                      value={newMedicine.barcode}
                      onChange={(e) => setNewMedicine({ ...newMedicine, barcode: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    rows="3"
                    value={newMedicine.description}
                    onChange={(e) => setNewMedicine({ ...newMedicine, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium"
                  >
                    Add Medicine
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Update Stock Modal */}
      {showStockModal && selectedMedicine && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-900">Update Stock</h2>
                <button
                  onClick={() => setShowStockModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600">Medicine</div>
                <div className="font-medium text-gray-900">{selectedMedicine.name}</div>
                <div className="text-sm text-gray-600 mt-1">Current Stock: {selectedMedicine.quantity_in_stock}</div>
              </div>

              <form onSubmit={handleUpdateStock} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Action *</label>
                  <select
                    value={stockUpdate.action}
                    onChange={(e) => setStockUpdate({ ...stockUpdate, action: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="add">Add Stock</option>
                    <option value="remove">Remove Stock</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quantity *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={stockUpdate.quantity}
                    onChange={(e) => setStockUpdate({ ...stockUpdate, quantity: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea
                    rows="2"
                    value={stockUpdate.notes}
                    onChange={(e) => setStockUpdate({ ...stockUpdate, notes: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Optional notes about this stock update"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium"
                  >
                    Update Stock
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowStockModal(false)}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MedicineInventory;
