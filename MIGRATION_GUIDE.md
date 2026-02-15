# Aplicar Migración de Sistema de Compliance Score

## Opción 1: Usando Supabase Dashboard (Recomendado)

1. Ve a tu proyecto de Supabase: https://supabase.com/dashboard/project/kngievscfzjpfgrpdxcc
2. Navega a **SQL Editor** en el menú lateral
3. Crea una nueva query
4. Copia y pega todo el contenido del archivo:
   `supabase/migrations/20260215_add_compliance_score_system.sql`
5. Ejecuta la query (Run)

## Opción 2: Usando Supabase CLI

Si tienes configurado el CLI de Supabase con acceso a tu proyecto:

```bash
npx supabase db push
```

## Después de aplicar la migración

1. Regenera los tipos de TypeScript:

```bash
npx supabase gen types typescript --project-id kngievscfzjpfgrpdxcc > src/integrations/supabase/types.ts
```

2. Reinicia el servidor de desarrollo si está corriendo:

```bash
# Ctrl+C para detener
npm run dev
```

## Verificar que la migración se aplicó correctamente

Puedes verificar en el SQL Editor de Supabase ejecutando:

```sql
-- Verificar que existe la tabla compliance_scores
SELECT * FROM compliance_scores LIMIT 1;

-- Verificar que existe el enum obligation_criticality
SELECT enum_range(NULL::obligation_criticality);

-- Verificar que existe la columna criticality en obligations
SELECT criticality FROM obligations LIMIT 1;
```

## Notas

- La migración agrega el campo `criticality` a la tabla `obligations` con valor por defecto `'media'`
- Todas las obligaciones existentes se marcarán automáticamente como criticidad `'media'`
- Se crea la tabla `compliance_scores` para almacenar el historial de scores
- Se crean triggers automáticos que recalculan el score cuando cambian las obligaciones
