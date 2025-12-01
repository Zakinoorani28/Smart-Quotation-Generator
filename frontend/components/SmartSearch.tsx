"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import axios from "axios";
import { Search, Package, Plus, Loader2, X } from "lucide-react";

// Define what the backend sends us (Raw Data)
interface RawProduct {
  name?: string;
  sku?: string;
  thumbnail?: string;
  unit_price?: number | string;
  price?: number | string;
  brand?: string;
  [key: string]: unknown;
}

// Define what our component uses
interface Product {
  name: string;
  sku: string;
  thumbnail?: string;
  unit_price: number;
  brand?: string;
}

interface SmartSearchProps {
  onAddProduct: (product: Product) => void;
}

export default function SmartSearch({ onAddProduct }: SmartSearchProps) {
  const [query, setQuery] = useState("");
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // 1. Fetch Data on Mount
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Hardcoded Cloud Backend URL to fix connection issues
        const res = await axios.get(
          "https://smag-backend-1051387132770.us-central1.run.app/products"
        );

        let data: RawProduct[] = [];

        if (Array.isArray(res.data)) {
          data = res.data;
        } else if (res.data && Array.isArray(res.data.products)) {
          data = res.data.products;
        }

        // Fix 1: Removed 'any', used 'RawProduct' type
        const normalized: Product[] = data.map((p) => ({
          name: String(p.name || "Unknown Product"),
          sku: String(p.sku || "NO-SKU"),
          unit_price: Number(p.unit_price || p.price || 0),
          thumbnail: typeof p.thumbnail === "string" ? p.thumbnail : undefined,
          brand: typeof p.brand === "string" ? p.brand : undefined,
        }));

        setAllProducts(normalized);
      } catch (e) {
        console.error("Smart Search Error:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Fix 2: Replaced 'useEffect' with 'useMemo'
  // This calculates results instantly during render, avoiding the cascading update error
  const filteredResults = useMemo(() => {
    if (!query.trim()) return [];

    const q = query.toLowerCase();
    return allProducts
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          (p.brand && p.brand.toLowerCase().includes(q))
      )
      .slice(0, 10); // Limit results
  }, [query, allProducts]);

  // 3. Click Outside to Close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);

  const handleSelect = (product: Product) => {
    onAddProduct(product);
    setQuery("");
    setIsOpen(false);
  };

  return (
    <div ref={wrapperRef} className="relative w-full md:w-80 z-30">
      <div
        className={`flex items-center border transition-all duration-200 rounded-xl bg-white px-4 py-2.5 ${
          isOpen
            ? "ring-2 ring-blue-100 border-blue-400 shadow-sm"
            : "border-gray-200"
        }`}
      >
        <Search size={18} className="text-gray-400 mr-3 shrink-0" />
        <input
          type="text"
          className="block w-full outline-none text-sm text-gray-700 placeholder:text-gray-400"
          placeholder="Search products..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
        />
        {loading && (
          <Loader2 size={16} className="animate-spin text-blue-500 ml-2" />
        )}
        {query && !loading && (
          <button
            onClick={() => setQuery("")}
            className="ml-2 text-gray-300 hover:text-gray-500"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {isOpen && query && (
        <div className="absolute mt-2 left-0 w-full bg-white shadow-xl rounded-xl border border-gray-100 overflow-hidden max-h-80 overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
          {filteredResults.length > 0 ? (
            <div className="divide-y divide-gray-50">
              {filteredResults.map((product, idx) => (
                <div
                  key={idx}
                  onClick={() => handleSelect(product)}
                  className="flex items-center p-3 hover:bg-blue-50 cursor-pointer group transition-colors"
                >
                  <div className="flex-shrink-0 h-10 w-10 border border-gray-200 rounded-lg overflow-hidden bg-white flex items-center justify-center">
                    {product.thumbnail ? (
                      <img
                        src={product.thumbnail}
                        alt={product.name}
                        className="h-full w-full object-contain"
                      />
                    ) : (
                      <Package size={20} className="text-gray-300" />
                    )}
                  </div>

                  <div className="ml-3 flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {product.name}
                    </p>
                    <p className="text-xs text-gray-500 truncate font-mono">
                      {product.sku}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-gray-900">
                      ${product.unit_price.toLocaleString()}
                    </span>
                    <div className="p-1.5 rounded-full bg-blue-100 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all">
                      <Plus size={14} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 text-center">
              <Package size={24} className="mx-auto text-gray-300 mb-2" />
              <p className="text-sm text-gray-500">No products found</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
