'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface Variant {
  id: string;
  size: string;
  price: number;
}

export default function BarcodeGeneratorPage() {
  const [size, setSize] = useState('');
  const [price, setPrice] = useState(1500);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [recentBarcodes, setRecentBarcodes] = useState<Variant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPrinting, setIsPrinting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchVariants();
    fetchRecentBarcodes();
  }, []);

  const fetchVariants = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.from('variants').select('*');
      if (error) throw error;
      setVariants(data || []);
    } catch (err) {
      console.error('Fetch error:', err);
      setError('Failed to load variants');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRecentBarcodes = async () => {
    try {
      const { data, error } = await supabase
        .from('recent_barcodes')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setRecentBarcodes(data || []);
    } catch (err) {
      console.error('Fetch error:', err);
      setError('Failed to load recent barcodes');
    }
  };

  const generateUniqueId = () => `${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  const handleAddVariant = async () => {
    if (!size || !price) {
      setError('Please fill in all fields');
      return;
    }

    try {
      const newVariant: Variant = { id: generateUniqueId(), size, price };
      const { error } = await supabase.from('variants').insert([newVariant]);
      if (error) throw error;
      
      setVariants(prev => [...prev, newVariant]);
      setSize('');
      setPrice(1500);
      setError(null);
    } catch (err) {
      console.error('Insert error:', err);
      setError('Failed to add variant');
    }
  };

  const handleDeleteVariant = async (id: string) => {
    try {
      const { error } = await supabase.from('variants').delete().eq('id', id);
      if (error) throw error;
      
      setVariants(prev => prev.filter(v => v.id !== id));
      setError(null);
    } catch (err) {
      console.error('Delete error:', err);
      setError('Failed to delete variant');
    }
  };

  const handlePrintAll = async () => {
    if (typeof window === 'undefined' || variants.length === 0 || isPrinting) return;

    setIsPrinting(true);
    setError(null);

    try {
      const printWindow = window.open('', '_blank', 'width=800,height=600');
      if (!printWindow) {
        throw new Error('Popup blocked - please allow popups');
      }

      const printTimeout = setTimeout(() => {
        printWindow.close();
        throw new Error('Print window timed out');
      }, 3000);

      // Write print content
      printWindow.document.write(`
        <html>
          <head>
            <title>Print Barcodes</title>
            ${printStyles()}
          </head>
          <body>
            ${variants.map(printBarcodeElement).join('')}
            ${barcodeScript(variants)}
          </body>
        </html>
      `);

      printWindow.document.close();

      // Save to recent barcodes
      const { error } = await supabase
        .from('recent_barcodes')
        .insert(variants);
      if (error) throw error;

      printWindow.addEventListener('load', () => {
        clearTimeout(printTimeout);
        printWindow.print();
        setVariants([]);
        setIsPrinting(false);
      });

    } catch (err) {
      console.error('Print error:', err);
      setError(err instanceof Error ? err.message : 'Print failed');
      setIsPrinting(false);
    }
  };

  const handlePrintSingle = async (variant: Variant) => {
    if (typeof window === 'undefined' || isPrinting) return;

    setIsPrinting(true);
    setError(null);

    try {
      const printWindow = window.open('', '_blank', 'width=800,height=600');
      if (!printWindow) {
        throw new Error('Popup blocked - please allow popups');
      }

      printWindow.document.write(`
        <html>
          <head>
            <title>Print Barcode</title>
            ${printStyles()}
          </head>
          <body>
            ${printBarcodeElement(variant)}
            ${barcodeScript([variant])}
          </body>
        </html>
      `);

      printWindow.document.close();

      printWindow.addEventListener('load', () => {
        printWindow.print();
        setIsPrinting(false);
      });

    } catch (err) {
      console.error('Print error:', err);
      setError(err instanceof Error ? err.message : 'Print failed');
      setIsPrinting(false);
    }
  };

  // Helper functions for print content
  const printStyles = () => `
    <style>
      body { font-family: Arial, sans-serif; margin: 20px; }
      .barcode-container { margin-bottom: 20px; text-align: center; }
      .barcode-info { font-size: 14px; margin-bottom: 5px; }
      .barcode-id { font-size: 12px; color: #555; margin-top: 5px; }
      @media print { 
        body { margin: 0; padding: 0; }
        .barcode-container { page-break-inside: avoid; }
      }
    </style>
  `;

  const printBarcodeElement = (variant: Variant) => `
    <div class="barcode-container">
      <div class="barcode-info">
        Size: ${variant.size} | Price: PKR ${variant.price.toLocaleString()}
      </div>
      <svg id="barcode-${variant.id}"></svg>
      <div class="barcode-id">${variant.id}</div>
    </div>
  `;

  const barcodeScript = (targets: Variant[]) => `
    <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.0/dist/JsBarcode.all.min.js"></script>
    <script>
      window.onload = () => {
        ${targets.map(v => `
          JsBarcode("#barcode-${v.id}", "${v.id}", {
            format: "CODE128",
            width: 2,
            height: 60,
            displayValue: false
          });
        `).join('')}
        window.print();
      };
    </script>
  `;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Barcode Generator</h1>

      {/* Input Fields */}
      <div className="grid grid-cols-2 gap-6 mb-4">
        <input
          type="text"
          value={size}
          onChange={(e) => setSize(e.target.value)}
          placeholder="Size"
          className="w-full p-2 border rounded-md"
        />
        <input
          type="number"
          value={price}
          onChange={(e) => setPrice(Number(e.target.value))}
          className="w-full p-2 border rounded-md"
        />
      </div>

      <button 
        onClick={handleAddVariant}
        disabled={isLoading || isPrinting}
        className="w-full bg-purple-600 text-white py-2 rounded-md disabled:opacity-50"
      >
        {isLoading ? 'Loading...' : 'Add Variant'}
      </button>

      {error && <p className="mt-2 text-red-500 text-center">{error}</p>}

      {/* Current Variants */}
      {variants.length > 0 && (
        <div className="mt-6">
          <h2 className="mb-2 font-semibold">Current Variants</h2>
          {variants.map((variant) => (
            <div key={variant.id} className="flex justify-between items-center border-b py-2">
              <span>{variant.size} - PKR {variant.price.toLocaleString()}</span>
              <button 
                onClick={() => handleDeleteVariant(variant.id)}
                className="text-red-500 hover:text-red-700"
                disabled={isPrinting}
              >
                Delete
              </button>
            </div>
          ))}
          <button 
            onClick={handlePrintAll}
            disabled={isPrinting}
            className="w-full mt-4 bg-black text-white py-2 rounded-md disabled:opacity-50"
          >
            {isPrinting ? 'Printing...' : 'Print All'}
          </button>
        </div>
      )}

      {/* Recent Barcodes */}
      {recentBarcodes.length > 0 && (
        <div className="mt-6">
          <h2 className="mb-2 font-semibold">Recent Barcodes</h2>
          {recentBarcodes.map((variant) => (
            <div key={variant.id} className="flex justify-between items-center border-b py-2">
              <span>{variant.size} - PKR {variant.price.toLocaleString()}</span>
              <button 
                onClick={() => handlePrintSingle(variant)}
                className="text-blue-500 hover:text-blue-700"
                disabled={isPrinting}
              >
                Print
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
