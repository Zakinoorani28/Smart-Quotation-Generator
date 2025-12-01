class ReviewAgent:
    def __init__(self):
        pass

    def validate(self, items):
        """
        Returns a list of review notes and warnings.
        """

        notes = []

        if not items or len(items) == 0:
            notes.append("No products detected in the request.")
            return notes

        for item in items:

            if item.get("quantity", 0) <= 0:
                notes.append(f"Quantity for {item['name']} seems invalid.")

            if item.get("unit_price", 0) <= 0:
                notes.append(f"Price missing for {item['name']}. Using fallback price.")

            if len(item.get("short_description", "")) < 20:
                notes.append(f"Short Description for {item['name']} might be too short.")

        if len(items) > 5:
            notes.append("Large quotation detected — consider adding a discount.")

        return notes
