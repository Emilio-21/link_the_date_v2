// app/api/events/[slug]/route.js
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function supaAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Faltan env vars");
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function GET(_req, { params }) {
  try {
    const slug = params?.slug;
    if (!slug) return NextResponse.json({ error: "Missing slug" }, { status: 400 });

    const supabase = supaAdmin();

    const { data: event, error } = await supabase
      .from("events")
      .select(
        "id,org_id,name,event_date,event_datetime,slug,description,location,venue_name,location_url,gift_url_1,gift_url_2,bank_account,created_at"
      )
      .eq("slug", slug)
      .single();

    if (error || !event) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ event }, { status: 200 });
  } catch (e) {
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}