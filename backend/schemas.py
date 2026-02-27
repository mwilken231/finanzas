from pydantic import BaseModel, Field
from typing import Optional, List, Any
from datetime import date, datetime


# ── Auth ──────────────────────────────────────────────────────────────────────

class LoginRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str


class ApiKeyResponse(BaseModel):
    api_key: str


# ── Category ──────────────────────────────────────────────────────────────────

class CategoryBase(BaseModel):
    nombre: str
    tipo: str   # ingreso | gasto | ambos
    orden: int = 0
    activo: bool = True


class CategoryCreate(CategoryBase):
    pass


class CategoryUpdate(BaseModel):
    nombre: Optional[str] = None
    tipo: Optional[str] = None
    orden: Optional[int] = None
    activo: Optional[bool] = None


class CategoryOut(CategoryBase):
    id: int

    model_config = {"from_attributes": True}


# ── Transaction ───────────────────────────────────────────────────────────────

class TransactionBase(BaseModel):
    fecha: date
    fecha_n8n: Optional[str] = None
    concepto: Optional[str] = None
    tipo: str                           # ingreso | gasto
    monto: float = Field(gt=0)
    moneda: str = "ARS"
    categoria_id: Optional[int] = None
    fuente: str = "manual"              # manual | telegram_bot | recurrente


class TransactionCreate(TransactionBase):
    pass


class TransactionUpdate(BaseModel):
    fecha: Optional[date] = None
    fecha_n8n: Optional[str] = None
    concepto: Optional[str] = None
    tipo: Optional[str] = None
    monto: Optional[float] = None
    moneda: Optional[str] = None
    categoria_id: Optional[int] = None
    fuente: Optional[str] = None


class TransactionOut(TransactionBase):
    id: int
    created_at: datetime
    categoria: Optional[CategoryOut] = None

    model_config = {"from_attributes": True}

    @classmethod
    def model_validate(cls, obj, *args, **kwargs):
        # Map categoria_rel → categoria for output
        if hasattr(obj, "categoria_rel"):
            obj.__dict__["categoria"] = obj.categoria_rel
        return super().model_validate(obj, *args, **kwargs)


class TransactionListResponse(BaseModel):
    total: int
    items: List[TransactionOut]


# ── Bot API Transaction (accepts categoria by name) ───────────────────────────

class BotTransactionCreate(BaseModel):
    fecha_n8n: Optional[str] = None
    fecha: Optional[date] = None
    concepto: Optional[str] = None
    tipo: str
    monto: float
    moneda: str = "ARS"
    categoria: Optional[str] = None     # category name string


# ── Monthly Plan ──────────────────────────────────────────────────────────────

class PlanItemDetail(BaseModel):
    nombre: str
    monto: float
    nota: Optional[str] = None
    cobrado: Optional[bool] = None


class PlanDetail(BaseModel):
    items: List[PlanItemDetail] = []


class MonthlyPlanBase(BaseModel):
    mes: date                           # first day of month
    categoria_id: Optional[int] = None
    tipo: str                           # ingreso | gasto
    monto_planificado: float = 0
    es_recurrente: bool = False
    detalle: Optional[str] = None       # JSON string


class MonthlyPlanCreate(MonthlyPlanBase):
    pass


class MonthlyPlanUpdate(BaseModel):
    monto_planificado: Optional[float] = None
    es_recurrente: Optional[bool] = None
    detalle: Optional[str] = None


class MonthlyPlanOut(MonthlyPlanBase):
    id: int
    categoria: Optional[CategoryOut] = None

    model_config = {"from_attributes": True}

    @classmethod
    def model_validate(cls, obj, *args, **kwargs):
        if hasattr(obj, "categoria_rel"):
            obj.__dict__["categoria"] = obj.categoria_rel
        return super().model_validate(obj, *args, **kwargs)


# ── Credit Card ───────────────────────────────────────────────────────────────

class CreditCardBase(BaseModel):
    concepto: str
    tarjeta: str
    monto_cuota: float
    cuota_actual: int
    cuotas_totales: int
    activo: bool = True
    nota: Optional[str] = None


class CreditCardCreate(CreditCardBase):
    pass


class CreditCardUpdate(BaseModel):
    concepto: Optional[str] = None
    tarjeta: Optional[str] = None
    monto_cuota: Optional[float] = None
    cuota_actual: Optional[int] = None
    cuotas_totales: Optional[int] = None
    activo: Optional[bool] = None
    nota: Optional[str] = None


class CreditCardOut(CreditCardBase):
    id: int
    created_at: datetime

    model_config = {"from_attributes": True}


# ── Dashboard ─────────────────────────────────────────────────────────────────

class CategoryExpense(BaseModel):
    categoria_id: Optional[int]
    categoria_nombre: str
    monto: float
    porcentaje: float


class DashboardSummary(BaseModel):
    mes: str
    ingreso_total: float
    gasto_total: float
    saldo: float
    presupuesto_gastos: float
    presupuesto_ingresos: float
    pct_gasto_vs_plan: Optional[float]
    pct_ingreso_vs_plan: Optional[float]
    gastos_por_categoria: List[CategoryExpense]
    ultimas_transacciones: List[TransactionOut]


class MonthlyChartPoint(BaseModel):
    mes: str
    ingresos: float
    gastos: float
    saldo: float
