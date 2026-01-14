# Configuración de Supabase Edge Function para Envío de Emails

## Problema resuelto
El error de CORS se solucionó moviendo el envío de emails a una Supabase Edge Function, que se ejecuta en el servidor y no tiene restricciones de CORS.

## Pasos para configurar

### 1. Instalar Supabase CLI (si no lo tienes)
```bash
npm install -g supabase
```

O descarga desde: https://github.com/supabase/cli/releases

### 2. Iniciar sesión en Supabase CLI
```bash
supabase login
```

### 3. Vincular tu proyecto
```bash
supabase link --project-ref kngievscfzjpfgrpdxcc
```

### 4. Configurar variables de entorno en Supabase

Necesitas agregar las variables de entorno en el dashboard de Supabase:

1. Ve a tu proyecto en https://supabase.com/dashboard
2. Ve a **Settings** → **Edge Functions** → **Secrets**
3. Agrega estas variables:
   - `RESEND_API_KEY` = `re_iR6forJf_FisdSDAJCkcKoZPGxSV4gcrN`
   - `RESEND_FROM_EMAIL` = `Sentinel Alerts <onboarding@resend.dev>`

**O usando la CLI:**
```bash
supabase secrets set RESEND_API_KEY=re_iR6forJf_FisdSDAJCkcKoZPGxSV4gcrN
supabase secrets set RESEND_FROM_EMAIL="Sentinel Alerts <onboarding@resend.dev>"
```

### 5. Desplegar la función

```bash
supabase functions deploy send-email
```

### 6. Probar la función localmente (opcional)

```bash
supabase functions serve send-email
```

Luego puedes probar con:
```bash
curl -i --location --request POST 'http://localhost:54321/functions/v1/send-email' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{
    "to": "tu-email@ejemplo.com",
    "userName": "Usuario de Prueba",
    "obligationName": "Obligación de Prueba",
    "daysUntilDue": 7,
    "dueDate": "2026-01-21"
  }'
```

## Estructura creada

```
supabase/
  functions/
    send-email/
      index.ts  (Edge Function que envía emails usando Resend)
```

## Cambios en el código

- **`src/services/emailService.ts`**: Ahora llama a la Edge Function en lugar de Resend directamente
- **`supabase/functions/send-email/index.ts`**: Nueva Edge Function que maneja el envío de emails

## Verificación

Una vez desplegada la función:
1. Ve a cualquier detalle de obligación
2. Haz clic en "Enviar email de prueba"
3. El email debería enviarse sin errores de CORS

## Troubleshooting

### Error: "Function not found"
- Asegúrate de haber desplegado la función: `supabase functions deploy send-email`
- Verifica que estás usando el proyecto correcto

### Error: "RESEND_API_KEY no está configurada"
- Verifica que agregaste el secret en Supabase
- Usa `supabase secrets list` para verificar

### Error: "Unauthorized"
- Asegúrate de que el usuario esté autenticado
- La función requiere autenticación de Supabase
