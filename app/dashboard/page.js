'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar, Copy, LogOut, ExternalLink } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export default function DashboardPage() {
  const [user, setUser] = useState(null)
  const [organizations, setOrganizations] = useState([])
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
        return
      }
      setUser(session.user)

      // Cargar organizaciones
      const orgsResponse = await fetch('/api/organizations', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })
      const orgsData = await orgsResponse.json()
      setOrganizations(orgsData)

      // Cargar eventos
      if (orgsData.length > 0) {
        const eventsResponse = await fetch('/api/events', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        })
        const eventsData = await eventsResponse.json()
        setEvents(eventsData)
      }
    } catch (error) {
      console.error('Error cargando datos:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const copyLink = (slug) => {
    const link = `${window.location.origin}/events/${slug}`
    navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-muted-foreground">Bienvenido, {user?.email}</p>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Cerrar sesión
          </Button>
        </div>

        {/* Organizaciones */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Mis Organizaciones</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {organizations.map((org) => (
              <Card key={org.id}>
                <CardHeader>
                  <CardTitle>{org.name}</CardTitle>
                  <CardDescription>Creada el {format(new Date(org.created_at), "d 'de' MMMM 'de' yyyy", { locale: es })}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>

        {/* Eventos */}
        <div>
          <h2 className="text-2xl font-semibold mb-4">Mis Eventos</h2>
          {events.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">No tienes eventos todavía</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {events.map((event) => (
                <Card key={event.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="flex items-center gap-2">
                          <Calendar className="w-5 h-5" />
                          {event.name}
                        </CardTitle>
                        <CardDescription>
                          {format(new Date(event.event_date), "d 'de' MMMM 'de' yyyy", { locale: es })}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {event.description && (
                      <p className="text-sm text-muted-foreground mb-4">{event.description}</p>
                    )}
                    {event.location && (
                      <p className="text-sm text-muted-foreground mb-4">
                        <strong>Lugar:</strong> {event.location}
                      </p>
                    )}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => copyLink(event.slug)}
                      >
                        <Copy className="w-4 h-4 mr-2" />
                        {copied ? 'Copiado!' : 'Copiar link'}
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        className="flex-1"
                        onClick={() => window.open(`/events/${event.slug}`, '_blank')}
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Ver evento
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
