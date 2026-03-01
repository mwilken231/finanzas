# Guía de Troubleshooting - Supabase

## Problemas Comunes y Soluciones

### 1. "Missing Supabase environment variables"

**Síntoma**: Error al cargar la app
```
Error: Missing Supabase environment variables
```

**Solución**:
1. Verifica que tienes un archivo `.env.local` en `frontend/`
2. Verifica que tiene estas líneas:
   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```
3. Obtén las claves en: https://supabase.com/dashboard/project/[tu-proyecto]/api/default
4. Reinicia el dev server después de crear `.env.local`

**Variables Correctas**:
- `VITE_SUPABASE_URL`: URL completa del proyecto (ej: `https://abc123.supabase.co`)
- `VITE_SUPABASE_ANON_KEY`: La clave anon (NO la service role)

---

### 2. "No user logged in"

**Síntoma**: Error al intentar crear transacciones o categorías
```
Error: No user logged in
```

**Solución**:
1. Verifica que el usuario está autenticado
2. En Login, completa email y contraseña correctamente
3. Espera a que se redirija a /dashboard
4. Si aún falla, verifica:
   - AuthContext está envolviendo toda la app en App.jsx
   - `useAuth()` se llama correctamente en componentes

**Debug**:
```javascript
import { useAuth } from './context/AuthContext'

export function MyComponent() {
  const { user, loading } = useAuth()
  console.log('User:', user)
  console.log('Loading:', loading)
  
  if (loading) return <p>Cargando...</p>
  if (!user) return <p>No estás autenticado</p>
  
  return <p>Bienvenido, {user.email}</p>
}
```

---

### 3. "User does not exist" al hacer login

**Síntoma**: Error en la página de login
```
User does not exist
```

**Solución**:
1. El usuario no existe en Supabase
2. Crea un usuario nuevo:
   - Opción A: Click en "¿Sin cuenta? Registrate aquí" en el login
   - Opción B: Dashboard Supabase > Authentication > Users > Add user

**Nota**: Las contraseñas deben tener al menos 6 caracteres.

---

### 4. "Permission denied" al acceder a datos

**Síntoma**: Error al traer transacciones o categorías
```
Error: Insufficient permissions
```

**Solución**:
1. Las políticas RLS no están correctas
2. Verifica que RLS está habilitado:
   - Dashboard Supabase > Database > Tables
   - Abre cada tabla (transactions, categories, etc.)
   - Verifica que "RLS is on"
3. Si no está, vuelve a ejecutar el script SQL:
   ```sql
   ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
   ```

**Otra causa**: El trigger no creó el perfil
- Ve a `profiles` en Dashboard y verifica que existe un registro con tu user_id
- Si no existe, crea uno manualmente

---

### 5. Las consultas devuelven datos vacíos

**Síntoma**: Las funciones retornan `[]` en lugar de datos
```javascript
const { transactions } = useTransactions() // Devuelve []
```

**Solución Paso a Paso**:

1. **Verifica que hay datos**:
   - Dashboard Supabase > SQL Editor
   - Ejecuta:
   ```sql
   SELECT * FROM transactions;
   ```
   - ¿Hay resultados?

2. **Si no hay datos**:
   - Es normal para usuarios nuevos
   - Crea una transacción manualmente primero

3. **Si hay datos pero no aparecen**:
   - Verifica el RLS:
   ```sql
   SELECT * FROM transactions WHERE user_id = auth.uid();
   ```
   - ¿Tienes resultados?

4. **Si RLS falla**:
   - Vuelve a ejecutar las políticas:
   ```sql
   CREATE POLICY "transactions_select_own" ON public.transactions 
     FOR SELECT USING (auth.uid() = user_id);
   ```

---

### 6. "Failed to fetch" al hacer operaciones

**Síntoma**: Error genérico de red
```
Error: Failed to fetch
```

**Solución**:
1. Verifica que tu URL de Supabase es correcta
2. Verifica que tienes internet
3. Verifica que la API de Supabase está activa (status.supabase.com)
4. En Dev Tools, ve a Network y busca la request fallida
5. ¿Es un error 401, 403 o 500?

**Errores comunes**:
- **401**: Usuario no autenticado, hacer login
- **403**: Permiso denegado, verificar RLS
- **500**: Error del servidor Supabase, esperar

---

### 7. La app se reinicia cuando hago login

**Síntoma**: Se recarga la página después de hacer login

**Solución** (es normal):
- La app se redirija a `/dashboard`
- Pero React recarga en algunos casos
- No es un error, es comportamiento esperado

**Para reducir recargas**:
- Usa `useNavigate` en lugar de redireccionamientos manuales

---

### 8. Error: "Invalid API Key"

**Síntoma**: Error al conectar
```
Invalid API Key
```

**Solución**:
1. Verifica que usas la ANON KEY, no la SERVICE ROLE KEY
2. Copia desde: Dashboard > API > Project API keys > `anon` key
3. Verifica que no tiene espacios al inicio/final

**Diferencia**:
- **Anon Key**: Para el frontend, limitada por RLS ✅
- **Service Role Key**: Para backend, acceso total ❌

---

### 9. Componentes no se actualizan después de crear datos

**Síntoma**: Creo una transacción pero no aparece en la lista

**Solución**:
1. Llama a `refetch()` después de crear:
```javascript
const { transactions, refetch } = useTransactions()

const handleCreate = async () => {
  await addTransaction(newData)
  await refetch() // Recarga datos
}
```

2. O usa el patrón de actualización optimista:
```javascript
setTransactions(prev => [...prev, newData])
```

---

### 10. Variables de entorno no se cargan en Vercel

**Síntoma**: Funciona localmente pero falla en Vercel

**Solución**:
1. Ve a Vercel > Project Settings > Environment Variables
2. Agrega:
   - Key: `VITE_SUPABASE_URL`
   - Value: Tu URL
   - Selecciona: Production, Preview, Development
3. Agrega:
   - Key: `VITE_SUPABASE_ANON_KEY`
   - Value: Tu clave anon
   - Selecciona: Production, Preview, Development
4. Vuelve a hacer deploy

**Nota**: Los nombres deben ser exactos (incluyendo `VITE_`)

---

### 11. Error: "Relations not found"

**Síntoma**: Error al hacer select con joins
```
Error: Relation "public.categories" does not exist
```

**Solución**:
1. Verifica que la tabla existe
2. En Dashboard > Database > Tables
3. ¿Ves "transactions", "categories", etc.?
4. Si falta alguna, vuelve a ejecutar el script SQL

---

### 12. La contraseña no se puede cambiar

**Síntoma**: `changePassword()` falla

**Solución**:
- Verifica que el usuario está autenticado
- Las contraseñas deben tener al menos 6 caracteres
- Supabase requiere confirmación por email en algunos casos

---

## Debug Avanzado

### Ver logs de Supabase
```javascript
// En lib/supabase.js, agrega:
const supabase = createClient(supabaseUrl, supabaseKey, {
  headers: {
    'X-Debug': 'true'
  }
})
```

### Verificar RLS
```sql
-- Abre SQL Editor en Dashboard y ejecuta:
SELECT 
  schemaname, 
  tablename, 
  rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';
```

Si `rowsecurity` es `t`, RLS está habilitado.

### Ver qué usuario está autenticado
```javascript
const { data: { user }, error } = await supabase.auth.getUser()
console.log('Current user:', user?.email)
console.log('User ID:', user?.id)
```

---

## Verificación Completa

Si algo no funciona, sigue este checklist:

- [ ] Variables de entorno correctas en `.env.local`
- [ ] `npm install` ejecutado en `frontend/`
- [ ] Usuario creado en Supabase (Authentication > Users)
- [ ] RLS habilitado en todas las tablas
- [ ] Políticas RLS creadas correctamente
- [ ] Trigger `on_auth_user_created` existe
- [ ] `profiles` tabla tiene un registro para tu usuario
- [ ] Supabase API está activa
- [ ] No hay errores en Dev Tools (F12)
- [ ] Iniciaste sesión con email + contraseña correcta

---

## Recursos

- [Supabase Status](https://status.supabase.com)
- [Supabase Docs](https://supabase.com/docs)
- [RLS Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [JS Client Reference](https://supabase.com/docs/reference/javascript/introduction)

---

**¿Aún no funciona?** 
1. Verifica los logs en el navegador (F12 > Console)
2. Comparte el error exacto
3. Revisa la documentación de Supabase
