'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface Order {
  id: number;
  customer_name: string;
  phone_number: string;
  subtotal_amount: number;
  discount_amount: number;
  total_amount: number;
  tendered_amount: number;
  change_amount: number;
  payment_status: string;
  payment_method: string;
  created_at: string;
  updated_at: string;
  items: OrderItem[];
}

interface OrderItem {
  id: number;
  product_name: string;
  price: number;
  quantity: number;
  discount_percentage: number;
  subtotal: number;
  total_after_discount: number;
  created_at: string;
}

export default function OrdersList() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [printError, setPrintError] = useState<string | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*');

      if (ordersError) throw ordersError;

      const enrichedOrders = await Promise.all(
        ordersData.map(async (order) => {
          const { data: itemsData, error: itemsError } = await supabase
            .from('order_items')
            .select('*')
            .eq('order_id', order.id);

          return {
            ...order,
            items: itemsError ? [] : itemsData || []
          };
        })
      );

      setOrders(enrichedOrders);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = async (order: Order) => {
    try {
      setPrintError(null);
      
      if (typeof window === 'undefined') {
        throw new Error('Printing is only available in the browser');
      }

      const printTemplate = createPrintTemplate(order);
      const printWindow = window.open('about:blank', 'PrintWindow');
      
      if (!printWindow) {
        throw new Error('Popup blocked! Please allow popups for printing.');
      }
      
      setTimeout(() => {
        printWindow.document.write(printTemplate);
        printWindow.document.close();
        
        printWindow.onbeforeunload = () => {
          setPrintError('Printing was cancelled');
        };

        printWindow.onafterprint = () => {
          printWindow.close();
        };

        if (printWindow.print) {
          printWindow.print();
        } else {
          throw new Error('Print function not available');
        }
      }, 100);
    } catch (error) {
      handlePrintError(error);
    }
  };

  const createPrintTemplate = (order: Order) => {
    const isMobile = typeof window !== 'undefined' && 
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      );
    const paperWidth = isMobile ? '57mm' : '80mm';
    const baseFontSize = isMobile ? '10px' : '12px';

    return `
      <html>
        <head>
          <meta http-equiv="Content-Security-Policy" content="default-src 'self' 'unsafe-inline'">
          <title>Invoice #${order.id}</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            @media print {
              @page { margin: 0; size: auto; }
              body {
                font-family: 'Courier New', monospace;
                width: ${paperWidth};
                margin: 0 auto;
                padding: 2px;
                font-size: ${baseFontSize};
                line-height: 1.1;
                -webkit-print-color-adjust: exact;
              }
              table { width: 100%; border-collapse: collapse; }
              td, th { padding: 1px; white-space: nowrap; }
              .text-right { text-align: right; }
              .text-center { text-align: center; }
              .bordered { border-bottom: 1px solid #000; }
              .compact { margin: 2px 0; }
            }
            @media screen {
              body { background: white; padding: 10px; }
            }
          </style>
        </head>
        <body>
          <div class="text-center compact">
            <h2>FASHION ARENA</h2>
            <div class="compact">OPP. PRISMA MALL BASEMENT</div>
            <div class="compact">CANTT</div>
            <div class="compact">PH: 055-386577</div>
          </div>

          <div class="bordered compact">
            <div>INV#: ${order.id}</div>
            <div>DATE: ${new Date(order.created_at).toLocaleDateString()}</div>
            <div>CUSTOMER: ${order.customer_name || 'CASH CUSTOMER'}</div>
          </div>

          <table class="compact">
            <thead>
              <tr>
                <th>#</th>
                <th>QTY</th>
                <th class="text-right">RATE</th>
                <th class="text-right">AMT</th>
              </tr>
            </thead>
            <tbody>
              ${order.items.map((item, index) => `
                <tr>
                  <td>${index + 1}</td>
                  <td>${item.quantity}</td>
                  <td class="text-right">${item.price.toFixed(2)}</td>
                  <td class="text-right">${item.total_after_discount.toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="bordered compact">
            <div>TOTAL UNITS: ${order.items.reduce((sum, item) => sum + item.quantity, 0)}</div>
            <div>AMOUNT DUE: ${order.total_amount.toFixed(2)}</div>
            <div>CASH RECEIVED: ${order.tendered_amount.toFixed(2)}</div>
            <div>CHANGE: ${order.change_amount.toFixed(2)}</div>
          </div>

          <div class="text-center compact" style="margin-top:5px">
            THANK YOU FOR SHOPPING<br>
            ${order.payment_method ? `PAYMENT METHOD: ${order.payment_method.toUpperCase()}` : ''}
          </div>
        </body>
      </html>
    `;
  };

  const handlePrintError = (error: unknown) => {
    const errorMessage = error instanceof Error ? error.message : 'Failed to print receipt';
    setPrintError(errorMessage);
    setTimeout(() => setPrintError(null), 5000);
  };

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Orders</h1>
      
      {printError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {printError}
        </div>
      )}

      {loading ? (
        <div className="text-center p-4">
          <div className="animate-spin inline-block w-6 h-6 border-2 border-current border-t-transparent rounded-full" />
          <p className="mt-2">Loading orders...</p>
        </div>
      ) : orders.length === 0 ? (
        <p className="text-gray-500 p-4">No orders found</p>
      ) : (
        orders.slice().reverse().map((order) => (
          <div key={order.id} className="border rounded-lg p-3 mb-4 bg-white shadow-sm">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <h2 className="text-lg font-semibold">
                Order #{order.id}
                <span className="ml-2 text-sm font-normal text-gray-600">
                  {new Date(order.created_at).toLocaleDateString()}
                </span>
              </h2>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 text-xs rounded ${
                  order.payment_status === 'completed'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {order.payment_status.toUpperCase()}
                </span>
                <button
                  onClick={() => handlePrint(order)}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
                  aria-label="Print receipt"
                >
                  Print Slip
                </button>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <p className="text-sm">
                  <span className="font-medium">Customer:</span> {order.customer_name}
                </p>
                <p className="text-sm">
                  <span className="font-medium">Phone:</span> {order.phone_number || '-'}
                </p>
              </div>
              <div className="space-y-1">
                <div className="grid grid-cols-2 gap-1">
                  <p className="text-sm">Subtotal:</p>
                  <p className="text-sm text-right">${order.subtotal_amount.toFixed(2)}</p>
                  <p className="text-sm">Discount:</p>
                  <p className="text-sm text-right">${order.discount_amount.toFixed(2)}</p>
                  <p className="text-sm font-medium">Total:</p>
                  <p className="text-sm font-medium text-right">${order.total_amount.toFixed(2)}</p>
                </div>
              </div>
            </div>

            {order.items.length > 0 && (
              <div className="mt-4">
                <h3 className="font-medium mb-2">Items</h3>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="p-2 text-left text-sm">Product</th>
                        <th className="p-2 text-right text-sm">Price</th>
                        <th className="p-2 text-right text-sm">Qty</th>
                        <th className="p-2 text-right text-sm">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {order.items.map((item) => (
                        <tr key={item.id} className="border-t">
                          <td className="p-2 text-sm">{item.product_name}</td>
                          <td className="p-2 text-sm text-right">${item.price.toFixed(2)}</td>
                          <td className="p-2 text-sm text-right">{item.quantity}</td>
                          <td className="p-2 text-sm text-right">${item.total_after_discount.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}
