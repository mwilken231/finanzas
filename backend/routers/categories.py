from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import User, Category
from auth import get_current_user
from schemas import CategoryOut, CategoryCreate, CategoryUpdate

router = APIRouter()


@router.get("", response_model=List[CategoryOut])
def list_categories(
    tipo: str = None,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    q = db.query(Category)
    if tipo:
        q = q.filter((Category.tipo == tipo) | (Category.tipo == "ambos"))
    return q.order_by(Category.orden, Category.nombre).all()


@router.post("", response_model=CategoryOut, status_code=201)
def create_category(
    data: CategoryCreate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    cat = Category(**data.model_dump())
    db.add(cat)
    db.commit()
    db.refresh(cat)
    return cat


@router.put("/{cat_id}", response_model=CategoryOut)
def update_category(
    cat_id: int,
    data: CategoryUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    cat = db.query(Category).filter(Category.id == cat_id).first()
    if not cat:
        raise HTTPException(status_code=404, detail="Categoría no encontrada")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(cat, field, value)
    db.commit()
    db.refresh(cat)
    return cat


@router.delete("/{cat_id}", status_code=204)
def delete_category(
    cat_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    cat = db.query(Category).filter(Category.id == cat_id).first()
    if not cat:
        raise HTTPException(status_code=404, detail="Categoría no encontrada")
    cat.activo = False
    db.commit()
