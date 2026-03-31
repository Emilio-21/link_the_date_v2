"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function CallbackClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState("");
  const supabase = createClient();

  useEffect(() => {
    let alive = true;
    async function run() {
      try {
        const errorParam = searchParams.get("error");
        if (errorParam) { if (alive) setError(errorParam); return; }
        await new Promise((r) => setTimeout(r, 150));
        const { data, error: userError } = await supabase.auth.getUser();
        if (userError) throw userError;
        const user = data?.user;
        if (!user) throw new Error("No se pudo autenticar.");

        // Buscar tenant del usuario
        const { data: tenant } = await supabase
          .from("tenants")
          .select("subdomain")
          .eq("owner_id", user.id)
          .maybeSingle();

        if (tenant?.subdomain) {
          router.replace(`/u/${tenant.subdomain}/dashboard`);
        } else {
          router.replace("/dashboard");
        }
      } catch (err) {
        if (alive) setError(err?.message || "Error en callback");
      }
    }
    run();
    return () => { alive = false; };
  }, [router, searchParams]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50 p-4">
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-800 max-w-sm w-full text-center">
          <p className="font-bold">Error de autenticación</p>
          <p className="text-sm mt-1 opacity-70">{error}</p>
          <a href="/login" className="mt-4 inline-block text-sm text-rose-500 hover:underline">
            Volver al login
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50">
      <div className="flex flex-col items-center gap-3 text-stone-400">
        <div className="w-8 h-8 rounded-full border-2 border-stone-200 border-t-rose-400 animate-spin"/>
        <span className="text-sm font-medium">Iniciando sesión…</span>
      </div>
    </div>
  );
}
