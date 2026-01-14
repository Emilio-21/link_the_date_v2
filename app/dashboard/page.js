"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../lib/supabase/client";

function slugify(str) {
  return (str || "")
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .slice(0, 60);
}

function fmtDate(dateStr) {
  try {
    if (!dateStr) return "";
    const d = new Date(`${dateStr}T00:00:00`);
    return d.toLocaleDateString("es-MX", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function fmtDateTime(isoStr) {
  try {
    if (!isoStr) return "";
    const d = new Date(isoStr);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleString("es-MX", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

async function safeJson(res) {
  const text = await res.text();
  try {
    return { ok: res.ok, status: res.status, json: JSON.parse(text), text };
  } catch {
    return { ok: res.ok, status: res.status, json: null, text };
  }
}

// datetime-local ("YYYY-MM-DDTHH:mm") -> ISO UTC
function toIsoOrNull(datetimeLocal) {
  if (!datetimeLocal) return null;
  const d = new Date(datetimeLocal);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

// datetime-local ("YYYY-MM-DDTHH:mm") -> "YYYY-MM-DD"
function dateOnlyFromDatetimeLocal(datetimeLocal) {
  if (!datetimeLocal) return null;
  const d = new Date(datetimeLocal);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

export default function DashboardPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState(null);

  const [orgs, setOrgs] = useState([]);
  const [events, setEvents] = useState([]);

  const [orgName, setOrgName] = useState("");
  const [busyOrg, setBusyOrg] = useState(false);

  // ORG seleccionada
  const [selectedOrgId, setSelectedOrgId] = useState("");

  // Event fields
  const [eventTitle, setEventTitle] = useState("");
  const [eventDateTime, setEventDateTime] = useState(""); // ✅ ÚNICO input para fecha/hora
  const [eventLocation, setEventLocation] = useState("");
  const [eventDesc, setEventDesc] = useState("");
  const [busyEvent, setBusyEvent] = useState(false);

  // NEW EVENT FIELDS
  const [venueName, setVenueName] = useState("");
  const [locationUrl, setLocationUrl] = useState("");
  const [giftUrl1, setGiftUrl1] = useState("");
  const [giftUrl2, setGiftUrl2] = useState("");
  const [bankAccount, setBankAccount] = useState("");

  // Guests
  const [selectedEventId, setSelectedEventId] = useState("");
  const [guests, setGuests] = useState([]);

  const [guestName, setGuestName] = useState("");
  const [guestPasses, setGuestPasses] = useState(1);
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [busyGuest, setBusyGuest] = useState(false);

  const [errorMsg, setErrorMsg] = useState(null);
  const [infoMsg, setInfoMsg] = useState(null);

  const currentEvent = events.find((e) => e.id === selectedEventId) || null;

  useEffect(() => {
    let mounted = true;

    async function boot() {
      setLoading(true);
      setErrorMsg(null);
      setInfoMsg(null);

      const { data: userRes } = await supabase.auth.getUser();
      const user = userRes?.user;

      if (!user) {
        router.replace("/login");
        return;
      }

      if (!mounted) return;
      setEmail(user.email ?? null);

      await refreshAll(true);

      setLoading(false);
    }

    boot();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // cuando cambias de org, recarga eventos de esa org
  useEffect(() => {
    if (!selectedOrgId) return;
    refreshEventsForOrg(selectedOrgId, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedOrgId]);

  async function refreshAll(initial = false) {
    setErrorMsg(null);
    setInfoMsg(null);

    const { data: orgRows, error: orgErr } = await supabase
      .from("organizations")
      .select("id,name,slug,created_at")
      .order("created_at", { ascending: false });

    if (orgErr) {
      setErrorMsg(`Error cargando organizaciones: ${orgErr.message}`);
      return;
    }

    const orgList = orgRows || [];
    setOrgs(orgList);

    const orgIdToUse = selectedOrgId || orgList?.[0]?.id || "";
    if (!selectedOrgId && orgIdToUse) setSelectedOrgId(orgIdToUse);

    if (orgIdToUse) {
      await refreshEventsForOrg(orgIdToUse, initial);
    } else {
      setEvents([]);
      setSelectedEventId("");
      setGuests([]);
    }
  }

  async function refreshEventsForOrg(orgId, initial = false) {
    setErrorMsg(null);
    setInfoMsg(null);

    const { data: eventRows, error: eventErr } = await supabase
      .from("events")
      .select(
        "id,org_id,name,event_date,event_datetime,slug,description,location,venue_name,location_url,gift_url_1,gift_url_2,bank_account,created_at"
      )
      .eq("org_id", orgId)
      .order("created_at", { ascending: false });

    if (eventErr) {
      setErrorMsg(`Error cargando eventos: ${eventErr.message}`);
      return;
    }

    const list = eventRows || [];
    setEvents(list);

    if (initial) {
      const first = list[0];
      if (first?.id) {
        setSelectedEventId(first.id);
        await loadGuests(first.id);
      } else {
        setSelectedEventId("");
        setGuests([]);
      }
    } else {
      if (selectedEventId && !list.some((e) => e.id === selectedEventId)) {
        setSelectedEventId("");
        setGuests([]);
      }
    }
  }

  async function logout() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  async function createOrganization() {
    setErrorMsg(null);
    setInfoMsg(null);

    const name = orgName.trim();
    if (!name) return;

    try {
      setBusyOrg(true);

      const { data: userRes } = await supabase.auth.getUser();
      const user = userRes?.user;
      if (!user) {
        router.replace("/login");
        return;
      }

      const slug = slugify(name) || `org-${Date.now()}`;

      const { data: org, error: orgInsErr } = await supabase
        .from("organizations")
        .insert({
          name,
          slug,
          created_by: user.id,
        })
        .select("id,name,slug,created_at")
        .single();

      if (orgInsErr) {
        setErrorMsg(`Crear organización: ${orgInsErr.message}`);
        return;
      }

      await supabase.from("organization_members").insert({
        org_id: org.id,
        user_id: user.id,
        role: "owner",
      });

      setOrgName("");
      setInfoMsg("Organización creada ✅");

      setSelectedOrgId(org.id);
      await refreshAll(false);
    } finally {
      setBusyOrg(false);
    }
  }

  async function createEvent() {
    setErrorMsg(null);
    setInfoMsg(null);

    if (!selectedOrgId) {
      setErrorMsg("Primero selecciona una organización.");
      return;
    }

    const title = eventTitle.trim();
    if (!title) return;

    // ✅ Fuente de verdad: datetime-local
    const event_datetime = toIsoOrNull(eventDateTime);
    if (!event_datetime) {
      setErrorMsg("Selecciona fecha y hora del evento.");
      return;
    }

    // ✅ Compat: derivamos event_date desde event_datetime
    const event_date = dateOnlyFromDatetimeLocal(eventDateTime) || new Date().toISOString().slice(0, 10);

    const slug = slugify(title) || `evento-${Date.now()}`;

    try {
      setBusyEvent(true);

      const { data: ev, error: evErr } = await supabase
        .from("events")
        .insert({
          org_id: selectedOrgId,
          name: title,
          event_date,
          event_datetime,
          slug,
          description: eventDesc.trim() || null,
          location: eventLocation.trim() || null,

          venue_name: venueName.trim() || null,
          location_url: locationUrl.trim() || null,
          gift_url_1: giftUrl1.trim() || null,
          gift_url_2: giftUrl2.trim() || null,
          bank_account: bankAccount.trim() || null,
        })
        .select(
          "id,org_id,name,event_date,event_datetime,slug,description,location,venue_name,location_url,gift_url_1,gift_url_2,bank_account,created_at"
        )
        .single();

      if (evErr) {
        setErrorMsg(`Crear evento: ${evErr.message}`);
        return;
      }

      // reset fields
      setEventTitle("");
      setEventDateTime("");
      setEventLocation("");
      setEventDesc("");

      setVenueName("");
      setLocationUrl("");
      setGiftUrl1("");
      setGiftUrl2("");
      setBankAccount("");

      setInfoMsg("Evento creado ✅");

      await refreshEventsForOrg(selectedOrgId, false);

      setSelectedEventId(ev.id);
      await loadGuests(ev.id);

      router.push(`/events/${ev.slug}`);
    } finally {
      setBusyEvent(false);
    }
  }

  async function copyInviteLink(slug) {
    setErrorMsg(null);
    setInfoMsg(null);

    const url = `${window.location.origin}/events/${slug}`;
    try {
      await navigator.clipboard.writeText(url);
      setInfoMsg("Link copiado ✅");
      setTimeout(() => setInfoMsg(null), 2000);
    } catch {
      window.prompt("Copia este link:", url);
    }
  }

  async function copyGuestLink(token) {
    setErrorMsg(null);
    setInfoMsg(null);

    const url = `${window.location.origin}/i/${token}`;
    try {
      await navigator.clipboard.writeText(url);
      setInfoMsg("Link del invitado copiado ✅");
      setTimeout(() => setInfoMsg(null), 2000);
    } catch {
      window.prompt("Copia este link:", url);
    }
  }

  async function loadGuests(eventId) {
    setErrorMsg(null);

    const res = await fetch(`/api/guests?event_id=${encodeURIComponent(eventId)}`);
    const parsed = await safeJson(res);

    if (!parsed.ok || !parsed.json) {
      setErrorMsg(
        `Error cargando invitados. Status ${parsed.status}. ${parsed.text?.slice(0, 140) || ""}`
      );
      setGuests([]);
      return;
    }

    const list = parsed.json?.guests ?? [];
    setGuests(list);
  }

  async function addGuest() {
    setErrorMsg(null);
    setInfoMsg(null);

    if (!selectedEventId) {
      setErrorMsg("Selecciona un evento para agregar invitados.");
      return;
    }

    const name = guestName.trim();
    if (!name) return;

    const maxGuests = Number(guestPasses) || 1;

    try {
      setBusyGuest(true);

      const res = await fetch("/api/guests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event_id: selectedEventId,
          name,
          max_guests: maxGuests,
          email: guestEmail.trim() || null,
          phone: guestPhone.trim() || null,
        }),
      });

      const parsed = await safeJson(res);
      if (!parsed.ok) {
        setErrorMsg(
          `Error agregando invitado. Status ${parsed.status}. ${parsed.text?.slice(0, 180) || ""}`
        );
        return;
      }

      setGuestName("");
      setGuestPasses(1);
      setGuestEmail("");
      setGuestPhone("");

      setInfoMsg("Invitado agregado ✅");
      await loadGuests(selectedEventId);
    } finally {
      setBusyGuest(false);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-white to-slate-50">
      <div className="mx-auto max-w-5xl px-6 py-10 space-y-8">
        <header className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
            {email && (
              <p className="text-sm text-slate-500 mt-1">
                Bienvenido, <span className="font-medium">{email}</span>
              </p>
            )}
          </div>

          <button
            onClick={logout}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium shadow-sm hover:bg-slate-50"
          >
            Cerrar sesión
          </button>
        </header>

        {loading && (
          <div className="rounded-xl border border-slate-200 bg-white p-4 text-slate-600">
            Cargando...
          </div>
        )}

        {!loading && (errorMsg || infoMsg) && (
          <div
            className={[
              "rounded-xl border p-4",
              errorMsg
                ? "border-rose-200 bg-rose-50 text-rose-900"
                : "border-emerald-200 bg-emerald-50 text-emerald-900",
            ].join(" ")}
          >
            <p className="font-medium">{errorMsg ? "Ocurrió un error" : "Listo"}</p>
            <p className="text-sm opacity-80 mt-1">{errorMsg || infoMsg}</p>
          </div>
        )}

        {!loading && (
          <div className="grid gap-6">
            {/* ORGS */}
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold">Mis Organizaciones</h2>
              <p className="text-sm text-slate-500 mt-1">
                Crea una organización (ej. “Mi boda”) para agrupar tus eventos.
              </p>

              <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                <input
                  className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder="Nombre de la organización"
                />
                <button
                  className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
                  onClick={createOrganization}
                  disabled={busyOrg || !orgName.trim()}
                >
                  {busyOrg ? "Creando..." : "Crear"}
                </button>
              </div>

              <div className="mt-5">
                {orgs.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-slate-500">
                    No tienes organizaciones todavía
                  </div>
                ) : (
                  <ul className="grid gap-3 sm:grid-cols-2">
                    {orgs.map((o) => (
                      <li key={o.id} className="rounded-xl border border-slate-200 p-4">
                        <div className="font-semibold">{o.name}</div>
                        <div className="text-xs text-slate-500 mt-1">ID: {o.id}</div>
                        <div className="text-xs text-slate-500">Slug: {o.slug}</div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>

            {/* EVENTS */}
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold">Mis Eventos</h2>
              <p className="text-sm text-slate-500 mt-1">
                Crea un evento y comparte el link de invitación pública.
              </p>

              {/* SELECT ORG */}
              <div className="mt-4">
                <label className="text-xs text-slate-500">Organización</label>
                <select
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200"
                  value={selectedOrgId}
                  onChange={(e) => setSelectedOrgId(e.target.value)}
                >
                  <option value="" disabled>
                    Selecciona una organización
                  </option>
                  {orgs.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <input
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200"
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  placeholder="Título del evento (ej. Nuestra Boda)"
                />

                {/* ✅ SOLO datetime-local */}
                <input
                  type="datetime-local"
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200"
                  value={eventDateTime}
                  onChange={(e) => setEventDateTime(e.target.value)}
                />

                <input
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200"
                  value={eventLocation}
                  onChange={(e) => setEventLocation(e.target.value)}
                  placeholder="Ciudad / Lugar (ej. San Luis Potosí)"
                />

                <input
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200"
                  value={eventDesc}
                  onChange={(e) => setEventDesc(e.target.value)}
                  placeholder="Descripción (ej. Acompáñanos a celebrar ❤️)"
                />

                <input
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200"
                  value={venueName}
                  onChange={(e) => setVenueName(e.target.value)}
                  placeholder="Venue (ej. Edificio Ipiña)"
                />

                <input
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200"
                  value={locationUrl}
                  onChange={(e) => setLocationUrl(e.target.value)}
                  placeholder="Link ubicación (Google Maps)"
                />

                <input
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200"
                  value={giftUrl1}
                  onChange={(e) => setGiftUrl1(e.target.value)}
                  placeholder="Mesa de regalos #1 (opcional)"
                />

                <input
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200"
                  value={giftUrl2}
                  onChange={(e) => setGiftUrl2(e.target.value)}
                  placeholder="Mesa de regalos #2 (opcional)"
                />

                <input
                  className="sm:col-span-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200"
                  value={bankAccount}
                  onChange={(e) => setBankAccount(e.target.value)}
                  placeholder="Número de cuenta (opcional)"
                />
              </div>

              <div className="mt-3 flex items-center justify-between gap-3 flex-wrap">
                <p className="text-xs text-slate-500">
                  Nota: ahora la fecha/hora se define con un solo campo (datetime).
                </p>

                <button
                  className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
                  onClick={createEvent}
                  disabled={!selectedOrgId || busyEvent || !eventTitle.trim() || !eventDateTime}
                >
                  {busyEvent ? "Creando..." : "Crear evento"}
                </button>
              </div>

              <div className="mt-5">
                {events.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-slate-500">
                    No tienes eventos todavía
                  </div>
                ) : (
                  <ul className="grid gap-3">
                    {events.map((ev) => (
                      <li key={ev.id} className="rounded-xl border border-slate-200 p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <div className="text-lg font-semibold truncate">{ev.name}</div>

                            <div className="text-sm text-slate-600 mt-1">
                              {/* ✅ preferimos event_datetime */}
                              {ev.event_datetime ? fmtDateTime(ev.event_datetime) : fmtDate(ev.event_date)}
                              {ev.location ? ` · ${ev.location}` : ""}
                              {ev.venue_name ? ` · ${ev.venue_name}` : ""}
                            </div>

                            {(ev.location_url ||
                              ev.gift_url_1 ||
                              ev.gift_url_2 ||
                              ev.bank_account) && (
                              <div className="text-xs text-slate-500 mt-2 space-y-1 break-words">
                                {ev.location_url ? <div>Mapa: {ev.location_url}</div> : null}
                                {ev.gift_url_1 ? <div>Mesa 1: {ev.gift_url_1}</div> : null}
                                {ev.gift_url_2 ? <div>Mesa 2: {ev.gift_url_2}</div> : null}
                                {ev.bank_account ? <div>Cuenta: {ev.bank_account}</div> : null}
                              </div>
                            )}

                            {ev.description ? (
                              <div className="text-sm text-slate-500 mt-2">{ev.description}</div>
                            ) : null}

                            <div className="text-xs text-slate-500 mt-2">
                              Slug: <span className="font-mono">{ev.slug}</span>
                            </div>
                          </div>

                          <div className="flex flex-col gap-2 shrink-0">
                            <button
                              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium hover:bg-slate-50"
                              onClick={() => router.push(`/events/${ev.slug}`)}
                            >
                              Ver invitación
                            </button>

                            <button
                              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium hover:bg-slate-50"
                              onClick={() => copyInviteLink(ev.slug)}
                            >
                              Copiar link evento
                            </button>

                            <button
                              className={[
                                "rounded-lg px-3 py-2 text-sm font-medium",
                                selectedEventId === ev.id
                                  ? "bg-slate-900 text-white"
                                  : "border border-slate-200 bg-white hover:bg-slate-50",
                              ].join(" ")}
                              onClick={async () => {
                                setSelectedEventId(ev.id);
                                await loadGuests(ev.id);
                              }}
                            >
                              {selectedEventId === ev.id ? "Gestionando invitados" : "Invitados"}
                            </button>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>

            {/* GUESTS */}
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold">Invitados (pases + contacto opcional)</h2>
              <p className="text-sm text-slate-500 mt-1">
                Define cuántos pases tiene cada invitado (max_guests). Email y teléfono son opcionales.
              </p>

              <div className="mt-4">
                <div className="text-xs text-slate-500">Evento seleccionado</div>
                <div className="mt-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
                  {currentEvent ? (
                    <>
                      <span className="font-semibold">{currentEvent.name}</span>{" "}
                      <span className="text-slate-500 font-mono">({currentEvent.id})</span>
                    </>
                  ) : (
                    <span className="text-slate-500">Selecciona un evento</span>
                  )}
                </div>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-4">
                <input
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="Nombre del invitado"
                />

                <input
                  type="number"
                  min={1}
                  max={20}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                  value={guestPasses}
                  onChange={(e) => setGuestPasses(e.target.value)}
                  placeholder="Pases"
                />

                <input
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                  placeholder="Email (opcional)"
                />

                <input
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                  value={guestPhone}
                  onChange={(e) => setGuestPhone(e.target.value)}
                  placeholder="Teléfono (opcional)"
                />
              </div>

              <button
                className="mt-3 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
                onClick={addGuest}
                disabled={busyGuest || !selectedEventId || !guestName.trim()}
              >
                {busyGuest ? "Agregando..." : "Agregar invitado"}
              </button>

              <div className="mt-5">
                {selectedEventId && guests.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-slate-500">
                    Aún no hay invitados para este evento.
                  </div>
                ) : null}

                {guests.length > 0 ? (
                  <div className="overflow-hidden rounded-xl border border-slate-200">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 text-slate-600">
                        <tr>
                          <th className="text-left font-semibold px-4 py-3">Nombre</th>
                          <th className="text-left font-semibold px-4 py-3">Email</th>
                          <th className="text-left font-semibold px-4 py-3">Teléfono</th>
                          <th className="text-left font-semibold px-4 py-3">Pases</th>
                          <th className="text-left font-semibold px-4 py-3">RSVP</th>
                          <th className="text-left font-semibold px-4 py-3">Confirmados</th>
                          <th className="text-left font-semibold px-4 py-3">Link</th>
                        </tr>
                      </thead>
                      <tbody>
                        {guests.map((g) => (
                          <tr key={g.id} className="border-t border-slate-100">
                            <td className="px-4 py-3">{g.name}</td>
                            <td className="px-4 py-3">{g.email ?? "-"}</td>
                            <td className="px-4 py-3">{g.phone ?? "-"}</td>
                            <td className="px-4 py-3 font-semibold">{g.max_guests ?? "-"}</td>
                            <td className="px-4 py-3">{g.rsvp_status ?? "-"}</td>
                            <td className="px-4 py-3">{g.rsvp_count ?? "-"}</td>
                            <td className="px-4 py-3">
                              {g.token ? (
                                <button
                                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium hover:bg-slate-50"
                                  onClick={() => copyGuestLink(g.token)}
                                >
                                  Copiar link invitado
                                </button>
                              ) : (
                                "-"
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : null}
              </div>
            </section>
          </div>
        )}
      </div>
    </main>
  );
}