# Configuración de Supabase Auth

Para que funcione el magic link, necesitas configurar las URLs de redirección en Supabase:

## Paso 1: Ir a Authentication Settings
1. Ve a tu proyecto en https://supabase.com/dashboard
2. En el menú lateral, ve a **Authentication** → **URL Configuration**

## Paso 2: Configurar Site URL
En **Site URL**, ingresa:
```
https://date-invite-3.preview.emergentagent.com
```

## Paso 3: Configurar Redirect URLs
En **Redirect URLs**, agrega las siguientes URLs (una por línea):

```
https://date-invite-3.preview.emergentagent.com/auth/callback
http://localhost:3000/auth/callback
```

## Paso 4: Configurar Email Templates (Opcional)
Ve a **Authentication** → **Email Templates** → **Magic Link**

Puedes personalizar el template del email. El predeterminado funciona bien.

## Paso 5: Guardar
Haz clic en **Save** para guardar los cambios.

¡Listo! Ahora el magic link funcionará correctamente.
