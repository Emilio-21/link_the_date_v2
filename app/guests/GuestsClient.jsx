"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function GuestsClient() {
  const searchParams = useSearchParams();
  const eventId = searchParams.get("event_id");
  const [guests, setGuests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!eventId) { setLoading(false); return; }
    fetch(`/api/guests?event_id=${encodeURIComponent(eventId)}`)
      .then(r => r.json())
      .then(data => setGuests(data?.guests || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [eventId]);

  if (loading) return <div className="p-6 text-stone-400">Cargando invitados…</div>;
  if (!eventId) return <div className="p-6 text-stone-400">No se especificó un evento.</div>;

  return (
    <div className="p-6">
      <h1 className="text-lg font-bold text-stone-900 mb-4">Invitados</h1>
      {guests.length === 0 ? (
        <p className="text-stone-400">Sin invitados todavía.</p>
      ) : (
        <ul className="space-y-2">
          {guests.map(g => (
            <li key={g.id} className="rounded-xl border border-stone-100 bg-white p-3 text-sm text-stone-700">
              {g.name} — {g.max_guests} pase{g.max_guests !== 1 ? "s" : ""}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
