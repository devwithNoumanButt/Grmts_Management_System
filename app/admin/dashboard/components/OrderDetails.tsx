"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useReactToPrint } from "react-to-print";
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

const PrintReceipt = React.forwardRef<HTMLDivElement, { order: Order }>(
  ({ order }, ref) => {
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

    return (
      <div ref={ref} className="print-container">
        <div className="header">
          <h3>Fashion Arena</h3>
          <div className="store-info">
            <p>Opp. Prisma Mall Basement of Cafecito Grw Cantt.</p>
            <p>Phone: 055-386577 / 0321-7456467</p>
          </div>
        </div>

        <div className="order-info">
          <p><strong>Invoice No:</strong> {order.id}</p>
          <p><strong>Date:</strong> {new Date(order.created_at).toLocaleString()}</p>
          <p><strong>Customer:</strong> {order.customer_name || "CASH CUSTOMER"}</p>
          <p><strong>Phone:</strong> {order.phone_number || "-"}</p>
        </div>

        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th className="text-right">Qty</th>
              <th className="text-right">Price</th>
              <th className="text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item, index) => (
              <tr key={item.id}>
                <td>{index + 1}. {item.product_name}</td>
                <td className="text-right">{item.quantity}</td>
                <td className="text-right">{currencyFormatter(item.price)}</td>
                <td className="text-right">{currencyFormatter(item.total_after_discount)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="total-section">
          <p><strong>Subtotal:</strong> {currencyFormatter(order.subtotal_amount)}</p>
          <p><strong>Discount:</strong> {currencyFormatter(order.discount_amount)}</p>
          <p><strong>Total Payable:</strong> {currencyFormatter(order.total_amount)}</p>
          <p><strong>Cash Received:</strong> {currencyFormatter(order.tendered_amount)}</p>
          <p><strong>Change:</strong> {currencyFormatter(order.change_amount)}</p>
        </div>

        <div className="footer">
          <p>Thank you for your purchase!</p>
          <p>Returns accepted within 7 days with receipt</p>
        </div>
      </div>
    );
  }
);

PrintReceipt.displayName = "PrintReceipt";

export default function OrdersList() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [printingOrder, setPrintingOrder] = useState<Order | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
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

    fetchOrders();
  }, []);

  const handlePrintLog = useCallback(async (orderId: number) => {
    try {
      await supabase.from("print_logs").insert({
        order_id: orderId,
        printed_at: new Date().toISOString()
      });
    } catch (error) {
      console.error("Failed to log print:", error);
    }
  }, []);

  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    onBeforeGetContent: async () => {
      if (!printingOrder) return;
      await new Promise(resolve => setTimeout(resolve, 100));
    },
    onAfterPrint: () => {
      if (printingOrder) {
        handlePrintLog(printingOrder.id);
        setPrintingOrder(null);
      }
    },
    removeAfterPrint: true,
  });

  const triggerPrint = (order: Order) => {
    setPrintingOrder(order);
    setTimeout(handlePrint, 100);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Orders</h1>
      
      {printingOrder && (
        <div style={{ display: "none" }}>
          <PrintReceipt ref={printRef} order={printingOrder} />
        </div>
      )}

      {loading ? (
        <div className="text-center p-4">Loading orders...</div>
      ) : orders.length === 0 ? (
        <p className="text-gray-500 text-center p-4">No orders found.</p>
      ) : (
        orders.map((order) => (
          <div key={order.id} className="border rounded-md p-4 mb-4 bg-white shadow-sm">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Order #{order.id}</h2>
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
                  onClick={() => triggerPrint(order)}
                  disabled={!!printingOrder}
                  className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {printingOrder?.id === order.id ? (
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
      
      <style jsx global>{`
        @media print {
          @page {
            size: 72mm auto;
            margin: 2mm;
          }
          
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          
          .print-container {
            width: 72mm !important;
            margin: 0 !important;
            padding: 2mm !important;
            font-family: 'Courier New', monospace;
            font-size: 12px;
          }
          
          .header, .order-info, .total-section, .footer {
            text-align: center;
            margin-bottom: 4mm;
          }
          
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 3mm 0;
          }
          
          th, td {
            padding: 1mm 0;
            border-bottom: 1px solid #000;
          }
          
          .text-right {
            text-align: right;
          }
        }
      `}</style>
    </div>
  );
}

function currencyFormatter(value: number) {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value);
  } catch {
    return `$${value.toFixed(2)}`;
  }
}
