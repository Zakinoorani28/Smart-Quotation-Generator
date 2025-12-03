from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import List, Optional
import glob
import os
import base64
from datetime import datetime

#AGENTS
from agents.product_agent import ProductAgent
from agents.pricing_agent import PricingAgent
from agents.formatting_agent import FormattingAgent
from agents.review_agent import ReviewAgent
from agents.gemini_extraction_agent import GeminiExtractionAgent

from tools.pdf_generator import generate_pdf_from_html, image_to_base64
from tools.invoice_manager import get_next_invoice_number

from dotenv import load_dotenv
load_dotenv()

# --- CONFIGURATION ---
STORAGE_DIR = "storage"
PDF_DIR = os.path.join(STORAGE_DIR, "pdfs")
os.makedirs(PDF_DIR, exist_ok=True)

# ====================================================
# FASTAPI APP
# ====================================================
app = FastAPI(title="S-MAG Enterprise Backend", version="2.0.0")

# Enable CORS (Next.js frontend needs this)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- DYNAMIC URL LOGIC ---
def get_base_url():
    public_url = os.getenv("PUBLIC_URL")
    if public_url:
        return public_url.rstrip("/")
    
    # 2. In Local Development, we fallback to localhost
    return "http://127.0.0.1:8000"

BASE_URL = get_base_url()

# ====================================================
# DATA MODELS
# ====================================================

# Step 1: User Input
class AnalyzeRequest(BaseModel):
    prompt: str

# Structure of a product inside the list
class ProductItem(BaseModel):
    sku: str
    name: str
    description: Optional[str] = ""
    short_description: Optional[str] = ""
    thumbnail: Optional[str] = None
    quantity: int
    unit_price: float
    line_total: float
    brand: Optional[str] = "Generic"
    use_case: Optional[str] = ""

# Step 2: Final Data for PDF
class FinalizeRequest(BaseModel):
    customer_name: str
    invoice_date: str
    valid_until: str
    tax_rate: float = 0.0
    discount_rate: float = 0.0
    products: List[ProductItem]

# ====================================================
# ROUTE 1: GET ALL PRODUCTS (For Search Bar)
@app.get("/products")
async def get_all_products():
    """Returns all available products for the search bar"""
    product_agent = ProductAgent()
    # This now uses the robust loader we just wrote
    return product_agent.products

# ====================================================
# ROUTE 2: ANALYZE REQUEST (AI Extraction)
# ====================================================
@app.post("/analyze-request")
async def analyze_request(req: AnalyzeRequest):
    """
    Step 1: Takes user prompt, finds products, returns JSON list.
    Does NOT generate PDF yet. Allows user to edit data on frontend.
    """
    # Initialize Agents
    gemini_agent = GeminiExtractionAgent()
    product_agent = ProductAgent()
    pricing_agent = PricingAgent()

    # 1. Gemini Extraction
    try:
        extraction = gemini_agent.extract(req.prompt)
    except Exception as e:
        print("GEMINI ERROR:", e)
        extraction = {"items": [], "customer_name": ""}

    # 2. Product Matching
    matched_items = []
    for item in extraction.get("items", []):
        sku_or_name = item.get("sku") or item.get("name")
        qty = item.get("quantity", 1)
        
        found = product_agent.find_products(sku_or_name)
        
        if found:
            product = found[0] # Match the best product
            product["quantity"] = qty
            matched_items.append(product)

    # 3. Initial Pricing Calculation
    priced_items, _ = pricing_agent.process(matched_items)

    return {
        "success": True,
        "suggested_customer": extraction.get("customer_name", ""),
        "products": priced_items
    }

# ====================================================
# ROUTE 3: FINALIZE QUOTATION (Generate PDF)
# ====================================================
@app.post("/finalize-quotation")
async def finalize_quotation(req: FinalizeRequest):
    """
    Step 2: Takes edited data, calculates Tax/Discount, Converts Images,
    Generates Sequential ID, and Creates PDF.
    """
    formatting_agent = FormattingAgent()
    # review_agent = ReviewAgent()

    # 1. Recalculate Financials (Server-side math is safer)
    subtotal = sum(item.unit_price * item.quantity for item in req.products)
    
    # Update line totals just in case
    for item in req.products:
        item.line_total = item.unit_price * item.quantity

    discount_amount = subtotal * (req.discount_rate / 100)
    taxable_income = subtotal - discount_amount
    tax_amount = taxable_income * (req.tax_rate / 100)
    grand_total = taxable_income + tax_amount

    # 2. Prepare Product List & Convert Images
    # We convert Pydantic models to Dicts and handle Images here
    print("Converting images for PDF...")
    product_dicts = []
    
    for item in req.products:
        p_dict = item.dict()
        # Image conversion logic
        if p_dict.get('thumbnail'):
            p_dict['base64_image'] = image_to_base64(p_dict.get('thumbnail'))
        else:
            p_dict['base64_image'] = None
        product_dicts.append(p_dict)

    # 3. Get Sequential Invoice Number
    invoice_no = get_next_invoice_number()

    # 4. Prepare Data Context for HTML Template
    context = {
        "invoice_no": invoice_no,
        "quote_id": invoice_no,
        "customer_name": req.customer_name,
        "date_today": req.invoice_date,
        "valid_until": req.valid_until,
        "items": product_dicts,
        "subtotal": subtotal,
        "discount_rate": req.discount_rate,
        "discount_amount": discount_amount,
        "tax_rate": req.tax_rate,
        "tax_amount": tax_amount,
        "total": grand_total
    }

    # 5. Generate HTML from Template
    html_output = formatting_agent.generate_html_with_context(context)

    # 6. Generate PDF File
    pdf_filename = f"{invoice_no}.pdf"
    pdf_path = os.path.join("storage", "pdfs", pdf_filename)
    generate_pdf_from_html(html_output, pdf_path)

    with open(pdf_path, "rb") as f:
        pdf_bytes = f.read()
        encoded_pdf = base64.b64encode(pdf_bytes).decode('utf-8')

    return {
        "success": True,
        "invoice_no": invoice_no,
        "filename": pdf_filename,            
        "pdf_url": f"{BASE_URL}/pdf/{pdf_filename}",
        "pdf_base64": encoded_pdf,            
        "grand_total": grand_total
    }

# ====================================================
# ROUTE: HISTORY MANAGEMENT
# ====================================================
@app.get("/history")
async def get_history():
    """Returns list of generated PDFs sorted by date"""
    files = []
    pdf_dir = os.path.join("storage", "pdfs")
    os.makedirs(pdf_dir, exist_ok=True)
    
    # Get all PDF files
    paths = sorted(glob.glob(os.path.join(pdf_dir, "*.pdf")), key=os.path.getmtime, reverse=True)
    
    for p in paths:
        filename = os.path.basename(p)
        timestamp = datetime.fromtimestamp(os.path.getmtime(p)).strftime("%Y-%m-%d %H:%M")
        files.append({
            "filename": filename,
            "url": f"{BASE_URL}/pdf/{filename}",      # <--- Uses dynamic URL
            "created_at": timestamp
        })
    return files

@app.delete("/history/{filename}")
async def delete_history(filename: str):
    """Deletes a specific PDF file"""
    file_path = os.path.join("storage", "pdfs", filename)
    if os.path.exists(file_path):
        os.remove(file_path)
        return {"success": True, "message": "File deleted"}
    raise HTTPException(status_code=404, detail="File not found")

# ====================================================
# ROUTE: SERVE PDF FILE
# ====================================================
@app.get("/pdf/{filename}")
async def serve_pdf(filename: str, download: bool = False):
    file_path = os.path.join("storage", "pdfs", filename)
    if os.path.exists(file_path):
        headers = {}
        # If ?download=true is passed, force browser to download instead of view
        if download:
            headers["Content-Disposition"] = f'attachment; filename="{filename}"'
        return FileResponse(file_path, media_type="application/pdf", headers=headers)
    raise HTTPException(status_code=404, detail="PDF not found")
