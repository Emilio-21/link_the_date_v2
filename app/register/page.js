// app/login/page.js  — reemplaza el anterior
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

function Label({ children }) {
  return <span className="block text-[10px] font-bold tracking-widest uppercase text-stone-400 mb-1.5">{children}</span>
}
function Input({ className = '', ...props }) {
  return (
    <input
      className={`w-full rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 text-sm text-stone-800 placeholder:text-stone-300 outline-none transition focus:border-rose-300 focus:ring-2 focus:ring-rose-100 disabled:opacity-50 ${className}`}
      {...props}
    />
  )
}

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()

  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  async function handleLogin(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { data, error: authErr } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })
      if (authErr) throw authErr

      // Buscar el tenant del usuario para redirigir a su subdominio
      const { data: tenant } = await supabase
        .from('tenants')
        .select('subdomain')
        .eq('owner_id', data.user.id)
        .maybeSingle()

      if (tenant?.subdomain) {
        // En producción redirige al subdominio
        const isProd = window.location.hostname !== 'localhost'
        if (isProd) {
          const base = window.location.origin.replace(/^https?:\/\/[^.]+/, '')
          window.location.href = `https://${tenant.subdomain}${base}/dashboard`
        } else {
          // En local, solo va al dashboard (no hay subdominios reales en localhost)
          router.replace('/dashboard')
        }
      } else {
        router.replace('/dashboard')
      }
    } catch (err) {
      setError(err.message === 'Invalid login credentials'
        ? 'Email o contraseña incorrectos'
        : err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">

        {/* logo */}
        <div className="flex flex-col items-center mb-8 gap-3">
          <div className="h-14 w-14 rounded-2xl bg-rose-500 text-white text-2xl font-black shadow-lg shadow-rose-200 flex items-center justify-center">L</div>
          <div className="text-center">
            <h1 className="text-2xl font-black tracking-tight text-stone-900">Link the Date</h1>
            <p className="text-sm text-stone-400 mt-0.5">Accede a tu dashboard</p>
          </div>
        </div>

        <div className="rounded-3xl border border-stone-100 bg-white p-8 shadow-sm">
          <h2 className="text-base font-bold text-stone-800 mb-1">Iniciar sesión</h2>
          <p className="text-xs text-stone-400 mb-6">Ingresa con tu email y contraseña.</p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="tu@email.com"
                disabled={loading}
                required
              />
            </div>

            <div>
              <Label>Contraseña</Label>
              <Input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                disabled={loading}
                required
              />
            </div>

            {error && (
              <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-3 text-xs text-rose-700">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="mt-0.5 shrink-0"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !email.trim() || !password}
              className="w-full rounded-xl bg-rose-500 px-4 py-2.5 text-sm font-bold text-white shadow-sm shadow-rose-200 hover:bg-rose-600 active:scale-[.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                  Entrando…
                </span>
              ) : 'Entrar →'}
            </button>
          </form>
        </div>

        <p className="mt-4 text-center text-xs text-stone-400">
          ¿No tienes cuenta?{' '}
          <a href="/register" className="text-rose-500 hover:underline font-medium">Regístrate aquí</a>
        </p>
      </div>
    </div>
  )
}