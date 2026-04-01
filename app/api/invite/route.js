// app/api/invite/route.js
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function supaAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Faltan env vars");
  return createClient(url, key, {
    auth: { persistSession: false },
    global: {
      fetch: (url, options = {}) => fetch(url, { ...options, cache: 'no-store' })
    }
  });
}

function supaAnon() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Faltan env vars");
  return createClient(url, key, {
    auth: { persistSession: false },
    global: {
      fetch: (url, options = {}) => fetch(url, { ...options, cache: 'no-store' })
    }
  });
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const token = (searchParams.get("token") || "").trim();

    if (!token) {
      return NextResponse.json({ error: "Falta token" }, { status: 400 });
    }

    // Guests con service role (tienen RLS)
    const supabase = supaAdmin();

    const { data: guest, error: gErr } = await supabase
      .from("guests")
      .select("id,event_id,name,email,phone,max_guests,token,created_at")
      .eq("token", token)
      .maybeSingle();

    if (gErr) return NextResponse.json({ error: `Guest query error: ${gErr.message}` }, { status: 500 });
    if (!guest) return NextResponse.json({ error: "Invitación no encontrada" }, { status: 404 });

    // Evento con anon key (política pública)
    const { data: event, error: eErr } = await supaAnon()
      .from("events")
      .select(`
        id, org_id, name, event_date, event_datetime, slug,
        description, location, venue_name, location_url,
        gift_url_1, gift_url_2, bank_account,
        couple_name, main_message,
        dress_code_text, kids_policy_text,
        gift_label_1, gift_label_2,
        bank_name,
        show_dress_code, show_kids_policy, show_gifts, show_bank
      `)
      .eq("id", guest.event_id)
      .maybeSingle();

    if (eErr) return NextResponse.json({ error: `Event query error: ${eErr.message}` }, { status: 500 });
    if (!event) return NextResponse.json({ error: "Evento no encontrado" }, { status: 404 });

    // RSVP con service role
    const { data: rsvp } = await supabase
      .from("rsvps")
      .select("guest_id,attending,party_size,updated_at")
      .eq("guest_id", guest.id)
      .maybeSingle();

    return NextResponse.json(
      { guest, event, rsvp: rsvp || null },
      {
        status: 200,
        headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' }
      }
    );
  } catch (e) {
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}