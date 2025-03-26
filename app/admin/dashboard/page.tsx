'use client';

import { useState } from 'react';
import { 
  BarChart3, 
  FolderPlus, 
  PackagePlus, 
  ShoppingCart, 
  ClipboardList,
  Sparkles,
  QrCode,
  ListFilter
} from 'lucide-react';

import Statistics from './components/Statistics';
import AddCategory from './components/AddCategory';
import AddProduct from './components/AddProduct';
import POS from './components/POS';
import OrderDetails from './components/OrderDetails';
import ProductList from './components/ProductList';
import BarcodeGenerator from './components/BarcodeGenerator';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('pos');
  
  const tabs = [
    { id: 'statistics', name: 'Statistics', icon: BarChart3 },
    { id: 'pos', name: 'POS', icon: ShoppingCart },
    { id: 'barcodes', name: 'Barcodes', icon: QrCode },
    { id: 'addCategory', name: 'Add Category', icon: FolderPlus },
    { id: 'addProduct', name: 'Add Product', icon: PackagePlus },
    { id: 'products', name: 'Products', icon: ListFilter },
    { id: 'orderDetails', name: 'Order Details', icon: ClipboardList },
  ];
  
  const renderContent = () => {
    switch (activeTab) {
      case 'statistics':
        return <Statistics />;
      case 'addCategory':
        return <AddCategory />;
      case 'addProduct':
        return <AddProduct />;
      case 'pos':
        return <POS />;
      case 'products':
        return <ProductList />;
      case 'barcodes':
        return <BarcodeGenerator />;
      case 'orderDetails':
        return <OrderDetails />;
      default:
        return <POS />;
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white text-black-600 shadow">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center">
            <Sparkles className="h-6 w-6 mr-2 text-purple-600" />
            <h1 className="text-4xl font-bold">Fashion Kids POS</h1>
          </div>
        </div>
      </header>
      
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-2">
          <div className="flex space-x-2 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center px-3 py-2 rounded-md transition-colors ${
                  activeTab === tab.id
                  ? 'bg-purple-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-purple-50'
                }`}
              >
                <tab.icon className="h-4 w-4 mr-2" />
                <span>{tab.name}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>
      
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {renderContent()}
      </main>
    </div>
  );
}