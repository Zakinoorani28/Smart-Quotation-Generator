from jinja2 import Environment, FileSystemLoader
import os

class FormattingAgent:
    def __init__(self):
        # Setup Jinja2 to look in the templates folder
        template_dir = os.path.join(os.getcwd(), "templates")
        self.env = Environment(loader=FileSystemLoader(template_dir))

    def generate_html_with_context(self, context: dict):
        """
        Renders the HTML template using a full context dictionary.
        This supports invoice numbers, dates, tax/discount, etc.
        """
        try:
            template = self.env.get_template("quotation_template.html")
            return template.render(**context)
        except Exception as e:
            print(f"Formatting Error: {e}")
            # Return a basic fallback HTML if template fails
            return "<html><body><h1>Error generating quotation</h1></body></html>"

    # Legacy method (kept for compatibility if needed, but generate_html_with_context is preferred)
    def generate_html(self, products, total):
        context = {
            "items": products,
            "total": total,
            "invoice_no": "DRAFT",
            "date_today": "N/A",
            "customer_name": "Valued Customer"
        }
        return self.generate_html_with_context(context)