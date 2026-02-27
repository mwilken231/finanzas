"""Bot/n8n compatible API endpoints (support API key authentication)."""
from typing import Optional
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload

from database import get_db
from models import User, Transaction, Category
from auth import get_current_user_or_api_key
from schemas import BotTransactionCreate, TransactionOut, CategoryOut
from routers.transactions import _serialize

router = APIRouter()


@router.post("/transactions", response_model=TransactionOut, status_code=201)
def bot_create_transaction(
    data: BotTransactionCreate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user_or_api_key),
):
    # Resolve category by name
    categoria_id = None
    if data.categoria:
        cat = db.query(Category).filter(Category.nombre.ilike(data.categoria)).first()
        if cat:
            categoria_id = cat.id

    # Use fecha_n8n date if fecha not provided
    tx_date = data.fecha
    if not tx_date and data.fecha_n8n:
        try:
            from datetime import datetime
            dt = datetime.fromisoformat(data.fecha_n8n.replace("Z", "+00:00"))
            tx_date = dt.date()
        except Exception:
            tx_date = date.today()
    if not tx_date:
        tx_date = date.today()

    tx = Transaction(
        fecha_n8n=data.fecha_n8n,
        fecha=tx_date,
        concepto=data.concepto,
        tipo=data.tipo,
        monto=data.monto,
        moneda=data.moneda,
        categoria_id=categoria_id,
        fuente="telegram_bot",
    )
    db.add(tx)
    db.commit()
    db.refresh(tx)
    tx = db.query(Transaction).options(joinedload(Transaction.categoria_rel)).filter(Transaction.id == tx.id).first()
    return _serialize(tx)


@router.get("/transactions")
def bot_list_transactions(
    mes: Optional[str] = Query(None, description="YYYY-MM"),
    tipo: Optional[str] = None,
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user_or_api_key),
):
    from routers.transactions import _q_with_filters
    q = _q_with_filters(db, mes=mes, tipo=tipo)
    items = q.order_by(Transaction.fecha.desc()).limit(limit).all()
    return [_serialize(t) for t in items]


@router.get("/categories", response_model=list[CategoryOut])
def bot_list_categories(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user_or_api_key),
):
    return db.query(Category).order_by(Category.orden).all()


@router.get("/dashboard/summary")
def bot_dashboard_summary(
    mes: str = Query(..., description="YYYY-MM"),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user_or_api_key),
):
    from routers.dashboard import summary
    return summary(mes=mes, db=db, _=_)
