# S-MAG: Smart Multi-Agent Quotation Generator 🤖💼

<div align="center">
  <img src="frontend/public/logo.png" alt="S-MAG Logo" width="120">
  <h3>Enterprise-Grade CPQ System Powered by Google Gemini</h3>
  <p>Transform language requests into professional, sequential PDF quotations instantly.</p>
</div>

---

## 🚀 The Problem

In the enterprise network industry (Ubiquiti, ZKTeco, MikroTik), sales engineers waste hours manually:

1.  Looking up complex SKUs (e.g., _"Was that the 24-port PoE or PoE+ switch?"_).
2.  Calculating taxes, discounts, and totals.
3.  Formatting professional PDF invoices.

A single typo in a SKU can cost thousands of dollars in returns. **S-MAG solves this by using AI Agents to bridge the gap between human intent and inventory data.**

## 💡 The Solution: Multi-Agent Architecture

S-MAG is not just a chatbot. It is a **Multi-Agent System** that orchestrates specialized tasks:

1.  **🧠 Extraction Agent (Gemini 2.5 Flash):** Parses unstructured voice/text (e.g., _"Need 5 biometric locks for Microtech Inc"_) into structured JSON.
2.  **📦 Product Resolution Agent:** Uses fuzzy logic + token-based matching to find exact SKUs (e.g., maps "unifi 48 switch" -> `US-48-500W`).
3.  **💰 Pricing Agent:** Handles unit price retrieval, currency standardization, and line-item calculations.
4.  **🎨 Formatting Agent:** Generates pixel-perfect, branded PDF quotations with embedded product images.
5.  **🛡️ Review Agent:** Validates the final data structure before generation.

## ✨ Key Features

- **🎤 Voice-to-Quote:** Use the Web Speech API to dictate requirements hands-free.
- **🔍 Smart Inventory Search:** Real-time, token-based search finds products even if you don't know the exact SKU.
- **📄 Enterprise PDF Generation:** Creates sequential invoices (`SQ-20251201-0001`) with legal terms and product thumbnails.
- **✏️ Edit-Before-Finalize:** Review AI suggestions, adjust quantities/prices, and apply Tax/Discounts before locking the invoice.
- **💾 History Tracking:** View, download, and manage past quotations.

## 🛠️ Tech Stack

- **Frontend:** Next.js 14 (React), Tailwind CSS, Lucide UI.
- **Backend:** FastAPI (Python 3.11), Uvicorn.
- **AI Engine:** Google Gemini 2.5 Flash via Google AI Studio.
- **PDF Engine:** WeasyPrint (Headless).
- **Deployment:** Google Cloud Run (Backend) + Vercel (Frontend).

## 🔧 Setup & Installation

### Prerequisites

- Node.js 18+
- Python 3.11+
- Google Cloud Project (for Gemini API)

### 1. Backend Setup

```bash
cd backend
# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
# Create a .env file and add: GEMINI_API_KEY=your_key_here

# Run Server
uvicorn main:app --reload
```
