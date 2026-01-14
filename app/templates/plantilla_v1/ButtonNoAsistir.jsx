"use client";

import { useState } from "react";

export function ButtonNoAsistir({ className = "", guestId, onDone }) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [sure, setSure] = useState(false);

  async function sendNo() {
    setMsg("");

    if (!guestId) {
      setMsg("No se encontró el invitado.");
      return;
    }

    try {
      setBusy(true);

      const res = await fetch("/api/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          guest_id: guestId,
          attending: false,
          party_size: 0,
        }),
      });

      const text = await res.text();
      let json = null;
      try {
        json = text ? JSON.parse(text) : null;
      } catch {
        json = null;
      }

      if (!res.ok) {
        setMsg(json?.error || `No se pudo enviar (status ${res.status}).`);
        return;
      }

      setMsg("Listo ✅");
      onDone?.({ attending: false, party_size: 0 });
    } catch (e) {
      setMsg(e?.message || "Error enviando.");
    } finally {
      setBusy(false);
      setSure(false);
    }
  }

  return (
    <button
      type="button"
      onClick={() => {
        if (busy) return;
        if (!sure) {
          setSure(true);
          setMsg("¿Seguro? toca otra vez");
          setTimeout(() => setSure(false), 2500);
          return;
        }
        sendNo();
      }}
      className={[
        // base
        "w-[123px] h-[45px] rounded-[31px] border border-black bg-transparent",
        // text layout: wrap + center + line-height
        "px-2 flex flex-col items-center justify-center text-center",
        "text-[10px] tracking-[3.2px] font-cinzel leading-[12px]",
        "whitespace-normal",
        // hover
        "hover:bg-black hover:text-white transition",
        busy ? "opacity-60 pointer-events-none" : "",
        className,
      ].join(" ")}
    >
      <span className="block max-w-[105px]">NO PODRÉ ASISTIR</span>

      {msg ? (
        <span className="block mt-[2px] text-[9px] tracking-normal leading-[10px] max-w-[110px]">
          {msg}
        </span>
      ) : null}
    </button>
  );
}

export default ButtonNoAsistir;