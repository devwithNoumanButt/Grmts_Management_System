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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchVariants();
    fetchRecentBarcodes();
  }, []);

  // Fetch stored variants from Supabase
  const fetchVariants = async () => {
    setIsLoading(true);
    setError(null);
    
    const { data, error } = await supabase.from('variants').select('*');
    if (error) {
      console.error('Error fetching variants:', error);
      setError('Failed to load variants');
    } else {
      setVariants(data || []);
    }
    setIsLoading(false);
  };

  // Fetch recent barcodes from Supabase
  const fetchRecentBarcodes = async () => {
    try {
      const { data, error } = await supabase
        .from('recent_barcodes')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);
  
      if (error) {
        console.error('Supabase Error:', error.message);
        setError('Failed to fetch recent barcodes');
        return;
      }
  
      setRecentBarcodes(data || []);
    } catch (err) {
      console.error('Unexpected Error:', err);
      setError('An unexpected error occurred');
    }
  };
  
  // Generate unique ID for barcode
  const generateUniqueId = () => `${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  // Add new variant to Supabase
  const handleAddVariant = async () => {
    if (!size || !price) {
      setError('Please fill in all fields');
      return;
    }

    const newVariant: Variant = { id: generateUniqueId(), size, price };

    const { error } = await supabase.from('variants').insert([newVariant]);
    if (error) {
      console.error('Error adding variant:', error);
      setError('Failed to add variant');
      return;
    }

    setVariants([...variants, newVariant]);
    setSize('');
    setPrice(1500);
    setError(null);
  };

  // Delete variant from Supabase
  const handleDeleteVariant = async (id: string) => {
    const { error } = await supabase.from('variants').delete().eq('id', id);
    if (error) {
      console.error('Error deleting variant:', error);
      setError('Failed to delete variant');
      return;
    }
    setVariants(variants.filter((v) => v.id !== id));
    setError(null);
  };

  // Print all barcodes and move to recent section
  const handlePrintAll = () => {
    if (variants.length === 0) return;

    const printWindow = window.open('', '', 'width=800,height=600');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Print Barcodes</title>
            <style>
              body { font-family: Arial, sans-serif; }
              .barcode-container { margin-bottom: 20px; text-align: center; }
              .barcode-info { font-size: 14px; margin-bottom: 5px; }
              .barcode-id { font-size: 12px; color: #555; margin-top: 5px; }
              @media print {
                body { margin: 0; padding: 0; }
                .barcode-container { page-break-inside: avoid; }
              }
            </style>
          </head>
          <body>
      `);

      variants.forEach((variant) => {
        printWindow.document.write(`
          <div class="barcode-container">
            <div class="barcode-info">Size: ${variant.size} | Price: PKR ${variant.price.toLocaleString()}</div>
            <svg id="barcode-${variant.id}"></svg>
            <div class="barcode-id">${variant.id}</div>
          </div>
        `);
      });

      printWindow.document.write(`
          <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.0/dist/JsBarcode.all.min.js"></script>
          <script>
            window.onload = () => {
              ${variants
                .map(
                  (variant) => `
                JsBarcode("#barcode-${variant.id}", "${variant.id}", {
                  format: "CODE128",
                  width: 2,
                  height: 60,
                  displayValue: false
                });
              `
                )
                .join('')}
              window.print();
              window.close();
            };
          </script>
          </body>
        </html>
      `);

      printWindow.document.close();

      // ✅ Move to recent barcodes and clear variants
      setRecentBarcodes([...recentBarcodes, ...variants]);
      setVariants([]);
    }
  };

  // Print individual barcode
  const handlePrintSingle = (variant: Variant) => {
    const printWindow = window.open('', '', 'width=800,height=600');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Print Barcode</title>
            <style>
              body { font-family: Arial, sans-serif; }
              .barcode-container { text-align: center; margin-top: 50px; }
              .barcode-info { font-size: 14px; margin-bottom: 5px; }
              .barcode-id { font-size: 12px; color: #555; margin-top: 5px; }
              @media print {
                body { margin: 0; padding: 0; }
              }
            </style>
          </head>
          <body>
            <div class="barcode-container">
              <div class="barcode-info">Size: ${variant.size} | Price: PKR ${variant.price.toLocaleString()}</div>
              <svg id="barcode-${variant.id}"></svg>
              <div class="barcode-id">${variant.id}</div>
            </div>
            <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.0/dist/JsBarcode.all.min.js"></script>
            <script>
              window.onload = () => {
                JsBarcode("#barcode-${variant.id}", "${variant.id}", {
                  format: "CODE128",
                  width: 2,
                  height: 60,
                  displayValue: false
                });
                window.print();
                window.close();
              };
            </script>
          </body>
        </html>
      `);

      printWindow.document.close();
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Barcode Generator</h1>

      {/* Input Fields */}
      <div className="grid grid-cols-2 gap-6">
        <div>
          <input
            type="text"
            value={size}
            onChange={(e) => setSize(e.target.value)}
            placeholder="Size"
            className="w-full p-2 border rounded-md"
          />
        </div>
        <div>
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(Number(e.target.value))}
            className="w-full p-2 border rounded-md"
          />
        </div>
      </div>

      <button onClick={handleAddVariant} className="w-full mt-4 bg-purple-600 text-white py-2 rounded-md">
        Add Variant
      </button>

      {/* Current Variants */}
      {variants.length > 0 && (
        <>
          <h2 className="mt-6 mb-2 font-semibold">Current Variants</h2>
          {variants.map((variant) => (
            <div key={variant.id} className="flex justify-between items-center border-b py-2">
              <span>{variant.size} - PKR {variant.price.toLocaleString()}</span>
              <button onClick={() => handleDeleteVariant(variant.id)} className="text-red-500">
                Delete
              </button>
            </div>
          ))}
          <button onClick={handlePrintAll} className="w-full mt-4 bg-black text-white py-2 rounded-md">
            Print All
          </button>
        </>
      )}

      {/* Recent Barcodes */}
      {recentBarcodes.length > 0 && (
        <>
          <h2 className="mt-6 mb-2 font-semibold">Recent Barcodes</h2>
          {recentBarcodes.map((variant) => (
            <div key={variant.id} className="flex justify-between items-center border-b py-2">
              <span>{variant.size} - PKR {variant.price.toLocaleString()}</span>
              <button onClick={() => handlePrintSingle(variant)} className="text-blue-500">
                Print
              </button>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
