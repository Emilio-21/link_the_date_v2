import { Suspense } from "react";
import CallbackClient from "./CallbackClient";

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="w-8 h-8 rounded-full border-2 border-stone-200 border-t-rose-400 animate-spin"/>
      </div>
    }>
      <CallbackClient />
    </Suspense>
  );
}
