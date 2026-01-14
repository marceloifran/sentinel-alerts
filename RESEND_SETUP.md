# Configuración de Resend para Envío de Emails

## Pasos para configurar Resend

### 1. Crear cuenta en Resend
1. Ve a [https://resend.com](https://resend.com)
2. Crea una cuenta (es gratis hasta 3,000 emails/mes)
3. Verifica tu email

### 2. Obtener API Key
1. Ve a [API Keys](https://resend.com/api-keys)
2. Crea una nueva API Key
3. Copia la clave (empieza con `re_`)

### 3. Verificar dominio (opcional pero recomendado)
1. Ve a [Domains](https://resend.com/domains)
2. Agrega tu dominio
3. Configura los registros DNS según las instrucciones
4. Una vez verificado, podrás usar emails desde tu dominio

### 4. Configurar variables de entorno
Crea un archivo `.env` en la raíz del proyecto con:

```env
VITE_RESEND_API_KEY=re_tu_api_key_aqui
VITE_RESEND_FROM_EMAIL=Sentinel Alerts <noreply@tudominio.com>
```

**Nota:** Si no tienes un dominio verificado, puedes usar el email de prueba de Resend:
```env
VITE_RESEND_FROM_EMAIL=Sentinel Alerts <onboarding@resend.dev>
```

### 5. Reiniciar el servidor de desarrollo
Después de agregar las variables de entorno, reinicia Vite:
```bash
npm run dev
```

## Funcionalidades implementadas

### ✅ Envío automático de notificaciones
- Cuando una obligación está por vencer, se envía un email automáticamente al creador
- El email se envía según los días configurados en `days_before` (por defecto 7 días antes)

### ✅ Notificación automática al crear obligación
- Al crear una nueva obligación, se crea automáticamente una notificación para el creador
- La notificación está configurada para enviarse 7 días antes del vencimiento

### ✅ Plantilla de email profesional
- Email HTML responsive
- Mensajes personalizados según días restantes
- Colores y estilos según urgencia

## Ejecutar envío de alertas

Para enviar las alertas pendientes, puedes:

1. **Desde el código (desarrollo/testing):**
```typescript
import { sendObligationAlerts } from '@/services/notificationService';

// Ejecutar manualmente
await sendObligationAlerts();
```

2. **Configurar un cron job (producción):**
   - Usa Supabase Edge Functions con un cron trigger
   - O configura un cron job en tu servidor que llame a esta función diariamente

## Estructura del email

El email incluye:
- Asunto personalizado según urgencia
- Nombre del usuario
- Nombre de la obligación
- Fecha de vencimiento formateada
- Días restantes
- Mensaje de urgencia/tranquilidad según corresponda

## Troubleshooting

### Error: "VITE_RESEND_API_KEY no está configurada"
- Verifica que el archivo `.env` existe en la raíz del proyecto
- Asegúrate de que la variable empieza con `VITE_`
- Reinicia el servidor de desarrollo

### Error: "Invalid API key"
- Verifica que copiaste correctamente la API key
- Asegúrate de que no hay espacios extra
- Verifica que la API key está activa en Resend

### Error: "Domain not verified"
- Si usas un dominio personalizado, verifica que está completamente verificado en Resend
- O usa temporalmente `onboarding@resend.dev` para pruebas
