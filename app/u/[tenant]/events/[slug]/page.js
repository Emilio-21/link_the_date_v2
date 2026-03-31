// app/u/[tenant]/events/[slug]/page.js
// Reexporta la página de evento pública con el slug correcto
'use client'

import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import Plantilla from '@/app/templates/plantilla_v1/Plantilla'

async function safeJson(res) {
  const text = await res.text()
  try { return { ok: res.ok, status: res.status, json: JSON.parse(text) } }
  catch { return { ok: res.ok, status: res.status, json: null } }
}

export default function TenantEventPage() {
  const params = useParams()
  const slug   = params?.slug
  const tenant = params?.tenant

  const [loading, setLoading] = useState(true)
  const [event, setEvent]     = useState(null)
  const [error, setError]     = useState(null)

  useEffect(() => {
    if (!slug) return
    fetch(`/api/events/${encodeURIComponent(slug)}`, {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    })
      .then(safeJson)
      .then(({ ok, json }) => {
        if (!ok || !json?.event) { setError('Evento no encontrado'); return }
        setEvent(json.event)
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [slug])

  if (loading) return (
    <div className="min-h-screen bg-[#fff3e7] flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-2 border-stone-200 border-t-rose-400 animate-spin"/>
    </div>
  )

  if (error || !event) return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center p-6">
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-800 text-sm max-w-sm w-full text-center">
        <p className="font-bold">Invitación no encontrada</p>
        <p className="mt-1 opacity-70">{error || 'El evento no existe o fue eliminado.'}</p>
      </div>
    </div>
  )

  // La plantilla pública no necesita guest ni rsvp (es la vista sin token)
  return <Plantilla event={event} guest={null} rsvp={null} />
}