import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { pharmacistAPI } from '../../api/pharmacist.api';
import { FaChartBar, FaBox, FaClock, FaWarehouse, FaSync, FaFilter, FaDownload } from 'react-icons/fa';

const Reports = () => {
  const [activeTab, setActiveTab] = useState('sales');
  const [loading, setLoading] = useState(false);
  
  // Sales data
  const [sales, setSales] = useState([]);
  const [salesSummary, setSalesSummary] = useState(null);
  const [salesFilters, setSalesFilters] = useState({
    start_date: '',
    end_date: '',
    status: '',
    limit: 50
  });

  // Low stock data
  const [lowStockMedicines, setLowStockMedicines] = useState([]);
  const [lowStockThreshold, setLowStockThreshold] = useState(10);

  // Expiry data
  const [expiryMedicines, setExpiryMedicines] = useState([]);
  const [expiryDays, setExpiryDays] = useState(30);

  // Inventory summary
  const [inventorySummary, setInventorySummary] = useState(null);

  useEffect(() => {
    loadSalesData();
  }, [salesFilters]);

  const loadSalesData = async () => {
    try {
      setLoading(true);
      const response = await pharmacistAPI.getSales(salesFilters);
      if (response && response.success) {
        setSales(response.data || []);
        setSalesSummary(response.summary || null);
      }
    } catch (error) {
      console.error('Error loading sales:', error);
      if (error.response?.status === 404) {
        toast.error('Sales report feature requires backend deployment. Please deploy the latest backend changes.');
        setSales([]);
        setSalesSummary(null);
      } else {
        toast.error('Failed to load sales data');
      }
    } finally {
      setLoading(false);
    }
  };

  const loadLowStockReport = async () => {
    try {
      setLoading(true);
      const response = await pharmacistAPI.getLowStockReport(lowStockThreshold);
      if (response && response.success) {
        setLowStockMedicines(response.data || []);
      }
    } catch (error) {
      console.error('Error loading low stock report:', error);
      toast.error('Failed to load low stock report');
    } finally {
      setLoading(false);
    }
  };

  const loadExpiryReport = async () => {
    try {
      setLoading(true);
      const response = await pharmacistAPI.getExpiryReport(expiryDays);
      if (response && response.success) {
        setExpiryMedicines(response.data || []);
      }
    } catch (error) {
      console.error('Error loading expiry report:', error);
      toast.error('Failed to load expiry report');
    } finally {
      setLoading(false);
    }
  };

  const loadInventorySummary = async () => {
    try {
      setLoading(true);
      const response = await pharmacistAPI.getInventorySummary();
      if (response && response.success) {
        setInventorySummary(response.data);
      }
    } catch (error) {
      console.error('Error loading inventory summary:', error);
      toast.error('Failed to load inventory summary');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'low-stock' && lowStockMedicines.length === 0) {
      loadLowStockReport();
    } else if (tab === 'expiry' && expiryMedicines.length === 0) {
      loadExpiryReport();
    } else if (tab === 'inventory' && !inventorySummary) {
      loadInventorySummary();
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'pending_payment': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const renderSalesTab = () => (
    <div>
      <div className="mb-6 flex flex-wrap gap-4 items-center">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
          <input
            type="date"
            value={salesFilters.start_date}
            onChange={(e) => setSalesFilters({ ...salesFilters, start_date: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
          <input
            type="date"
            value={salesFilters.end_date}
            onChange={(e) => setSalesFilters({ ...salesFilters, end_date: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex-1 min-w-[150px]">
          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select
            value={salesFilters.status}
            onChange={(e) => setSalesFilters({ ...salesFilters, status: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Status</option>
            <option value="completed">Completed</option>
            <option value="pending_payment">Pending Payment</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        <button
          onClick={loadSalesData}
          disabled={loading}
          className="mt-6 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 flex items-center gap-2"
        >
          <FaSync /> {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {salesSummary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 rounded-lg p-4">
            <p className="text-sm text-gray-600">Total Sales</p>
            <p className="text-2xl font-bold text-blue-600">${salesSummary.total_sales?.toFixed(2) || '0.00'}</p>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <p className="text-sm text-gray-600">Total Transactions</p>
            <p className="text-2xl font-bold text-green-600">{salesSummary.total_count || 0}</p>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <p className="text-sm text-gray-600">Status Breakdown</p>
            <div className="mt-1 space-y-1">
              {Object.entries(salesSummary.status_counts || {}).map(([status, count]) => (
                <p key={status} className="text-sm">
                  <span className="capitalize">{status}:</span> {count}
                </p>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sale ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pharmacist</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                  Loading sales data...
                </td>
              </tr>
            ) : sales.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                  No sales found
                </td>
              </tr>
            ) : (
              sales.map((sale) => (
                <tr key={sale.sale_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    #{sale.sale_id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(sale.sale_date).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {sale.pharmacist_name || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {sale.item_count || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                    ${parseFloat(sale.total_amount).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(sale.status)}`}>
                      {sale.status?.replace('_', ' ') || 'Unknown'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                    {sale.payment_type || 'N/A'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderLowStockTab = () => (
    <div>
      <div className="mb-6 flex items-center gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Stock Threshold</label>
          <input
            type="number"
            value={lowStockThreshold}
            onChange={(e) => setLowStockThreshold(parseInt(e.target.value) || 10)}
            className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button
          onClick={loadLowStockReport}
          disabled={loading}
          className="mt-6 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 flex items-center gap-2"
        >
          <FaSync /> {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Medicine</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expiry Date</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                  Loading low stock report...
                </td>
              </tr>
            ) : lowStockMedicines.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                  No medicines with low stock
                </td>
              </tr>
            ) : (
              lowStockMedicines.map((medicine) => (
                <tr key={medicine.medicine_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {medicine.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {medicine.category_name || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      {medicine.quantity_in_stock}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${parseFloat(medicine.price).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {medicine.expiry_date ? new Date(medicine.expiry_date).toLocaleDateString() : 'N/A'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderExpiryTab = () => (
    <div>
      <div className="mb-6 flex items-center gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Days Until Expiry</label>
          <input
            type="number"
            value={expiryDays}
            onChange={(e) => setExpiryDays(parseInt(e.target.value) || 30)}
            className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button
          onClick={loadExpiryReport}
          disabled={loading}
          className="mt-6 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 flex items-center gap-2"
        >
          <FaSync /> {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Medicine</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expiry Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Days Left</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                  Loading expiry report...
                </td>
              </tr>
            ) : expiryMedicines.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                  No medicines expiring soon
                </td>
              </tr>
            ) : (
              expiryMedicines.map((medicine) => (
                <tr key={medicine.medicine_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {medicine.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {medicine.category_name || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {medicine.quantity_in_stock}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(medicine.expiry_date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      medicine.days_until_expiry <= 7 ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {medicine.days_until_expiry} days
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderInventoryTab = () => (
    <div>
      <button
        onClick={loadInventorySummary}
        disabled={loading}
        className="mb-6 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 flex items-center gap-2"
      >
        <FaSync /> {loading ? 'Loading...' : 'Refresh'}
      </button>

      {inventorySummary ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">Total Medicines</p>
              <p className="text-2xl font-bold text-blue-600">{inventorySummary.summary?.total_medicines || 0}</p>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">Total Quantity</p>
              <p className="text-2xl font-bold text-green-600">{inventorySummary.summary?.total_quantity || 0}</p>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">Total Value</p>
              <p className="text-2xl font-bold text-purple-600">${inventorySummary.summary?.total_value?.toFixed(2) || '0.00'}</p>
            </div>
            <div className="bg-yellow-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">Low Stock Items</p>
              <p className="text-2xl font-bold text-yellow-600">{inventorySummary.summary?.low_stock_count || 0}</p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Medicines by Category</h3>
            <div className="space-y-3">
              {inventorySummary.by_category?.map((cat) => (
                <div key={cat.category_name} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium">{cat.category_name}</span>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">{cat.medicine_count} medicines</p>
                    <p className="text-sm text-gray-500">{cat.total_quantity} units</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
          Click refresh to load inventory summary
        </div>
      )}
    </div>
  );

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
        <p className="text-gray-600 mt-2">View sales, inventory, and expiry reports</p>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            <button
              onClick={() => handleTabChange('sales')}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                activeTab === 'sales'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <FaChartBar /> Sales
            </button>
            <button
              onClick={() => handleTabChange('low-stock')}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                activeTab === 'low-stock'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <FaBox /> Low Stock
            </button>
            <button
              onClick={() => handleTabChange('expiry')}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                activeTab === 'expiry'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <FaClock /> Expiry
            </button>
            <button
              onClick={() => handleTabChange('inventory')}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                activeTab === 'inventory'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <FaWarehouse /> Inventory
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'sales' && renderSalesTab()}
          {activeTab === 'low-stock' && renderLowStockTab()}
          {activeTab === 'expiry' && renderExpiryTab()}
          {activeTab === 'inventory' && renderInventoryTab()}
        </div>
      </div>
    </div>
  );
};

export default Reports;
