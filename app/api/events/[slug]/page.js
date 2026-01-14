// app/events/[slug]/page.js
import Plantilla from "../../../templates/plantilla";

export default async function EventInvitePage({ params }) {
  const slug = params?.slug;

  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/events/${slug}`, {
    cache: "no-store",
  });

  const data = await res.json().catch(() => null);

  if (!res.ok || !data?.event) {
    return (
      <main className="min-h-screen grid place-items-center bg-[#fff3e7]">
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-rose-900">
          Invitación no encontrada
          <div className="text-sm opacity-80 mt-2">
            {data?.error ? JSON.stringify(data) : "Error cargando evento"}
          </div>
        </div>
      </main>
    );
  }

  // Plantilla espera { event, guest, rsvp } pero aquí no hay guest/token
  return <Plantilla event={data.event} guest={null} rsvp={null} />;
}