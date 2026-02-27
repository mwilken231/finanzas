from typing import List, Optional
from datetime import date
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func

from database import get_db
from models import User, Transaction, Category, MonthlyPlan
from auth import get_current_user
from schemas import DashboardSummary, CategoryExpense, MonthlyChartPoint
from routers.transactions import _serialize

router = APIRouter()


def _month_range(mes: str):
    year, month = mes.split("-")
    start = date(int(year), int(month), 1)
    if int(month) == 12:
        end = date(int(year) + 1, 1, 1)
    else:
        end = date(int(year), int(month) + 1, 1)
    return start, end


@router.get("/summary", response_model=DashboardSummary)
def summary(
    mes: str = Query(..., description="YYYY-MM"),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    start, end = _month_range(mes)

    # Totals
    rows = (
        db.query(Transaction.tipo, func.sum(Transaction.monto))
        .filter(Transaction.fecha >= start, Transaction.fecha < end)
        .group_by(Transaction.tipo)
        .all()
    )
    totals = {r[0]: r[1] or 0 for r in rows}
    ingreso_total = totals.get("ingreso", 0)
    gasto_total = totals.get("gasto", 0)

    # Budget plan for the month
    plan_rows = (
        db.query(MonthlyPlan.tipo, func.sum(MonthlyPlan.monto_planificado))
        .filter(MonthlyPlan.mes == start)
        .group_by(MonthlyPlan.tipo)
        .all()
    )
    plan = {r[0]: r[1] or 0 for r in plan_rows}
    presupuesto_gastos = plan.get("gasto", 0)
    presupuesto_ingresos = plan.get("ingreso", 0)

    # Expenses by category
    cat_rows = (
        db.query(
            Transaction.categoria_id,
            Category.nombre,
            func.sum(Transaction.monto).label("total")
        )
        .outerjoin(Category, Transaction.categoria_id == Category.id)
        .filter(Transaction.fecha >= start, Transaction.fecha < end, Transaction.tipo == "gasto")
        .group_by(Transaction.categoria_id, Category.nombre)
        .order_by(func.sum(Transaction.monto).desc())
        .all()
    )
    gastos_por_cat = [
        CategoryExpense(
            categoria_id=r[0],
            categoria_nombre=r[1] or "Sin categoría",
            monto=r[2],
            porcentaje=round((r[2] / gasto_total * 100) if gasto_total > 0 else 0, 1),
        )
        for r in cat_rows
    ]

    # Last 15 transactions
    last_txs = (
        db.query(Transaction)
        .options(joinedload(Transaction.categoria_rel))
        .filter(Transaction.fecha >= start, Transaction.fecha < end)
        .order_by(Transaction.fecha.desc(), Transaction.id.desc())
        .limit(15)
        .all()
    )

    return DashboardSummary(
        mes=mes,
        ingreso_total=ingreso_total,
        gasto_total=gasto_total,
        saldo=ingreso_total - gasto_total,
        presupuesto_gastos=presupuesto_gastos,
        presupuesto_ingresos=presupuesto_ingresos,
        pct_gasto_vs_plan=round(gasto_total / presupuesto_gastos * 100, 1) if presupuesto_gastos > 0 else None,
        pct_ingreso_vs_plan=round(ingreso_total / presupuesto_ingresos * 100, 1) if presupuesto_ingresos > 0 else None,
        gastos_por_categoria=gastos_por_cat,
        ultimas_transacciones=[_serialize(t) for t in last_txs],
    )


@router.get("/chart", response_model=List[MonthlyChartPoint])
def monthly_chart(
    months: int = Query(6, ge=1, le=24),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    """Return income vs expense totals for the last N months."""
    from datetime import date
    import calendar

    today = date.today()
    result = []

    for i in range(months - 1, -1, -1):
        # Calculate month i months ago
        month = today.month - i
        year = today.year
        while month <= 0:
            month += 12
            year -= 1
        start = date(year, month, 1)
        _, last_day = calendar.monthrange(year, month)
        end = date(year, month, last_day + 1) if last_day < 28 else date(year, month + 1 if month < 12 else 1, 1) if month < 12 else date(year + 1, 1, 1)

        rows = (
            db.query(Transaction.tipo, func.sum(Transaction.monto))
            .filter(Transaction.fecha >= start, Transaction.fecha < end)
            .group_by(Transaction.tipo)
            .all()
        )
        totals = {r[0]: r[1] or 0 for r in rows}
        ing = totals.get("ingreso", 0)
        gas = totals.get("gasto", 0)
        result.append(MonthlyChartPoint(
            mes=f"{year:04d}-{month:02d}",
            ingresos=ing,
            gastos=gas,
            saldo=ing - gas,
        ))

    return result
