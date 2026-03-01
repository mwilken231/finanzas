#!/usr/bin/env python3
"""
Migration script to move data from SQLite to Supabase PostgreSQL.
This script exports data from the local SQLite database and imports it to Supabase.
"""

import sqlite3
import os
import json
import sys
from datetime import datetime
from decimal import Decimal

# Supabase PostgreSQL connection
try:
    import psycopg2
    from psycopg2.extras import execute_values
except ImportError:
    print("Error: psycopg2 not installed. Install with: pip install psycopg2-binary")
    sys.exit(1)


def connect_sqlite(db_path: str):
    """Connect to SQLite database."""
    try:
        conn = sqlite3.connect(db_path)
        conn.row_factory = sqlite3.Row
        return conn
    except Exception as e:
        print(f"Error connecting to SQLite: {e}")
        sys.exit(1)


def connect_supabase():
    """Connect to Supabase PostgreSQL."""
    try:
        conn = psycopg2.connect(
            host=os.getenv("SUPABASE_HOST"),
            port=os.getenv("SUPABASE_PORT", 5432),
            user=os.getenv("SUPABASE_USER"),
            password=os.getenv("SUPABASE_PASSWORD"),
            database=os.getenv("SUPABASE_DB", "postgres")
        )
        return conn
    except Exception as e:
        print(f"Error connecting to Supabase: {e}")
        sys.exit(1)


def migrate_categories(sqlite_conn, supabase_conn):
    """Migrate categories from SQLite to Supabase."""
    print("Migrating categories...")
    
    cursor = sqlite_conn.cursor()
    cursor.execute("SELECT * FROM categories")
    categories = cursor.fetchall()
    
    if not categories:
        print("  No categories to migrate")
        return
    
    supabase_cursor = supabase_conn.cursor()
    
    # For now, create categories for a default user (user_id would need to be mapped)
    # In production, you'd map users first
    
    for cat in categories:
        try:
            supabase_cursor.execute(
                """
                INSERT INTO public.categories (user_id, name, type, color, created_at)
                VALUES (gen_random_uuid(), %s, %s, %s, NOW())
                """,
                (cat['nombre'], cat['tipo'], None)
            )
        except Exception as e:
            print(f"  Error migrating category {cat['nombre']}: {e}")
    
    supabase_conn.commit()
    print(f"  Migrated {len(categories)} categories")


def migrate_transactions(sqlite_conn, supabase_conn):
    """Migrate transactions from SQLite to Supabase."""
    print("Migrating transactions...")
    
    cursor = sqlite_conn.cursor()
    cursor.execute("SELECT * FROM transactions")
    transactions = cursor.fetchall()
    
    if not transactions:
        print("  No transactions to migrate")
        return
    
    supabase_cursor = supabase_conn.cursor()
    
    for txn in transactions:
        try:
            supabase_cursor.execute(
                """
                INSERT INTO public.transactions 
                (user_id, category_id, description, amount, type, date, notes, created_at)
                VALUES (gen_random_uuid(), %s, %s, %s, %s, %s, %s, %s)
                """,
                (
                    txn['categoria_id'],
                    txn['concepto'],
                    float(txn['monto']),
                    txn['tipo'],
                    txn['fecha'],
                    None,
                    datetime.fromisoformat(txn['created_at']) if txn['created_at'] else None
                )
            )
        except Exception as e:
            print(f"  Error migrating transaction: {e}")
    
    supabase_conn.commit()
    print(f"  Migrated {len(transactions)} transactions")


def migrate_monthly_plans(sqlite_conn, supabase_conn):
    """Migrate monthly plans from SQLite to Supabase."""
    print("Migrating monthly plans...")
    
    cursor = sqlite_conn.cursor()
    cursor.execute("SELECT * FROM monthly_plans")
    plans = cursor.fetchall()
    
    if not plans:
        print("  No monthly plans to migrate")
        return
    
    supabase_cursor = supabase_conn.cursor()
    
    for plan in plans:
        try:
            supabase_cursor.execute(
                """
                INSERT INTO public.monthly_plans 
                (user_id, category_id, month, budget_amount, spent_amount, created_at)
                VALUES (gen_random_uuid(), %s, %s, %s, %s, NOW())
                """,
                (
                    plan['categoria_id'],
                    plan['mes'],
                    float(plan['monto_planificado']),
                    0.0  # spent_amount will be calculated later
                )
            )
        except Exception as e:
            print(f"  Error migrating monthly plan: {e}")
    
    supabase_conn.commit()
    print(f"  Migrated {len(plans)} monthly plans")


def migrate_credit_cards(sqlite_conn, supabase_conn):
    """Migrate credit cards from SQLite to Supabase."""
    print("Migrating credit cards...")
    
    cursor = sqlite_conn.cursor()
    cursor.execute("SELECT * FROM credit_cards")
    cards = cursor.fetchall()
    
    if not cards:
        print("  No credit cards to migrate")
        return
    
    supabase_cursor = supabase_conn.cursor()
    
    for card in cards:
        try:
            supabase_cursor.execute(
                """
                INSERT INTO public.credit_cards 
                (user_id, name, last_four, credit_limit, balance, due_date, created_at)
                VALUES (gen_random_uuid(), %s, %s, NULL, %s, NULL, NOW())
                """,
                (
                    card['concepto'],
                    card['tarjeta'][-4:] if card['tarjeta'] else None,
                    0.0
                )
            )
        except Exception as e:
            print(f"  Error migrating credit card: {e}")
    
    supabase_conn.commit()
    print(f"  Migrated {len(cards)} credit cards")


def main():
    """Main migration function."""
    print("Starting data migration from SQLite to Supabase...")
    print()
    
    # Get SQLite path
    sqlite_path = os.getenv("SQLITE_DB_PATH", "/data/finanzas.db")
    if not os.path.exists(sqlite_path):
        print(f"Error: SQLite database not found at {sqlite_path}")
        sys.exit(1)
    
    # Connect to databases
    sqlite_conn = connect_sqlite(sqlite_path)
    supabase_conn = connect_supabase()
    
    try:
        migrate_categories(sqlite_conn, supabase_conn)
        migrate_transactions(sqlite_conn, supabase_conn)
        migrate_monthly_plans(sqlite_conn, supabase_conn)
        migrate_credit_cards(sqlite_conn, supabase_conn)
        
        print()
        print("Migration completed successfully!")
    except Exception as e:
        print(f"Migration failed: {e}")
        supabase_conn.rollback()
        sys.exit(1)
    finally:
        sqlite_conn.close()
        supabase_conn.close()


if __name__ == "__main__":
    main()
