"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "../../../lib/supabase/client";

function formatDate(dateStr) {
  if (!dateStr) return "";
  // event_date puede venir como "2026-06-14" (DATE)
  // lo convertimos a algo legible
  const d = new Date(dateStr + "T00:00:00");
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("es-MX", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function EventBySlugPage() {
  const params = useParams();
  const slug = useMemo(() => {
    // params.slug puede ser string o array
    const s = params?.slug;
    return Array.isArray(s) ? s[0] : s;
  }, [params]);

  const [loading, setLoading] = useState(true);
  const [event, setEvent] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  const [rsvpName, setRsvpName] = useState("");
  const [rsvpStatus, setRsvpStatus] = useState("yes"); // yes|no|maybe
  const [rsvpBusy, setRsvpBusy] = useState(false);
  const [rsvpOkMsg, setRsvpOkMsg] = useState("");

  useEffect(() => {
    if (!slug) return;

    async function run() {
      setLoading(true);
      setErrorMsg("");
      setEvent(null);

      try {
        // 1) intenta traer el evento desde tu API (recomendado)
        //    (tu route debería ser /app/api/events/[slug]/route.js)
        const res = await fetch(`/api/events/${encodeURIComponent(slug)}`, {
          method: "GET",
          headers: { Accept: "application/json" },
          cache: "no-store",
        });

        // Si tu API alguna vez devuelve texto (pretty print), lo toleramos:
        const text = await res.text();
        let json = null;
        try {
          json = text ? JSON.parse(text) : null;
        } catch (e) {
          json = null;
        }

        if (!res.ok) {
          const msg =
            json?.error ||
            `No se pudo cargar el evento. Status ${res.status}.`;
          setErrorMsg(msg);
          setLoading(false);
          return;
        }

        // esperamos { event: {...} } o directamente el objeto
        const ev = json?.event ?? json;
        if (!ev) {
          setErrorMsg("Respuesta inválida: no llegó el evento.");
          setLoading(false);
          return;
        }

        setEvent(ev);
        setLoading(false);
      } catch (err) {
        // 2) fallback: si la API no existe por alguna razón, intenta directo a Supabase
        try {
          const supabase = createClient();
          const { data, error } = await supabase
            .from("events")
            .select("id, org_id, name, event_date, slug, description, location")
            .eq("slug", slug)
            .maybeSingle();

          if (error) throw error;
          if (!data) throw new Error("Evento no encontrado");

          setEvent(data);
          setLoading(false);
        } catch (e2) {
          setErrorMsg(e2?.message || "Error cargando evento.");
          setLoading(false);
        }
      }
    }

    run();
  }, [slug]);

  async function submitRSVP() {
    setRsvpOkMsg("");
    setErrorMsg("");
    setRsvpBusy(true);

    try {
      const res = await fetch("/api/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          slug,
          name: rsvpName.trim(),
          status: rsvpStatus,
        }),
      });

      const text = await res.text();
      let json = null;
      try {
        json = text ? JSON.parse(text) : null;
      } catch (e) {
        json = null;
      }

      if (!res.ok) {
        setErrorMsg(json?.error || `No se pudo enviar RSVP (status ${res.status}).`);
        setRsvpBusy(false);
        return;
      }

      setRsvpOkMsg("¡Listo! Tu RSVP fue registrado.");
      setRsvpName("");
      setRsvpBusy(false);
    } catch (e) {
      setErrorMsg(e?.message || "Error enviando RSVP.");
      setRsvpBusy(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center p-8">
        <p className="opacity-70">Cargando invitación...</p>
      </main>
    );
  }

  if (errorMsg) {
    return (
      <main className="min-h-screen p-8">
        <div className="max-w-3xl mx-auto rounded-xl border p-6">
          <h1 className="text-xl font-semibold">Ocurrió un error</h1>
          <p className="mt-2 text-sm opacity-70">{errorMsg}</p>
          <div className="mt-4 text-sm opacity-70">
            Slug: <span className="font-mono">{slug}</span>
          </div>
        </div>
      </main>
    );
  }

  if (!event) {
    return (
      <main className="min-h-screen p-8">
        <div className="max-w-3xl mx-auto rounded-xl border p-6">
          <h1 className="text-xl font-semibold">Evento no encontrado</h1>
          <p className="mt-2 text-sm opacity-70">
            Slug: <span className="font-mono">{slug}</span>
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* “Invitación” */}
        <section className="rounded-2xl border p-8 bg-white">
          <div className="text-center space-y-2">
            <p className="text-sm tracking-widest uppercase opacity-60">
              Invitación
            </p>
            <h1 className="text-4xl font-semibold">{event.name}</h1>

            <p className="text-base opacity-70">
              {formatDate(event.event_date)}
              {event.location ? ` · ${event.location}` : ""}
            </p>
          </div>

          {event.description ? (
            <div className="mt-6 text-center">
              <p className="text-base leading-relaxed opacity-80">
                {event.description}
              </p>
            </div>
          ) : null}

          <div className="mt-8 pt-6 border-t text-sm opacity-70">
            <div className="flex flex-col gap-1">
              <div>
                <span className="font-medium">Slug:</span>{" "}
                <span className="font-mono">{event.slug}</span>
              </div>
              <div>
                <span className="font-medium">Fecha:</span>{" "}
                {event.event_date || "-"}
              </div>
              <div>
                <span className="font-medium">Lugar:</span>{" "}
                {event.location || "-"}
              </div>
            </div>
          </div>
        </section>

        {/* RSVP */}
        <section className="rounded-2xl border p-6 bg-white">
          <h2 className="text-xl font-semibold">RSVP</h2>
          <p className="text-sm opacity-70 mt-1">
            Confirma tu asistencia para ayudarnos a organizar.
          </p>

          <div className="mt-4 grid gap-3">
            <input
              className="rounded-md border px-3 py-2"
              placeholder="Tu nombre"
              value={rsvpName}
              onChange={(e) => setRsvpName(e.target.value)}
            />

            <select
              className="rounded-md border px-3 py-2"
              value={rsvpStatus}
              onChange={(e) => setRsvpStatus(e.target.value)}
            >
              <option value="yes">Sí, asistiré</option>
              <option value="maybe">Tal vez</option>
              <option value="no">No podré</option>
            </select>

            <button
              className="rounded-md border px-4 py-2 disabled:opacity-50"
              onClick={submitRSVP}
              disabled={rsvpBusy || !rsvpName.trim()}
            >
              {rsvpBusy ? "Enviando..." : "Enviar RSVP"}
            </button>

            {rsvpOkMsg ? (
              <p className="text-sm opacity-70">{rsvpOkMsg}</p>
            ) : null}
          </div>
        </section>
      </div>
    </main>
  );
}