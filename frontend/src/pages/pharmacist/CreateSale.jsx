import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { pharmacistAPI } from '../../api/pharmacist.api';
import { FaSearch, FaCartPlus, FaTrash, FaPlus, FaMinus, FaReceipt, FaCreditCard, FaMoneyBillWave, FaMobileAlt } from 'react-icons/fa';

const CreateSale = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [medicines, setMedicines] = useState([]);
  const [filteredMedicines, setFilteredMedicines] = useState([]);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [completedSale, setCompletedSale] = useState(null);
  
  // Customer info
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  
  // Payment method
  const [paymentType, setPaymentType] = useState('cash');

  // Load medicines on component mount
  useEffect(() => {
    loadMedicines();
  }, []);

  // Filter medicines based on search query
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredMedicines(medicines);
    } else {
      const filtered = medicines.filter(med => 
        med.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        med.barcode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        med.category_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        med.manufacturer?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredMedicines(filtered);
    }
  }, [searchQuery, medicines]);

  const loadMedicines = async () => {
    try {
      setLoading(true);
      const response = await pharmacistAPI.getAllMedicines();
      console.log('Full API Response:', response);
      
      // Axios interceptor unwraps response.data, so response is already the data
      if (response && response.success) {
        const medicinesData = response.data || [];
        setMedicines(medicinesData);
        setFilteredMedicines(medicinesData);
        console.log('Medicines loaded successfully:', medicinesData.length, 'items');
        toast.success(`Loaded ${medicinesData.length} medicines`);
      } else {
        console.error('Unexpected response format:', response);
        toast.error('Unexpected response format from server');
      }
    } catch (error) {
      console.error('Error loading medicines:', error);
      console.error('Error details:', error.response?.data);
      toast.error(`Failed to load medicines: ${error.response?.data?.message || error.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (medicine) => {
    // Check if item already in cart
    const existingItem = cart.find(item => item.medicine_id === medicine.medicine_id);
    
    if (existingItem) {
      // Check if adding one more would exceed stock
      if (existingItem.quantity >= medicine.quantity_in_stock) {
        toast.error(`Cannot add more. Only ${medicine.quantity_in_stock} in stock.`);
        return;
      }
      // Update quantity
      setCart(cart.map(item => 
        item.medicine_id === medicine.medicine_id 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      // Add new item
      setCart([...cart, {
        medicine_id: medicine.medicine_id,
        name: medicine.name,
        price: medicine.price,
        quantity: 1,
        max_stock: medicine.quantity_in_stock,
        barcode: medicine.barcode
      }]);
    }
    toast.success(`Added ${medicine.name} to cart`);
  };

  const updateCartQuantity = (medicineId, newQuantity) => {
    const item = cart.find(item => item.medicine_id === medicineId);
    
    if (newQuantity <= 0) {
      removeFromCart(medicineId);
      return;
    }
    
    if (newQuantity > item.max_stock) {
      toast.error(`Cannot exceed available stock (${item.max_stock})`);
      return;
    }
    
    setCart(cart.map(item => 
      item.medicine_id === medicineId 
        ? { ...item, quantity: newQuantity }
        : item
    ));
  };

  const removeFromCart = (medicineId) => {
    setCart(cart.filter(item => item.medicine_id !== medicineId));
    toast.info('Item removed from cart');
  };

  const clearCart = () => {
    setCart([]);
    setCustomerName('');
    setCustomerPhone('');
    setPaymentType('cash');
    toast.info('Cart cleared');
  };

  const calculateTotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const handleSubmitSale = async () => {
    if (cart.length === 0) {
      toast.error('Cart is empty. Please add items.');
      return;
    }

    if (!paymentType) {
      toast.error('Please select a payment method.');
      return;
    }

    // Validate stock one more time before submission
    for (const item of cart) {
      if (item.quantity > item.max_stock) {
        toast.error(`Insufficient stock for ${item.name}. Available: ${item.max_stock}`);
        return;
      }
    }

    setSubmitting(true);

    try {
      const saleData = {
        items: cart.map(item => ({
          medicine_id: item.medicine_id,
          quantity: item.quantity
        })),
        payment_type: paymentType,
        customer_name: customerName || null,
        customer_phone: customerPhone || null
      };

      console.log('Submitting sale data:', saleData);
      const response = await pharmacistAPI.createSale(saleData);
      console.log('Sale response:', response);
      
      // Handle axios interceptor response structure
      if (response && response.success) {
        setCompletedSale(response.data);
        setShowReceipt(true);
        toast.success('Sale created successfully!');
        
        // Clear cart after successful sale
        setCart([]);
        setCustomerName('');
        setCustomerPhone('');
        setSearchQuery('');
        
        // Reload medicines to update stock
        loadMedicines();
      } else {
        console.error('Unexpected sale response format:', response);
        toast.error('Unexpected response from server');
      }
    } catch (error) {
      console.error('Error creating sale:', error);
      console.error('Error response:', error.response?.data);
      toast.error(error.response?.data?.message || error.message || 'Failed to create sale');
    } finally {
      setSubmitting(false);
    }
  };

  const printReceipt = () => {
    window.print();
  };

  const closeReceipt = () => {
    setShowReceipt(false);
    setCompletedSale(null);
  };

  if (showReceipt && completedSale) {
    return (
      <div className="min-h-screen bg-gray-100 p-6">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8" id="receipt">
            <div className="text-center border-b pb-4 mb-4">
              <h2 className="text-2xl font-bold text-gray-800">PharmaCare</h2>
              <p className="text-gray-600">Receipt</p>
              <p className="text-sm text-gray-500">Receipt #: {completedSale.receipt_number || `REC-${completedSale.sale?.sale_id?.toString().padStart(6, '0')}`}</p>
              <p className="text-sm text-gray-500">Date: {new Date(completedSale.sale?.sale_date).toLocaleString()}</p>
            </div>

            <div className="mb-4">
              <h3 className="font-semibold text-gray-700 mb-2">Sold By: {completedSale.sale?.pharmacist_name}</h3>
              {customerName && <p className="text-gray-600">Customer: {customerName}</p>}
              {customerPhone && <p className="text-gray-600">Phone: {customerPhone}</p>}
            </div>

            <table className="w-full mb-4">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Item</th>
                  <th className="text-center py-2">Qty</th>
                  <th className="text-right py-2">Price</th>
                  <th className="text-right py-2">Total</th>
                </tr>
              </thead>
              <tbody>
                {completedSale.items?.map((item, index) => (
                  <tr key={index} className="border-b">
                    <td className="py-2">{item.medicine_name}</td>
                    <td className="text-center py-2">{item.quantity}</td>
                    <td className="text-right py-2">${parseFloat(item.unit_price).toFixed(2)}</td>
                    <td className="text-right py-2">${parseFloat(item.subtotal).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="border-t pt-4">
              <div className="flex justify-between text-xl font-bold">
                <span>Total:</span>
                <span>${parseFloat(completedSale.sale?.total_amount).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600 mt-2">
                <span>Payment Method:</span>
                <span className="capitalize">{completedSale.sale?.payment_type || paymentType}</span>
              </div>
              <div className="flex justify-between text-gray-600 mt-2">
                <span>Status:</span>
                <span className="capitalize">{completedSale.status}</span>
              </div>
            </div>

            <div className="mt-6 text-center text-sm text-gray-500">
              <p>Thank you for choosing PharmaCare!</p>
              <p className="mt-2">Payment pending cashier approval</p>
            </div>
          </div>

          <div className="mt-6 flex gap-4 justify-center no-print">
            <button
              onClick={printReceipt}
              className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
            >
              <FaReceipt /> Print Receipt
            </button>
            <button
              onClick={closeReceipt}
              className="flex items-center gap-2 bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition"
            >
              New Sale
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Point of Sale</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Product Search and List */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow p-6">
              {/* Search Bar */}
              <div className="mb-6">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search medicines by name, barcode, or category..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                </div>
                <button
                  onClick={loadMedicines}
                  disabled={loading}
                  className="mt-2 text-sm text-blue-600 hover:text-blue-800 disabled:text-gray-400"
                >
                  {loading ? 'Loading...' : '🔄 Refresh medicines'}
                </button>
              </div>

              {/* Medicine List */}
              <div className="mb-4">
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading medicines...</p>
                  </div>
                ) : filteredMedicines.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>No medicines found</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[600px] overflow-y-auto">
                    {filteredMedicines.map((medicine) => (
                      <div
                        key={medicine.medicine_id}
                        className={`border rounded-lg p-4 hover:shadow-md transition ${
                          medicine.quantity_in_stock <= 0 
                            ? 'bg-gray-100 opacity-60' 
                            : medicine.quantity_in_stock <= 10 
                              ? 'border-yellow-400 bg-yellow-50' 
                              : 'border-gray-200'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-semibold text-gray-800">{medicine.name}</h3>
                          <span className={`px-2 py-1 rounded text-xs ${
                            medicine.quantity_in_stock <= 0 
                              ? 'bg-red-100 text-red-800' 
                              : medicine.quantity_in_stock <= 10 
                                ? 'bg-yellow-100 text-yellow-800' 
                                : 'bg-green-100 text-green-800'
                          }`}>
                            Stock: {medicine.quantity_in_stock}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-1">{medicine.category_name}</p>
                        {medicine.barcode && (
                          <p className="text-xs text-gray-500 mb-2">Barcode: {medicine.barcode}</p>
                        )}
                        <div className="flex justify-between items-center">
                          <span className="text-lg font-bold text-blue-600">
                            ${parseFloat(medicine.price).toFixed(2)}
                          </span>
                          <button
                            onClick={() => addToCart(medicine)}
                            disabled={medicine.quantity_in_stock <= 0}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition ${
                              medicine.quantity_in_stock <= 0
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                : 'bg-blue-600 text-white hover:bg-blue-700'
                            }`}
                          >
                            <FaCartPlus /> Add
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Cart */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6 sticky top-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <FaCartPlus /> Shopping Cart
              </h2>

              {/* Customer Info */}
              <div className="mb-4 space-y-3">
                <input
                  type="text"
                  placeholder="Customer Name (Optional)"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <input
                  type="text"
                  placeholder="Customer Phone (Optional)"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Payment Method Selection */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Method *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setPaymentType('cash')}
                    className={`flex flex-col items-center p-3 rounded-lg border-2 transition ${
                      paymentType === 'cash'
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <FaMoneyBillWave className="text-xl mb-1" />
                    <span className="text-xs">Cash</span>
                  </button>
                  <button
                    onClick={() => setPaymentType('card')}
                    className={`flex flex-col items-center p-3 rounded-lg border-2 transition ${
                      paymentType === 'card'
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <FaCreditCard className="text-xl mb-1" />
                    <span className="text-xs">Card</span>
                  </button>
                  <button
                    onClick={() => setPaymentType('mobile')}
                    className={`flex flex-col items-center p-3 rounded-lg border-2 transition ${
                      paymentType === 'mobile'
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <FaMobileAlt className="text-xl mb-1" />
                    <span className="text-xs">Mobile</span>
                  </button>
                </div>
              </div>

              {/* Cart Items */}
              <div className="mb-4 max-h-[300px] overflow-y-auto">
                {cart.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>Cart is empty</p>
                    <p className="text-sm">Add medicines to start a sale</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {cart.map((item) => (
                      <div key={item.medicine_id} className="border rounded-lg p-3 bg-gray-50">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium text-gray-800 text-sm">{item.name}</h4>
                          <button
                            onClick={() => removeFromCart(item.medicine_id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <FaTrash />
                          </button>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                          ${parseFloat(item.price).toFixed(2)} each
                        </p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => updateCartQuantity(item.medicine_id, item.quantity - 1)}
                              className="w-8 h-8 rounded bg-gray-200 hover:bg-gray-300 flex items-center justify-center"
                            >
                              <FaMinus className="text-xs" />
                            </button>
                            <span className="w-8 text-center font-medium">{item.quantity}</span>
                            <button
                              onClick={() => updateCartQuantity(item.medicine_id, item.quantity + 1)}
                              disabled={item.quantity >= item.max_stock}
                              className={`w-8 h-8 rounded flex items-center justify-center ${
                                item.quantity >= item.max_stock
                                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                  : 'bg-gray-200 hover:bg-gray-300'
                              }`}
                            >
                              <FaPlus className="text-xs" />
                            </button>
                          </div>
                          <span className="font-bold text-blue-600">
                            ${(item.price * item.quantity).toFixed(2)}
                          </span>
                        </div>
                        {item.quantity >= item.max_stock && (
                          <p className="text-xs text-yellow-600 mt-1">Max stock reached</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Total and Actions */}
              {cart.length > 0 && (
                <>
                  <div className="border-t pt-4 mb-4">
                    <div className="flex justify-between text-xl font-bold">
                      <span>Total:</span>
                      <span className="text-blue-600">${calculateTotal().toFixed(2)}</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      {cart.reduce((sum, item) => sum + item.quantity, 0)} items
                    </p>
                  </div>

                  <div className="space-y-2">
                    <button
                      onClick={handleSubmitSale}
                      disabled={submitting}
                      className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {submitting ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                          Processing...
                        </>
                      ) : (
                        <>
                          <FaReceipt /> Complete Sale
                        </>
                      )}
                    </button>
                    <button
                      onClick={clearCart}
                      className="w-full bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 transition"
                    >
                      Clear Cart
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateSale;
