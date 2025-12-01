import os
import requests
import base64
from io import BytesIO
from PIL import Image
from weasyprint import HTML, CSS
from weasyprint.text.fonts import FontConfiguration

def image_to_base64(url):
    """
    Downloads an image, converts it to PNG, and returns Base64 string.
    """
    if not url:
        return None
    try:
        # Fake a browser user agent
        headers = {'User-Agent': 'Mozilla/5.0'}
        response = requests.get(url, headers=headers, timeout=5)
        
        if response.status_code == 200:
            img = Image.open(BytesIO(response.content))
            
            # Convert to RGB (fix for RGBA/P modes)
            if img.mode in ("RGBA", "P"):
                img = img.convert("RGB")
                
            buffered = BytesIO()
            img.save(buffered, format="PNG")
            img_str = base64.b64encode(buffered.getvalue()).decode("utf-8")
            return f"data:image/png;base64,{img_str}"
    except Exception as e:
        print(f"Failed to process image {url}: {e}")
        return None

def generate_pdf_from_html(html_content, output_path):
    """
    Generates a PDF using WeasyPrint.
    """
    # Ensure directory exists
    os.makedirs(os.path.dirname(output_path), exist_ok=True)

    # Configure Fonts (Optional but good for Enterprise)
    font_config = FontConfiguration()

    # Render PDF
    # WeasyPrint handles modern CSS perfectly.
    html = HTML(string=html_content)
    html.write_pdf(
        output_path, 
        font_config=font_config,
        presentational_hints=True
    )

    return output_path