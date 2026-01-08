'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'

export default function AuthCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState('')
  const supabase = createClient()

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Verificar si hay error en la URL
        const errorParam = searchParams.get('error')
        if (errorParam) {
          setError(errorParam)
          return
        }

        // Obtener el usuario actual
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        
        if (userError) throw userError
        if (!user) throw new Error('No se pudo autenticar')

        // Verificar si es primer login
        const response = await fetch('/api/organizations/check-first-login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id })
        })

        const data = await response.json()

        if (data.isFirstLogin) {
          // Crear organización y evento por defecto
          await fetch('/api/organizations/create-initial', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              userId: user.id,
              email: user.email 
            })
          })
        }

        // Redirigir al dashboard
        router.push('/dashboard')
      } catch (error) {
        console.error('Error en callback:', error)
        setError(error.message)
      }
    }

    handleCallback()
  }, [router, searchParams, supabase])

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Error de autenticación</CardTitle>
            <CardDescription>Hubo un problema al iniciar sesión</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-red-600 mb-4">{error}</p>
            <a href="/login" className="text-blue-600 hover:underline">
              Volver a intentar
            </a>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-blue-600" />
          <CardTitle>Iniciando sesión...</CardTitle>
          <CardDescription>Por favor espera un momento</CardDescription>
        </CardHeader>
      </Card>
    </div>
  )
}
