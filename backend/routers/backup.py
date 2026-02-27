import json
import csv
import io
from datetime import datetime
from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse, JSONResponse
from sqlalchemy.orm import Session

from database import get_db
from models import User, Transaction, Category, MonthlyPlan, CreditCard
from auth import get_current_user

router = APIRouter()


@router.get("/json")
def export_json(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    categories = [{"id": c.id, "nombre": c.nombre, "tipo": c.tipo, "orden": c.orden, "activo": c.activo}
                  for c in db.query(Category).all()]
    transactions = [
        {
            "id": t.id, "fecha_n8n": t.fecha_n8n,
            "fecha": t.fecha.isoformat() if t.fecha else None,
            "concepto": t.concepto, "tipo": t.tipo,
            "monto": t.monto, "moneda": t.moneda,
            "categoria_id": t.categoria_id, "fuente": t.fuente,
            "created_at": t.created_at.isoformat() if t.created_at else None,
        }
        for t in db.query(Transaction).all()
    ]
    plans = [
        {
            "id": p.id, "mes": p.mes.isoformat(), "categoria_id": p.categoria_id,
            "tipo": p.tipo, "monto_planificado": p.monto_planificado,
            "es_recurrente": p.es_recurrente, "detalle": p.detalle,
        }
        for p in db.query(MonthlyPlan).all()
    ]
    cards = [
        {
            "id": c.id, "concepto": c.concepto, "tarjeta": c.tarjeta,
            "monto_cuota": c.monto_cuota, "cuota_actual": c.cuota_actual,
            "cuotas_totales": c.cuotas_totales, "activo": c.activo, "nota": c.nota,
        }
        for c in db.query(CreditCard).all()
    ]

    data = {
        "exported_at": datetime.utcnow().isoformat(),
        "categories": categories,
        "transactions": transactions,
        "monthly_plans": plans,
        "credit_cards": cards,
    }
    content = json.dumps(data, ensure_ascii=False, indent=2)
    return StreamingResponse(
        io.StringIO(content),
        media_type="application/json",
        headers={"Content-Disposition": f"attachment; filename=finanzas_backup_{datetime.now().strftime('%Y%m%d')}.json"},
    )


@router.get("/csv")
def export_csv(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    transactions = (
        db.query(Transaction, Category.nombre)
        .outerjoin(Category, Transaction.categoria_id == Category.id)
        .order_by(Transaction.fecha.desc())
        .all()
    )

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["id", "fecha", "fecha_n8n", "concepto", "tipo", "monto", "moneda", "categoria", "fuente", "created_at"])
    for tx, cat_nombre in transactions:
        writer.writerow([
            tx.id, tx.fecha, tx.fecha_n8n, tx.concepto, tx.tipo,
            tx.monto, tx.moneda, cat_nombre or "", tx.fuente,
            tx.created_at.isoformat() if tx.created_at else "",
        ])

    output.seek(0)
    return StreamingResponse(
        output,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=transacciones_{datetime.now().strftime('%Y%m%d')}.csv"},
    )
