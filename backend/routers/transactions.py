from typing import List, Optional
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, or_, func

from database import get_db
from models import User, Transaction, Category
from auth import get_current_user
from schemas import TransactionCreate, TransactionUpdate, TransactionOut, TransactionListResponse

router = APIRouter()


def _q_with_filters(db, mes=None, tipo=None, categoria_id=None, search=None, fecha_desde=None, fecha_hasta=None):
    q = db.query(Transaction).options(joinedload(Transaction.categoria_rel))

    if mes:
        try:
            year, month = mes.split("-")
            start = date(int(year), int(month), 1)
            if int(month) == 12:
                end = date(int(year) + 1, 1, 1)
            else:
                end = date(int(year), int(month) + 1, 1)
            q = q.filter(Transaction.fecha >= start, Transaction.fecha < end)
        except Exception:
            pass

    if fecha_desde:
        q = q.filter(Transaction.fecha >= fecha_desde)
    if fecha_hasta:
        q = q.filter(Transaction.fecha <= fecha_hasta)
    if tipo:
        q = q.filter(Transaction.tipo == tipo)
    if categoria_id:
        q = q.filter(Transaction.categoria_id == categoria_id)
    if search:
        q = q.filter(Transaction.concepto.ilike(f"%{search}%"))

    return q


def _serialize(tx: Transaction) -> TransactionOut:
    data = {
        "id": tx.id,
        "fecha": tx.fecha,
        "fecha_n8n": tx.fecha_n8n,
        "concepto": tx.concepto,
        "tipo": tx.tipo,
        "monto": tx.monto,
        "moneda": tx.moneda,
        "categoria_id": tx.categoria_id,
        "fuente": tx.fuente,
        "created_at": tx.created_at,
        "categoria": tx.categoria_rel,
    }
    return TransactionOut(**{k: v for k, v in data.items()})


@router.get("", response_model=TransactionListResponse)
def list_transactions(
    mes: Optional[str] = Query(None, description="YYYY-MM"),
    tipo: Optional[str] = None,
    categoria_id: Optional[int] = None,
    search: Optional[str] = None,
    fecha_desde: Optional[date] = None,
    fecha_hasta: Optional[date] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    q = _q_with_filters(db, mes, tipo, categoria_id, search, fecha_desde, fecha_hasta)
    total = q.count()
    items = q.order_by(Transaction.fecha.desc(), Transaction.id.desc()).offset((page - 1) * limit).limit(limit).all()
    return TransactionListResponse(total=total, items=[_serialize(t) for t in items])


@router.get("/{tx_id}", response_model=TransactionOut)
def get_transaction(
    tx_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    tx = db.query(Transaction).options(joinedload(Transaction.categoria_rel)).filter(Transaction.id == tx_id).first()
    if not tx:
        raise HTTPException(status_code=404, detail="Transacción no encontrada")
    return _serialize(tx)


@router.post("", response_model=TransactionOut, status_code=201)
def create_transaction(
    data: TransactionCreate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    tx = Transaction(**data.model_dump())
    db.add(tx)
    db.commit()
    db.refresh(tx)
    # Reload with relationship
    tx = db.query(Transaction).options(joinedload(Transaction.categoria_rel)).filter(Transaction.id == tx.id).first()
    return _serialize(tx)


@router.put("/{tx_id}", response_model=TransactionOut)
def update_transaction(
    tx_id: int,
    data: TransactionUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    tx = db.query(Transaction).filter(Transaction.id == tx_id).first()
    if not tx:
        raise HTTPException(status_code=404, detail="Transacción no encontrada")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(tx, field, value)
    db.commit()
    tx = db.query(Transaction).options(joinedload(Transaction.categoria_rel)).filter(Transaction.id == tx_id).first()
    return _serialize(tx)


@router.delete("/{tx_id}", status_code=204)
def delete_transaction(
    tx_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    tx = db.query(Transaction).filter(Transaction.id == tx_id).first()
    if not tx:
        raise HTTPException(status_code=404, detail="Transacción no encontrada")
    db.delete(tx)
    db.commit()
