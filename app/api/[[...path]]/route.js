import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { v4 as uuidv4 } from 'uuid'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

function getSupabaseClient() {
  return createClient(supabaseUrl, supabaseAnonKey)
}

function generateSlug(name) {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    + '-' + Math.random().toString(36).substr(2, 6)
}

export async function GET(request) {
  const supabase = getSupabaseClient()
  const { pathname } = new URL(request.url)

  try {
    // GET /api/organizations
    if (pathname === '/api/organizations') {
      const authHeader = request.headers.get('authorization')
      if (!authHeader) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
      }

      const token = authHeader.replace('Bearer ', '')
      const { data: { user }, error: userError } = await supabase.auth.getUser(token)
      
      if (userError || !user) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
      }

      const { data, error } = await supabase
        .from('organizations')
        .select(`
          *,
          organization_members!inner(
            user_id,
            role
          )
        `)
        .eq('organization_members.user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching organizations:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json(data || [])
    }

    // GET /api/events
    if (pathname === '/api/events') {
      const authHeader = request.headers.get('authorization')
      if (!authHeader) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
      }

      const token = authHeader.replace('Bearer ', '')
      const { data: { user }, error: userError } = await supabase.auth.getUser(token)
      
      if (userError || !user) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
      }

      // Obtener organizaciones del usuario primero
      const { data: orgs } = await supabase
        .from('organization_members')
        .select('org_id')
        .eq('user_id', user.id)

      if (!orgs || orgs.length === 0) {
        return NextResponse.json([])
      }

      const orgIds = orgs.map(o => o.org_id)

      const { data, error } = await supabase
        .from('events')
        .select('*')
        .in('org_id', orgIds)
        .order('event_date', { ascending: true })

      if (error) {
        console.error('Error fetching events:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json(data || [])
    }

    // GET /api/events/:slug (público)
    if (pathname.startsWith('/api/events/')) {
      const slug = pathname.split('/api/events/')[1]
      
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('slug', slug)
        .single()

      if (error || !data) {
        return NextResponse.json({ error: 'Evento no encontrado' }, { status: 404 })
      }

      return NextResponse.json(data)
    }

    return NextResponse.json({ error: 'Ruta no encontrada' }, { status: 404 })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function POST(request) {
  const supabase = getSupabaseClient()
  const { pathname } = new URL(request.url)

  try {
    const body = await request.json()

    // POST /api/organizations/check-first-login
    if (pathname === '/api/organizations/check-first-login') {
      const { userId } = body

      const { data, error } = await supabase
        .from('organization_members')
        .select('id')
        .eq('user_id', userId)
        .limit(1)

      if (error) {
        console.error('Error checking first login:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({ isFirstLogin: !data || data.length === 0 })
    }

    // POST /api/organizations/create-initial
    if (pathname === '/api/organizations/create-initial') {
      const { userId, email } = body

      // Crear organización
      const orgId = uuidv4()
      const orgSlug = generateSlug('mi-evento')
      
      const { error: orgError } = await supabase
        .from('organizations')
        .insert([{
          id: orgId,
          name: 'Mi Evento',
          slug: orgSlug,
          created_by: userId
        }])

      if (orgError) {
        console.error('Error creating organization:', orgError)
        return NextResponse.json({ error: orgError.message }, { status: 500 })
      }

      // Agregar usuario como owner
      const { error: memberError } = await supabase
        .from('organization_members')
        .insert([{
          id: uuidv4(),
          org_id: orgId,
          user_id: userId,
          role: 'owner'
        }])

      if (memberError) {
        console.error('Error creating member:', memberError)
        return NextResponse.json({ error: memberError.message }, { status: 500 })
      }

      // Crear evento por defecto
      const eventId = uuidv4()
      const eventSlug = generateSlug('mi-evento-especial')
      const futureDate = new Date()
      futureDate.setMonth(futureDate.getMonth() + 3) // 3 meses en el futuro

      const { error: eventError } = await supabase
        .from('events')
        .insert([{
          id: eventId,
          org_id: orgId,
          name: 'Mi Evento Especial',
          event_date: futureDate.toISOString().split('T')[0],
          slug: eventSlug,
          description: 'Este es tu primer evento. Puedes editarlo más adelante.'
        }])

      if (eventError) {
        console.error('Error creating event:', eventError)
        return NextResponse.json({ error: eventError.message }, { status: 500 })
      }

      return NextResponse.json({ success: true, orgId, eventId })
    }

    return NextResponse.json({ error: 'Ruta no encontrada' }, { status: 404 })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
