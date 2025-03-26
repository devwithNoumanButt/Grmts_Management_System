'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Search, Filter } from 'lucide-react'; // Removed Tag import

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeData = async () => {
      try {
        await Promise.all([fetchProducts(), fetchCategories()]);
      } catch {
        setError('Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    initializeData();
  }, []);

  const fetchProducts = async () => {
    const { data, error } = await supabase.from('products').select('*');
    if (error) throw new Error('Error fetching products');
    setProducts(data || []);
  };

  const fetchCategories = async () => {
    const { data, error } = await supabase.from('categories').select('id, name');
    if (error) throw new Error('Error fetching categories');
    setCategories(data || []);
  };

  const filteredProducts = products.filter((product) => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = 
      product.name.toLowerCase().includes(searchLower) ||
      product.code.toLowerCase().includes(searchLower);
    const matchesCategory = !selectedCategory || 
      product.category_id === Number(selectedCategory);
    return matchesSearch && matchesCategory;
  });

  const formatCurrency = (amount: number) => {
    try {
      return `PKR ${amount.toLocaleString('en-PK', { maximumFractionDigits: 2 })}`;
    } catch {
      return `PKR ${amount.toFixed(2)}`;
    }
  };

  if (loading) {
    return (
      <div className="p-6 max-w-6xl mx-auto text-center">
        <div className="animate-spin inline-block w-8 h-8 border-4 border-purple-500 rounded-full border-t-transparent" />
        <p className="mt-4 text-gray-600">Loading products...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-6xl mx-auto text-center text-red-600">
        {error} - Please refresh the page or check your connection
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Product List</h1>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <label htmlFor="search" className="sr-only">Search products</label>
          <Search className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            id="search"
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setSelectedProduct(null);
            }}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>

        <div className="relative flex-1">
          <label htmlFor="category" className="sr-only">Filter by category</label>
          <Filter className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <select
            id="category"
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setSelectedProduct(null);
            }}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent appearance-none"
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
          <article
            key={product.id}
            role="button"
            tabIndex={0}
            onClick={() => setSelectedProduct(product)}
            onKeyDown={(e) => e.key === 'Enter' && setSelectedProduct(product)}
            className={`p-4 rounded-lg transition-colors duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-500 ${
              selectedProduct?.id === product.id
                ? 'bg-purple-100 border-2 border-purple-500'
                : 'bg-gray-50 hover:bg-purple-50'
            }`}
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
                  aria-label={`Select ${product.name}`}
                >
                  Select
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>

      {/* Selected Product Details */}
      {selectedProduct && (
        <section 
          className="mt-6 p-6 bg-white rounded-xl shadow-lg relative"
          aria-labelledby="selected-product-heading"
        >
          <button
            onClick={() => setSelectedProduct(null)}
            className="absolute top-4 right-4 p-1 text-gray-500 hover:text-gray-700"
            aria-label="Close product details"
          >
            ×
          </button>
          <h2 id="selected-product-heading" className="text-xl font-bold text-gray-800 mb-4">
            Selected Product
          </h2>
          <dl className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <dt className="font-medium">Name</dt>
              <dd className="text-gray-600">{selectedProduct.name}</dd>
            </div>
            <div>
              <dt className="font-medium">Code</dt>
              <dd className="text-gray-600">{selectedProduct.code}</dd>
            </div>
            <div>
              <dt className="font-medium">Category</dt>
              <dd className="text-gray-600">
                {categories.find((cat) => cat.id === selectedProduct.category_id)?.name || 'Unknown'}
              </dd>
            </div>
            <div className="col-span-2">
              <dt className="font-medium">Price</dt>
              <dd className="text-purple-600 font-semibold">
                {formatCurrency(selectedProduct.price)}
              </dd>
            </div>
          </dl>
        </section>
      )}
    </div>
  );
}
