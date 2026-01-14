// app/api/rsvp/route.js
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
export const runtime = "nodejs";

function supaAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Faltan env vars");
  return createClient(url, key, { auth: { persistSession: false } });
}

/**
 * GET (opcional):
 * - Si mandas ?guest_id=... regresa el RSVP de ese invitado (si existe)
 * - Si no mandas nada, solo dice ok
 */
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const guest_id = searchParams.get("guest_id");

    if (!guest_id) {
      return NextResponse.json({ ok: true, hint: "Use POST to submit RSVP" }, { status: 200 });
    }

    const supabase = supaAdmin();
    const { data, error } = await supabase
      .from("rsvps")
      .select("guest_id,attending,party_size,updated_at")
      .eq("guest_id", guest_id)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ rsvp: data || null }, { status: 200 });
  } catch (e) {
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}

/**
 * POST:
 * body: { guest_id: string, attending: boolean, party_size?: number }
 */
export async function POST(req) {
  try {
    const body = await req.json().catch(() => null);

    const guest_id = body?.guest_id;
    const attending = body?.attending;
    const party_size = body?.party_size;

    if (!guest_id) {
      return NextResponse.json({ error: "Falta guest_id" }, { status: 400 });
    }
    if (typeof attending !== "boolean") {
      return NextResponse.json({ error: "attending debe ser boolean" }, { status: 400 });
    }

    const size = attending ? Math.max(1, Number(party_size || 1)) : 0;

    const supabase = supaAdmin();

    // Upsert por guest_id (un RSVP por invitado)
    const { data, error } = await supabase
      .from("rsvps")
      .upsert(
        {
          guest_id,
          attending,
          party_size: size,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "guest_id" }
      )
      .select("guest_id,attending,party_size,updated_at")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ rsvp: data }, { status: 200 });
  } catch (e) {
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}