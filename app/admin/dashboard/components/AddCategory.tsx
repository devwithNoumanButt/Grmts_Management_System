'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function AddCategory() {
  const [categoryName, setCategoryName] = useState('');
  const [description, setDescription] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCategories(data.map((cat) => cat.name));
    } catch (error) {
      console.error('Error fetching categories:', error);
      alert('Failed to load categories. Please refresh the page.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!categoryName.trim() || !description.trim()) {
      alert('Please fill out all fields.');
      return;
    }

    try {
      setIsLoading(true);
      const { error } = await supabase
        .from('categories')
        .insert([{ 
          name: categoryName.trim(), 
          description: description.trim() 
        }]);

      if (error) throw error;
      
      alert('Category added successfully!');
      setCategoryName('');
      setDescription('');
      await fetchCategories();
    } catch (error) {
      console.error('Error adding category:', error);
      alert(error instanceof Error ? error.message : 'Failed to add category');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteCategory = async (category: string) => {
    if (!confirm(`Are you sure you want to delete "${category}"?`)) return;

    try {
      setIsLoading(true);
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('name', category);

      if (error) throw error;
      
      alert(`Category "${category}" deleted.`);
      await fetchCategories();
    } catch (error) {
      console.error('Error deleting category:', error);
      alert(`Failed to delete "${category}". It might be in use.`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Add New Category</h1>

      <div className="grid grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium mb-1">
            Category Name
          </label>
          <input
            type="text"
            value={categoryName}
            onChange={(e) => setCategoryName(e.target.value)}
            className="w-full p-2 border rounded-md"
            placeholder="Enter category name"
            disabled={isLoading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="w-full p-2 border rounded-md"
            placeholder="Enter category description"
            disabled={isLoading}
          />
        </div>
      </div>

      <button
        type="button"
        onClick={handleSubmit}
        disabled={isLoading}
        className={`w-full mt-6 text-white py-3 rounded-md transition-colors ${
          isLoading ? 'bg-gray-400' : 'bg-purple-600 hover:bg-purple-800'
        }`}
      >
        {isLoading ? 'Processing...' : 'Add Category'}
      </button>

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Existing Categories</h2>
        <div className="border rounded-md overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Category Name</th>
                <th className="px-4 py-2 text-right text-sm font-medium text-gray-500">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {categories.map((category) => (
                <tr key={category}>
                  <td className="px-4 py-3">{category}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleDeleteCategory(category)}
                      className="text-red-500 hover:text-red-700 disabled:text-gray-400"
                      disabled={isLoading}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {categories.length === 0 && !isLoading && (
                <tr>
                  <td colSpan={2} className="px-4 py-3 text-center text-gray-500">
                    No categories available
                  </td>
                </tr>
              )}
              {isLoading && (
                <tr>
                  <td colSpan={2} className="px-4 py-3 text-center text-gray-500">
                    Loading...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}