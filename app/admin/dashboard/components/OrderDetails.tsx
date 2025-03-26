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

      if (ordersData.length > 0) {
        const enrichedOrders = await Promise.all(
          ordersData.map(async (order) => {
            const { data: itemsData, error: itemsError } = await supabase
              .from("order_items")
              .select("*")
              .eq("order_id", order.id);

            return { ...order, items: itemsError ? [] : itemsData || [] };
          })
        );
        setOrders(enrichedOrders);
      } else {
        setOrders([]);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = (order: Order) => {
    setPrintingOrderId(order.id);
    try {
      const printWindow = window.open("", "_blank");
      if (!printWindow) {
        alert("Please allow popups for printing");
        return;
      }

      const currencyFormatter = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      });

      const printContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Invoice #${order.id}</title>
            <style>
              @media print {
                @page {
                  margin: 0;
                  size: 76mm auto;
                }
                body { 
                  font-family: 'Courier New', monospace;
                  font-size: 12px;
                  width: 76mm;
                  margin: 0 auto;
                  padding: 2mm;
                  -webkit-print-color-adjust: exact;
                }
              }
              
              .header {
                text-align: center;
                margin-bottom: 4mm;
              }
              
              .store-info p {
                margin: 2px 0;
                font-size: 0.9em;
              }
              
              table {
                width: 100%;
                border-collapse: collapse;
                margin: 3mm 0;
              }
              
              th {
                border-bottom: 1px solid #000;
                padding: 2mm 0;
                font-weight: bold;
              }
              
              td {
                padding: 1mm 0;
              }
              
              .text-right {
                text-align: right;
              }
              
              .total-section {
                margin-top: 4mm;
                border-top: 1px dashed #000;
                padding-top: 2mm;
              }
              
              .footer {
                margin-top: 6mm;
                text-align: center;
                font-size: 0.8em;
              }
              
              .order-info p {
                margin: 2px 0;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h3>Fashion Arena</h3>
              <div class="store-info">
                <p>Opp. Prisma Mall Basement of Cafecito Grw Cantt.</p>
                <p>Phone: 055-386577 / 0321-7456467</p>
              </div>
            </div>

            <div class="order-info">
              <p><strong>Invoice No:</strong> ${order.id}</p>
              <p><strong>Date:</strong> ${new Date(
                order.created_at
              ).toLocaleString()}</p>
              <p><strong>Customer:</strong> ${
                order.customer_name || "CASH CUSTOMER"
              }</p>
              <p><strong>Phone:</strong> ${order.phone_number || "-"}</p>
            </div>

            <table>
              <thead>
                <tr>
                  <th>Item</th>
                  <th class="text-right">Qty</th>
                  <th class="text-right">Price</th>
                  <th class="text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                ${order.items
                  .map(
                    (item, index) => `
                    <tr>
                      <td>${index + 1}. ${item.product_name}</td>
                      <td class="text-right">${item.quantity}</td>
                      <td class="text-right">${currencyFormatter.format(
                        item.price
                      )}</td>
                      <td class="text-right">${currencyFormatter.format(
                        item.total_after_discount
                      )}</td>
                    </tr>
                  `
                  )
                  .join("")}
              </tbody>
            </table>

            <div class="total-section">
              <p><strong>Subtotal:</strong> ${currencyFormatter.format(
                order.subtotal_amount
              )}</p>
              <p><strong>Discount:</strong> ${currencyFormatter.format(
                order.discount_amount
              )}</p>
              <p><strong>Total Payable:</strong> ${currencyFormatter.format(
                order.total_amount
              )}</p>
              <p><strong>Cash Received:</strong> ${currencyFormatter.format(
                order.tendered_amount
              )}</p>
              <p><strong>Change:</strong> ${currencyFormatter.format(
                order.change_amount
              )}</p>
            </div>

            <div class="footer">
              <p>Thank you for your purchase!</p>
              <p>Returns accepted within 7 days with receipt</p>
            </div>
          </body>
        </html>
      `;

      printWindow.document.write(printContent);
      printWindow.document.close();

      printWindow.addEventListener("load", () => {
        setTimeout(() => {
          printWindow.print();
          printWindow.close();
          setPrintingOrderId(null);
        }, 500);
      });
    } catch (error) {
      console.error("Print error:", error);
      alert("Failed to print receipt. Please try again.");
      setPrintingOrderId(null);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Orders</h1>

      {loading ? (
        <p>Loading orders...</p>
      ) : orders.length === 0 ? (
        <p className="text-gray-500">No orders found.</p>
      ) : (
        orders.map((order) => (
          <div key={order.id} className="border rounded-md p-4 mb-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Order ID: #{order.id}</h2>
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
                  className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 text-sm disabled:opacity-50"
                >
                  {printingOrderId === order.id ? "Printing..." : "Print Slip"}
                </button>
              </div>
            </div>

            <div className="mt-2 grid grid-cols-2 gap-4">
              <div>
                <p>
                  <strong>Customer:</strong> {order.customer_name}
                </p>
                <p>
                  <strong>Phone:</strong> {order.phone_number || "-"}
                </p>
              </div>
              <div>
                <p>
                  <strong>Subtotal:</strong> ${order.subtotal_amount.toFixed(2)}
                </p>
                <p>
                  <strong>Discount:</strong> ${order.discount_amount.toFixed(2)}
                </p>
                <p>
                  <strong>Total:</strong> ${order.total_amount.toFixed(2)}
                </p>
                <p>
                  <strong>Tendered:</strong> ${order.tendered_amount.toFixed(2)}
                </p>
                <p>
                  <strong>Change:</strong> ${order.change_amount.toFixed(2)}
                </p>
                <p>
                  <strong>Payment Method:</strong> {order.payment_method}
                </p>
              </div>
            </div>

            {order.items.length > 0 ? (
              <div className="mt-4">
                <h3 className="font-semibold mb-2">Items:</h3>
                <table className="w-full border-collapse border border-gray-300">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="border border-gray-300 p-2">Product</th>
                      <th className="border border-gray-300 p-2">Price</th>
                      <th className="border border-gray-300 p-2">Qty</th>
                      <th className="border border-gray-300 p-2">Discount</th>
                      <th className="border border-gray-300 p-2">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.items.map((item) => (
                      <tr key={item.id}>
                        <td className="border border-gray-300 p-2">
                          {item.product_name}
                        </td>
                        <td className="border border-gray-300 p-2">
                          ${item.price.toFixed(2)}
                        </td>
                        <td className="border border-gray-300 p-2">
                          {item.quantity}
                        </td>
                        <td className="border border-gray-300 p-2">
                          {item.discount_percentage}%
                        </td>
                        <td className="border border-gray-300 p-2">
                          ${item.total_after_discount.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500 mt-2">No items in this order.</p>
            )}
          </div>
        ))
      )}
    </div>
  );
}
