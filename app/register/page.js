// app/register/page.js
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

function toSubdomain(str) {
  return (str || '')
    .toLowerCase().trim()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
    .slice(0, 40)
}

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

function SubdomainStatus({ status, subdomain, baseUrl }) {
  if (!subdomain || status === 'idle') return null
  if (status === 'checking') return (
    <span className="flex items-center gap-1.5 text-xs text-stone-400 mt-1.5">
      <svg className="animate-spin shrink-0" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
      Verificando disponibilidad…
    </span>
  )
  if (status === 'invalid') return (
    <span className="flex items-center gap-1.5 text-xs text-rose-500 mt-1.5">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
      Solo letras, números y guiones (mín. 3 caracteres)
    </span>
  )
  if (status === 'taken') return (
    <span className="flex items-center gap-1.5 text-xs text-rose-500 mt-1.5">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
      <strong>{subdomain}</strong> ya está en uso, elige otro
    </span>
  )
  if (status === 'available') return (
    <span className="flex items-center gap-1.5 text-xs text-emerald-600 mt-1.5">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
      <span><strong>{baseUrl}/u/{subdomain}</strong> está disponible ✓</span>
    </span>
  )
  return null
}

export default function RegisterPage() {
  const router   = useRouter()
  const supabase = createClient()

  const [displayName, setDisplayName]         = useState('')
  const [subdomain, setSubdomain]             = useState('')
  const [subStatus, setSubStatus]             = useState('idle')
  const [email, setEmail]                     = useState('')
  const [password, setPassword]               = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [loading, setLoading]                 = useState(false)
  const [error, setError]                     = useState('')
  const [done, setDone]                       = useState(false)

  // base URL para mostrar el preview del link
  const baseUrl = typeof window !== 'undefined'
    ? window.location.origin
    : 'https://tu-app.vercel.app'

  // ── verificar subdominio con debounce ─────────────────────────────────
  let debounceTimer = null
  function handleSubdomainChange(raw) {
    const val = toSubdomain(raw)
    setSubdomain(val)
    setSubStatus('idle')
    clearTimeout(debounceTimer)
    if (!val) return
    if (val.length < 3) { setSubStatus('invalid'); return }
    setSubStatus('checking')
    debounceTimer = setTimeout(() => checkSubdomain(val), 600)
  }

  async function checkSubdomain(val) {
    try {
      const res  = await fetch(`/api/tenants?subdomain=${encodeURIComponent(val)}`)
      const json = await res.json()
      setSubStatus(json.available ? 'available' : 'taken')
    } catch {
      setSubStatus('idle')
    }
  }

  const passwordsMatch = password === passwordConfirm
  const canSubmit =
    displayName.trim() &&
    subdomain.length >= 3 &&
    subStatus === 'available' &&
    email.trim() &&
    password.length >= 8 &&
    passwordsMatch &&
    !loading

  async function handleRegister(e) {
    e.preventDefault()
    if (!canSubmit) return
    setError('')
    setLoading(true)

    try {
      // 1. Crear usuario en Supabase Auth
      const { data: authData, error: authErr } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: { display_name: displayName.trim(), subdomain },
        },
      })
      if (authErr) throw authErr

      const userId = authData?.user?.id
      if (!userId) throw new Error('No se pudo crear la cuenta.')

      // 2. Crear tenant vía API server-side
      const res  = await fetch('/api/tenants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id:      userId,
          subdomain,
          org_name:     displayName.trim(),
          display_name: displayName.trim(),
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || 'Error creando el tenant.')

      setDone(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // ── pantalla de éxito ──────────────────────────────────────────────────
  if (done) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
        <div className="w-full max-w-sm text-center">
          <div className="flex justify-center mb-6">
            <div className="h-16 w-16 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
            </div>
          </div>
          <h1 className="text-xl font-black text-stone-900">¡Revisa tu email!</h1>
          <p className="mt-3 text-sm text-stone-500 leading-relaxed">
            Enviamos un link de verificación a<br/>
            <span className="font-semibold text-stone-800">{email}</span>
          </p>
          <div className="mt-5 rounded-2xl border border-stone-100 bg-white p-4 text-sm text-stone-600 space-y-1">
            <p className="text-xs text-stone-400 uppercase font-bold tracking-widest">Tu link de dashboard</p>
            <p className="font-black text-rose-500 break-all">{baseUrl}/u/{subdomain}/dashboard</p>
          </div>
          <div className="mt-3 rounded-2xl border border-stone-100 bg-white p-4 text-sm text-stone-600 space-y-1">
            <p className="text-xs text-stone-400 uppercase font-bold tracking-widest">Invitaciones en</p>
            <p className="font-black text-stone-700 break-all">{baseUrl}/u/{subdomain}/events/[tu-evento]</p>
          </div>
          <p className="mt-4 text-xs text-stone-400">
            ¿No llegó? Revisa spam o{' '}
            <button onClick={() => setDone(false)} className="text-rose-500 hover:underline">
              intenta de nuevo
            </button>
          </p>
        </div>
      </div>
    )
  }

  // ── formulario ─────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* logo */}
        <div className="flex flex-col items-center mb-8 gap-3">
          <div className="h-14 w-14 rounded-2xl bg-rose-500 text-white text-2xl font-black shadow-lg shadow-rose-200 flex items-center justify-center">L</div>
          <div className="text-center">
            <h1 className="text-2xl font-black tracking-tight text-stone-900">Link the Date</h1>
            <p className="text-sm text-stone-400 mt-0.5">Crea la invitación de tu evento especial</p>
          </div>
        </div>

        <div className="rounded-3xl border border-stone-100 bg-white p-8 shadow-sm">
          <h2 className="text-base font-bold text-stone-800 mb-1">Crear tu cuenta</h2>
          <p className="text-xs text-stone-400 mb-6">Tu invitación tendrá su propio link personalizado.</p>

          <form onSubmit={handleRegister} className="space-y-4">

            {/* nombre */}
            <div>
              <Label>Nombre de tu evento o pareja *</Label>
              <Input
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                placeholder="Ej. Andy y Emilio"
                disabled={loading}
              />
              <p className="text-[11px] text-stone-400 mt-1">Así aparecerá en tu invitación.</p>
            </div>

            {/* identificador */}
            <div>
              <Label>Tu identificador único *</Label>
              <div className="flex rounded-xl border border-stone-200 bg-white overflow-hidden focus-within:border-rose-300 focus-within:ring-2 focus-within:ring-rose-100 transition">
                <span className="flex items-center pl-3.5 text-sm text-stone-400 font-medium select-none whitespace-nowrap">
                  .../u/
                </span>
                <input
                  className="flex-1 px-1.5 py-2.5 text-sm text-stone-800 placeholder:text-stone-300 outline-none bg-transparent"
                  value={subdomain}
                  onChange={e => handleSubdomainChange(e.target.value)}
                  placeholder="andy-y-emilio"
                  disabled={loading}
                />
                <span className="flex items-center pr-3.5 text-sm text-stone-400 font-medium select-none whitespace-nowrap">
                  /dashboard
                </span>
              </div>
              <SubdomainStatus status={subStatus} subdomain={subdomain} baseUrl={baseUrl} />
            </div>

            {/* divider */}
            <div className="border-t border-stone-100 pt-2">
              <p className="text-[10px] font-bold tracking-widest uppercase text-stone-400 mb-3">Tu cuenta</p>
            </div>

            {/* email */}
            <div>
              <Label>Email *</Label>
              <Input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="tu@email.com"
                disabled={loading}
              />
            </div>

            {/* password */}
            <div>
              <Label>Contraseña * (mín. 8 caracteres)</Label>
              <Input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                disabled={loading}
              />
            </div>

            {/* confirm */}
            <div>
              <Label>Confirmar contraseña *</Label>
              <Input
                type="password"
                value={passwordConfirm}
                onChange={e => setPasswordConfirm(e.target.value)}
                placeholder="••••••••"
                disabled={loading}
                className={passwordConfirm && !passwordsMatch ? 'border-rose-300' : ''}
              />
              {passwordConfirm && !passwordsMatch && (
                <span className="text-xs text-rose-500 mt-1 block">Las contraseñas no coinciden</span>
              )}
            </div>

            {/* error */}
            {error && (
              <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-3 text-xs text-rose-700">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="mt-0.5 shrink-0"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={!canSubmit}
              className="w-full rounded-xl bg-rose-500 px-4 py-2.5 text-sm font-bold text-white shadow-sm shadow-rose-200 hover:bg-rose-600 active:scale-[.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed mt-2"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                  Creando tu cuenta…
                </span>
              ) : 'Crear cuenta →'}
            </button>
          </form>
        </div>

        <p className="mt-4 text-center text-xs text-stone-400">
          ¿Ya tienes cuenta?{' '}
          <a href="/login" className="text-rose-500 hover:underline font-medium">Inicia sesión</a>
        </p>
      </div>
    </div>
  )
}