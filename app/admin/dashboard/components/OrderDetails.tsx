"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

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
  const [printingOrderId, setPrintingOrderId] = useState<number | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const { data: ordersData, error: ordersError } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });

      if (ordersError) throw ordersError;

      const enrichedOrders = await Promise.all(
        (ordersData || []).map(async (order) => {
          const { data: itemsData, error: itemsError } = await supabase
            .from("order_items")
            .select("*")
            .eq("order_id", order.id);

          return { ...order, items: itemsError ? [] : itemsData || [] };
        })
      );
      setOrders(enrichedOrders);
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const currencyFormatter = (value: number) => {
    try {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(value);
    } catch {
      return `$${value.toFixed(2)}`;
    }
  };

  const handlePrint = (order: Order) => {
    setPrintingOrderId(order.id);
    const printWindow = window.open("", "_blank");
    
    if (!printWindow || printWindow.closed) {
      alert("Please enable popups to print receipts");
      setPrintingOrderId(null);
      return;
    }

    try {
      const printContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Invoice #${order.id}</title>
            <meta name="viewport" content="width=72mm, initial-scale=1.0">
            <style>
              /* Base styles */
              * {
                box-sizing: border-box;
                margin: 0;
                padding: 0;
                -webkit-print-color-adjust: exact !important;
              }

              body {
                background: #ffffff !important;
                color: #000000 !important;
                font-family: 'Courier New', monospace;
                font-size: 12px;
                width: 72mm;
                margin: 0 auto;
                padding: 2mm;
              }

              /* Print-specific styles */
              @media print {
                @page {
                  margin: 0;
                  size: auto;
                }

                body {
                  background: #fff !important;
                  color: #000 !important;
                  width: 72mm !important;
                  margin: 0 !important;
                  padding: 2mm !important;
                }

                .print-safe {
                  background: #fff !important;
                  color: #000 !important;
                }
              }

              .header {
                text-align: center;
                margin-bottom: 4mm;
                padding: 2mm 0;
                border-bottom: 2px solid #000;
              }

              .store-info p {
                margin: 2px 0;
                font-size: 0.9em;
              }

              table {
                width: 100%;
                border-collapse: collapse;
                margin: 3mm 0;
                page-break-inside: avoid;
              }

              th, td {
                padding: 1mm 0;
                border-bottom: 1px solid #000;
              }

              .text-right {
                text-align: right;
              }

              .total-section {
                margin-top: 4mm;
                padding-top: 2mm;
                border-top: 2px solid #000;
              }

              .footer {
                margin-top: 6mm;
                text-align: center;
                font-size: 0.8em;
                padding: 2mm 0;
                border-top: 1px dashed #000;
              }

              .order-info p {
                margin: 2px 0;
              }
            </style>
          </head>
          <body class="print-safe">
            <div class="header print-safe">
              <h3>Fashion Arena</h3>
              <div class="store-info">
                <p>Opp. Prisma Mall Basement of Cafecito Grw Cantt.</p>
                <p>Phone: 055-386577 / 0321-7456467</p>
              </div>
            </div>

            <div class="order-info print-safe">
              <p><strong>Invoice No:</strong> ${order.id}</p>
              <p><strong>Date:</strong> ${new Date(order.created_at).toLocaleString()}</p>
              <p><strong>Customer:</strong> ${order.customer_name || "CASH CUSTOMER"}</p>
              <p><strong>Phone:</strong> ${order.phone_number || "-"}</p>
            </div>

            <table class="print-safe">
              <thead>
                <tr>
                  <th>Item</th>
                  <th class="text-right">Qty</th>
                  <th class="text-right">Price</th>
                  <th class="text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                ${order.items.map((item, index) => `
                  <tr>
                    <td>${index + 1}. ${item.product_name}</td>
                    <td class="text-right">${item.quantity}</td>
                    <td class="text-right">${currencyFormatter(item.price)}</td>
                    <td class="text-right">${currencyFormatter(item.total_after_discount)}</td>
                  </tr>
                `).join("")}
              </tbody>
            </table>

            <div class="total-section print-safe">
              <p><strong>Subtotal:</strong> ${currencyFormatter(order.subtotal_amount)}</p>
              <p><strong>Discount:</strong> ${currencyFormatter(order.discount_amount)}</p>
              <p><strong>Total Payable:</strong> ${currencyFormatter(order.total_amount)}</p>
              <p><strong>Cash Received:</strong> ${currencyFormatter(order.tendered_amount)}</p>
              <p><strong>Change:</strong> ${currencyFormatter(order.change_amount)}</p>
            </div>

            <div class="footer print-safe">
              <p>Thank you for your purchase!</p>
              <p>Returns accepted within 7 days with receipt</p>
            </div>

            <script>
              (function() {
                function triggerPrint() {
                  window.print();
                  window.onafterprint = function() {
                    window.close();
                  };
                }
                
                // First try
                if (document.readyState === 'complete') {
                  triggerPrint();
                } else {
                  window.addEventListener('load', triggerPrint);
                }
                
                // Fallback for mobile browsers
                setTimeout(triggerPrint, 1000);
              })();
            </script>
          </body>
        </html>
      `;

      printWindow.document.write(printContent);
      printWindow.document.close();

      printWindow.addEventListener("beforeunload", () => {
        setPrintingOrderId(null);
      });

    } catch (error) {
      console.error("Print error:", error);
      setPrintingOrderId(null);
      alert("Failed to print receipt. Please try again.");
      printWindow.close();
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Orders</h1>
      <div className="mb-4 text-sm text-blue-600 bg-blue-50 p-2 rounded">
        Note: Please enable popups and allow background printing for best results
      </div>

      {loading ? (
        <div className="text-center p-4">Loading orders...</div>
      ) : orders.length === 0 ? (
        <p className="text-gray-500 text-center p-4">No orders found.</p>
      ) : (
        orders.map((order) => (
          <div key={order.id} className="border rounded-md p-4 mb-4 bg-white shadow-sm">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Order #${order.id}</h2>
              <div className="flex gap-2">
                <span
                  className={`px-2 py-1 text-sm rounded ${
                    order.payment_status === "completed"
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {order.payment_status}
                </span>
                <button
                  onClick={() => handlePrint(order)}
                  disabled={printingOrderId === order.id}
                  className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {printingOrderId === order.id ? (
                    <span className="flex items-center">
                      <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                      </svg>
                      Printing...
                    </span>
                  ) : (
                    "Print Slip"
                  )}
                </button>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-1">
                <p><strong>Customer:</strong> {order.customer_name || "Walk-in Customer"}</p>
                <p><strong>Phone:</strong> {order.phone_number || "-"}</p>
                <p><strong>Date:</strong> {new Date(order.created_at).toLocaleString()}</p>
              </div>
              <div className="space-y-1">
                <p><strong>Payment Method:</strong> {order.payment_method}</p>
                <p><strong>Subtotal:</strong> {currencyFormatter(order.subtotal_amount)}</p>
                <p><strong>Discount:</strong> {currencyFormatter(order.discount_amount)}</p>
                <p><strong>Total:</strong> {currencyFormatter(order.total_amount)}</p>
                <p><strong>Tendered:</strong> {currencyFormatter(order.tendered_amount)}</p>
                <p><strong>Change:</strong> {currencyFormatter(order.change_amount)}</p>
              </div>
            </div>

            {order.items.length > 0 ? (
              <div className="mt-4">
                <h3 className="font-semibold mb-2">Items</h3>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="p-2 text-left border-b">Product</th>
                        <th className="p-2 text-right border-b">Price</th>
                        <th className="p-2 text-right border-b">Qty</th>
                        <th className="p-2 text-right border-b">Discount</th>
                        <th className="p-2 text-right border-b">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {order.items.map((item) => (
                        <tr key={item.id} className="border-b">
                          <td className="p-2">{item.product_name}</td>
                          <td className="p-2 text-right">{currencyFormatter(item.price)}</td>
                          <td className="p-2 text-right">{item.quantity}</td>
                          <td className="p-2 text-right">{item.discount_percentage}%</td>
                          <td className="p-2 text-right">{currencyFormatter(item.total_after_discount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="mt-4 text-gray-500">No items in this order</div>
            )}
          </div>
        ))
      )}
    </div>
  );
}
