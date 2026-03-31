"use client";

import { useState, useEffect } from "react";
import { ButtonLocation } from "./ButtonLocation";
import { ButtonMesaDe } from "./ButtonMesaDe";
import { ButtonMesaDeWrapper } from "./ButtonMesaDeWrapper";
import { ButtonNoAsistir } from "./ButtonNoAsistir";
import { ButtonSiAsistir } from "./ButtonSiAsistir";
import Countdown from "./countdown";

function monthES(dateStr) {
  try {
    if (!dateStr) return "";
    return new Date(`${dateStr}T00:00:00`).toLocaleDateString("es-MX", { month: "long" });
  } catch { return ""; }
}
function dayNum(dateStr) {
  try {
    if (!dateStr) return "";
    return String(new Date(`${dateStr}T00:00:00`).getDate());
  } catch { return ""; }
}
function yearNum(dateStr) {
  try {
    if (!dateStr) return "";
    return String(new Date(`${dateStr}T00:00:00`).getFullYear());
  } catch { return ""; }
}

export function Plantilla({ event, guest, rsvp }) {
  // ── campos del evento ────────────────────────────────────────────────
  const coupleName     = event?.couple_name     || event?.couple_top  || "Los novios";
  const eventDate      = event?.event_date      || event?.date        || "";
  const venueName      = event?.venue_name      || event?.location_name || "";
  const city           = event?.city            || event?.location    || "";
  const time           = event?.time            || "";
  const ampm           = event?.ampm            || "";
  const mapUrl         = event?.map_url         || event?.location_url || null;
  const gift1          = event?.gift_url_1      || null;
  const gift2          = event?.gift_url_2      || null;

  // ── campos personalizables ───────────────────────────────────────────
  const mainMessage    = event?.main_message    || "Nos encantaría contar con tu\npresencia en este día tan especial\npara nosotros";
  const dressCodeText  = event?.dress_code_text || "Formal";
  const kidsPolicyText = event?.kids_policy_text|| "Sin niños";
  const giftLabel1     = event?.gift_label_1    || "Mesa de regalos";
  const giftLabel2     = event?.gift_label_2    || "Mesa de regalos";
  const bankAccount    = event?.bank_account    || null;
  const bankName       = event?.bank_name       || null;

  // ── toggles de secciones ─────────────────────────────────────────────
  const showDressCode  = event?.show_dress_code  !== false;
  const showKidsPolicy = event?.show_kids_policy !== false;
  const showGifts      = event?.show_gifts       !== false;
  const showBank       = event?.show_bank        !== false && !!bankAccount;

  // ── RSVP state ───────────────────────────────────────────────────────
  const [showYesPanel, setShowYesPanel] = useState(false);
  const [partySize, setPartySize]       = useState(1);
  const [rsvpMsg, setRsvpMsg]           = useState("");
  const [busyYes, setBusyYes]           = useState(false);
  const [yesConfirmed, setYesConfirmed] = useState(false);

  useEffect(() => {
    if (!rsvp) return;
    if (rsvp.attending === true) {
      setYesConfirmed(true);
      setPartySize(Math.max(1, Number(rsvp.party_size || 1)));
      setRsvpMsg(`¡CONFIRMADO! ✅ (${rsvp.party_size || 1})`);
    }
    if (rsvp.attending === false) {
      setYesConfirmed(false);
      setPartySize(1);
      setRsvpMsg("Registramos que no podrás asistir");
    }
  }, [rsvp]);

  const maxGuests = Math.max(1, Number(guest?.max_guests || 1));
  const IMG = (name) => `/template/plantilla_v1/${name}`;
  const W = 440;
  const H = 1750;
  const BODY_SHIFT_Y = 80;

  async function confirmYes() {
    if (!guest?.id) { setRsvpMsg("No se encontró el invitado."); return; }
    const size = Math.max(1, Math.min(maxGuests, Number(partySize) || 1));
    try {
      setBusyYes(true); setRsvpMsg("");
      const res = await fetch("/api/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ guest_id: guest.id, attending: true, party_size: size }),
      });
      const text = await res.text();
      let json = null;
      try { json = text ? JSON.parse(text) : null; } catch {}
      if (!res.ok) { setRsvpMsg(json?.error || `No se pudo confirmar (status ${res.status})`); return; }
      setYesConfirmed(true);
      setRsvpMsg(`¡CONFIRMADO! ✅ (${size})`);
      setShowYesPanel(false);
    } catch (e) {
      setRsvpMsg(e?.message || "Error confirmando.");
    } finally { setBusyYes(false); }
  }

  return (
    <main className="min-h-screen w-full bg-[#0f0f10] grid place-items-start justify-center overflow-hidden py-6">
      <div className="relative" style={{ width: W, height: H, transform: "scale(var(--scale))", transformOrigin: "top center", ["--scale"]: 1 }}>
        <div className="absolute inset-0 w-[440px] h-[1700px] relative overflow-hidden bg-[#fff3e7]">

          {/* HERO */}
          <img className="absolute top-0 left-0 w-[440px] h-[390px] object-cover" alt="Portada" src={IMG("anillo-de-compromiso-44-1.png")} />
          <div className="absolute top-0 left-0 w-[440px] h-[248px] bg-[linear-gradient(180deg,rgba(0,0,0,0.58)_0%,rgba(0,0,0,0)_100%)]" />

          {/* Nombre de la pareja */}
          <div className="absolute top-[38px] left-0 w-[440px] text-center text-white text-[40px] leading-[36.2px] font-pinyon">
            {coupleName}
          </div>
          <div className="absolute top-[86px] left-0 w-[440px] text-center text-white text-[13px] tracking-[4.94px] font-cinzel">
            ¡Nos casamos!
          </div>
          <div className="absolute top-[241px] left-0 w-[440px] h-[150px] bg-[linear-gradient(180deg,rgba(255,244,232,0)_0%,rgba(255,244,232,1)_100%)]" />

          {/* BODY */}
          <div className="absolute inset-0" style={{ transform: `translateY(${BODY_SHIFT_Y}px)` }}>

            {/* Countdown */}
            <div className="absolute top-[340px] left-0 w-[440px] text-center text-2xl tracking-[16.80px] text-black font-cinzel">
              <Countdown event={event} />
            </div>
            <div className="absolute top-[367px] left-[81px] text-[13px] tracking-[4.94px] font-cinzel">dias</div>
            <div className="absolute top-[367px] left-[175px] text-[13px] tracking-[4.94px] font-cinzel">hrs</div>
            <div className="absolute top-[367px] left-[253px] text-[13px] tracking-[4.94px] font-cinzel">min</div>
            <div className="absolute top-[367px] left-[333px] text-[13px] tracking-[4.94px] font-cinzel">sec</div>

            {/* Nombre invitado */}
            <div className="absolute top-[417px] left-0 w-[440px] text-center text-black text-[40px] leading-[36.2px] font-pinyon">
              {(guest?.name || "").trim() || "Invitación especial"}
            </div>
            <div className="absolute top-[468px] left-0 w-[440px] text-center text-black text-[13px] tracking-[4.94px] font-cinzel">
              ¡ESTÁN INVITADOS!
            </div>

            {/* Mensaje principal */}
            <p className="absolute top-[498px] left-0 w-[440px] text-center text-black text-sm font-cinzel whitespace-pre-line">
              {mainMessage}
            </p>

            {/* Flores + fecha */}
            <img className="absolute top-[600px] left-[-5px] w-[55px] h-[300px] object-contain z-[10]" alt="" src={IMG("flores-izquierda.svg")} />
            <img className="absolute top-[600px] right-0 w-[55px] h-[300px] object-contain z-[10]" alt="" src={IMG("flores-derecha.svg")} />
            <div className="absolute left-0 w-[440px] h-[120px] pointer-events-none z-[20]" style={{ top: "580px", background: "linear-gradient(360deg, rgba(255,243,231,0) 0%, #fff3e7 100%)" }} />
            <div className="absolute left-0 w-[440px] h-[120px] pointer-events-none z-[20]" style={{ top: "810px", background: "linear-gradient(360deg, #fff3e7 0%, rgba(255,243,231,0.6) 45%, rgba(255,243,231,0) 100%)" }} />
            <img className="absolute top-[617px] left-[220px] w-px h-[142px]" alt="" src={IMG("vector-1.svg")} />

            <div className="absolute top-[636px] left-[80px] text-black text-5xl leading-[43.4px] z-[30] font-pinyon">{monthES(eventDate) || "Agosto"}</div>
            <div className="absolute top-[676px] left-[124px] text-black text-4xl tracking-[-0.36px] font-cinzel">{dayNum(eventDate) || "21"}</div>
            <div className="absolute top-[718px] left-[96px] text-black text-base tracking-[16.48px] font-cinzel">{yearNum(eventDate) || "2026"}</div>
            <div className="absolute top-[643px] left-[250px] text-black text-5xl leading-[43.4px] z-[30] font-pinyon">{time}</div>
            <div className="absolute top-[684px] left-[272px] text-black text-4xl tracking-[-0.36px] z-[30] font-cinzel">{ampm}</div>

            {/* Lugar */}
            <div className="absolute top-[779px] left-0 w-[440px] text-center text-black text-[40px] leading-[36.2px] font-pinyon">{venueName}</div>
            <div className="absolute top-[825px] left-0 w-[440px] text-center text-black text-[13px] tracking-[4.94px] z-[30] font-cinzel">{city}</div>
            <ButtonLocation className="!absolute !left-[calc(50.00%_-_54px)] z-[30]" href={mapUrl} />

            {/* Dress code */}
            {showDressCode && (
              <>
                <div className="absolute top-[930px] left-0 w-[440px] text-center text-black text-[40px] leading-[36.2px] font-pinyon">Dress Code</div>
                <div className="absolute top-[969px] left-0 w-[440px] text-center text-black text-[13px] tracking-[4.94px] font-cinzel">{dressCodeText}</div>
                <p className="absolute top-[991px] left-0 w-[440px] text-center text-black text-sm font-cinzel">
                  ¡luce tu mejor look!<br />obviamente el color blanco está prohibido
                </p>
              </>
            )}

            {/* Kids policy */}
            {showKidsPolicy && (
              <div className="absolute top-[1032px] left-0 w-[440px] text-center text-black text-[13px] tracking-[4.94px] font-cinzel">
                {kidsPolicyText}
              </div>
            )}

            {/* Regalos */}
            {showGifts && (
              <>
                <div className="absolute left-0 w-[440px] h-[80px] z-[20]" style={{ top: "1050px", background: "linear-gradient(360deg, rgba(255,243,231,0) 0%, #fff3e7 100%)" }} />
                <div className="absolute top-[1089px] left-0 w-[440px] text-center text-black text-[40px] leading-[36.2px] z-[30] font-pinyon">Regalos</div>
                <p className="absolute top-[1138px] left-0 w-[440px] text-center text-black text-[13px] font-cinzel">
                  Lo más importante es tu presencia,<br />pero si quieres bendecirnos con algo<br />aquí tienes algunas sugerencias
                </p>
                {gift1 && <ButtonMesaDe className="!left-[calc(50.00%_-_54px)] !absolute" href={gift1} label={giftLabel1} />}
                {gift2 && <ButtonMesaDeWrapper className="!left-[calc(50.00%_-_54px)] !absolute" href={gift2} label={giftLabel2} />}
              </>
            )}

            {/* Cuenta bancaria */}
            {showBank && bankAccount && (
              <>
                <p className="absolute top-[1305px] left-0 w-[440px] text-center text-black text-[11px] z-[30] font-cinzel">
                  DE IGUAL MANERA SI NOS QUIERES BENDECIR<br />CON DINERO, TE DEJAMOS UNA CUENTA
                </p>
                <div className="absolute top-[1343px] left-[calc(50%_-_124px)] w-[249px] h-[25px] bg-[#f2ccaa] rounded-[21px]" />
                <p className="absolute top-[1350px] left-0 w-[440px] text-center text-black text-[10px] tracking-[3.80px] font-cinzel">
                  {bankAccount}
                </p>
                {bankName && (
                  <div className="absolute top-[1371px] left-0 w-[440px] text-center text-black text-[7px] tracking-[2.66px] z-[30] font-cinzel">
                    {bankName.toUpperCase()}
                  </div>
                )}
              </>
            )}

            {/* RSVP */}
            <div className="absolute top-[1434px] left-0 w-[440px] text-center text-black text-[40px] leading-[36.2px] font-pinyon">Confirma tu asistencia</div>
            <div className="absolute top-[1485px] left-0 w-[440px] text-center text-black text-[13px] tracking-[4.94px] font-cinzel">
              Cuentas con {maxGuests} entradas
            </div>

            {showYesPanel && (
              <div className="absolute top-[1468px] left-0 w-[440px] flex justify-center z-[50]">
                <div className="flex items-center gap-2 rounded-full border border-black px-3 py-1 bg-[#fff3e7]">
                  <span className="text-[10px] tracking-[3.8px] font-cinzel">PASES</span>
                  <select className="bg-transparent text-[12px] font-cinzel outline-none" value={partySize} onChange={(e) => setPartySize(Number(e.target.value))}>
                    {Array.from({ length: maxGuests }, (_, i) => i + 1).map((n) => <option key={n} value={n}>{n}</option>)}
                  </select>
                  <button className="rounded-full border border-black px-3 py-1 text-[10px] tracking-[3.8px] font-cinzel" disabled={busyYes} onClick={confirmYes}>
                    {busyYes ? "..." : "CONFIRMAR"}
                  </button>
                  <button className="text-[10px] tracking-[3.8px] font-cinzel px-2" onClick={() => setShowYesPanel(false)}>Cancelar</button>
                </div>
              </div>
            )}

            {rsvpMsg && (
              <div className="absolute top-[1498px] left-0 w-[440px] flex justify-center z-[50]">
                <div className="text-[10px] tracking-[3.8px] font-cinzel bg-white/70 border border-black rounded-full px-3 py-1">{rsvpMsg}</div>
              </div>
            )}

            <div className="absolute left-[calc(50.00%_-_128px)] top-[1530px] z-[40]"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setRsvpMsg(""); setPartySize(1); setShowYesPanel(true); }}>
              <ButtonSiAsistir className="!static" label={yesConfirmed ? "¡CONFIRMADO!" : "SÍ AHÍ ESTARÉ"} />
            </div>
            <div className="absolute left-[calc(50.00%_+_5px)] top-[1530px] z-[40]">
              <ButtonNoAsistir className="!static" guestId={guest?.id}
                onSuccess={() => { setRsvpMsg("Registramos tu respuesta ✅"); setYesConfirmed(false); }}
                onError={(msg) => setRsvpMsg(msg || "No se pudo registrar")} />
            </div>

            {/* Flores abajo */}
            <img className="absolute top-[1066px] left-[-5px] w-[72px] h-[352px] z-[10] object-contain" alt="" src={IMG("flores-izquierda.svg")} />
            <img className="absolute top-[1066px] left-[370px] w-[72px] h-[352px] z-[10] object-contain" alt="" src={IMG("flores-derecha.svg")} />
            <div className="absolute top-[1373px] left-0 w-[440px] h-[53px] z-[20] bg-[linear-gradient(180deg,rgba(255,244,232,0)_0%,rgba(255,244,232,1)_100%)]" />
          </div>
        </div>
      </div>
      <style jsx>{`
        @media (max-width: 440px) {
          main > div { --scale: calc((100vw - 16px) / 440); }
        }
      `}</style>
    </main>
  );
}

export default Plantilla;