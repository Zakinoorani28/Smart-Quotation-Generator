# Use official lightweight Python image
FROM python:3.11-slim

# 1. Install System Dependencies for WeasyPrint
# WeasyPrint needs Pango, Cairo, and GDK-Pixbuf to render PDFs
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    python3-cffi \
    python3-brotli \
    libpango-1.0-0 \
    libpangoft2-1.0-0 \
    libharfbuzz0b \
    libgdk-pixbuf2.0-0 \
    libcairo2 \
    libffi-dev \
    shared-mime-info \
    fonts-liberation \
    fonts-dejavu-core \
    && rm -rf /var/lib/apt/lists/*

# 2. Set working directory
WORKDIR /app

# 3. Copy requirements FIRST (for Docker caching)
# This assumes you are building from inside the 'backend' folder
COPY requirements.txt .

# 4. Install Python dependencies
RUN pip install --upgrade pip setuptools wheel
RUN pip install --no-cache-dir -r requirements.txt

# 5. Copy the rest of the application code
COPY . .

# 6. Create the storage directory for PDFs
# Cloud Run allows writing to /tmp or application directories (ephemeral)
RUN mkdir -p /app/storage/pdfs

# 7. Environment Setup
ENV PYTHONUNBUFFERED=1
ENV PORT=8080

# 8. Run the application
# We explicitly bind to 0.0.0.0 and the PORT env variable for Cloud Run
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]