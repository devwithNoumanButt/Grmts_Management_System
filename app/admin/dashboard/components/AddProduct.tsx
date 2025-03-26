'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function AddProduct() {
  const [productName, setProductName] = useState('');
  const [category, setCategory] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [barcode, setBarcode] = useState('');
  const [barcodes, setBarcodes] = useState<string[]>([]);
  const [isManualBarcode, setIsManualBarcode] = useState(false);
  const [price, setPrice] = useState<number | ''>('');
  const [stock, setStock] = useState<number | ''>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const initializeData = async () => {
      try {
        setIsLoading(true);
        await Promise.all([fetchCategories(), fetchBarcodes()]);
      } catch (err) {
        setError('Failed to initialize form data');
      } finally {
        setIsLoading(false);
      }
    };
    initializeData();
  }, []);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('name')
        .order('name', { ascending: true });

      if (error) throw error;
      setCategories(data.map((cat) => cat.name));
    } catch (err) {
      console.error('Error fetching categories:', err);
      setError('Failed to load categories');
    }
  };

  const fetchBarcodes = async () => {
    try {
      const { data, error } = await supabase
        .from('variants')
        .select('id')
        .order('id', { ascending: true });

      if (error) throw error;
      setBarcodes(data.map((variant) => variant.id));
    } catch (err) {
      console.error('Error fetching barcodes:', err);
      setError('Failed to load barcodes');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!productName.trim() || !category || !barcode.trim() || price === '' || stock === '') {
      setError('Please fill out all fields');
      return;
    }

    if (price < 0 || stock < 0) {
      setError('Price and stock must be positive numbers');
      return;
    }

    try {
      setIsLoading(true);

      // Get category ID
      const { data: categoryData, error: categoryError } = await supabase
        .from('categories')
        .select('id')
        .eq('name', category)
        .single();

      if (categoryError || !categoryData) throw new Error('Invalid category selected');

      // Check for duplicate barcode
      const { count } = await supabase
        .from('products')
        .select('*', { count: 'exact' })
        .eq('code', barcode.trim());

      if (count && count > 0) throw new Error('Barcode already exists');

      // Insert product
      const { error: insertError } = await supabase.from('products').insert([{
        name: productName.trim(),
        category_id: categoryData.id,
        code: barcode.trim(),
        price: Number(price),
        stock: Number(stock),
      }]);

      if (insertError) throw insertError;

      alert('Product added successfully!');
      resetForm();
      await Promise.all([fetchCategories(), fetchBarcodes()]);
    } catch (err) {
      console.error('Error adding product:', err);
      setError(err instanceof Error ? err.message : 'Failed to add product');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setProductName('');
    setCategory('');
    setBarcode('');
    setPrice('');
    setStock('');
    setIsManualBarcode(false);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Add New Product</h1>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-6">
        {/* Product Name */}
        <div>
          <label className="block text-sm font-medium mb-1">Product Name</label>
          <input
            type="text"
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            className="w-full p-2 border rounded-md disabled:bg-gray-100"
            placeholder="Enter product name"
            disabled={isLoading}
          />
        </div>

        {/* Category Dropdown */}
        <div>
          <label className="block text-sm font-medium mb-1">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full p-2 border rounded-md disabled:bg-gray-100"
            disabled={isLoading || categories.length === 0}
          >
            <option value="">{categories.length ? 'Select Category' : 'Loading categories...'}</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Barcode Selection */}
        <div>
          <label className="block text-sm font-medium mb-1">Product Code (Barcode)</label>
          {!isManualBarcode ? (
            <select
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              className="w-full p-2 border rounded-md disabled:bg-gray-100"
              disabled={isLoading || barcodes.length === 0}
            >
              <option value="">{barcodes.length ? 'Select Barcode' : 'Loading barcodes...'}</option>
              {barcodes.map((code) => (
                <option key={code} value={code}>
                  {code}
                </option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              className="w-full p-2 border rounded-md disabled:bg-gray-100"
              placeholder="Enter barcode manually"
              disabled={isLoading}
            />
          )}
          <button
            type="button"
            onClick={() => setIsManualBarcode(!isManualBarcode)}
            className="mt-2 text-blue-600 underline disabled:text-gray-400"
            disabled={isLoading}
          >
            {isManualBarcode ? 'Select from dropdown' : 'Enter manually'}
          </button>
        </div>

        {/* Price and Stock Inputs */}
        <div>
          <label className="block text-sm font-medium mb-1">Price (PKR)</label>
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.valueAsNumber || '')}
            min="0"
            className="w-full p-2 border rounded-md disabled:bg-gray-100"
            placeholder="Enter price"
            disabled={isLoading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Stock Quantity</label>
          <input
            type="number"
            value={stock}
            onChange={(e) => setStock(e.target.valueAsNumber || '')}
            min="0"
            className="w-full p-2 border rounded-md disabled:bg-gray-100"
            placeholder="Enter stock quantity"
            disabled={isLoading}
          />
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={isLoading}
        className={`w-full mt-6 text-white py-3 rounded-md transition-colors ${
          isLoading ? 'bg-gray-400' : 'bg-purple-600 hover:bg-purple-800'
        }`}
      >
        {isLoading ? 'Adding Product...' : 'Add Product'}
      </button>
    </div>
  );
}