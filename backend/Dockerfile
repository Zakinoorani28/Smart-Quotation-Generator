# Use specific stable version (Bookworm) to prevent breaking changes
FROM python:3.11-slim-bookworm

# 1. Install System Dependencies for WeasyPrint
# Fixed package names for Debian Bookworm
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    python3-cffi \
    python3-brotli \
    libpango-1.0-0 \
    libpangoft2-1.0-0 \
    libharfbuzz0b \
    libgdk-pixbuf-2.0-0 \
    libcairo2 \
    libffi-dev \
    shared-mime-info \
    fonts-liberation \
    fonts-dejavu-core \
    && rm -rf /var/lib/apt/lists/*

# 2. Set working directory
WORKDIR /app

# 3. Copy requirements
COPY requirements.txt .

# 4. Install Python dependencies
RUN pip install --upgrade pip setuptools wheel
RUN pip install --no-cache-dir -r requirements.txt

# 5. Copy the rest of the application code
COPY . .

# FORCE COPY DATA FOLDER (Just to be safe)
COPY data /app/data

# 6. Create storage directory
RUN mkdir -p /app/storage/pdfs

# 7. Environment Setup
ENV PYTHONUNBUFFERED=1
ENV PORT=8080

# 8. Run the application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]