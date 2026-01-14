// app/api/invite/route.js
export const runtime = "nodejs"; // ✅ FORZAR Node runtime

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function supaAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) throw new Error("Faltan env vars");

  return createClient(url, key, {
    auth: { persistSession: false },
  });
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const token = (searchParams.get("token") || "").trim();

    if (!token) {
      return NextResponse.json({ error: "Falta token" }, { status: 400 });
    }

    const supabase = supaAdmin();

    // ✅ SOLO columnas reales de guests
    const { data: guest, error: gErr } = await supabase
      .from("guests")
      .select("id,event_id,name,email,phone,max_guests,token,created_at")
      .eq("token", token)
      .maybeSingle();

    if (gErr) {
      return NextResponse.json(
        { error: `Guest query error: ${gErr.message}` },
        { status: 500 }
      );
    }

    if (!guest) {
      return NextResponse.json({ error: "Invitación no encontrada" }, { status: 404 });
    }

    // ✅ evento con campos nuevos
    const { data: event, error: eErr } = await supabase
      .from("events")
      .select(
        "id,org_id,name,event_date,event_datetime,slug,description,location,venue_name,location_url,gift_url_1,gift_url_2,bank_account"
      )
      .eq("id", guest.event_id)
      .maybeSingle();

    if (eErr) {
      return NextResponse.json(
        { error: `Event query error: ${eErr.message}` },
        { status: 500 }
      );
    }

    if (!event) {
      return NextResponse.json({ error: "Evento no encontrado" }, { status: 404 });
    }

    return NextResponse.json({ guest, event }, { status: 200 });
  } catch (e) {
    return NextResponse.json(
      { error: e?.message || "Server error" },
      { status: 500 }
    );
  }
}