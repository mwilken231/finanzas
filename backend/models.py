from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Date, Text, ForeignKey
from sqlalchemy.orm import relationship
from database import Base
import datetime


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, nullable=False)
    password_hash = Column(String, nullable=False)
    api_key = Column(String, unique=True, nullable=False)


class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, nullable=False)
    tipo = Column(String, nullable=False)  # ingreso | gasto | ambos
    orden = Column(Integer, default=0)
    activo = Column(Boolean, default=True)

    transactions = relationship("Transaction", back_populates="categoria_rel")
    plans = relationship("MonthlyPlan", back_populates="categoria_rel")


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    fecha_n8n = Column(String, nullable=True)   # ISO string from bot
    fecha = Column(Date, nullable=False)
    concepto = Column(String, nullable=True)
    tipo = Column(String, nullable=False)        # ingreso | gasto
    monto = Column(Float, nullable=False)
    moneda = Column(String, default="ARS")
    categoria_id = Column(Integer, ForeignKey("categories.id"), nullable=True)
    fuente = Column(String, default="manual")    # manual | telegram_bot | recurrente
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    categoria_rel = relationship("Category", back_populates="transactions")


class MonthlyPlan(Base):
    __tablename__ = "monthly_plans"

    id = Column(Integer, primary_key=True, index=True)
    mes = Column(Date, nullable=False)           # first day of month e.g. 2026-02-01
    categoria_id = Column(Integer, ForeignKey("categories.id"), nullable=True)
    tipo = Column(String, nullable=False)        # ingreso | gasto
    monto_planificado = Column(Float, nullable=False, default=0)
    es_recurrente = Column(Boolean, default=False)
    detalle = Column(Text, nullable=True)        # JSON string with items

    categoria_rel = relationship("Category", back_populates="plans")


class CreditCard(Base):
    __tablename__ = "credit_cards"

    id = Column(Integer, primary_key=True, index=True)
    concepto = Column(String, nullable=False)
    tarjeta = Column(String, nullable=False)
    monto_cuota = Column(Float, nullable=False)
    cuota_actual = Column(Integer, nullable=False)
    cuotas_totales = Column(Integer, nullable=False)
    activo = Column(Boolean, default=True)
    nota = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
