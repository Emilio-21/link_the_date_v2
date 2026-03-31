// app/u/[tenant]/dashboard/page.js
// Reexporta el dashboard principal inyectando el tenant desde los params
'use client'

import { useParams } from 'next/navigation'
import { useEffect } from 'react'
import DashboardPage from '@/app/dashboard/page'

// Este wrapper simplemente pasa el tenant al dashboard principal.
// El dashboard ya funciona con el usuario autenticado y sus organizaciones.
// El tenant en la URL es solo para routing — el RLS de Supabase garantiza
// que el usuario solo ve SUS datos.
export default function TenantDashboard() {
  return <DashboardPage />
}