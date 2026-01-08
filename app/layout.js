import './globals.css'

export const metadata = {
  title: 'Link The Date - Crea y comparte tus eventos',
  description: 'Plataforma para crear eventos importantes y compartirlos con invitados',
}

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>
        {children}
      </body>
    </html>
  )
}