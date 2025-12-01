"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import {
  Sparkles,
  FileText,
  Download,
  Loader2,
  Package,
  CheckCircle2,
  Mic,
  MicOff,
  Trash2,
  History,
  Calendar,
  User,
  RefreshCcw,
  ExternalLink,
} from "lucide-react";
import Image from "next/image";
import SmartSearch from "../components/SmartSearch";

/* ---------------------------------------------------------
    TYPES
--------------------------------------------------------- */
interface Product {
  name: string;
  sku: string;
  thumbnail?: string;
  short_description?: string;
  description?: string;
  quantity: number;
  unit_price: number;
  line_total: number;
  brand?: string;
  use_case?: string;
}

interface QuotationResult {
  success: boolean;
  invoice_no: string;
  pdf_url: string;
  grand_total: number;
}

interface HistoryItem {
  filename: string;
  url: string;
  created_at: string;
}

// Speech Recognition
declare global {
  interface Window {
    webkitSpeechRecognition: any;
  }
}

/* ---------------------------------------------------------
    MAIN COMPONENT
--------------------------------------------------------- */
export default function Home() {
  /* ---------------- STATE ---------------- */
  const [prompt, setPrompt] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [taxRate, setTaxRate] = useState(0);
  const [discountRate, setDiscountRate] = useState(0);

  const [invoiceDate, setInvoiceDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [validityDate, setValidityDate] = useState("");

  const [activeTab, setActiveTab] = useState<"create" | "history">("create");
  const [isListening, setIsListening] = useState(false);

  const [products, setProducts] = useState<Product[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [finalResult, setFinalResult] = useState<QuotationResult | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [generating, setGenerating] = useState(false);

  /* ---------------- VALID UNTIL AUTO SET ---------------- */
  useEffect(() => {
    const d = new Date(invoiceDate);
    d.setDate(d.getDate() + 30);
    setValidityDate(d.toISOString().split("T")[0]);
  }, [invoiceDate]);

  /* ---------------- HISTORY FETCH ---------------- */
  const fetchHistory = async () => {
    try {
      const API_URL = "https://smag-backend-1051387132770.us-central1.run.app";
      const res = await axios.get(`${API_URL}/history`);
      setHistory(res.data);
    } catch (e) {
      console.error("History load failed", e);
    }
  };

  const deleteHistory = async (filename: string) => {
    if (!confirm("Delete this file?")) return;
    try {
      const API_URL = "https://smag-backend-1051387132770.us-central1.run.app";
      await axios.delete(`${API_URL}/history/${filename}`);
      fetchHistory();
    } catch (e) {
      console.error("Delete failed", e);
    }
  };

  /* ---------------- FORCE DOWNLOAD ---------------- */
  const forceDownload = (url: string, filename: string) => {
    const a = document.createElement("a");
    a.href = `${url}?download=true`;
    a.setAttribute("download", filename);
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  /* ---------------- VOICE INPUT ---------------- */
  const toggleVoiceInput = () => {
    if (!window.webkitSpeechRecognition) {
      alert("Voice input not supported.");
      return;
    }

    const recog = new window.webkitSpeechRecognition();
    recog.lang = "en-US";
    recog.continuous = false;

    recog.onstart = () => setIsListening(true);
    recog.onend = () => setIsListening(false);
    recog.onresult = (e: any) => {
      setPrompt((prev) => prev + " " + e.results[0][0].transcript);
    };

    isListening ? recog.stop() : recog.start();
  };

  const generateQuotation = async () => {
    setAnalyzing(true);
    setFinalResult(null);
    setProducts([]);

    try {
      // Updated API URL
      const API_URL = "https://smag-backend-1051387132770.us-central1.run.app";
      // Corrected: .post() syntax was broken
      const res = await axios.post(`${API_URL}/analyze-request`, { prompt });

      if (res.data.success) {
        setProducts(res.data.products);

        if (res.data.suggested_customer?.trim()) {
          setCustomerName(res.data.suggested_customer);
        }
      }
    } catch (e) {
      console.error("Error analyzing", e);
      alert("Error analyzing quotation request.");
    } finally {
      setAnalyzing(false);
    }
  };

  /* ---------------- SMART SEARCH ADD ---------------- */
  const addProductFromSearch = (prod: any) => {
    const price = Number(prod.unit_price || prod.price || 0);
    const idx = products.findIndex((p) => p.sku === prod.sku);

    if (idx >= 0) {
      const updated = [...products];
      updated[idx].quantity++;
      updated[idx].line_total = updated[idx].quantity * updated[idx].unit_price;
      setProducts(updated);
    } else {
      setProducts([
        ...products,
        {
          ...prod,
          quantity: 1,
          unit_price: price,
          line_total: price,
          description: prod.description || "",
          short_description: prod.short_description || "",
        },
      ]);
    }
  };

  /* ---------------- CALCULATIONS ---------------- */
  const subtotal = products.reduce((a, b) => a + b.line_total, 0);
  const discountAmt = subtotal * (discountRate / 100);
  const taxable = subtotal - discountAmt;
  const taxAmt = taxable * (taxRate / 100);
  const grandTotal = taxable + taxAmt;

  /* ---------------- Handle Finalize ---------------- */
  const handleFinalize = async () => {
    if (products.length === 0)
      return alert("Please analyze the quotation first.");

    setGenerating(true);

    try {
      const payload = {
        customer_name: customerName || "Valued Customer",
        invoice_date: invoiceDate,
        valid_until: validityDate,
        tax_rate: taxRate,
        discount_rate: discountRate,
        products,
      };

      const API_URL = "https://smag-backend-1051387132770.us-central1.run.app";
      // Corrected: Use .post() and pass payload as second argument
      const res = await axios.post(`${API_URL}/finalize-quotation`, payload);

      if (res.data.success) {
        setFinalResult(res.data);
        fetchHistory();
      }
    } catch (err) {
      console.error("Finalize Error:", err);
      alert("PDF generation failed.");
    }

    setGenerating(false);
  };

  /* ---------------- UPDATE FUNCTIONS ---------------- */
  const updateQuantity = (i: number, q: number) => {
    const list = [...products];
    list[i].quantity = Math.max(1, q);
    list[i].line_total = list[i].quantity * list[i].unit_price;
    setProducts(list);
  };
  const updatePrice = (i: number, p: number) => {
    const list = [...products];
    list[i].unit_price = Math.max(0, p);
    list[i].line_total = list[i].quantity * p;
    setProducts(list);
  };
  const removeProduct = (i: number) =>
    setProducts(products.filter((_, x) => x !== i));

  /* ---------------------------------------------------------
     UI START
  --------------------------------------------------------- */

  return (
    <main className="bg-gradient-to-br from-slate-50 to-slate-200 text-slate-800">
      {/* ------------------------------------------------ HEADER ------------------------------------------------ */}
      <header className="bg-white/70 backdrop-blur-lg border-b border-gray-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Image
              src="/logo.png"
              alt="logo"
              width={32}
              height={32}
              className="w-9 h-9"
            />
            <h1 className="text-2xl font-extrabold text-gray-900">
              SmartQuote<span className="text-blue-600">.ai</span>
            </h1>
          </div>

          <div className="hidden sm:flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-1.5 rounded-full text-sm font-semibold border border-blue-100">
            <Sparkles size={16} />
            Enterprise Agent System
          </div>
        </div>
      </header>

      {/* ------------------------------------------------ TABS ------------------------------------------------ */}
      <div className="flex bg-white p-1 rounded-xl shadow-inner w-max mx-auto mt-8">
        <button
          onClick={() => setActiveTab("create")}
          className={`px-6 py-2.5 text-sm font-bold rounded-lg ${
            activeTab === "create"
              ? "bg-blue-600 text-white shadow-lg"
              : "text-gray-600 hover:text-blue-600"
          }`}
        >
          Create Quote
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`px-6 py-2.5 text-sm font-bold rounded-lg ${
            activeTab === "history"
              ? "bg-blue-600 text-white shadow-lg"
              : "text-gray-600 hover:text-blue-600"
          }`}
        >
          History
        </button>
      </div>

      {/* ------------------------------------------------ TITLE ------------------------------------------------ */}
      <section className="text-center mt-12 mb-14 px-6">
        <div className="inline-flex items-center gap-2 bg-white px-5 py-2 rounded-full border shadow-sm mb-4">
          <span className="bg-indigo-100 text-indigo-600 p-1.5 rounded-full">
            <Sparkles size={18} />
          </span>
          <span className="text-sm font-semibold text-slate-600">
            AI-Powered Generator
          </span>
        </div>

        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900">
          Smart Quotation{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-600">
            Generator
          </span>
        </h1>

        <p className="text-lg text-slate-600 mt-3 max-w-2xl mx-auto">
          Generate professional quotations instantly — just describe your
          requirements.
        </p>
      </section>

      {/* ------------------------------------------------ CREATE TAB ------------------------------------------------ */}
      {activeTab === "create" && (
        <div className="max-w-5xl mx-auto px-6">
          {/* --- INPUT AREA --- */}
          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-7 mb-10">
            <h2 className="text-2xl font-bold text-gray-900">
              Create New Quotation
            </h2>
            <p className="text-gray-500 text-sm mt-1 mb-5">
              Describe customer requirements. Agents will detect SKUs, pricing &
              recommendations.
            </p>

            {/* TEXTAREA */}
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="E.g., Need quote for 1 UXG-Enterprise, 3 E7 APs and 6 UVC-G6 Dome Cameras for Google"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 min-h-[120px] text-gray-700 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 outline-none"
            />

            {/* BUTTON ROW */}
            <div className="flex items-center justify-between mt-4">
              {/* Multi-agent badge */}
              <div className="text-xs text-green-600 mt-3 flex items-center gap-2">
                <CheckCircle2 size={14} /> Multi-Agent System Active
              </div>

              {/* BUTTONS: Voice + Generate */}
              <div className="flex items-center gap-3">
                {/* Voice Button */}
                <button
                  onClick={toggleVoiceInput}
                  className={`p-3 rounded-full border ${
                    isListening
                      ? "bg-red-500 text-white border-red-500"
                      : "bg-white text-gray-600 border-gray-300 hover:bg-gray-100"
                  }`}
                >
                  {isListening ? <MicOff size={18} /> : <Mic size={18} />}
                </button>

                {/* Generate Button */}
                <button
                  onClick={generateQuotation}
                  disabled={analyzing || !prompt.trim()}
                  className={`flex items-center gap-2 px-8 py-3.5 rounded-xl text-white font-semibold shadow-md transition-all
                    ${
                      generating || !prompt.trim()
                        ? "bg-gray-300 cursor-not-allowed"
                        : "bg-gradient-to-r from-indigo-600 to-blue-600 hover:-translate-y-0.5"
                    }`}
                >
                  {analyzing ? (
                    <>
                      <Loader2 size={20} className="animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Sparkles size={18} className="opacity-80" />
                      Generate Quotation
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* --- RESULT SECTION --- */}
          {(products.length > 0 || finalResult) && (
            <div className="bg-white rounded-3xl shadow-xl border border-gray-200 overflow-hidden">
              {/* ---------------- Metadata ---------------- */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 bg-gray-50 border-b">
                {/* Client */}
                <div>
                  <label className="text-xs text-gray-500 font-semibold uppercase">
                    Client Name
                  </label>
                  <div className="flex items-center bg-white border rounded-xl px-3 py-2.5 mt-1">
                    <User size={16} className="text-gray-400 mr-3" />
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Valued Customer"
                      className="w-full text-sm outline-none"
                    />
                  </div>
                </div>

                {/* Issue Date */}
                <div>
                  <label className="text-xs text-gray-500 font-semibold uppercase">
                    Issue Date
                  </label>
                  <div className="flex items-center bg-white border rounded-xl px-3 py-2.5 mt-1">
                    <Calendar size={16} className="text-gray-400 mr-3" />
                    <input
                      type="date"
                      value={invoiceDate}
                      onChange={(e) => setInvoiceDate(e.target.value)}
                      className="w-full text-sm outline-none"
                    />
                  </div>
                </div>

                {/* Valid Until */}
                <div>
                  <label className="text-xs text-gray-500 font-semibold uppercase">
                    Valid Until
                  </label>
                  <div className="flex items-center bg-white border rounded-xl px-3 py-2.5 mt-1">
                    <Calendar size={16} className="text-gray-400 mr-3" />
                    <input
                      type="date"
                      value={validityDate}
                      onChange={(e) => setValidityDate(e.target.value)}
                      className="w-full text-sm outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* ---------------- Items + Table ---------------- */}
              <div className="p-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 gap-4">
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                    Review & Edit Items
                  </h3>

                  {/* SmartSearch */}
                  <div className="md:w-80 w-full">
                    <SmartSearch onAddProduct={addProductFromSearch} />
                  </div>
                </div>

                {/* TABLE */}
                <div className="overflow-x-auto border rounded-xl shadow-sm">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-100 text-gray-600 font-semibold">
                      <tr>
                        <th className="p-4 text-left">Product</th>
                        <th className="p-4 w-24 text-center">Qty</th>
                        <th className="p-4 w-32 text-right">Unit Price</th>
                        <th className="p-4 w-32 text-right">Total</th>
                        <th className="p-4"></th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-gray-100">
                      {products.map((item, idx) => (
                        <tr key={idx} className="hover:bg-blue-50/50">
                          {/* Product */}
                          <td className="p-4">
                            <div className="flex items-center gap-4">
                              {item.thumbnail ? (
                                <img
                                  src={item.thumbnail}
                                  className="w-12 h-12 rounded-lg border bg-white object-contain"
                                  alt="thumb"
                                />
                              ) : (
                                <Package className="text-gray-300" size={20} />
                              )}

                              <div>
                                <p className="font-bold text-gray-900">
                                  {item.name}
                                </p>
                                <span className="text-[10px] bg-gray-200 px-2 py-0.5 rounded font-mono">
                                  {item.sku}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Qty */}
                          <td className="p-4 text-center">
                            <input
                              type="number"
                              min={1}
                              value={item.quantity}
                              onChange={(e) =>
                                updateQuantity(idx, Number(e.target.value))
                              }
                              className="w-16 p-2 border rounded-lg text-center outline-none"
                            />
                          </td>

                          {/* Unit Price */}
                          <td className="p-4 text-right">
                            <input
                              type="number"
                              min={0}
                              value={item.unit_price}
                              onChange={(e) =>
                                updatePrice(idx, Number(e.target.value))
                              }
                              className="w-24 p-2 border rounded-lg text-right outline-none"
                            />
                          </td>

                          {/* Total */}
                          <td className="p-4 text-right font-bold">
                            ${item.line_total.toLocaleString()}
                          </td>

                          {/* Delete */}
                          <td className="p-4 text-center">
                            <button
                              onClick={() => removeProduct(idx)}
                              className="text-gray-400 hover:text-red-600"
                            >
                              <Trash2 size={18} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* ---------------- Total Summary ---------------- */}
                <div className="mt-10 flex flex-col items-end">
                  <div className="w-full md:w-80 bg-gray-50 p-6 rounded-xl border space-y-3">
                    <div className="flex justify-between text-gray-600">
                      <span>Subtotal</span>
                      <span className="font-medium">
                        ${subtotal.toLocaleString()}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm">Discount (%)</span>
                      <input
                        type="number"
                        value={discountRate}
                        onChange={(e) =>
                          setDiscountRate(Number(e.target.value))
                        }
                        className="w-20 p-1.5 border rounded text-right outline-none"
                      />
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm">Tax (%)</span>
                      <input
                        type="number"
                        value={taxRate}
                        onChange={(e) => setTaxRate(Number(e.target.value))}
                        className="w-20 p-1.5 border rounded text-right outline-none"
                      />
                    </div>

                    <div className="border-t pt-4 mt-2 flex justify-between">
                      <span className="font-bold text-gray-700">
                        Grand Total
                      </span>
                      <span className="text-2xl font-black text-blue-600">
                        ${grandTotal.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* ---------------- Final Action ---------------- */}
                <div className="border-t mt-10 pt-6 flex justify-end">
                  {finalResult ? (
                    <div className="bg-green-50 border border-green-200 p-5 rounded-xl flex flex-col md:flex-row items-center justify-between w-full gap-4">
                      <div className="flex items-center gap-4">
                        <div className="bg-green-100 p-3 rounded-full">
                          <CheckCircle2 size={26} className="text-green-600" />
                        </div>
                        <div>
                          <h3 className="font-bold text-green-800 text-lg">
                            Invoice Generated: {finalResult.invoice_no}
                          </h3>
                          <p className="text-sm text-green-700">
                            Your PDF is ready.
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <button
                          onClick={() => setFinalResult(null)}
                          className="px-4 py-2 text-sm font-semibold border-1 text-green-700 hover:bg-green-100 rounded-lg"
                        >
                          Create Another
                        </button>

                        <button
                          onClick={() =>
                            forceDownload(
                              finalResult.pdf_url,
                              `${finalResult.invoice_no}.pdf`
                            )
                          }
                          className="bg-green-600 hover:bg-green-700 text-white flex items-center px-6 py-3.5 rounded-lg font-bold shadow-lg"
                        >
                          <Download size={20} /> Download PDF
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={handleFinalize}
                      disabled={generating}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-bold shadow-lg flex items-center gap-3"
                    >
                      {generating ? (
                        <Loader2 className="animate-spin" />
                      ) : (
                        <FileText />
                      )}
                      {generating
                        ? "Generating Document..."
                        : "Confirm & Generate PDF"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------ HISTORY TAB ------------------------------------------------ */}
      {activeTab === "history" && (
        <div className="max-w-4xl mx-auto px-6 mt-8 bg-white rounded-3xl shadow-xl border">
          <div className="p-6 border-b bg-gray-50 flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Quotation History
              </h2>
              <p className="text-sm text-gray-500">
                View or download your previous quotations.
              </p>
            </div>
            <button
              onClick={fetchHistory}
              className="text-blue-600 hover:bg-blue-100 p-2 rounded-full"
            >
              <RefreshCcw size={20} />
            </button>
          </div>

          {history.length === 0 ? (
            <div className="p-16 text-center text-gray-400 flex flex-col items-center">
              <History size={46} className="opacity-20 mb-3" />
              <p>No history found yet.</p>
              <button
                onClick={() => setActiveTab("create")}
                className="text-blue-600 mt-2 hover:underline"
              >
                Create your first quote
              </button>
            </div>
          ) : (
            history.map((file, i) => (
              <div
                key={i}
                className="p-5 flex justify-between items-center border-b hover:bg-gray-50"
              >
                <div className="flex items-center gap-4">
                  <div className="bg-blue-50 text-blue-600 p-3 rounded-xl">
                    <FileText size={22} />
                  </div>
                  <div>
                    <p className="font-bold text-gray-800">{file.filename}</p>
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <Calendar size={12} /> {file.created_at}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <a
                    href={file.url}
                    target="_blank"
                    className="px-4 py-2 bg-white border rounded-lg text-gray-700 hover:bg-gray-100 flex gap-2 items-center text-xs font-semibold"
                  >
                    <ExternalLink size={14} /> View
                  </a>

                  <button
                    onClick={() => forceDownload(file.url, file.filename)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex gap-2 items-center text-xs font-semibold"
                  >
                    <Download size={14} /> Download
                  </button>

                  <button
                    onClick={() => deleteHistory(file.filename)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* FOOTER SECTION */}
      <div className="mt-auto border-t border-gray-200 bg-white">
        <div className="max-w-6xl mx-auto px-6 py-6 flex flex-col md:flex-row justify-between items-center gap-2 text-xs text-gray-500">
          <div className="flex items-center gap-2">
            <Image
              src="/logo.png"
              alt="Logo"
              width={20}
              height={20}
              className="opacity-70"
            />
            <span className="font-bold text-gray-600">
              S-MAG: Smart Multi-Agent Quotation Generator
            </span>
          </div>
          <div className="text-center md:text-right">
            <p>
              &copy; {new Date().getFullYear()} Developed by{" "}
              <span className="font-semibold text-blue-600">Zaki Noorani</span>
            </p>
            <p className="mt-0.5">
              Powered by{" "}
              <span className="font-medium text-gray-700">Gemini</span> and{" "}
              <span className="font-medium text-gray-700">Google ADK</span>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
