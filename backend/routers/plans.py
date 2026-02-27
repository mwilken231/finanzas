from typing import List, Optional
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload

from database import get_db
from models import User, MonthlyPlan, Category
from auth import get_current_user
from schemas import MonthlyPlanCreate, MonthlyPlanUpdate, MonthlyPlanOut

router = APIRouter()


def _serialize_plan(p: MonthlyPlan) -> MonthlyPlanOut:
    data = {
        "id": p.id,
        "mes": p.mes,
        "categoria_id": p.categoria_id,
        "tipo": p.tipo,
        "monto_planificado": p.monto_planificado,
        "es_recurrente": p.es_recurrente,
        "detalle": p.detalle,
        "categoria": p.categoria_rel,
    }
    return MonthlyPlanOut(**data)


@router.get("", response_model=List[MonthlyPlanOut])
def list_plans(
    mes: str = Query(..., description="YYYY-MM"),
    tipo: Optional[str] = None,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    year, month = mes.split("-")
    mes_date = date(int(year), int(month), 1)
    q = db.query(MonthlyPlan).options(joinedload(MonthlyPlan.categoria_rel)).filter(MonthlyPlan.mes == mes_date)
    if tipo:
        q = q.filter(MonthlyPlan.tipo == tipo)
    return [_serialize_plan(p) for p in q.all()]


@router.post("", response_model=MonthlyPlanOut, status_code=201)
def create_plan(
    data: MonthlyPlanCreate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    plan = MonthlyPlan(**data.model_dump())
    db.add(plan)
    db.commit()
    db.refresh(plan)
    plan = db.query(MonthlyPlan).options(joinedload(MonthlyPlan.categoria_rel)).filter(MonthlyPlan.id == plan.id).first()
    return _serialize_plan(plan)


@router.put("/{plan_id}", response_model=MonthlyPlanOut)
def update_plan(
    plan_id: int,
    data: MonthlyPlanUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    plan = db.query(MonthlyPlan).filter(MonthlyPlan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan no encontrado")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(plan, field, value)
    db.commit()
    plan = db.query(MonthlyPlan).options(joinedload(MonthlyPlan.categoria_rel)).filter(MonthlyPlan.id == plan_id).first()
    return _serialize_plan(plan)


@router.delete("/{plan_id}", status_code=204)
def delete_plan(
    plan_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    plan = db.query(MonthlyPlan).filter(MonthlyPlan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan no encontrado")
    db.delete(plan)
    db.commit()


@router.post("/copy/{from_mes}", status_code=201)
def copy_plan(
    from_mes: str,
    to_mes: str = Query(..., description="YYYY-MM target month"),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    """Copy recurring plan items from one month to another."""
    fy, fm = from_mes.split("-")
    ty, tm = to_mes.split("-")
    from_date = date(int(fy), int(fm), 1)
    to_date = date(int(ty), int(tm), 1)

    # Get recurring plans from source month
    source_plans = db.query(MonthlyPlan).filter(
        MonthlyPlan.mes == from_date,
        MonthlyPlan.es_recurrente == True,  # noqa: E712
    ).all()

    # Check which categories already have plans in target month
    existing_cats = {
        p.categoria_id for p in db.query(MonthlyPlan).filter(MonthlyPlan.mes == to_date).all()
    }

    copied = 0
    for src in source_plans:
        if src.categoria_id not in existing_cats:
            new_plan = MonthlyPlan(
                mes=to_date,
                categoria_id=src.categoria_id,
                tipo=src.tipo,
                monto_planificado=src.monto_planificado,
                es_recurrente=src.es_recurrente,
                detalle=src.detalle,
            )
            db.add(new_plan)
            copied += 1

    db.commit()
    return {"copied": copied, "to_mes": to_mes}
