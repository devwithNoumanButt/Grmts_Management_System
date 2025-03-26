'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Tag, Search, Filter } from 'lucide-react';

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

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  // Fetch products from Supabase
  const fetchProducts = async () => {
    const { data, error } = await supabase.from('products').select('*');
    if (error) {
      console.error('Error fetching products:', error);
    } else {
      setProducts(data || []);
    }
  };

  // Fetch categories from Supabase
  const fetchCategories = async () => {
    const { data, error } = await supabase.from('categories').select('id, name');
    if (error) {
      console.error('Error fetching categories:', error);
    } else {
      setCategories(data || []);
    }
  };

  // Filtered products based on search and category
  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.code.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = !selectedCategory || product.category_id === Number(selectedCategory);

    return matchesSearch && matchesCategory;
  });

  const formatCurrency = (amount: number) => `PKR ${amount.toLocaleString('en-PK')}`;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Product List</h1>

      {/* Search & Filter */}
      <div className="flex space-x-4 mb-6">
        {/* Search */}
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

        {/* Category Filter */}
        <div className="relative">
          <Filter className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent appearance-none"
          >
            <option value="">All Categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProducts.map((product) => (
          <div
            key={product.id}
            className={`p-4 rounded-lg transition-colors duration-200 cursor-pointer ${
              selectedProduct?.id === product.id
                ? 'bg-purple-100 border-2 border-purple-500'
                : 'bg-gray-50 hover:bg-purple-50'
            }`}
            onClick={() => setSelectedProduct(product)}
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
                <span className="font-semibold text-purple-600">{formatCurrency(product.price)}</span>
                <button className="px-3 py-1 text-sm bg-purple-100 text-purple-600 rounded-full hover:bg-purple-200 transition-colors duration-200">
                  Select
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Selected Product Details */}
      {selectedProduct && (
        <div className="mt-6 p-6 bg-white rounded-xl shadow-lg">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Selected Product</h2>
          <p>
            <strong>Name:</strong> {selectedProduct.name}
          </p>
          <p>
            <strong>Code:</strong> {selectedProduct.code}
          </p>
          <p>
            <strong>Category:</strong>{' '}
            {categories.find((cat) => cat.id === selectedProduct.category_id)?.name || 'Unknown'}
          </p>
          <p>
            <strong>Price:</strong> {formatCurrency(selectedProduct.price)}
          </p>
        </div>
      )}
    </div>
  );
}
