'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Tag, Search, Filter, ShoppingCart, Trash2, Calculator, X } from 'lucide-react';

interface Product {
  id: number;
  name: string;
  price: number;
  code: string;
  category_id: number;
}

interface Category {
  id: number;
  name: string;
}

interface OrderItem extends Product {
  quantity: number;
  discount: number;
  subtotal: number;
  totalAfterDiscount: number;
  category?: string;
}

export default function POSSystemPage() {
  // Product and category data state
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  
  // Product selection state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  // Order form state
  const [quantity, setQuantity] = useState<string>('1');
  const [discount, setDiscount] = useState<string>('0');
  const [customerName, setCustomerName] = useState<string>('');
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  
  // Cart state
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  
  // Payment modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [tenderedAmount, setTenderedAmount] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchProducts = async () => {
    const { data, error } = await supabase.from('products').select('*');
    if (error) console.error('Error fetching products:', error);
    else setProducts(data || []);
  };

  const fetchCategories = async () => {
    const { data, error } = await supabase.from('categories').select('id, name');
    if (error) console.error('Error fetching categories:', error);
    else setCategories(data || []);
  };

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || product.category_id === Number(selectedCategory);
    return matchesSearch && matchesCategory;
  });

  const calculateTotals = (price: number, qty: number, disc: number) => {
    const subtotal = price * qty;
    const discountAmount = (subtotal * disc) / 100;
    return { subtotal, totalAfterDiscount: subtotal - discountAmount };
  };

  const totalAmount = orderItems.reduce((sum, item) => sum + item.totalAfterDiscount, 0);
  const change = Number(tenderedAmount) - totalAmount;

  const formatCurrency = (amount: number) => `PKR ${amount.toLocaleString('en-PK')}`;

  const handleSelectProduct = (product: Product) => {
    setSelectedProduct(product);
    setQuantity('1');
    setDiscount('0');
  };

  const handleAddItem = () => {
    if (!selectedProduct) return;

    const qty = Number(quantity);
    const disc = Number(discount);
    const { subtotal, totalAfterDiscount } = calculateTotals(selectedProduct.price, qty, disc);
    const category = categories.find(cat => cat.id === selectedProduct.category_id)?.name;

    const newItem: OrderItem = {
      ...selectedProduct,
      quantity: qty,
      discount: disc,
      subtotal,
      totalAfterDiscount,
      category
    };

    setOrderItems(prev => [...prev, newItem]);
    setSelectedProduct(null);
  };

  const removeItem = (index: number) => {
    setOrderItems(prev => prev.filter((_, i) => i !== index));
  };

  const saveOrderToDatabase = async () => {
    try {
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert([{
          customer_name: customerName || 'Cash Customer',
          phone_number: phoneNumber,
          total_amount: totalAmount,
          subtotal_amount: orderItems.reduce((sum, item) => sum + item.subtotal, 0),
          discount_amount: orderItems.reduce((sum, item) => sum + (item.subtotal - item.totalAfterDiscount), 0),
          tendered_amount: Number(tenderedAmount),
          change_amount: change,
          payment_status: 'completed'
        }])
        .select();

      if (orderError) throw orderError;

      const orderItemsToInsert = orderItems.map(item => ({
        order_id: orderData[0].id,
        product_id: item.id,
        product_name: item.name,
        price: item.price,
        quantity: item.quantity,
        discount_percentage: item.discount,
        subtotal: item.subtotal,
        total_after_discount: item.totalAfterDiscount
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItemsToInsert);

      if (itemsError) throw itemsError;
      return true;
    } catch (error) {
      console.error('Error saving order:', error);
      return false;
    }
  };

  const handleSaveOrder = async () => {
    if (phoneNumber && !/^[0-9+\- ]+$/.test(phoneNumber)) {
      setErrorMessage('Invalid phone number format');
      return;
    }

    if (Number(tenderedAmount) < totalAmount) {
      setErrorMessage('Tendered amount must be greater than or equal to total amount');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    
    try {
      const success = await saveOrderToDatabase();
      if (success) {
        setOrderItems([]);
        setCustomerName('');
        setPhoneNumber('');
        setTenderedAmount('');
        setShowPaymentModal(false);
        setSuccessMessage('Order completed successfully!');
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    } catch{
      setErrorMessage('Failed to save order. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Point of Sale System</h1>
      
      {successMessage && (
        <div className="fixed top-4 right-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded z-50">
          {successMessage}
        </div>
      )}

      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">Complete Payment</h3>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="text-gray-500 hover:text-gray-700"
                disabled={isLoading}
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {errorMessage && (
              <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                {errorMessage}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payable Amount
                </label>
                <input
                  type="text"
                  value={formatCurrency(totalAmount)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                  disabled
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tendered Amount
                </label>
                <input
                  type="number"
                  value={tenderedAmount}
                  onChange={(e) => setTenderedAmount(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  min={totalAmount}
                  step="1"
                  disabled={isLoading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Change
                </label>
                <input
                  type="text"
                  value={change > 0 ? formatCurrency(change) : formatCurrency(0)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                  disabled
                />
              </div>

              <div className="flex space-x-4 mt-6">
                <button
                  onClick={handleSaveOrder}
                  disabled={Number(tenderedAmount) < totalAmount || isLoading}
                  className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {isLoading ? 'Processing...' : (
                    <>
                      <Calculator className="h-5 w-5" />
                      <span>Complete Order</span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors duration-200"
                  disabled={isLoading}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Product Selection */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-2">
                <Tag className="h-6 w-6 text-purple-600" />
                <h2 className="text-xl font-bold text-gray-800">Products</h2>
              </div>
              <div className="flex space-x-4">
                <div className="relative">
                  <Search className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <div className="relative">
                  <Filter className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent appearance-none"
                  >
                    <option value="">All Categories</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>{category.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  className={`p-4 rounded-lg transition-colors duration-200 cursor-pointer ${
                    selectedProduct?.id === product.id 
                      ? 'bg-purple-100 border-2 border-purple-500' 
                      : 'bg-gray-50 hover:bg-purple-50'
                  }`}
                  onClick={() => handleSelectProduct(product)}
                >
                  <div className="space-y-2">
                    <h3 className="font-medium text-gray-900">{product.name}</h3>
                    <div className="flex justify-between text-sm text-gray-500">
                      <span>Code: {product.code}</span>
                      <span>
                        {categories.find((cat) => cat.id === product.category_id)?.name || 'Unknown'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                      <span className="font-semibold text-purple-600">
                        {formatCurrency(product.price)}
                      </span>
                      <button
                        className="px-3 py-1 text-sm bg-purple-100 text-purple-600 rounded-full hover:bg-purple-200 transition-colors duration-200"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectProduct(product);
                        }}
                      >
                        Select
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Selected Product Form */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <div className="flex items-center space-x-2 mb-4">
              <ShoppingCart className="h-6 w-6 text-purple-600" />
              <h2 className="text-xl font-bold text-gray-800">Add to Cart</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Selected Product</label>
                <input
                  type="text"
                  value={selectedProduct ? selectedProduct.name : ''}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                  disabled
                  placeholder="No product selected"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Price</label>
                <input
                  type="text"
                  value={selectedProduct ? formatCurrency(selectedProduct.price) : ''}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                  disabled
                  placeholder="PKR 0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Product Code</label>
                <input
                  type="text"
                  value={selectedProduct ? selectedProduct.code : ''}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                  disabled
                  placeholder="N/A"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  min="1"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Discount (%)</label>
                <input
                  type="number"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                  min="0"
                  max="100"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>

            <button
              onClick={handleAddItem}
              disabled={!selectedProduct}
              className={`w-full py-3 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2 ${
                selectedProduct 
                  ? 'bg-purple-600 text-white hover:bg-purple-700' 
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              <ShoppingCart className="h-5 w-5" />
              <span>Add to Cart</span>
            </button>
          </div>

          {/* Order Items Table */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Order Items</h2>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left">Product</th>
                    <th className="px-4 py-2 text-right">Price</th>
                    <th className="px-4 py-2 text-right">Qty</th>
                    <th className="px-4 py-2 text-right">Discount</th>
                    <th className="px-4 py-2 text-right">Total</th>
                    <th className="px-4 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {orderItems.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                        No items added to the cart
                      </td>
                    </tr>
                  ) : (
                    orderItems.map((item, index) => (
                      <tr key={index} className="border-t">
                        <td className="px-4 py-2">{item.name}</td>
                        <td className="px-4 py-2 text-right">{formatCurrency(item.price)}</td>
                        <td className="px-4 py-2 text-right">{item.quantity}</td>
                        <td className="px-4 py-2 text-right">{item.discount}%</td>
                        <td className="px-4 py-2 text-right">{formatCurrency(item.totalAfterDiscount)}</td>
                        <td className="px-4 py-2 text-right">
                          <button
                            onClick={() => removeItem(index)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column - Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6 sticky top-6">
            <h2 className="text-xl font-bold text-gray-800 mb-6">Order Summary</h2>
            
            {/* Customer Information */}
            <div className="space-y-4 mb-6">
              <h3 className="font-medium text-gray-700">Customer Information</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Customer Name (Optional)
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Enter customer name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number (Optional)
                </label>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Enter phone number"
                />
              </div>
            </div>
            
            {/* Order Totals */}
            <div className="border-t border-b py-4 mb-6">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Items:</span>
                  <span>{orderItems.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal:</span>
                  <span>{formatCurrency(orderItems.reduce((sum, item) => sum + item.subtotal, 0))}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Discount:</span>
                  <span>-{formatCurrency(orderItems.reduce((sum, item) => sum + (item.subtotal - item.totalAfterDiscount), 0))}</span>
                </div>
              </div>
            </div>
            
            {/* Total Amount */}
            <div className="flex justify-between items-center mb-8">
              <span className="text-lg font-semibold">Total:</span>
              <span className="text-2xl font-bold text-purple-600">{formatCurrency(totalAmount)}</span>
            </div>

            {/* Complete Order Button */}
            <button
              onClick={() => {
                setShowPaymentModal(true);
                handleSaveOrder();
              }}
              disabled={orderItems.length === 0}
              className={`w-full py-3 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2 ${
                orderItems.length > 0 
                  ? 'bg-green-600 text-white hover:bg-green-700' 
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              <Calculator className="h-5 w-5" />
              <span>Complete Payment</span>
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}

