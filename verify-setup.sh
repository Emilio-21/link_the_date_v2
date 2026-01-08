#!/bin/bash

# Script de verificación de configuración de Supabase
# Este script te ayuda a verificar que todo esté configurado correctamente

echo "==================================="
echo "  VERIFICACIÓN DE CONFIGURACIÓN"
echo "==================================="
echo ""

# Verificar variables de entorno
echo "✓ Verificando variables de entorno..."
if grep -q "NEXT_PUBLIC_SUPABASE_URL" .env && grep -q "NEXT_PUBLIC_SUPABASE_ANON_KEY" .env; then
    echo "  ✅ Variables de entorno configuradas"
else
    echo "  ❌ Variables de entorno faltantes"
    exit 1
fi

# Verificar que el servidor esté corriendo
echo ""
echo "✓ Verificando servidor..."
if curl -s http://localhost:3000 > /dev/null; then
    echo "  ✅ Servidor Next.js corriendo"
else
    echo "  ❌ Servidor no está corriendo"
    echo "  Ejecuta: sudo supervisorctl restart nextjs"
    exit 1
fi

# Verificar página de login
echo ""
echo "✓ Verificando páginas..."
if curl -s http://localhost:3000/login | grep -q "Link The Date"; then
    echo "  ✅ Página de login funcionando"
else
    echo "  ⚠️  Página de login puede tener problemas"
fi

# Instrucciones finales
echo ""
echo "==================================="
echo "  PRÓXIMOS PASOS"
echo "==================================="
echo ""
echo "1. Abre tu proyecto en Supabase:"
echo "   https://supabase.com/dashboard"
echo ""
echo "2. Ve a SQL Editor y ejecuta el script de SQL_SETUP.md"
echo ""
echo "3. Ve a Authentication → URL Configuration y configura:"
echo "   - Site URL: https://date-invite-3.preview.emergentagent.com"
echo "   - Redirect URLs:"
echo "     * https://date-invite-3.preview.emergentagent.com/auth/callback"
echo "     * http://localhost:3000/auth/callback"
echo ""
echo "4. Prueba la aplicación en:"
echo "   https://date-invite-3.preview.emergentagent.com"
echo ""
echo "==================================="
