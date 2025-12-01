import json
import os

class JSONLookupTool:
    def __init__(self):
        self.data_path = os.path.join("data", "products.json")
        with open(self.data_path, "r", encoding="utf-8") as f:
            self.products_db = json.load(f)["products"]

    def find_by_keyword(self, keyword: str):
        """
        Search products by name keyword or SKU.
        """
        keyword_lower = keyword.lower()
        results = []

        for prod in self.products_db:
            if (
                keyword_lower in prod["name"].lower()
                or keyword_lower in prod["sku"].lower()
                or keyword_lower in prod.get("brand", "").lower()
            ):
                results.append(prod)

        return results

    def get_all_products(self):
        return self.products_db
