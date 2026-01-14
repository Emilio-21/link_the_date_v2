// app/layout.js
import "./globals.css";
import { Cinzel, Pinyon_Script } from "next/font/google";

const cinzel = Cinzel({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-cinzel",
});

const pinyon = Pinyon_Script({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-pinyon",
});

export const metadata = {
  title: "Link The Date - Crea y comparte tus eventos",
  description: "Plataforma para crear eventos importantes y compartirlos con invitados",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body className={`${cinzel.variable} ${pinyon.variable}`}>
        {children}
      </body>
    </html>
  );
}