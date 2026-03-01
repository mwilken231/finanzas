# 🚀 Guía Rápida - Getting Started

Sigue estos pasos para empezar con tu app Supabase.

## Paso 1: Obtener Credenciales de Supabase

1. Ve a https://supabase.com/dashboard
2. Selecciona tu proyecto
3. Ve a **Settings > API**
4. Copia:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public** → `VITE_SUPABASE_ANON_KEY`

⚠️ **IMPORTANTE**: Asegúrate de copiar la **anon key**, NO la service role key

## Paso 2: Crear Archivo de Configuración

En `frontend/`, crea `.env.local`:

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

Reemplaza con tus valores reales (sin espacios ni comillas).

## Paso 3: Instalar Dependencias

```bash
cd frontend
npm install
```

## Paso 4: Iniciar la App

```bash
npm run dev
```

Abre http://localhost:5173 en tu navegador.

## Paso 5: Crear tu Primera Cuenta

1. En la página de login, click en **"¿Sin cuenta? Registrate aquí"**
2. Ingresa un email válido
3. Crea una contraseña (mín 6 caracteres)
4. Click en **"Crear cuenta"**
5. ¡Listo! Ya estás dentro

## Paso 6: Verificar que Funciona

- [ ] Página de login carga correctamente
- [ ] Puedo crear una cuenta nueva
- [ ] Me redirije a /dashboard
- [ ] Dashboard no muestra errores (pueden estar vacíos los datos)

## ✅ ¡Éxito!

Si llegaste aquí, tu app está conectada a Supabase.

---

## Próximos Pasos

### Crear Datos de Prueba

1. Ve a **Dashboard** en tu app
2. Intenta crear una transacción
3. Deberías verla aparecer en la lista

### Crear Categorías

1. Ve a **Categorías**
2. Agrega una categoría nueva
3. Úsala al crear transacciones

### Ver Datos en Supabase

1. Ve a Dashboard Supabase > **Database**
2. Abre la tabla `transactions`
3. Deberías ver los datos que creaste

---

## Troubleshooting Rápido

| Problema | Solución |
|----------|----------|
| "Missing environment variables" | Crea `.env.local` con credenciales |
| Error de login | Usuario no existe, crea uno nuevo |
| "Permission denied" | Verifica RLS está habilitado |
| Datos vacíos | Normal para usuario nuevo, crea datos primero |
| CORS error | Asegúrate que URL está correcta |

Más en: [SUPABASE_TROUBLESHOOTING.md](./SUPABASE_TROUBLESHOOTING.md)

---

## Estructura del Proyecto

```
frontend/
├── src/
│   ├── lib/
│   │   ├── supabase.js       ← Cliente Supabase
│   │   └── hooks.js          ← Hooks para datos
│   ├── context/
│   │   └── AuthContext.jsx   ← Autenticación
│   ├── pages/
│   │   ├── Login.jsx         ← Login/Signup
│   │   ├── Dashboard.jsx
│   │   └── ...
│   ├── api.js                ← Funciones API
│   └── App.jsx
├── .env.local                ← Tu configuración
└── package.json
```

---

## Comandos Útiles

```bash
# Instalar dependencias
npm install

# Iniciar dev server
npm run dev

# Build para producción
npm run build

# Ver preview de build
npm run preview
```

---

## Documentación

- [Guía Completa de Migración](./SUPABASE_MIGRATION_GUIDE.md)
- [Resumen de Implementación](./SUPABASE_IMPLEMENTATION_SUMMARY.md)
- [Solución de Problemas](./SUPABASE_TROUBLESHOOTING.md)
- [Documentación Oficial de Supabase](https://supabase.com/docs)

---

## Preguntas Frecuentes

**¿Necesito backend?**
No, Supabase reemplaza FastAPI. Solo necesitas el frontend.

**¿Cómo accedo a mis datos?**
Usa el Dashboard de Supabase o la app web.

**¿Es seguro?**
Sí, RLS protege los datos y Supabase maneja autenticación.

**¿Puedo migrar datos del SQLite?**
Sí, ver `scripts/migrate_data.py`

**¿Qué pasa si pierdo la contraseña?**
Supabase permite reset por email.

---

## Soporte

- **Documentación**: https://supabase.com/docs
- **Status**: https://status.supabase.com
- **Discord**: https://discord.supabase.com

---

**¡Bienvenido a Supabase!** 🎉
