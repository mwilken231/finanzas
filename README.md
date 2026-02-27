# Finanzas Personales

App web de finanzas personales con API para bot de Telegram/n8n.

## Stack
- **Backend**: FastAPI + SQLite + SQLAlchemy
- **Frontend**: React 18 + Vite + Tailwind CSS + Recharts
- **Deploy**: Docker + docker-compose

## Inicio rápido

### 1. Configurar variables de entorno
```bash
cp .env.example .env
# Editar .env con tus credenciales
```

### 2. Levantar con Docker
```bash
docker-compose up -d
# App disponible en http://localhost (o el PORT configurado)
```

### 3. Importar datos históricos del Excel
```bash
# Copiar el Excel al servidor
docker cp "Plan Financiero _ FP.xlsx" finanzas_backend:/data/plan.xlsx

# Ejecutar script de importación
docker exec finanzas_backend python scripts/import_excel.py /data/plan.xlsx
```

## Desarrollo local

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

mkdir -p /data
uvicorn main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev   # http://localhost:5173
```

## API para bot de Telegram / n8n

Autenticación: header `X-API-Key: <tu_api_key>`

El API key se genera automáticamente al iniciar y se imprime en los logs del backend:
```bash
docker logs finanzas_backend | grep "API key"
```

También se puede ver/regenerar desde la UI en Settings.

### Endpoints del bot

```
POST /api/transactions
GET  /api/transactions?mes=2026-02&tipo=gasto
GET  /api/categories
GET  /api/dashboard/summary?mes=2026-02
```

### Ejemplo de payload para n8n
```json
{
  "fecha_n8n": "2026-02-15T10:30:00.000-03:00",
  "concepto": "súper",
  "tipo": "gasto",
  "monto": 16000,
  "moneda": "ARS",
  "categoria": "Alimentación & Supermercado"
}
```

## Backup

```bash
# JSON completo
curl -H "Authorization: Bearer <token>" http://localhost/backup/json > backup.json

# CSV de transacciones
curl -H "Authorization: Bearer <token>" http://localhost/backup/csv > transacciones.csv
```

## Módulos implementados

| Módulo | Estado |
|--------|--------|
| Dashboard con gráficos | ✅ Fase 1 |
| Movimientos (CRUD) | ✅ Fase 1 |
| Consolidado financiero | ✅ Fase 1 |
| Plan de gastos | ✅ Fase 2 |
| Plan de ingresos | ✅ Fase 2 |
| Cuotas / Tarjeta de crédito | ✅ Fase 3 |
| Categorías (CRUD) | ✅ Fase 3 |
| API para bot/n8n | ✅ Fase 1 |
| Importación Excel | ✅ Fase 1 |
| Backup JSON/CSV | ✅ Fase 1 |
