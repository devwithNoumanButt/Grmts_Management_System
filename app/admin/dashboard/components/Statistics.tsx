'use client';
import React, { useState, useEffect } from 'react';
import { DollarSign, Package, Calendar } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { formatCurrency,formatDateTime } from '../../../../utils/format';
interface Order {
  id: number;
  total_amount: number;
  created_at: string;
  items: OrderItem[];
}

interface OrderItem {
  id: number;
  product_id: number;
  product_name: string;
  quantity: number;
  price: number;
}

interface Product {
  id: number;
  name: string;
}

const StatisticsPage = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch orders with their items
        const { data: ordersData, error: ordersError } = await supabase
          .from('orders')
          .select('*, items:order_items(*)');
        
        // Fetch products
        const { data: productsData, error: productsError } = await supabase
          .from('products')
          .select('id, name');

        if (ordersError || productsError) {
          throw new Error(ordersError?.message || productsError?.message);
        }

        setOrders(ordersData as Order[] || []);
        setProducts(productsData as Product[] || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Calculate sales metrics
  const calculateSales = (period: 'day' | 'month' | 'year') => {
    const now = new Date();
    return orders.reduce((total, order) => {
      const orderDate = new Date(order.created_at);
      
      const isValidPeriod = 
        period === 'day' ? 
          orderDate.getDate() === now.getDate() &&
          orderDate.getMonth() === now.getMonth() &&
          orderDate.getFullYear() === now.getFullYear() :
        period === 'month' ? 
          orderDate.getMonth() === now.getMonth() &&
          orderDate.getFullYear() === now.getFullYear() :
          orderDate.getFullYear() === now.getFullYear();

      return isValidPeriod ? total + order.total_amount : total;
    }, 0);
  };

  // Get recent sales items
  const recentSales = orders
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5)
    .flatMap(order => 
      order.items.map(item => ({
        ...item,
        orderTime: formatDateTime(order.created_at),
        orderId: order.id
      }))
    );

  // Calculate top selling product
  const productSales = orders.flatMap(order => order.items).reduce((acc, item) => {
    acc[item.product_id] = (acc[item.product_id] || 0) + item.quantity;
    return acc;
  }, {} as Record<number, number>);

  const [topProductId, topQuantity] = Object.entries(productSales).sort((a, b) => b[1] - a[1])[0] || [];
  const topProduct = products.find(p => p.id === Number(topProductId))?.name || 'N/A';

  // Calculate average order value
  const averageOrderValue = orders.length > 0 
    ? orders.reduce((sum, order) => sum + order.total_amount, 0) / orders.length
    : 0;

  if (loading) {
    return (
      <div className="p-6 text-center">
        <div className="animate-spin inline-block w-6 h-6 border-2 border-current border-t-transparent rounded-full" />
        <p className="mt-2">Loading statistics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center text-red-500">
        Error: {error}
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Dashboard Statistics</h1>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <StatCard
          title="Today's Sales"
          value={formatCurrency(calculateSales('day'))}
          icon={DollarSign}
          color="bg-green-500"
        />
        <StatCard
          title="Monthly Sales"
          value={formatCurrency(calculateSales('month'))}
          icon={Calendar}
          color="bg-blue-500"
        />
        <StatCard
          title="Yearly Sales"
          value={formatCurrency(calculateSales('year'))}
          icon={DollarSign}
          color="bg-purple-500"
        />
        <StatCard
          title="Total Products"
          value={products.length.toString()}
          icon={Package}
          color="bg-orange-500"
        />
      </div>

      {/* Recent Sales */}
      <div className="bg-white p-6 rounded-xl shadow-md">
        <h3 className="text-lg font-semibold mb-4">Recent Sales</h3>
        <div className="space-y-4">
          {recentSales.map((sale, index) => (
            <div 
              key={`${sale.orderId}-${sale.id}-${index}`} 
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <Package className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="font-medium">{sale.product_name}</p>
                  <p className="text-sm text-gray-500">{sale.orderTime}</p>
                </div>
              </div>
              <div className="text-right">
                <span className="font-semibold">{formatCurrency(sale.price)}</span>
                <p className="text-sm text-gray-500">Qty: {sale.quantity}</p>
              </div>
            </div>
          ))}
          {recentSales.length === 0 && (
            <p className="text-center text-gray-500 py-4">No recent sales</p>
          )}
        </div>
      </div>

      {/* Monthly Performance */}
      <div className="bg-white p-6 rounded-xl shadow-md mt-6">
        <h3 className="text-lg font-semibold mb-4">Monthly Performance</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-gray-500">Top Selling Product</p>
            <p className="font-semibold mt-1">{topProduct}</p>
            {topQuantity && (
              <p className="text-sm text-gray-500 mt-1">
                Sold: {topQuantity} units
              </p>
            )}
          </div>
          <div className="p-4 bg-green-50 rounded-lg">
            <p className="text-sm text-gray-500">Average Order Value</p>
            <p className="font-semibold mt-1">{formatCurrency(averageOrderValue)}</p>
            <p className="text-sm text-gray-500 mt-1">
              Based on {orders.length} orders
            </p>
          </div>
          <div className="p-4 bg-purple-50 rounded-lg">
            <p className="text-sm text-gray-500">Total Transactions</p>
            <p className="font-semibold mt-1">{orders.length}</p>
            <p className="text-sm text-gray-500 mt-1">
              {recentSales.length} today
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon: Icon, color }: { 
  title: string; 
  value: string; 
  icon: React.ComponentType<{ className: string }>; 
  color: string 
}) => (
  <div className="bg-white p-6 rounded-xl shadow-md transition-transform hover:scale-105">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-gray-500 text-sm">{title}</p>
        <p className="text-2xl font-bold mt-1">{value}</p>
      </div>
      <div className={`p-3 rounded-full ${color}`}>
        <Icon className="h-6 w-6 text-white" />
      </div>
    </div>
  </div>
);

export default StatisticsPage;
