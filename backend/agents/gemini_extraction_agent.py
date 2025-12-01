import google.generativeai as genai
import os
import json
import re

from dotenv import load_dotenv
load_dotenv()

# Load API key
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

class GeminiExtractionAgent:
    def __init__(self):
        # Use a model version that is stable and available for your key
        # 'gemini-2.5-flash' is generally faster/cheaper if available, else 'gemini-pro'
        self.model_name = "gemini-2.5-flash" 

    def extract(self, prompt: str):
        """
        Extracts product requirements from natural language into structured JSON.
        """
        
        system_prompt = """
        You are an expert sales engineer and quotation agent.
        
        Your Goal: 
        Extract a list of products from the user's request.
        
        Output Format (STRICT JSON):
        {
          "customer_name": "Client Name if mentioned, else null",
          "items": [
            {
              "sku": "Extracted SKU if explicit (e.g., UXG-Enterprise)",
              "name": "Product Name (e.g., UniFi Gateway, ZKTeco Terminal)",
              "quantity": 1
            }
          ]
        }

        Rules:
        1. If the user mentions a specific model (e.g., 'UXG-Enterprise'), put it in 'sku'.
        2. If the user just says '5 cameras', put 'Camera' in 'name' and 5 in 'quantity'.
        3. Default quantity is 1 if not specified.
        4. Do not markdown the output. Just plain JSON.
        """

        # Combine system + user
        # Note: The call structure depends on the library version. 
        # This is the standard generating content call.
        try:
            model = genai.GenerativeModel(self.model_name)
            
            response = model.generate_content(f"{system_prompt}\n\nUSER REQUEST:\n{prompt}")
            
            raw = response.text.strip()

            # --- CLEAN JSON (Remove Markdown ```json ... ```) ---
            # This regex finds the first { and the last } to capture the JSON object
            json_match = re.search(r"\{[\s\S]*\}", raw)
            
            if json_match:
                clean_json = json_match.group(0)
                return json.loads(clean_json)
            
            # Fallback if regex fails but text looks like json
            return json.loads(raw)

        except Exception as e:
            print(f"GEMINI EXTRACTION ERROR: {e}")
            # Return empty structure to prevent crashes
            return {"items": []}