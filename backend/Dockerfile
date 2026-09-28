# EyeSync Backend Service
FROM python:3.11-slim

WORKDIR /app

# Prevent Python from writing bytecode and enable unbuffered output
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Install curl for healthcheck probe
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend application, reference data, and experiments
COPY backend/ ./backend/
COPY data/ ./data/
COPY experiments/ ./experiments/

# Runtime environment defaults
ENV EYESYNC_JWT_SECRET=eyesync-screening-camp-review2-jwt-token-secret-2026
ENV EYESYNC_TOKEN_EXPIRE_MINUTES=480
ENV PORT=8000

EXPOSE 8000

# Container healthcheck probe
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:8000/api/health || exit 1

# Launch ASGI server
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
