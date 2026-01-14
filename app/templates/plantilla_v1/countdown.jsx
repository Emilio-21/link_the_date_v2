"use client";

import { useEffect, useMemo, useState } from "react";

function pad2(n) {
  return String(n).padStart(2, "0");
}

// Fallback: si no hay event_datetime, usa event_date a las 00:00 (hora local)
function getTargetDate(event) {
  const iso = event?.event_datetime || event?.eventDateTime || null;

  if (iso) {
    const d = new Date(iso);
    if (!Number.isNaN(d.getTime())) return d;
  }

  const dateOnly = event?.event_date || event?.date || null;
  if (dateOnly) {
    const d = new Date(`${dateOnly}T00:00:00`);
    if (!Number.isNaN(d.getTime())) return d;
  }

  return null;
}

export default function Countdown({ event }) {
  const target = useMemo(() => getTargetDate(event), [event]);

  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  if (!target) {
    return <span className="opacity-60">-- -- -- --</span>;
  }

  const diffMs = target.getTime() - now.getTime();

  if (diffMs <= 0) {
    // Puedes cambiar este texto por "00 00 00 00" si quieres que se vea igual siempre
    return <span className="opacity-80">00 00 00 00</span>;
  }

  const totalSec = Math.floor(diffMs / 1000);
  const days = Math.floor(totalSec / (60 * 60 * 24));
  const hrs = Math.floor((totalSec % (60 * 60 * 24)) / (60 * 60));
  const min = Math.floor((totalSec % (60 * 60)) / 60);
  const sec = totalSec % 60;

  // Figma: se ve como "DD HH MM SS"
  return (
    <span>
      {pad2(days)} {pad2(hrs)} {pad2(min)} {pad2(sec)}
    </span>
  );
}