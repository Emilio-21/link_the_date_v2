'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar, MapPin, Clock } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export default function PublicEventPage() {
  const params = useParams()
  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadEvent()
  }, [params.slug])

  const loadEvent = async () => {
    try {
      const response = await fetch(`/api/events/${params.slug}`)
      if (!response.ok) {
        throw new Error('Evento no encontrado')
      }
      const data = await response.json()
      setEvent(data)
    } catch (error) {
      console.error('Error cargando evento:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando evento...</p>
        </div>
      </div>
    )
  }

  if (error || !event) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Evento no encontrado</CardTitle>
            <CardDescription>El evento que buscas no existe o ya no está disponible.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="container mx-auto max-w-3xl">
        <Card className="shadow-xl">
          <CardHeader className="text-center border-b bg-white">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Calendar className="w-8 h-8 text-blue-600" />
            </div>
            <CardTitle className="text-3xl mb-2">{event.name}</CardTitle>
            <CardDescription className="text-lg">
              {format(new Date(event.event_date), "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-8 space-y-6">
            {event.description && (
              <div>
                <h3 className="font-semibold text-lg mb-2">Descripción</h3>
                <p className="text-muted-foreground">{event.description}</p>
              </div>
            )}
            
            {event.location && (
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-blue-600 mt-1" />
                <div>
                  <h3 className="font-semibold mb-1">Lugar</h3>
                  <p className="text-muted-foreground">{event.location}</p>
                </div>
              </div>
            )}

            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-blue-600 mt-1" />
              <div>
                <h3 className="font-semibold mb-1">Fecha</h3>
                <p className="text-muted-foreground">
                  {format(new Date(event.event_date), "d 'de' MMMM 'de' yyyy", { locale: es })}
                </p>
              </div>
            </div>

            <div className="mt-8 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-center text-muted-foreground">
                Has sido invitado a este evento especial.
                <br />
                ¡Esperamos verte allí!
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
