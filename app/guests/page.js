"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "../../lib/supabase/client";

function makeToken() {
  // Token simple y suficientemente único para MVP
  // Ej: "g_kt9x1q8m4n2p"
  return "g_" + Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
}

export default function GuestsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = useMemo(() => createClient(), []);

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  const [events, setEvents] = useState([]);
  const [eventId, setEventId] = useState(searchParams.get("event_id") || "");

  const [guests, setGuests] = useState([]);

  // form
  const [name, setName] = useState("");
  const [maxGuests, setMaxGuests] = useState(1);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [busyCreate, setBusyCreate] = useState(false);

  useEffect(() => {
    let alive = true;

    async function load() {
      setLoading(true);
      setErrorMsg("");

      // 1) check auth
      const { data: userRes, error: userErr } = await supabase.auth.getUser();
      if (userErr || !userRes?.user) {
        router.replace("/login");
        return;
      }

      // 2) load events user can see
      const { data: evData, error: evErr } = await supabase
        .from("events")
        .select("id,name,event_date,slug,org_id,location")
        .order("created_at", { ascending: false });

      if (!alive) return;

      if (evErr) {
        setErrorMsg(`Error cargando eventos: ${evErr.message}`);
        setLoading(false);
        return;
      }

      setEvents(evData ?? []);

      // pick default event if none selected
      const firstId = (evData ?? [])[0]?.id;
      const effectiveEventId = eventId || firstId || "";
      setEventId(effectiveEventId);

      // 3) load guests for event
      if (effectiveEventId) {
        const { data: gData, error: gErr } = await supabase
          .from("guests")
          .select("id,event_id,name,email,phone,max_guests,token,created_at,updated_at")
          .eq("event_id", effectiveEventId)
          .order("created_at", { ascending: false });

        if (gErr) {
          setErrorMsg(`Error cargando invitados: ${gErr.message}`);
          setLoading(false);
          return;
        }

        setGuests(gData ?? []);
      } else {
        setGuests([]);
      }

      setLoading(false);
    }

    load();

    return () => {
      alive = false;
    };
  }, [router, supabase]); // eslint-disable-line react-hooks/exhaustive-deps

  // reload guests when eventId changes
  useEffect(() => {
    if (!eventId) return;

    (async () => {
      setErrorMsg("");
      const { data: gData, error: gErr } = await supabase
        .from("guests")
        .select("id,event_id,name,email,phone,max_guests,token,created_at,updated_at")
        .eq("event_id", eventId)
        .order("created_at", { ascending: false });

      if (gErr) {
        setErrorMsg(`Error cargando invitados: ${gErr.message}`);
        return;
      }
      setGuests(gData ?? []);
    })();
  }, [eventId, supabase]);

  async function createGuest() {
    setErrorMsg("");

    if (!eventId) {
      setErrorMsg("Selecciona un evento.");
      return;
    }
    if (!name.trim()) {
      setErrorMsg("El invitado necesita nombre.");
      return;
    }
    const mg = Number(maxGuests);
    if (!Number.isFinite(mg) || mg < 1) {
      setErrorMsg("max_guests debe ser >= 1");
      return;
    }

    setBusyCreate(true);

    const token = makeToken();

    const { data, error } = await supabase
      .from("guests")
      .insert({
        event_id: eventId,
        name: name.trim(),
        max_guests: mg,
        email: email.trim() || null,
        phone: phone.trim() || null,
        token,
      })
      .select("id,event_id,name,email,phone,max_guests,token,created_at,updated_at")
      .single();

    if (error || !data) {
      setErrorMsg(`Error creando invitado: ${error?.message ?? "unknown"}`);
      setBusyCreate(false);
      return;
    }

    setGuests((prev) => [data, ...prev]);
    setName("");
    setMaxGuests(1);
    setEmail("");
    setPhone("");
    setBusyCreate(false);
  }

  async function deleteGuest(id) {
    setErrorMsg("");

    const ok = window.confirm("¿Borrar invitado? Esto eliminará su RSVP también.");
    if (!ok) return;

    const { error } = await supabase.from("guests").delete().eq("id", id);

    if (error) {
      setErrorMsg(`Error borrando invitado: ${error.message}`);
      return;
    }

    setGuests((prev) => prev.filter((g) => g.id !== id));
  }

  function inviteUrl(token) {
    // en producción será tu dominio; por ahora localhost
    return `http://localhost:3000/i/${token}`;
  }

  return (
    <main className="min-h-screen p-8 space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Invitados</h1>
          <p className="text-sm opacity-70">
            Crea invitados y asigna boletos. Cada invitado tiene link único para RSVP.
          </p>
        </div>

        <button className="rounded-md border px-3 py-2" onClick={() => router.push("/dashboard")}>
          Volver a Dashboard
        </button>
      </header>

      {loading && <p>Cargando...</p>}

      {!loading && errorMsg && (
        <div className="rounded-md border p-4">
          <p className="font-medium">Ocurrió un error</p>
          <p className="text-sm opacity-70 mt-1">{errorMsg}</p>
        </div>
      )}

      {!loading && (
        <div className="grid gap-8 md:grid-cols-2">
          {/* Form */}
          <section className="rounded-xl border p-6 space-y-4">
            <h2 className="text-xl font-semibold">Agregar invitado</h2>

            <div className="space-y-2">
              <label className="text-sm opacity-70">Evento</label>
              <select
                className="w-full rounded-md border px-3 py-2"
                value={eventId}
                onChange={(e) => setEventId(e.target.value)}
              >
                {events.map((ev) => (
                  <option key={ev.id} value={ev.id}>
                    {ev.name} ({ev.event_date})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm opacity-70">Nombre</label>
              <input
                className="w-full rounded-md border px-3 py-2"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej. Juan Pérez"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm opacity-70">Boletos / Pases (max_guests)</label>
              <input
                type="number"
                min={1}
                className="w-full rounded-md border px-3 py-2"
                value={maxGuests}
                onChange={(e) => setMaxGuests(e.target.value)}
              />
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm opacity-70">Email (opcional)</label>
                <input
                  className="w-full rounded-md border px-3 py-2"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="correo@..."
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm opacity-70">Teléfono (opcional)</label>
                <input
                  className="w-full rounded-md border px-3 py-2"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+52..."
                />
              </div>
            </div>

            <button
              className="rounded-md border px-4 py-2 disabled:opacity-50"
              onClick={createGuest}
              disabled={busyCreate}
            >
              {busyCreate ? "Creando..." : "Crear invitado"}
            </button>

            <p className="text-xs opacity-60">
              Nota: el token se genera automáticamente y crea el link público del invitado.
            </p>
          </section>

          {/* List */}
          <section className="rounded-xl border p-6 space-y-4">
            <h2 className="text-xl font-semibold">Lista ({guests.length})</h2>

            {guests.length === 0 ? (
              <p className="text-sm opacity-70">Aún no hay invitados.</p>
            ) : (
              <ul className="space-y-3">
                {guests.map((g) => (
                  <li key={g.id} className="rounded-md border p-4 space-y-2">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="font-medium">{g.name}</div>
                        <div className="text-sm opacity-70">
                          Boletos: {g.max_guests}
                          {g.email ? ` · ${g.email}` : ""}
                          {g.phone ? ` · ${g.phone}` : ""}
                        </div>
                      </div>

                      <button
                        className="rounded-md border px-3 py-1 text-sm"
                        onClick={() => deleteGuest(g.id)}
                      >
                        Borrar
                      </button>
                    </div>

                    <div className="text-sm">
                      <span className="opacity-70">Link:</span>{" "}
                      <a className="underline" href={`/i/${g.token}`} target="_blank" rel="noreferrer">
                        {inviteUrl(g.token)}
                      </a>
                    </div>

                    <div className="text-xs opacity-60">
                      Token: <span className="font-mono">{g.token}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </main>
  );
}