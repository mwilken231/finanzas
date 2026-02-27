#!/bin/bash
cd "$(dirname "$0")/backend"
mkdir -p /tmp/finanzas_db
export DATABASE_URL="sqlite:////tmp/finanzas_db/finanzas.db"
export SECRET_KEY="dev-secret-key"
export ADMIN_USERNAME="admin"
export ADMIN_PASSWORD="changeme"
source venv/bin/activate
uvicorn main:app --reload --port 8000
