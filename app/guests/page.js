import { Suspense } from "react";
import GuestsClient from "./GuestsClient";

export default function GuestsPage() {
  return (
    <Suspense fallback={<div className="p-6">Cargando...</div>}>
      <GuestsClient />
    </Suspense>
  );
}
