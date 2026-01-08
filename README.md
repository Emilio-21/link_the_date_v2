# 🎉 Link The Date

Una aplicación web para crear y compartir eventos importantes mediante links públicos.

## 🚀 Características

- ✅ **Autenticación sin contraseña** - Magic link por email
- ✅ **Creación automática** - Primera organización y evento al registrarse
- ✅ **Dashboard privado** - Gestiona tus eventos y organizaciones
- ✅ **Links públicos** - Comparte eventos sin requerir login
- ✅ **Seguridad RLS** - Row Level Security en Supabase
- ✅ **UI moderna** - Diseño hermoso con Tailwind y shadcn/ui

## 📋 Configuración Inicial

### 1. Base de Datos
Ejecuta el SQL que se encuentra en `SQL_SETUP.md`:
1. Ve a [tu proyecto Supabase](https://supabase.com/dashboard)
2. Abre **SQL Editor**
3. Copia y pega el contenido de `SQL_SETUP.md`
4. Ejecuta el script

### 2. Autenticación
Configura las URLs de redirección en Supabase (ver `SUPABASE_AUTH_CONFIG.md`):
1. Ve a **Authentication** → **URL Configuration**
2. Configura **Site URL**: `https://date-invite-3.preview.emergentagent.com`
3. Agrega **Redirect URLs**:
   - `https://date-invite-3.preview.emergentagent.com/auth/callback`
   - `http://localhost:3000/auth/callback`

## 🏗️ Estructura del Proyecto

```
/app
├── app/
│   ├── api/[[...path]]/route.js    # API unificada
│   ├── login/page.js                # Página de login
│   ├── auth/callback/page.js        # Callback de autenticación
│   ├── dashboard/page.js            # Dashboard privado
│   ├── events/[slug]/page.js        # Vista pública del evento
│   ├── page.js                      # Página principal (redirección)
│   └── layout.js                    # Layout principal
├── lib/
│   └── supabase/
│       ├── client.js                # Cliente Supabase (browser)
│       ├── server.js                # Cliente Supabase (server)
│       └── middleware.js            # Middleware helper
└── middleware.js                    # Middleware de Next.js
```

## 🎯 Flujo de Usuario

### Primera vez (Registro)
1. Usuario ingresa email en `/login`
2. Recibe magic link por email
3. Hace clic en el link → `/auth/callback`
4. Sistema detecta primer login
5. Crea automáticamente:
   - Organización "Mi Evento"
   - Evento "Mi Evento Especial" (3 meses en el futuro)
   - Usuario como owner
6. Redirige a `/dashboard`

### Usuario recurrente
1. Ingresa email en `/login`
2. Recibe magic link
3. Hace clic → autenticación
4. Redirige a `/dashboard`

### Invitado (sin login)
1. Accede directamente a `/events/[slug]`
2. Ve información del evento
3. No requiere autenticación

## 🔐 Seguridad

### Row Level Security (RLS)
Las políticas de seguridad garantizan que:
- Los usuarios solo ven organizaciones donde son miembros
- Los usuarios solo ven eventos de sus organizaciones
- Los eventos públicos son accesibles por slug sin autenticación
- Solo los owners pueden modificar organizaciones

### Middleware
Protege rutas automáticamente:
- `/dashboard/*` → Requiere autenticación
- `/login` → Redirige a dashboard si ya está autenticado

## 📊 Modelo de Datos

### organizations
- `id` (UUID)
- `name` (TEXT)
- `slug` (TEXT, unique)
- `created_at` (TIMESTAMP)
- `created_by` (UUID → auth.users)

### organization_members
- `id` (UUID)
- `org_id` (UUID → organizations)
- `user_id` (UUID → auth.users)
- `role` (TEXT: 'owner', 'admin', 'member')
- `created_at` (TIMESTAMP)

### events
- `id` (UUID)
- `org_id` (UUID → organizations)
- `name` (TEXT)
- `event_date` (DATE)
- `slug` (TEXT, unique)
- `description` (TEXT, nullable)
- `location` (TEXT, nullable)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

## 🛠️ Tecnologías

- **Framework**: Next.js 14 (App Router)
- **Base de datos**: Supabase (PostgreSQL)
- **Autenticación**: Supabase Auth (Magic Link)
- **UI**: Tailwind CSS + shadcn/ui
- **Gestión de estado**: React Hooks
- **Fechas**: date-fns

## 🚀 Desarrollo

### Instalar dependencias
```bash
yarn install
```

### Ejecutar en desarrollo
```bash
yarn dev
```

### Reiniciar servidor
```bash
sudo supervisorctl restart nextjs
```

## 📝 API Routes

### Privadas (requieren autenticación)
- `GET /api/organizations` - Lista organizaciones del usuario
- `GET /api/events` - Lista eventos de las organizaciones del usuario

### Públicas
- `GET /api/events/[slug]` - Obtiene evento por slug

### Sistema
- `POST /api/organizations/check-first-login` - Verifica si es primer login
- `POST /api/organizations/create-initial` - Crea organización y evento inicial

## 🎨 Personalización

### Colores y tema
Los colores están configurados en `tailwind.config.js` y `globals.css`.

### Email templates
Personaliza los templates de email en Supabase:
1. Ve a **Authentication** → **Email Templates**
2. Edita el template **Magic Link**

## 🐛 Troubleshooting

### El magic link no funciona
1. Verifica las URLs de redirección en Supabase
2. Revisa que las credenciales en `.env` sean correctas
3. Chequea la bandeja de spam

### No se crean la organización/evento
1. Verifica que el SQL se ejecutó correctamente
2. Revisa las políticas RLS en Supabase
3. Chequea los logs del servidor

### Error de autenticación
1. Limpia cookies del navegador
2. Verifica que el token no haya expirado
3. Intenta hacer logout y login nuevamente

## 📦 Próximas funcionalidades

- [ ] Gestión de invitados
- [ ] Confirmaciones de asistencia
- [ ] Edición de eventos desde dashboard
- [ ] Múltiples eventos por organización
- [ ] Notificaciones por email
- [ ] Exportar lista de invitados

## 📄 Licencia

MIT

---

Desarrollado con ❤️ usando Next.js y Supabase
