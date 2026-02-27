"""Seed the database with default categories and admin user."""
import os
from sqlalchemy.orm import Session
from models import User, Category
from auth import hash_password, generate_api_key

DEFAULT_CATEGORIES = [
    # ── Gastos ───────────────────────────────────────────────
    ("Alimentación & Supermercado", "gasto", 1),
    ("Restaurantes & Delivery", "gasto", 2),
    ("Transporte & Combustible", "gasto", 3),
    ("Movilidad compartida/Apps", "gasto", 4),
    ("Vivienda & Alquiler", "gasto", 5),
    ("Servicios del hogar", "gasto", 6),
    ("Telefonía & Streaming/Subscriptions", "gasto", 7),
    ("Salud & Farmacia", "gasto", 8),
    ("Gimnasio & Deporte", "gasto", 9),
    ("Ropa & Calzado", "gasto", 10),
    ("Entretenimiento & Ocio", "gasto", 11),
    ("Educación & Cursos", "gasto", 12),
    ("Tecnología & Gadgets", "gasto", 13),
    ("Viajes & Turismo", "gasto", 14),
    ("Regalos & Donaciones", "gasto", 15),
    ("Mascotas", "gasto", 16),
    ("Impuestos & Trámites", "gasto", 17),
    ("Hogar & Mantenimiento", "gasto", 18),
    ("Herramientas/Software trabajo", "gasto", 19),
    ("Otros", "gasto", 20),
    ("Pago de Tarjeta de Crédito", "gasto", 21),
    ("Pago de Préstamos/Cuotas", "gasto", 22),
    ("Inversión/Ahorro", "gasto", 23),
    # ── Ingresos ─────────────────────────────────────────────
    ("Sueldo/Salario", "ingreso", 101),
    ("Comisiones/Bonos", "ingreso", 102),
    ("Ventas personales/Freelance", "ingreso", 103),
    ("Devoluciones/Reembolsos", "ingreso", 104),
    ("Regalías/Intereses/Dividendos", "ingreso", 105),
    ("Transferencia recibida", "ingreso", 106),
    ("Vivienda & Alquiler", "ingreso", 107),
    ("Retiro de Inversión/Ahorro", "ingreso", 108),
    ("Otros ingresos", "ingreso", 109),
]


def seed_categories(db: Session):
    existing = db.query(Category).count()
    if existing > 0:
        return
    for nombre, tipo, orden in DEFAULT_CATEGORIES:
        db.add(Category(nombre=nombre, tipo=tipo, orden=orden))
    db.commit()


def seed_admin_user(db: Session):
    existing = db.query(User).count()
    if existing > 0:
        return
    username = os.getenv("ADMIN_USERNAME", "admin")
    password = os.getenv("ADMIN_PASSWORD", "changeme")
    api_key = os.getenv("API_KEY") or generate_api_key()
    db.add(User(
        username=username,
        password_hash=hash_password(password),
        api_key=api_key,
    ))
    db.commit()
    print(f"[seed] Admin user '{username}' created.")
    print(f"[seed] API key: {api_key}")


def run_seed(db: Session):
    seed_categories(db)
    seed_admin_user(db)
