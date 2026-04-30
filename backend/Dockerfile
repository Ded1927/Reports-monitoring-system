FROM python:3.11-slim-bookworm

WORKDIR /app

# Upgrade system libraries and install dependencies for psycopg2 and argon2
RUN apt-get update && apt-get upgrade -y && apt-get install -y gcc libpq-dev && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Set non-root user for security
RUN useradd -m -U appuser && chown -R appuser:appuser /app
USER appuser

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload", "--no-access-log"]
