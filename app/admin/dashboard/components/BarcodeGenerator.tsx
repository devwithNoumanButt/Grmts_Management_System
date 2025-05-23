"use client";

import { useState, useEffect, useCallback, memo, useRef } from "react";
import { supabase } from "@/lib/supabase";

interface Variant {
  id: string;
  size: string;
  price: number;
}

const BarcodeRow = memo(function BarcodeRow({
  variant,
  onPrint,
  onDelete,
  onToggleSelect,
  isSelected,
  isPrinting,
}: {
  variant: Variant;
  onPrint: () => void;
  onDelete?: () => void;
  onToggleSelect?: (checked: boolean) => void;
  isSelected?: boolean;
  isPrinting: boolean;
}) {
  return (
    <div className="flex justify-between items-center border-b py-2">
      <div className="flex items-center gap-2">
        {onToggleSelect && (
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => onToggleSelect?.(e.target.checked)}
            className="mr-2"
            disabled={isPrinting}
            aria-label={`Select ${variant.size}`}
          />
        )}
        <span>
          {variant.size} - PKR {variant.price.toLocaleString()}
        </span>
      </div>
      <div className="flex gap-2">
        <button
          onClick={onPrint}
          className="text-blue-500 hover:text-blue-700"
          disabled={isPrinting}
          aria-label={`Print ${variant.size}`}
        >
          Print
        </button>
        {onDelete && (
          <button
            onClick={onDelete}
            className="text-red-500 hover:text-red-700"
            disabled={isPrinting}
            aria-label={`Delete ${variant.size}`}
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
});

BarcodeRow.displayName = "BarcodeRow";

export default function BarcodeGenerator() {
  const [size, setSize] = useState("");
  const [price, setPrice] = useState(1500);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [customVariants, setCustomVariants] = useState<Variant[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [recentBarcodes, setRecentBarcodes] = useState<Variant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPrinting, setIsPrinting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const printWindowRef = useRef<Window | null>(null);
  const printTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const currentPrintWindow = printWindowRef.current;
    return () => {
      if (currentPrintWindow && !currentPrintWindow.closed) {
        currentPrintWindow.close();
      }
      if (printTimeoutRef.current) {
        clearTimeout(printTimeoutRef.current);
      }
    };
  }, []);

  const fetchData = useCallback(async () => {
    try {
      const [variantsResponse, recentResponse] = await Promise.all([
        supabase.from("variants").select("*"),
        supabase
          .from("recent_barcodes")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(10),
      ]);

      if (variantsResponse.error) throw variantsResponse.error;
      if (recentResponse.error) throw recentResponse.error;

      setVariants(variantsResponse.data || []);
      setRecentBarcodes(recentResponse.data || []);
    } catch (error) {
      console.error("Fetch error:", error);
      setError("Failed to load data");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const generateUniqueId = useCallback(
    () => `${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    []
  );

  const handleAddVariant = useCallback(async () => {
    if (!size || !price) {
      setError("Please fill in all fields");
      return;
    }

    try {
      const newVariant: Variant = {
        id: generateUniqueId(),
        size: size.trim(),
        price,
      };

      const { error } = await supabase.from("variants").insert([newVariant]);
      if (error) throw error;

      setVariants((prev) => [...prev, newVariant]);
      setSize("");
      setPrice(1500);
      setError(null);
    } catch (error) {
      console.error("Insert error:", error);
      setError("Failed to add variant");
    }
  }, [size, price, generateUniqueId]);

  const handleDeleteVariant = useCallback(async (id: string) => {
    try {
      const { error } = await supabase.from("variants").delete().eq("id", id);
      if (error) throw error;

      setVariants((prev) => prev.filter((v) => v.id !== id));
      setError(null);
    } catch (error) {
      console.error("Delete error:", error);
      setError("Failed to delete variant");
    }
  }, []);

  const handleAddToCustom = useCallback(() => {
    const selectedVariants = variants.filter((v) => selectedIds.includes(v.id));
    setCustomVariants((prev) => [...prev, ...selectedVariants]);
    setSelectedIds([]);
  }, [variants, selectedIds]);

  const printContent = useCallback((targets: Variant[]) => {
    const styles = `
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

    const barcodes = targets
      .map(
        (v) => `
      <div class="barcode-container">
        <div class="barcode-info">
          Size: ${v.size} | Price: PKR ${v.price.toLocaleString()}
        </div>
        <svg id="barcode-${v.id}"></svg>
        <div class="barcode-id">${v.id}</div>
      </div>
    `
      )
      .join("");

    const script = `
      <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.0/dist/JsBarcode.all.min.js"></script>
      <script>
        window.onload = () => {
          try {
            ${targets
              .map(
                (v) => `
              JsBarcode("#barcode-${v.id}", "${v.id}", {
                format: "CODE128",
                width: 2,
                height: 60,
                displayValue: false
              });`
              )
              .join("")}
          } catch (error) {
            console.error('Barcode error:', error);
          }
        };
      </script>
    `;

    return { styles, barcodes, script };
  }, []);

  const handlePrint = useCallback(
    async (targetVariants: Variant[], clearAfterPrint = false) => {
      if (
        typeof window === "undefined" ||
        targetVariants.length === 0 ||
        isPrinting
      )
        return;

      setIsPrinting(true);
      setError(null);

      try {
        let printFrame = document.getElementById('print-frame') as HTMLIFrameElement;
        if (!printFrame) {
          printFrame = document.createElement('iframe');
          printFrame.id = 'print-frame';
          printFrame.style.position = 'fixed';
          printFrame.style.right = '0';
          printFrame.style.bottom = '0';
          printFrame.style.width = '0';
          printFrame.style.height = '0';
          printFrame.style.border = 'none';
          document.body.appendChild(printFrame);
        }

        const { styles, barcodes, script } = printContent(targetVariants);
        const printDoc = printFrame.contentWindow?.document;
        if (!printDoc) throw new Error("Could not access print frame");

        printDoc.write(`
          <html>
            <head><title>Print Barcodes</title>${styles}</head>
            <body>${barcodes}${script}</body>
          </html>
        `);
        printDoc.close();

        const printSuccess = await new Promise<boolean>((resolve) => {
          if (!printFrame.contentWindow) {
            resolve(false);
            return;
          }

          const handlePrintComplete = () => {
            resolve(true);
          };

          printFrame.contentWindow.onafterprint = handlePrintComplete;

          setTimeout(() => {
            try {
              printFrame.contentWindow?.print();
            } catch (error) {
              console.error("Print execution error:", error);
              resolve(false);
            }
          }, 500);
        });

        if (printSuccess) {
          const { error } = await supabase
            .from("recent_barcodes")
            .insert(targetVariants);
          if (error) throw error;

          await fetchData();
          if (clearAfterPrint) {
            setCustomVariants([]);
            setVariants([]);
          }
        }
      } catch (error) {
        const normalizedError = error instanceof Error 
          ? error 
          : new Error(String(error));
        setError("Print failed - please try again");
        console.error("Print error:", normalizedError);
      } finally {
        setIsPrinting(false);
      }
    },
    [isPrinting, printContent, fetchData]
  );

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Barcode Generator</h1>

      <div className="grid grid-cols-2 gap-6 mb-4">
        <input
          type="text"
          value={size}
          onChange={(e) => setSize(e.target.value)}
          placeholder="Size"
          className="w-full p-2 border rounded-md"
          aria-label="Size input"
        />
        <input
          type="number"
          value={price}
          onChange={(e) => setPrice(Number(e.target.value))}
          className="w-full p-2 border rounded-md"
          aria-label="Price input"
        />
      </div>

      <button
        onClick={handleAddVariant}
        disabled={isLoading || isPrinting}
        className="w-full bg-purple-600 text-white py-2 rounded-md disabled:opacity-50"
      >
        {isLoading ? "Loading..." : "Add Variant"}
      </button>

      {error && <p className="mt-2 text-red-500 text-center">{error}</p>}

      {variants.length > 0 && (
        <div className="mt-6">
          <div className="flex justify-between items-center mb-2">
            <h2 className="font-semibold">Current Variants</h2>
            <button
              onClick={handleAddToCustom}
              disabled={selectedIds.length === 0 || isPrinting}
              className="px-4 py-1 bg-gray-200 rounded-md disabled:opacity-50"
            >
              Add to Custom
            </button>
          </div>
          {variants.map((variant) => (
            <BarcodeRow
              key={variant.id}
              variant={variant}
              isSelected={selectedIds.includes(variant.id)}
              isPrinting={isPrinting}
              onToggleSelect={(checked) => {
                setSelectedIds((prev) =>
                  checked
                    ? [...prev, variant.id]
                    : prev.filter((id) => id !== variant.id)
                );
              }}
              onPrint={() => handlePrint([variant])}
              onDelete={() => handleDeleteVariant(variant.id)}
            />
          ))}
          <button
            onClick={() => handlePrint(variants, true)}
            disabled={isPrinting}
            className="w-full mt-4 bg-black text-white py-2 rounded-md disabled:opacity-50"
          >
            {isPrinting ? "Printing..." : "Print All"}
          </button>
        </div>
      )}

      {customVariants.length > 0 && (
        <div className="mt-6">
          <h2 className="mb-2 font-semibold">Custom Variants</h2>
          {customVariants.map((variant, index) => (
            <BarcodeRow
              key={`${variant.id}-${index}`}
              variant={variant}
              isPrinting={isPrinting}
              onPrint={() => handlePrint([variant])}
              onDelete={() => {
                setCustomVariants((prev) => prev.filter((_, i) => i !== index));
              }}
            />
          ))}
          <button
            onClick={() => handlePrint(customVariants, true)}
            disabled={isPrinting}
            className="w-full mt-4 bg-green-600 text-white py-2 rounded-md disabled:opacity-50"
          >
            {isPrinting ? "Printing..." : "Print All Custom"}
          </button>
        </div>
      )}

      {recentBarcodes.length > 0 && (
        <div className="mt-6">
          <h2 className="mb-2 font-semibold">Recent Barcodes</h2>
          {recentBarcodes.map((variant) => (
            <BarcodeRow
              key={variant.id}
              variant={variant}
              isPrinting={isPrinting}
              onPrint={() => handlePrint([variant])}
            />
          ))}
        </div>
      )}
    </div>
  );
}
