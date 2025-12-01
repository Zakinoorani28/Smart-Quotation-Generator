import json
import re
import os

class ProductAgent:
    def __init__(self):
        # Ensure path is correct relative to where backend starts
        self.data_path = os.path.join("data", "products.json")
        self.products_db = self._load_products()

    @property
    def products(self):
        """Expose products directly for the /products endpoint"""
        return self.products_db

    def _load_products(self):
        """
        Robust loader: Handles both list [...] and dict {"products": [...]} formats.
        """
        if not os.path.exists(self.data_path):
            print(f"WARNING: Product file not found at {self.data_path}")
            return []

        try:
            with open(self.data_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                
                if isinstance(data, dict):
                    if "products" in data:
                        return data["products"]
                    return list(data.values())
                
                if isinstance(data, list):
                    return data
                
                return []
        except Exception as e:
            print(f"ERROR loading products.json: {e}")
            return []

    def process(self, prompt: str):
        return []

    def find_products(self, query: str):
        """
        SMART SEARCH with PRIORITY:
        1. Exact SKU Match (Highest Priority)
        2. SKU Contains Query
        3. Name Contains Query
        4. Description/Brand Contains Query
        """
        if not query:
            return []

        query_lower = query.lower().strip()
        
        exact_sku = []
        partial_sku = []
        name_match = []
        broad_match = []

        for product in self.products_db:
            p_sku = str(product.get("sku", "")).lower()
            p_name = str(product.get("name", "")).lower()
            p_brand = str(product.get("brand", "")).lower()
            p_desc = str(product.get("short_description", "")).lower()

            # 1. Exact SKU
            if query_lower == p_sku:
                exact_sku.append(product)
                continue

            # 2. SKU Contains
            if query_lower in p_sku:
                partial_sku.append(product)
                continue

            # 3. Name Contains
            if query_lower in p_name:
                name_match.append(product)
                continue
            
            # 4. Broad Match (Brand or Description)
            if query_lower in p_brand or query_lower in p_desc:
                broad_match.append(product)

        # Combine results in order of relevance
        all_matches = exact_sku + partial_sku + name_match + broad_match
        
        # Remove duplicates while preserving order
        return self._unique(all_matches)

    def extract_quantity(self, prompt: str, name: str, sku: str):
        prompt_lower = prompt.lower()
        name_lower = name.lower() if name else ""
        sku_lower = sku.lower() if sku else ""

        patterns = [
            rf"(\d+)\s+{re.escape(sku_lower)}",
            rf"{re.escape(sku_lower)}\s+(\d+)",
            rf"(\d+)\s+{re.escape(name_lower)}",
            rf"{re.escape(name_lower)}\s+(\d+)",
            r"qty\s+(\d+)",
        ]

        for p in patterns:
            try:
                match = re.search(p, prompt_lower)
                if match:
                    return int(match.group(1))
            except:
                continue

        return 1

    def _unique(self, items):
        seen = set()
        unique_items = []
        for item in items:
            sku = item.get("sku")
            if sku and sku not in seen:
                seen.add(sku)
                unique_items.append(item)
        return unique_items