import json
import os
from datetime import datetime

COUNTER_FILE = "data/invoice_counter.json"

def get_next_invoice_number():
    # Default structure if file doesn't exist
    data = {"date": "", "sequence": 0}
    
    # Read existing counter
    if os.path.exists(COUNTER_FILE):
        with open(COUNTER_FILE, "r") as f:
            try:
                data = json.load(f)
            except:
                pass

    today_str = datetime.now().strftime("%Y%m%d")

    # Reset sequence if it's a new day
    if data["date"] != today_str:
        data["date"] = today_str
        data["sequence"] = 1
    else:
        data["sequence"] += 1

    # Save new state
    os.makedirs("data", exist_ok=True)
    with open(COUNTER_FILE, "w") as f:
        json.dump(data, f)

    # Format: SQ-20251130-0001
    return f"SQ-{today_str}-{data['sequence']:04d}"