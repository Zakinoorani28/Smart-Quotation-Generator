class PricingTool:
    def __init__(self, margin=0.10):
        self.margin = margin

    def calculate_price(self, base_price):
        """
        Apply margin to base price.
        """
        return base_price + (base_price * self.margin)

    def calculate_line_total(self, unit_price, quantity):
        return unit_price * quantity
