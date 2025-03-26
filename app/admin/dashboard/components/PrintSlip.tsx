import React from 'react';

interface OrderItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  totalAfterDiscount: number;
}

interface PrintSlipProps {
  order: {
    id?: string;
    date: string;
    customerName: string;
    phoneNumber: string;
    orderItems: OrderItem[];
    totalAmount: number;
  };
}

const PrintSlip: React.FC<PrintSlipProps> = ({ order }) => {
  // Format date to DD/MM/YYYY
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  // Generate a fixed-format invoice number
  const generateInvoiceNumber = () => {
    const prefix = 'DIR';
    const randomNum = Math.floor(100000 + Math.random() * 900000);
    return `${prefix}${randomNum}`;
  };

  const totalUnits = order.orderItems.reduce((sum, item) => sum + item.quantity, 0);
  const formattedDate = formatDate(order.date || new Date().toISOString());
  const invoiceNumber = generateInvoiceNumber();

  return (
    <div className="receipt" style={{
      fontFamily: 'monospace',
      fontSize: '12px',
      maxWidth: '300px',
      margin: '0 auto',
      textAlign: 'center',
      padding: '10px',
      border: '1px solid black',
      borderRadius: '5px',
    }}>
      {/* Business Information */}
      <div style={{ fontWeight: 'bold', marginBottom: '10px', fontSize: '14px' }}>
        Fashion Arena
      </div>
      <div style={{ fontSize: '10px', marginBottom: '10px' }}>
        Opp. Prisma Mall Basement of Cafecito Grw Cantt.
      </div>
      <div style={{ fontSize: '10px', marginBottom: '10px' }}>
        Phone: 055-386577 / 0321-7456467
      </div>

      {/* Invoice Details */}
      <div style={{ marginBottom: '10px', textAlign: 'left' }}>
        <p>Invoice No: {order.id || invoiceNumber}</p>
        <p>Date: {formattedDate}</p>
        <p>Customer: {order.customerName || 'CASH CUSTOMER'}</p>
        <p>Phone #: {order.phoneNumber || '-'}</p>
      </div>

      {/* Order Table */}
      <table style={{
        width: '100%',
        borderCollapse: 'collapse',
        marginBottom: '10px',
        textAlign: 'left',
        fontSize: '10px',
      }}>
        <thead>
          <tr style={{ borderBottom: '1px solid black' }}>
            <th>#</th>
            <th>QTY</th>
            <th>Rate</th>
            <th style={{ textAlign: 'right' }}>Amount</th>
          </tr>
        </thead>
        <tbody>
          {order.orderItems.map((item, index) => (
            <tr key={index}>
              <td>{index + 1}</td>
              <td>{item.quantity}</td>
              <td>{item.price.toFixed(2)}</td>
              <td style={{ textAlign: 'right' }}>{item.totalAfterDiscount.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Summary Section */}
      <div style={{ marginBottom: '10px', textAlign: 'left' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Total Units:</span>
          <span>{totalUnits}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Amount Payable:</span>
          <span>{order.totalAmount.toFixed(2)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Cash Received:</span>
          <span>__</span>
        </div>
      </div>

      {/* Thank You Message */}
      <div style={{ textAlign: 'center', marginTop: '10px', fontSize: '10px' }}>
        Thank you for shopping with us!
      </div>
    </div>
  );
};

export default PrintSlip;
