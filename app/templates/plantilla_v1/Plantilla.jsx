"use client";

import { useState, useEffect} from "react";
import { ButtonLocation } from "./ButtonLocation";
import { ButtonMesaDe } from "./ButtonMesaDe";
import { ButtonMesaDeWrapper } from "./ButtonMesaDeWrapper";
import { ButtonNoAsistir } from "./ButtonNoAsistir";
import { ButtonSiAsistir } from "./ButtonSiAsistir";
import Countdown from "./countdown";

function monthES(dateStr) {
  try {
    if (!dateStr) return "";
    const d = new Date(`${dateStr}T00:00:00`);
    return d.toLocaleDateString("es-MX", { month: "long" });
  } catch {
    return "";
  }
}

function dayNum(dateStr) {
  try {
    if (!dateStr) return "";
    const d = new Date(`${dateStr}T00:00:00`);
    return String(d.getDate());
  } catch {
    return "";
  }
}

function yearNum(dateStr) {
  try {
    if (!dateStr) return "";
    const d = new Date(`${dateStr}T00:00:00`);
    return String(d.getFullYear());
  } catch {
    return "";
  }
}

export function Plantilla({ event, guest, rsvp }) {
  // Ajusta a tus campos reales
  const coupleTop = event?.couple_top || "Andy y Emilio";
  const eventDate = event?.event_date || event?.date || "";
  const venueName = event?.venue_name || event?.location_name || "Edificio Ipiña";
  const city = event?.city || event?.location || "San Luis Potosí";
  const time = event?.time || "5:00";
  const ampm = event?.ampm || "pm";

  // ✅ Estados para RSVP
  const [showYesPanel, setShowYesPanel] = useState(false);
  const [partySize, setPartySize] = useState(1);
  const [rsvpMsg, setRsvpMsg] = useState("");
  const [busyYes, setBusyYes] = useState(false);
  const [yesConfirmed, setYesConfirmed] = useState(false);

    // ✅ Precargar RSVP si ya existe
  useEffect(() => {
    if (!rsvp) return;

    // Si ya confirmó que sí
    if (rsvp.attending === true) {
      setYesConfirmed(true);
      setPartySize(Math.max(1, Number(rsvp.party_size || 1)));
      setRsvpMsg(`¡CONFIRMADO! ✅ (${rsvp.party_size || 1})`);
    }

    // Si ya confirmó que no
    if (rsvp.attending === false) {
      setYesConfirmed(false);
      setPartySize(1);
      setRsvpMsg("Registramos que no podrás asistir");
    }
  }, [rsvp]);

  // Links
  const mapUrl = event?.map_url || event?.location_url || null;
  const gift1 = event?.gift_url_1 || null;
  const gift2 = event?.gift_url_2 || null;

  const maxGuests = Math.max(1, Number(guest?.max_guests || 1));

  // Imágenes
  const IMG = (name) => `/template/plantilla_v1/${name}`;

  // FRAME FIJO (Figma)
  const W = 440;
  const H = 1750;

  // ✅ AJUSTA ESTE VALOR PARA BAJAR TODO (menos el HERO)
  // Sube/baja este número según lo que cambiaste en el hero.
  const BODY_SHIFT_Y = 80;

  async function confirmYes() {
    if (!guest?.id) {
      setRsvpMsg("No se encontró el invitado.");
      return;
    }

    const size = Math.max(1, Math.min(maxGuests, Number(partySize) || 1));

    try {
      setBusyYes(true);
      setRsvpMsg("");

      const res = await fetch("/api/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          guest_id: guest.id,
          attending: true,
          party_size: size,
        }),
      });

      const text = await res.text();
      let json = null;
      try {
        json = text ? JSON.parse(text) : null;
      } catch {}

      if (!res.ok) {
        setRsvpMsg(json?.error || `No se pudo confirmar (status ${res.status})`);
        return;
      }

      // ✅ SOLO aquí se marca como confirmado
      setYesConfirmed(true);
      setRsvpMsg(`¡CONFIRMADO! ✅ (${size})`);
      setShowYesPanel(false);
    } catch (e) {
      setRsvpMsg(e?.message || "Error confirmando.");
    } finally {
      setBusyYes(false);
    }
  }

  return (
    <main className="min-h-screen w-full bg-[#0f0f10] grid place-items-start justify-center overflow-hidden py-6">
      {/* Escalador */}
      <div
        className="relative"
        style={{
          width: W,
          height: H,
          transform: "scale(var(--scale))",
          transformOrigin: "top center",
          ["--scale"]: 1,
        }}
      >
        {/* Frame fijo (como Figma) */}
        <div className="absolute inset-0 w-[440px] h-[1700px] relative overflow-hidden bg-[#fff3e7]">
          {/* HERO (NO SE MUEVE) */}
          <img
            className="absolute top-0 left-0 w-[440px] h-[390px] object-cover"
            alt="Anillo de compromiso"
            src={IMG("anillo-de-compromiso-44-1.png")}
          />

          {/* overlay oscuro arriba */}
          <div className="absolute top-0 left-0 w-[440px] h-[248px] bg-[linear-gradient(180deg,rgba(0,0,0,0.58)_0%,rgba(0,0,0,0)_100%)]" />

          {/* nombres arriba */}
          <div className="absolute top-[38px] left-0 w-[440px] text-center text-white text-[40px] leading-[36.2px] font-pinyon">
            {coupleTop}
          </div>

          <div className="absolute top-[86px] left-0 w-[440px] text-center text-white text-[13px] tracking-[4.94px] font-cinzel">
            ¡Nos casamos!
          </div>

          {/* gradiente debajo de la foto (también se queda con el hero) */}
          <div className="absolute top-[241px] left-0 w-[440px] h-[150px] bg-[linear-gradient(180deg,rgba(255,244,232,0)_0%,rgba(255,244,232,1)_100%)]" />

          {/* ✅ TODO LO DEMÁS SE MUEVE HACIA ABAJO */}
          <div
            className="absolute inset-0"
            style={{ transform: `translateY(${BODY_SHIFT_Y}px)` }}
          >
            {/* contador */}
            <div className="absolute top-[340px] left-0 w-[440px] text-center text-2xl tracking-[16.80px] text-black font-cinzel">
              <Countdown event={event} />
            </div>

            {/* labels contador */}
            <div className="absolute top-[367px] left-[81px] text-[13px] tracking-[4.94px] font-cinzel">
              dias
            </div>
            <div className="absolute top-[367px] left-[175px] text-[13px] tracking-[4.94px] font-cinzel">
              hrs
            </div>
            <div className="absolute top-[367px] left-[253px] text-[13px] tracking-[4.94px] font-cinzel">
              min
            </div>
            <div className="absolute top-[367px] left-[333px] text-[13px] tracking-[4.94px] font-cinzel">
              sec
            </div>

            {/* titulo principal (nombre del invitado) */}
            <div className="absolute top-[417px] left-0 w-[440px] text-center text-black text-[40px] leading-[36.2px] font-pinyon">
              {(guest?.name || "").trim() || "Invitación especial"}
            </div>

            <div className="absolute top-[468px] left-0 w-[440px] text-center text-black text-[13px] tracking-[4.94px] font-cinzel">
              ¡ESTAN INVITADOS!
            </div>

            <p className="absolute top-[498px] left-0 w-[440px] text-center text-black text-sm font-cinzel">
              Nos encantaría contar con tu
              <br />
              presencia en este día tan especial
              <br />
              para nosotros
            </p>

            {/* FLORES sección fecha */}
            <img
              className="absolute top-[600px] left-[-5px] w-[55px] h-[300px] object-contain z-[10]"
              alt="Flores izquierda"
              src={IMG("flores-izquierda.svg")}
            />
            <img
              className="absolute top-[600px] right-0 w-[55px] h-[300px] object-contain z-[10]"
              alt="Flores derecha"
              src={IMG("flores-derecha.svg")}
            />

            {/* GRADIENTE SUPERIOR */}
            <div
              className="absolute left-0 w-[440px] h-[120px] pointer-events-none z-[20]"
              style={{
                top: "580px",
                background: "linear-gradient(360deg, rgba(255,243,231,0) 0%, #fff3e7 100%)",
              }}
            />

            {/* GRADIENTE INFERIOR */}
            <div
              className="absolute left-0 w-[440px] h-[120px] pointer-events-none z-[20]"
              style={{
                top: "810px",
                background:
                  "linear-gradient(360deg, #fff3e7 0%, rgba(255,243,231,0.6) 45%, rgba(255,243,231,0) 100%)",
              }}
            />

            {/* divisor */}
            <img
              className="absolute top-[617px] left-[220px] w-px h-[142px]"
              alt="Vector"
              src={IMG("vector-1.svg")}
            />

            {/* fecha */}
            <div className="absolute top-[636px] left-[80px] text-black text-5xl leading-[43.4px] z-[30] font-pinyon">
              {monthES(eventDate) || "Agosto"}
            </div>
            <div className="absolute top-[676px] left-[124px] text-black text-4xl tracking-[-0.36px] font-cinzel">
              {dayNum(eventDate) || "21"}
            </div>
            <div className="absolute top-[718px] left-[96px] text-black text-base tracking-[16.48px] font-cinzel">
              {yearNum(eventDate) || "2026"}
            </div>

            {/* hora */}
            <div className="absolute top-[643px] left-[250px] text-black text-5xl leading-[43.4px] z-[30] font-pinyon">
              {time}
            </div>
            <div className="absolute top-[684px] left-[272px] text-black text-4xl tracking-[-0.36px] z-[30] font-cinzel">
              {ampm}
            </div>

            {/* lugar */}
            <div className="absolute top-[779px] left-0 w-[440px] text-center text-black text-[40px] leading-[36.2px] font-pinyon">
              {venueName}
            </div>

            <div className="absolute top-[825px] left-0 w-[440px] text-center text-black text-[13px] tracking-[4.94px] z-[30] font-cinzel">
              {city}
            </div>

            {/* botón ubicación */}
            <ButtonLocation className="!absolute !left-[calc(50.00%_-_54px)] z-[30]" href={mapUrl} />

            {/* Dress code */}
            <div className="absolute top-[930px] left-0 w-[440px] text-center text-black text-[40px] leading-[36.2px] font-pinyon">
              Dress Code
            </div>
            <div className="absolute top-[969px] left-0 w-[440px] text-center text-black text-[13px] tracking-[4.94px] font-cinzel">
              formal
            </div>
            <p className="absolute top-[991px] left-0 w-[440px] text-center text-black text-sm font-cinzel">
              ¡luce tu mejor look!
              <br />
              obviamente el color blanco está prohibido
            </p>

            <div className="absolute top-[1032px] left-0 w-[440px] text-center text-black text-[13px] tracking-[4.94px] font-cinzel">
              Sin niños
            </div>

            {/* Regalos */}
            <div
              className="absolute left-0 w-[440px] h-[80px] z-[20]"
              style={{
                top: "1050px",
                background: "linear-gradient(360deg, rgba(255,243,231,0) 0%, #fff3e7 100%)",
              }}
            />

            <div className="absolute top-[1089px] left-0 w-[440px] text-center text-black text-[40px] leading-[36.2px] z-[30] font-pinyon">
              Regalos
            </div>

            <p className="absolute top-[1138px] left-0 w-[440px] text-center text-black text-[13px] font-cinzel">
              Lo más importante es tu presencia,
              <br />
              pero si quieres bendecirnos con algo
              <br />
              aquí tienes algunas sugerencias
            </p>

            <ButtonMesaDe className="!left-[calc(50.00%_-_54px)] !absolute" href={gift1} label="Liverpool" />
            <ButtonMesaDeWrapper className="!left-[calc(50.00%_-_54px)] !absolute" href={gift2} label="Amazon" />

            {/* Texto extra (dinero) */}
            <p className="absolute top-[1305px] left-0 w-[440px] text-center text-black text-[11px] z-[30] font-cinzel">
              DE IGUAL MANERA SI NOS QUIERES BENDECIR
              <br />
              CON DINERO, TE DEJAMOS UNA CUENTA
            </p>

            {/* Cuenta / transferencia (placeholder) */}
            <div className="absolute top-[1343px] left-[calc(50%_-_124px)] w-[249px] h-[25px] bg-[#f2ccaa] rounded-[21px]" />
            <p className="absolute top-[1350px] left-0 w-[440px] text-center text-black text-[10px] tracking-[3.80px] font-cinzel">
              0021 8070 2213 6208 88
            </p>

            {/* Banco */}
            <div className="absolute top-[1371px] left-0 w-[440px] text-center text-black text-[7px] tracking-[2.66px] z-[30] font-cinzel">
              BANAMEX
            </div>

            {/* RSVP */}
            <div className="absolute top-[1434px] left-0 w-[440px] text-center text-black text-[40px] leading-[36.2px] font-pinyon">
              Confirma tu asistencia
            </div>

            <div className="absolute top-[1485px] left-0 w-[440px] text-center text-black text-[13px] tracking-[4.94px] font-cinzel">
              Cuentas con {maxGuests} entradas
            </div>

            {/* ✅ Panel dropdown SOLO cuando presionas "Sí ahí estaré" */}
            {showYesPanel ? (
              <div className="absolute top-[1468px] left-0 w-[440px] flex justify-center z-[50]">
                <div className="flex items-center gap-2 rounded-full border border-black px-3 py-1 bg-[#fff3e7]">
                  <span className="text-[10px] tracking-[3.8px] font-cinzel">PASES</span>

                  <select
                    className="bg-transparent text-[12px] font-cinzel outline-none"
                    value={partySize}
                    onChange={(e) => setPartySize(Number(e.target.value))}
                  >
                    {Array.from({ length: maxGuests }, (_, i) => i + 1).map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>

                  <button
                    className="rounded-full border border-black px-3 py-1 text-[10px] tracking-[3.8px] font-cinzel"
                    disabled={busyYes}
                    onClick={confirmYes}
                  >
                    {busyYes ? "..." : "CONFIRMAR"}
                  </button>

                  <button
                    className="text-[10px] tracking-[3.8px] font-cinzel px-2"
                    onClick={() => setShowYesPanel(false)}
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : null}

            {/* ✅ Mensajito inline */}
            {rsvpMsg ? (
              <div className="absolute top-[1498px] left-0 w-[440px] flex justify-center z-[50]">
                <div className="text-[10px] tracking-[3.8px] font-cinzel bg-white/70 border border-black rounded-full px-3 py-1">
                  {rsvpMsg}
                </div>
              </div>
            ) : null}

            {/* ✅ Botones abajo */}
            <div
              className="absolute left-[calc(50.00%_-_128px)] top-[1530px] z-[40]"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setRsvpMsg("");
                setPartySize(1);
                setShowYesPanel(true);
              }}
            >
              <ButtonSiAsistir className="!static" label={yesConfirmed ? "¡CONFIRMADO!" : "SÍ AHÍ ESTARÉ"} />
            </div>

            <div className="absolute left-[calc(50.00%_+_5px)] top-[1530px] z-[40]">
              <ButtonNoAsistir
                className="!static"
                guestId={guest?.id}
                onSuccess={() => {
                  setRsvpMsg("Registramos tu respuesta ✅");
                  setYesConfirmed(false);
                }}
                onError={(msg) => setRsvpMsg(msg || "No se pudo registrar")}
              />
            </div>

            {/* flores abajo */}
            <img
              className="absolute top-[1066px] left-[-5px] w-[72px] h-[352px] z-[10] object-contain"
              alt="Flores"
              src={IMG("flores-izquierda.svg")}
            />
            <img
              className="absolute top-[1066px] left-[370px] w-[72px] h-[352px] z-[10] object-contain"
              alt="Flores"
              src={IMG("flores-derecha.svg")}
            />
            <div className="absolute top-[1373px] left-0 w-[440px] h-[53px] z-[20] bg-[linear-gradient(180deg,rgba(255,244,232,0)_0%,rgba(255,244,232,1)_100%)]" />
          </div>
        </div>
      </div>

      {/* Auto-scale */}
      <style jsx>{`
        @media (max-width: 440px) {
          main > div {
            --scale: calc((100vw - 16px) / 440);
          }
        }
      `}</style>
    </main>
  );
}

export default Plantilla;