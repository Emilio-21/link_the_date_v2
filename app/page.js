"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../lib/supabase/client";

export default function DashboardPage() {
  const supabase = createClient();
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [orgName, setOrgName] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        router.push("/login");
        return;
      }
      setUser(data.user);
      setLoading(false);
    };
    loadUser();
  }, []);

  const createOrganization = async () => {
    setError(null);

    const { data: sessionData } = await supabase.auth.getSession();
    console.log("SESSION:", sessionData.session);

    const { error } = await supabase
      .from("organizations")
      .insert({
        name: orgName,
        slug: orgName.toLowerCase().replace(/\s+/g, "-"),
        created_by: user.id,
      });

    if (error) {
      setError(error.message);
    } else {
      setOrgName("");
    }
  };

  if (loading) return <p>Cargando...</p>;

  return (
    <main className="p-8">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      <p className="text-sm opacity-70">Bienvenido, {user.email}</p>

      {error && (
        <div className="mt-4 p-3 border rounded text-red-600">
          {error}
        </div>
      )}

      <section className="mt-8">
        <h2 className="text-xl font-semibold mb-2">Mis Organizaciones</h2>

        <div className="flex gap-2">
          <input
            className="border px-3 py-2 rounded w-full"
            placeholder="Nombre de la organización"
            value={orgName}
            onChange={(e) => setOrgName(e.target.value)}
          />
          <button
            className="border px-4 py-2 rounded"
            onClick={createOrganization}
            disabled={!orgName.trim()}
          >
            Crear
          </button>
        </div>
      </section>
    </main>
  );
}