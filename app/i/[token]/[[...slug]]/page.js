// app/i/[token]/page.js
"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";

// IMPORTA TU PLANTILLA
import Plantilla from "@/app/templates/plantilla_v1/Plantilla";

async function safeJson(res) {
  const text = await res.text();
  try {
    return { ok: res.ok, status: res.status, json: JSON.parse(text), text };
  } catch {
    return { ok: res.ok, status: res.status, json: null, text };
  }
}

export default function InviteByTokenPage() {
  const params = useParams();

  const token = useMemo(() => {
    const t = params?.token;
    return Array.isArray(t) ? t[0] : t;
  }, [params]);

  const [loading, setLoading] = useState(true);
  const [guest, setGuest] = useState(null);
  const [event, setEvent] = useState(null);
  const [rsvp, setRsvp] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    if (!token || typeof token !== "string") return;

    let cancelled = false;

    async function load() {
      setLoading(true);
      setErrorMsg(null);

      try {
        const res = await fetch(`/api/invite?token=${encodeURIComponent(token)}`, {
          method: "GET",
          headers: { Accept: "application/json" },
          cache: "no-store",
        });

        const parsed = await safeJson(res);

        if (!parsed.ok || !parsed.json) {
          if (cancelled) return;
          setErrorMsg(
            parsed.json?.error ||
              `No se encontró la invitación. Status ${parsed.status}. ${(
                parsed.text || ""
              ).slice(0, 160)}`
          );
          setLoading(false);
          return;
        }

        if (cancelled) return;

        setGuest(parsed.json.guest || null);
        setEvent(parsed.json.event || null);
        setRsvp(parsed.json.rsvp || null);

        // Si por alguna razón no llegaron guest/event, muéstralo como error
        if (!parsed.json.guest || !parsed.json.event) {
          setErrorMsg("Respuesta inválida: faltan datos de invitación.");
        }

        setLoading(false);
      } catch (e) {
        if (cancelled) return;
        setErrorMsg(e?.message || "Error cargando invitación.");
        setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [token]);

  if (loading) {
    return (
      <main className="min-h-screen grid place-items-center bg-[#fff3e7]">
        <div className="rounded-xl border bg-white p-6 text-slate-700">
          Cargando invitación...
        </div>
      </main>
    );
  }

  if (errorMsg) {
    return (
      <main className="min-h-screen grid place-items-center bg-[#fff3e7] px-6">
        <div className="max-w-lg w-full rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-900">
          <div className="font-semibold text-lg">Invitación no encontrada</div>
          <div className="text-sm opacity-80 mt-2">{errorMsg}</div>
          {token ? (
            <div className="text-xs opacity-70 mt-3">
              Token: <span className="font-mono">{token}</span>
            </div>
          ) : null}
        </div>
      </main>
    );
  }

  // ✅ Renderiza la plantilla real con RSVP precargado
  return <Plantilla event={event} guest={guest} rsvp={rsvp} />;
}