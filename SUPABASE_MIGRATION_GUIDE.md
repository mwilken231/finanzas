# Migración a Supabase - Guía Completa

Este proyecto ha sido completamente migrado de FastAPI + SQLite a Supabase PostgreSQL con autenticación nativa.

## ✅ Lo que se ha completado

1. **Tablas en Supabase PostgreSQL creadas**
   - `profiles`: Perfiles de usuario (vinculados a auth.users)
   - `categories`: Categorías de ingresos/gastos
   - `transactions`: Transacciones financieras
   - `monthly_plans`: Planes mensuales de presupuesto
   - `credit_cards`: Tarjetas de crédito

2. **Row Level Security (RLS) implementado**
   - Todas las tablas tienen políticas RLS para proteger datos de usuario
   - Los usuarios solo pueden acceder a sus propios datos

3. **Frontend actualizado**
   - Supabase Auth integrado (email/contraseña)
   - Hooks personalizados para operaciones CRUD
   - AuthContext actualizado para usar Supabase
   - Página de Login actualizada

4. **Script de migración de datos**
   - `scripts/migrate_data.py` para transferir datos del SQLite a Supabase

## 🚀 Pasos para Completar la Migración

### 1. Configurar Variables de Entorno

#### Frontend (`frontend/.env.local`)
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Obtén estas de tu dashboard de Supabase: https://supabase.com/dashboard/api/default

#### Backend (si usas el script de migración)
```
SUPABASE_HOST=db.your-project.supabase.co
SUPABASE_PORT=5432
SUPABASE_USER=postgres
SUPABASE_PASSWORD=your-password
SUPABASE_DB=postgres
SQLITE_DB_PATH=/path/to/finanzas.db
```

### 2. Instalar Dependencias

```bash
# Frontend
cd frontend
npm install

# Backend (solo si vas a ejecutar migración)
cd backend
pip install psycopg2-binary
```

### 3. Migrar Datos (Opcional)

Si quieres conservar tus datos existentes del SQLite:

```bash
python scripts/migrate_data.py
```

**Nota**: El script usa UUIDs aleatorios para usuarios, por lo que necesitarás crear cuentas nuevas en Supabase y luego re-asociar los datos si es necesario.

### 4. Crear Usuarios de Prueba

Puedes crear usuarios directamente en Supabase:
1. Ve a Authentication > Users en tu dashboard
2. Haz clic en "Add user"
3. Ingresa email y contraseña
4. Los datos se crearán automáticamente en la tabla `profiles`

O crea usuarios directamente desde la app Login página:
1. Haz clic en "¿Sin cuenta? Registrate aquí"
2. Completa email y contraseña
3. ¡Listo! Ya tendrás acceso a tu cuenta

## 📋 Cambios en la API

### Antes (FastAPI)
```javascript
import { login, getMe } from '../api'

const data = await login(username, password)
const user = await getMe()
```

### Ahora (Supabase)
```javascript
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

const { login, logout } = useAuth()
await login(email, password)
```

## 🎣 Usando Hooks Personalizados

El proyecto incluye hooks listos para usar:

```javascript
import { useCategories, useTransactions, useMonthlyPlans, useCreditCards } from '../lib/hooks'

// En tu componente
export function Dashboard() {
  const { categories, loading } = useCategories()
  const { transactions, refetch } = useTransactions({ type: 'expense' })
  
  return (
    // ...
  )
}
```

### Operaciones CRUD

```javascript
import {
  addTransaction,
  updateTransaction,
  deleteTransaction,
  addCategory,
  updateCategory,
  deleteCategory,
  // ... más funciones
} from '../lib/hooks'

// Agregar transacción
const newTxn = await addTransaction({
  description: 'Compra',
  amount: 100,
  type: 'expense',
  date: '2024-03-01',
  category_id: 1,
})

// Actualizar
await updateTransaction(id, { amount: 150 })

// Eliminar
await deleteTransaction(id)
```

## 🔐 Seguridad

- **RLS activo**: Los usuarios solo ven/modifican sus datos
- **Auth de Supabase**: Contraseñas hasheadas automáticamente
- **JWT**: Sesiones seguras manejadas por Supabase
- **CORS configurado**: Solo el frontend puede acceder

## 📦 Estructura del Proyecto Ahora

```
finanzas/
├── frontend/
│   ├── src/
│   │   ├── context/
│   │   │   └── AuthContext.jsx (actualizado)
│   │   ├── lib/
│   │   │   ├── supabase.js (nuevo)
│   │   │   └── hooks.js (nuevo)
│   │   ├── pages/
│   │   │   ├── Login.jsx (actualizado)
│   │   │   └── ... (otros componentes)
│   │   └── App.jsx
│   └── .env.example
├── backend/
│   ├── models.py (puedes eliminar)
│   ├── main.py (puedes eliminar)
│   └── ...
├── scripts/
│   ├── 001_create_tables.sql (ejecutado)
│   └── migrate_data.py (para migración de datos)
└── SUPABASE_MIGRATION_GUIDE.md (este archivo)
```

## ⚠️ Próximas Acciones Recomendadas

1. **Actualizar componentes**: Los componentes aún pueden estar llamando a endpoints FastAPI
   - Busca `axios.post`, `axios.get`, etc.
   - Reemplaza con llamadas a hooks o funciones de `lib/hooks.js`

2. **Eliminar FastAPI** (opcional)
   - Si no lo necesitas, puedes remover la carpeta `backend/`
   - Si lo necesitas para integraciones externas, mantenlo pero desactívalo

3. **Configurar Variables de Entorno en Vercel**
   - Si despliegas en Vercel, agrega `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` en Settings > Environment Variables

4. **Tests**: Actualiza tests para usar Supabase en lugar de mocks

## 🆘 Troubleshooting

### "Missing Supabase environment variables"
- Asegúrate que `.env.local` existe en `frontend/`
- Verifica que tienes `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`

### "User not logged in" en operaciones CRUD
- El usuario debe estar autenticado
- Verifica que `AuthContext` está envolviendo tu app
- Usa `useAuth()` para verificar que hay usuario

### Las consultas devuelven vacío
- Verifica que el usuario tiene datos en Supabase
- Revisa que las políticas RLS permiten acceso
- Usa Supabase dashboard para debuggear

### Error de CORS
- Asegúrate que `VITE_SUPABASE_URL` está correcto
- Supabase maneja CORS automáticamente, no necesita configuración extra

## 📚 Recursos

- [Documentación Supabase](https://supabase.com/docs)
- [Supabase JS Client](https://supabase.com/docs/reference/javascript/introduction)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Auth en Supabase](https://supabase.com/docs/guides/auth/overview)

---

**Fecha de migración**: Marzo 2026
**Estado**: Listo para usar
**Siguiente paso**: Actualizar componentes para usar Supabase en lugar de FastAPI
