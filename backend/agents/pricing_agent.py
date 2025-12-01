class PricingAgent:
    def __init__(self):
        # Default margin rules (can be updated later)
        self.default_margin = 0.10  # 10% markup

    def process(self, products):
        """
        Takes extracted products and applies pricing.
        Returns: priced_items_list, grand_total
        """

        priced_items = []
        grand_total = 0

        for item in products:
            base_price = item.get("price", 50)  # fallback dummy price
            margin_price = base_price + (base_price * self.default_margin)

            quantity = item.get("quantity", 1)
            line_total = margin_price * quantity

            priced_items.append({
                "sku": item["sku"],
                "name": item["name"],
                "quantity": quantity,
                "unit_price": round(margin_price, 2),
                "line_total": round(line_total, 2),
                "thumbnail": item.get("thumbnail"),
                "description": item.get("short_description")
            })

            grand_total += line_total

        return priced_items, round(grand_total, 2)
