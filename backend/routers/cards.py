from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import User, CreditCard
from auth import get_current_user
from schemas import CreditCardCreate, CreditCardUpdate, CreditCardOut

router = APIRouter()


@router.get("", response_model=List[CreditCardOut])
def list_cards(
    activo: bool = True,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    q = db.query(CreditCard)
    if activo is not None:
        q = q.filter(CreditCard.activo == activo)
    return q.order_by(CreditCard.tarjeta, CreditCard.concepto).all()


@router.post("", response_model=CreditCardOut, status_code=201)
def create_card(
    data: CreditCardCreate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    card = CreditCard(**data.model_dump())
    db.add(card)
    db.commit()
    db.refresh(card)
    return card


@router.put("/{card_id}", response_model=CreditCardOut)
def update_card(
    card_id: int,
    data: CreditCardUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    card = db.query(CreditCard).filter(CreditCard.id == card_id).first()
    if not card:
        raise HTTPException(status_code=404, detail="Cuota no encontrada")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(card, field, value)
    # Auto-deactivate when last installment paid
    if card.cuota_actual >= card.cuotas_totales:
        card.activo = False
    db.commit()
    db.refresh(card)
    return card


@router.post("/{card_id}/advance", response_model=CreditCardOut)
def advance_installment(
    card_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    """Advance cuota_actual by 1."""
    card = db.query(CreditCard).filter(CreditCard.id == card_id).first()
    if not card:
        raise HTTPException(status_code=404, detail="Cuota no encontrada")
    if card.cuota_actual >= card.cuotas_totales:
        raise HTTPException(status_code=400, detail="La cuota ya está completada")
    card.cuota_actual += 1
    if card.cuota_actual >= card.cuotas_totales:
        card.activo = False
    db.commit()
    db.refresh(card)
    return card


@router.delete("/{card_id}", status_code=204)
def delete_card(
    card_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    card = db.query(CreditCard).filter(CreditCard.id == card_id).first()
    if not card:
        raise HTTPException(status_code=404, detail="Cuota no encontrada")
    db.delete(card)
    db.commit()
