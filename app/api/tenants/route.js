// app/api/tenants/route.js
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
export const runtime = 'nodejs'

function supaAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Faltan env vars de Supabase')
  return createClient(url, key, { auth: { persistSession: false } })
}

function isValidSubdomain(s) {
  return /^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$/.test(s)
}

// GET /api/tenants?subdomain=andy-y-emilio  → check disponibilidad
export async function GET(req) {
  const { searchParams } = new URL(req.url)
  const subdomain = searchParams.get('subdomain')?.toLowerCase().trim()

  if (!subdomain) return NextResponse.json({ error: 'Falta subdomain' }, { status: 400 })
  if (!isValidSubdomain(subdomain)) return NextResponse.json({ available: false, reason: 'invalid' })

  const supabase = supaAdmin()
  const { data } = await supabase.from('tenants').select('id').eq('subdomain', subdomain).maybeSingle()
  return NextResponse.json({ available: !data })
}

// POST /api/tenants  → crear tenant después del signUp
export async function POST(req) {
  try {
    const body = await req.json().catch(() => null)
    const { user_id, subdomain, org_name, display_name } = body || {}

    if (!user_id || !subdomain || !org_name) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
    }
    if (!isValidSubdomain(subdomain)) {
      return NextResponse.json({ error: 'Subdominio inválido' }, { status: 400 })
    }

    const supabase = supaAdmin()

    // Verificar que el subdominio no esté tomado (doble check server-side)
    const { data: existing } = await supabase
      .from('tenants').select('id').eq('subdomain', subdomain).maybeSingle()
    if (existing) {
      return NextResponse.json({ error: 'Este subdominio ya está en uso' }, { status: 409 })
    }

    // Llamar la función SQL que crea org + miembro + tenant atómicamente
    const { data, error } = await supabase.rpc('create_tenant', {
      p_user_id:      user_id,
      p_subdomain:    subdomain,
      p_org_name:     org_name,
      p_display_name: display_name || org_name,
    })

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    return NextResponse.json({ ok: true, tenant: data?.[0] }, { status: 201 })
  } catch (e) {
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 })
  }
}