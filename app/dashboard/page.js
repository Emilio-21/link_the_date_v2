// app/dashboard/page.js
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../lib/supabase/client";

// ── utils ────────────────────────────────────────────────────────────────────
function slugify(str) {
  return (str||"").toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"-").replace(/(^-|-$)+/g,"").slice(0,60);
}
function slugifyName(str) {
  return (str||"").toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"-").replace(/(^-|-$)+/g,"");
}
function fmtDate(s) {
  try { if(!s)return""; return new Date(`${s}T00:00:00`).toLocaleDateString("es-MX",{weekday:"long",year:"numeric",month:"long",day:"numeric"}); } catch{return s;}
}
function fmtDateTime(s) {
  try { if(!s)return""; const d=new Date(s); if(Number.isNaN(d.getTime()))return""; return d.toLocaleString("es-MX",{weekday:"long",year:"numeric",month:"long",day:"numeric",hour:"numeric",minute:"2-digit"}); } catch{return"";}
}
async function safeJson(res) {
  const text=await res.text(); try{return{ok:res.ok,status:res.status,json:JSON.parse(text),text};}catch{return{ok:res.ok,status:res.status,json:null,text};}
}
function toIsoOrNull(d){if(!d)return null;const x=new Date(d);return Number.isNaN(x.getTime())?null:x.toISOString();}
function dateOnly(d){if(!d)return null;const x=new Date(d);return Number.isNaN(x.getTime())?null:x.toISOString().slice(0,10);}

// ── design system ────────────────────────────────────────────────────────────
function Label({children}){
  return <span className="block text-[10px] font-bold tracking-widest uppercase text-stone-400 mb-1.5">{children}</span>;
}
function Input({className="",...props}){
  return <input className={`w-full rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 text-sm text-stone-800 placeholder:text-stone-300 outline-none transition focus:border-rose-300 focus:ring-2 focus:ring-rose-100 ${className}`} {...props}/>;
}
function Btn({variant="primary",size="md",className="",children,...props}){
  const base="inline-flex items-center justify-center gap-1.5 rounded-xl font-semibold transition-all focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed select-none";
  const variants={
    primary:"bg-stone-900 text-white hover:bg-stone-700 active:scale-95 shadow-sm",
    outline:"border border-stone-200 bg-white text-stone-700 hover:bg-stone-50 active:scale-95",
    rose:"bg-rose-500 text-white hover:bg-rose-600 active:scale-95 shadow-sm shadow-rose-200",
    amber:"bg-amber-400 text-stone-900 hover:bg-amber-500 active:scale-95 shadow-sm",
    ghost:"text-stone-500 hover:bg-stone-100 hover:text-stone-800 active:scale-95",
    danger:"border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 active:scale-95",
  };
  const sizes={sm:"px-3 py-1.5 text-xs",md:"px-4 py-2 text-sm",lg:"px-5 py-2.5 text-sm"};
  return <button className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...props}>{children}</button>;
}
function Card({children,className=""}){
  return <div className={`rounded-2xl border border-stone-100 bg-white shadow-sm ${className}`}>{children}</div>;
}
function Badge({children,color="stone"}){
  const colors={stone:"bg-stone-100 text-stone-600",green:"bg-emerald-50 text-emerald-700 border border-emerald-200",red:"bg-rose-50 text-rose-600 border border-rose-200",amber:"bg-amber-50 text-amber-700 border border-amber-200"};
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${colors[color]}`}>{children}</span>;
}

// ── icons ────────────────────────────────────────────────────────────────────
const Ico={
  Logout:()=><svg width="15"height="15"viewBox="0 0 24 24"fill="none"stroke="currentColor"strokeWidth="2"strokeLinecap="round"strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21"y1="12"x2="9"y2="12"/></svg>,
  Eye:()=><svg width="14"height="14"viewBox="0 0 24 24"fill="none"stroke="currentColor"strokeWidth="2"strokeLinecap="round"strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12"cy="12"r="3"/></svg>,
  Copy:()=><svg width="14"height="14"viewBox="0 0 24 24"fill="none"stroke="currentColor"strokeWidth="2"strokeLinecap="round"strokeLinejoin="round"><rect x="9"y="9"width="13"height="13"rx="2"ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>,
  Edit:()=><svg width="14"height="14"viewBox="0 0 24 24"fill="none"stroke="currentColor"strokeWidth="2"strokeLinecap="round"strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  Trash:()=><svg width="14"height="14"viewBox="0 0 24 24"fill="none"stroke="currentColor"strokeWidth="2"strokeLinecap="round"strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>,
  Users:()=><svg width="14"height="14"viewBox="0 0 24 24"fill="none"stroke="currentColor"strokeWidth="2"strokeLinecap="round"strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9"cy="7"r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  Gift:()=><svg width="14"height="14"viewBox="0 0 24 24"fill="none"stroke="currentColor"strokeWidth="2"strokeLinecap="round"strokeLinejoin="round"><polyline points="20 12 20 22 4 22 4 12"/><rect x="2"y="7"width="20"height="5"/><line x1="12"y1="22"x2="12"y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>,
  Cal:()=><svg width="13"height="13"viewBox="0 0 24 24"fill="none"stroke="currentColor"strokeWidth="2"strokeLinecap="round"strokeLinejoin="round"><rect x="3"y="4"width="18"height="18"rx="2"ry="2"/><line x1="16"y1="2"x2="16"y2="6"/><line x1="8"y1="2"x2="8"y2="6"/><line x1="3"y1="10"x2="21"y2="10"/></svg>,
  Pin:()=><svg width="13"height="13"viewBox="0 0 24 24"fill="none"stroke="currentColor"strokeWidth="2"strokeLinecap="round"strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12"cy="10"r="3"/></svg>,
  Plus:()=><svg width="14"height="14"viewBox="0 0 24 24"fill="none"stroke="currentColor"strokeWidth="2.5"strokeLinecap="round"><line x1="12"y1="5"x2="12"y2="19"/><line x1="5"y1="12"x2="19"y2="12"/></svg>,
  Check:()=><svg width="14"height="14"viewBox="0 0 24 24"fill="none"stroke="currentColor"strokeWidth="2.5"strokeLinecap="round"strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  X:()=><svg width="14"height="14"viewBox="0 0 24 24"fill="none"stroke="currentColor"strokeWidth="2.5"strokeLinecap="round"><line x1="18"y1="6"x2="6"y2="18"/><line x1="6"y1="6"x2="18"y2="18"/></svg>,
};

// ── main ─────────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [loading, setLoading]           = useState(true);
  const [email, setEmail]               = useState(null);
  const [orgs, setOrgs]                 = useState([]);
  const [events, setEvents]             = useState([]);
  const [orgName, setOrgName]           = useState("");
  const [busyOrg, setBusyOrg]           = useState(false);
  const [selectedOrgId, setSelectedOrgId] = useState("");

  // new event
  const [showNewEvent, setShowNewEvent] = useState(false);
  const [eventTitle, setEventTitle]     = useState("");
  const [eventDateTime, setEventDateTime] = useState("");
  const [eventLocation, setEventLocation] = useState("");
  const [eventDesc, setEventDesc]       = useState("");
  const [venueName, setVenueName]       = useState("");
  const [locationUrl, setLocationUrl]   = useState("");
  const [giftUrl1, setGiftUrl1]         = useState("");
  const [giftUrl2, setGiftUrl2]         = useState("");
  const [bankAccount, setBankAccount]   = useState("");
  const [busyEvent, setBusyEvent]       = useState(false);

  // guests
  const [selectedEventId, setSelectedEventId] = useState("");
  const [guests, setGuests]             = useState([]);
  const [showGuestForm, setShowGuestForm] = useState(false);
  const [guestName, setGuestName]       = useState("");
  const [guestPasses, setGuestPasses]   = useState(1);
  const [guestEmail, setGuestEmail]     = useState("");
  const [guestPhone, setGuestPhone]     = useState("");
  const [busyGuest, setBusyGuest]       = useState(false);

  // edit guest
  const [editingGuestId, setEditingGuestId]   = useState(null);
  const [editGuestName, setEditGuestName]     = useState("");
  const [editGuestEmail, setEditGuestEmail]   = useState("");
  const [editGuestPhone, setEditGuestPhone]   = useState("");
  const [editGuestPasses, setEditGuestPasses] = useState(1);
  const [busyUpdateGuest, setBusyUpdateGuest] = useState(false);
  const [busyDeleteGuestId, setBusyDeleteGuestId] = useState(null);

  // edit event
  const [editingEventId, setEditingEventId]         = useState(null);
  const [editEventTitle, setEditEventTitle]         = useState("");
  const [editEventDateTime, setEditEventDateTime]   = useState("");
  const [editEventLocation, setEditEventLocation]   = useState("");
  const [editEventDesc, setEditEventDesc]           = useState("");
  const [editEventVenueName, setEditEventVenueName] = useState("");
  const [editEventLocationUrl, setEditEventLocationUrl] = useState("");
  const [editEventGiftUrl1, setEditEventGiftUrl1]   = useState("");
  const [editEventGiftUrl2, setEditEventGiftUrl2]   = useState("");
  const [editEventBankAccount, setEditEventBankAccount] = useState("");
  const [busyUpdateEvent, setBusyUpdateEvent]       = useState(false);

  // personalización
  const [editCoupleName, setEditCoupleName]         = useState("");
  const [editMainMessage, setEditMainMessage]       = useState("");
  const [editDressCodeText, setEditDressCodeText]   = useState("");
  const [editKidsPolicyText, setEditKidsPolicyText] = useState("");
  const [editGiftLabel1, setEditGiftLabel1]         = useState("");
  const [editGiftLabel2, setEditGiftLabel2]         = useState("");
  const [editBankName, setEditBankName]             = useState("");
  const [editShowDressCode, setEditShowDressCode]   = useState(true);
  const [editShowKidsPolicy, setEditShowKidsPolicy] = useState(true);
  const [editShowGifts, setEditShowGifts]           = useState(true);
  const [editShowBank, setEditShowBank]             = useState(true);

  const [errorMsg, setErrorMsg] = useState(null);
  const [toast, setToast]       = useState(null);

  const currentEvent = events.find((e) => e.id === selectedEventId) || null;

  function showToast(msg, type="success") {
    setToast({msg,type});
    setTimeout(()=>setToast(null), 2500);
  }

  // ── boot ──────────────────────────────────────────────────────────────────
  useEffect(()=>{
    let mounted=true;
    async function boot(){
      setLoading(true);
      const {data:ur}=await supabase.auth.getUser();
      const user=ur?.user;
      if(!user){router.replace("/login");return;}
      if(!mounted)return;
      setEmail(user.email??null);
      await refreshAll(true);
      setLoading(false);
    }
    boot();
    return()=>{mounted=false;};
    // eslint-disable-next-line
  },[]);

  useEffect(()=>{
    if(!selectedOrgId)return;
    refreshEventsForOrg(selectedOrgId,false);
    // eslint-disable-next-line
  },[selectedOrgId]);

  // ── data ──────────────────────────────────────────────────────────────────
  async function refreshAll(initial=false){
    const{data:rows,error}=await supabase.from("organizations").select("id,name,slug,created_at").order("created_at",{ascending:false});
    console.log("UPDATE result:", {updated, error});
    if(error){setErrorMsg(error.message);return;}
    const list=rows||[];
    setOrgs(list);
    const id=selectedOrgId||list?.[0]?.id||"";
    if(!selectedOrgId&&id)setSelectedOrgId(id);
    if(id)await refreshEventsForOrg(id,initial);
    else{setEvents([]);setSelectedEventId("");setGuests([]);stopEditingGuest();}
  }

  async function refreshEventsForOrg(orgId,initial=false){
    const{data:rows,error}=await supabase.from("events")
      .select("id,org_id,name,event_date,event_datetime,slug,description,location,venue_name,location_url,gift_url_1,gift_url_2,bank_account,couple_name,main_message,dress_code_text,kids_policy_text,gift_label_1,gift_label_2,bank_name,show_dress_code,show_kids_policy,show_gifts,show_bank,created_at")
      .eq("org_id",orgId).order("created_at",{ascending:false});
    if(error){setErrorMsg(error.message);return;}
    const list=rows||[];
    setEvents(list);
    if(initial){
      const first=list[0];
      if(first?.id){setSelectedEventId(first.id);await loadGuests(first.id);}
      else{setSelectedEventId("");setGuests([]);stopEditingGuest();}
    }else{
      if(selectedEventId&&!list.some(e=>e.id===selectedEventId)){setSelectedEventId("");setGuests([]);stopEditingGuest();}
    }
  }

  async function loadGuests(eventId){
    const res=await fetch(`/api/guests?event_id=${encodeURIComponent(eventId)}`);
    const p=await safeJson(res);
    if(!p.ok||!p.json){setGuests([]);stopEditingGuest();return;}
    const list=p.json?.guests??[];
    setGuests(list);
    if(editingGuestId&&!list.some(g=>g.id===editingGuestId))stopEditingGuest();
  }

  // ── actions ───────────────────────────────────────────────────────────────
  async function logout(){await supabase.auth.signOut();router.replace("/login");}

  async function createOrganization(){
    const name=orgName.trim();if(!name)return;
    try{
      setBusyOrg(true);
      const{data:ur}=await supabase.auth.getUser();const user=ur?.user;
      if(!user){router.replace("/login");return;}
      const slug=slugify(name)||`org-${Date.now()}`;
      const{data:org,error}=await supabase.from("organizations").insert({name,slug,created_by:user.id}).select("id,name,slug,created_at").single();
      if(error){setErrorMsg(error.message);return;}
      await supabase.from("organization_members").insert({org_id:org.id,user_id:user.id,role:"owner"});
      setOrgName("");setSelectedOrgId(org.id);
      await refreshAll(false);showToast("Organización creada ✓");
    }finally{setBusyOrg(false);}
  }

  async function createEvent(){
    if(!selectedOrgId)return;
    const title=eventTitle.trim();if(!title)return;
    const event_datetime=toIsoOrNull(eventDateTime);
    if(!event_datetime){setErrorMsg("Selecciona fecha y hora.");return;}
    const event_date=dateOnly(eventDateTime)||new Date().toISOString().slice(0,10);
    const slug=slugify(title)||`evento-${Date.now()}`;
    try{
      setBusyEvent(true);
      const{data:ev,error}=await supabase.from("events").insert({
        org_id:selectedOrgId,name:title,event_date,event_datetime,slug,
        description:eventDesc.trim()||null,location:eventLocation.trim()||null,
        venue_name:venueName.trim()||null,location_url:locationUrl.trim()||null,
        gift_url_1:giftUrl1.trim()||null,gift_url_2:giftUrl2.trim()||null,
        bank_account:bankAccount.trim()||null,
      }).select("id,org_id,name,event_date,event_datetime,slug,description,location,venue_name,location_url,gift_url_1,gift_url_2,bank_account,couple_name,main_message,dress_code_text,kids_policy_text,gift_label_1,gift_label_2,bank_name,show_dress_code,show_kids_policy,show_gifts,show_bank,created_at").single();
      if(error){setErrorMsg(error.message);return;}
      setEventTitle("");setEventDateTime("");setEventLocation("");setEventDesc("");
      setVenueName("");setLocationUrl("");setGiftUrl1("");setGiftUrl2("");setBankAccount("");
      setShowNewEvent(false);
      await refreshEventsForOrg(selectedOrgId,false);
      setSelectedEventId(ev.id);await loadGuests(ev.id);
      showToast("Evento creado ✓");
    }finally{setBusyEvent(false);}
  }

  async function copyInviteLink(slug){
    const url=`${window.location.origin}/events/${slug}`;
    try{await navigator.clipboard.writeText(url);showToast("Link copiado ✓");}
    catch{window.prompt("Copia este link:",url);}
  }
  async function copyGuestLink(guest){
    const token=guest?.token;if(!token)return;
    const url=`${window.location.origin}/i/${token}/${slugifyName(guest?.name||"invitado")}`;
    try{await navigator.clipboard.writeText(url);showToast("Link del invitado copiado ✓");}
    catch{window.prompt("Copia este link:",url);}
  }

  async function addGuest(){
    if(!selectedEventId)return;
    const name=guestName.trim();if(!name)return;
    try{
      setBusyGuest(true);
      const res=await fetch("/api/guests",{method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({event_id:selectedEventId,name,max_guests:Number(guestPasses)||1,
          email:guestEmail.trim()||null,phone:guestPhone.trim()||null})});
      const p=await safeJson(res);
      if(!p.ok){setErrorMsg(`Error ${p.status}`);return;}
      setGuestName("");setGuestPasses(1);setGuestEmail("");setGuestPhone("");
      setShowGuestForm(false);await loadGuests(selectedEventId);showToast("Invitado agregado ✓");
    }finally{setBusyGuest(false);}
  }

  function startEditingGuest(g){setEditingGuestId(g.id);setEditGuestName(g.name??"");setEditGuestEmail(g.email??"");setEditGuestPhone(g.phone??"");setEditGuestPasses(Number(g.max_guests)||1);}
  function stopEditingGuest(){setEditingGuestId(null);setEditGuestName("");setEditGuestEmail("");setEditGuestPhone("");setEditGuestPasses(1);}

  async function saveGuestEdits(){
    if(!editingGuestId)return;
    const name=(editGuestName||"").trim();if(!name)return;
    try{
      setBusyUpdateGuest(true);
      const res=await fetch("/api/guests",{method:"PATCH",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({id:editingGuestId,name,email:(editGuestEmail||"").trim()||null,phone:(editGuestPhone||"").trim()||null,max_guests:Number(editGuestPasses)||1})});
      const p=await safeJson(res);
      if(!p.ok){setErrorMsg(`Error ${p.status}`);return;}
      await loadGuests(selectedEventId);stopEditingGuest();showToast("Invitado actualizado ✓");
    }finally{setBusyUpdateGuest(false);}
  }

  async function deleteGuest(id){
    if(!id||!window.confirm("¿Borrar este invitado?"))return;
    try{
      setBusyDeleteGuestId(id);
      const res=await fetch(`/api/guests?id=${encodeURIComponent(id)}`,{method:"DELETE"});
      const p=await safeJson(res);
      if(!p.ok){setErrorMsg(`Error ${p.status}`);return;}
      if(editingGuestId===id)stopEditingGuest();
      await loadGuests(selectedEventId);showToast("Invitado eliminado ✓");
    }finally{setBusyDeleteGuestId(null);}
  }

  function startEditingEvent(ev){
    setEditingEventId(ev.id);setEditEventTitle(ev.name??"");
    const dtLocal=ev.event_datetime?new Date(ev.event_datetime).toLocaleString("sv-SE",{timeZone:"America/Mexico_City"}).replace(" ","T").slice(0,16):"";
    setEditEventDateTime(dtLocal);setEditEventLocation(ev.location??"");setEditEventDesc(ev.description??"");
    setEditEventVenueName(ev.venue_name??"");setEditEventLocationUrl(ev.location_url??"");
    setEditEventGiftUrl1(ev.gift_url_1??"");setEditEventGiftUrl2(ev.gift_url_2??"");setEditEventBankAccount(ev.bank_account??"");
    // personalización
    setEditCoupleName(ev.couple_name??"");
    setEditMainMessage(ev.main_message??"");
    setEditDressCodeText(ev.dress_code_text??"Formal");
    setEditKidsPolicyText(ev.kids_policy_text??"Sin niños");
    setEditGiftLabel1(ev.gift_label_1??"Liverpool");
    setEditGiftLabel2(ev.gift_label_2??"Amazon");
    setEditBankName(ev.bank_name??"");
    setEditShowDressCode(ev.show_dress_code!==false);
    setEditShowKidsPolicy(ev.show_kids_policy!==false);
    setEditShowGifts(ev.show_gifts!==false);
    setEditShowBank(ev.show_bank!==false);
  }
  function stopEditingEvent(){setEditingEventId(null);setEditEventTitle("");setEditEventDateTime("");setEditEventLocation("");setEditEventDesc("");setEditEventVenueName("");setEditEventLocationUrl("");setEditEventGiftUrl1("");setEditEventGiftUrl2("");setEditEventBankAccount("");
    setEditCoupleName("");setEditMainMessage("");setEditDressCodeText("");setEditKidsPolicyText("");setEditGiftLabel1("");setEditGiftLabel2("");setEditBankName("");setEditShowDressCode(true);setEditShowKidsPolicy(true);setEditShowGifts(true);setEditShowBank(true);
  }

  async function updateEvent(){
    if(!editingEventId)return;
    const title=editEventTitle.trim();if(!title)return;
    const event_datetime=toIsoOrNull(editEventDateTime);if(!event_datetime){setErrorMsg("Selecciona fecha y hora.");return;}
    const event_date=dateOnly(editEventDateTime)||new Date().toISOString().slice(0,10);
    try{
      setBusyUpdateEvent(true);
      const{data:updated,error}=await supabase.from("events").update({
        name:title,event_date,event_datetime,
        location:editEventLocation.trim()||null,description:editEventDesc.trim()||null,
        venue_name:editEventVenueName.trim()||null,location_url:editEventLocationUrl.trim()||null,
        gift_url_1:editEventGiftUrl1.trim()||null,gift_url_2:editEventGiftUrl2.trim()||null,
        bank_account:editEventBankAccount.trim()||null,
        couple_name:editCoupleName.trim()||null,
        main_message:editMainMessage.trim()||null,
        dress_code_text:editDressCodeText.trim()||null,
        kids_policy_text:editKidsPolicyText.trim()||null,
        gift_label_1:editGiftLabel1.trim()||null,
        gift_label_2:editGiftLabel2.trim()||null,
        bank_name:editBankName.trim()||null,
        show_dress_code:editShowDressCode,
        show_kids_policy:editShowKidsPolicy,
        show_gifts:editShowGifts,
        show_bank:editShowBank,
      }).eq("id",editingEventId)
        .select("id,org_id,name,event_date,event_datetime,slug,description,location,venue_name,location_url,gift_url_1,gift_url_2,bank_account,couple_name,main_message,dress_code_text,kids_policy_text,gift_label_1,gift_label_2,bank_name,show_dress_code,show_kids_policy,show_gifts,show_bank,created_at")
        .single();
      if(error){setErrorMsg(error.message);return;}
      setEvents(prev=>prev.map(e=>e.id===updated.id?updated:e));
      stopEditingEvent();showToast("Evento actualizado ✓");
    }finally{setBusyUpdateEvent(false);}
  }

  // ── stats ─────────────────────────────────────────────────────────────────
  const rsvpYes=guests.filter(g=>g.rsvp_status==="yes").length;
  const rsvpNo=guests.filter(g=>g.rsvp_status==="no").length;
  const rsvpPending=guests.filter(g=>!g.rsvp_status).length;
  const confirmedCount=guests.reduce((s,g)=>s+(g.rsvp_status==="yes"?(g.rsvp_count??1):0),0);

  // ─────────────────────────────────────────────────────────────────────────
  if(loading){
    return(
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-stone-400">
          <div className="w-8 h-8 rounded-full border-2 border-stone-200 border-t-rose-400 animate-spin"/>
          <span className="text-sm font-medium">Cargando tu dashboard…</span>
        </div>
      </div>
    );
  }

  return(
    <div className="min-h-screen bg-stone-50">

      {/* toast */}
      {toast&&(
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold shadow-xl animate-in slide-in-from-top-2 duration-200
          ${toast.type==="success"?"bg-stone-900 text-white":"bg-rose-500 text-white"}`}>
          <Ico.Check/>{toast.msg}
        </div>
      )}

      {/* topbar */}
      <header className="sticky top-0 z-40 border-b border-stone-100 bg-white/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3.5">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-500 text-white text-xs font-black tracking-tight">L</div>
            <div>
              <div className="text-sm font-black tracking-tight text-stone-900">Link the Date</div>
              {email&&<div className="text-[11px] text-stone-400 leading-none mt-0.5">{email}</div>}
            </div>
          </div>
          <Btn variant="ghost" size="sm" onClick={logout}><Ico.Logout/>Salir</Btn>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 sm:px-6 py-8 space-y-8">

        {/* error */}
        {errorMsg&&(
          <div className="flex items-center gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
            <Ico.X/><span className="flex-1">{errorMsg}</span>
            <button className="opacity-50 hover:opacity-100" onClick={()=>setErrorMsg(null)}><Ico.X/></button>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[260px_1fr]">

          {/* ── sidebar ─────────────────────────────────────────────────── */}
          <aside className="space-y-4">

            {/* orgs */}
            <Card className="p-4">
              <Label>Organización</Label>
              {orgs.length>0&&(
                <div className="mb-3 space-y-1">
                  {orgs.map(o=>(
                    <button key={o.id} onClick={()=>setSelectedOrgId(o.id)}
                      className={`w-full text-left rounded-xl px-3 py-2.5 text-sm font-semibold transition
                        ${selectedOrgId===o.id?"bg-stone-900 text-white":"text-stone-600 hover:bg-stone-50"}`}>
                      {o.name}
                    </button>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <Input value={orgName} onChange={e=>setOrgName(e.target.value)}
                  placeholder="Nueva organización…" className="text-xs py-2"
                  onKeyDown={e=>e.key==="Enter"&&createOrganization()}/>
                <Btn variant="outline" size="sm" onClick={createOrganization} disabled={busyOrg||!orgName.trim()}>
                  <Ico.Plus/>
                </Btn>
              </div>
            </Card>

            {/* rsvp stats */}
            {currentEvent&&guests.length>0&&(
              <Card className="p-4">
                <Label>RSVP — {currentEvent.name}</Label>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {[
                    {val:rsvpYes,   label:"Confirman", bg:"bg-emerald-50 border-emerald-100", tx:"text-emerald-600"},
                    {val:rsvpNo,    label:"No van",    bg:"bg-rose-50 border-rose-100",       tx:"text-rose-500"},
                    {val:rsvpPending,label:"Pendientes",bg:"bg-amber-50 border-amber-100",   tx:"text-amber-500"},
                    {val:confirmedCount,label:"Personas",bg:"bg-stone-100 border-stone-200", tx:"text-stone-700"},
                  ].map(({val,label,bg,tx})=>(
                    <div key={label} className={`rounded-xl border p-3 text-center ${bg}`}>
                      <div className={`text-2xl font-black ${tx}`}>{val}</div>
                      <div className={`text-[10px] font-bold uppercase tracking-wider mt-0.5 ${tx} opacity-70`}>{label}</div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </aside>

          {/* ── main content ────────────────────────────────────────────── */}
          <div className="space-y-6 min-w-0">

            {/* EVENTS */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-black text-stone-900">Eventos</h2>
                  <p className="text-xs text-stone-400">{events.length} evento{events.length!==1?"s":""}</p>
                </div>
                <Btn variant={showNewEvent?"outline":"rose"} size="sm"
                  onClick={()=>setShowNewEvent(!showNewEvent)} disabled={!selectedOrgId}>
                  {showNewEvent?<><Ico.X/>Cancelar</>:<><Ico.Plus/>Nuevo evento</>}
                </Btn>
              </div>

              {/* new event form */}
              {showNewEvent&&(
                <Card className="mb-4 p-5 border-rose-100 bg-gradient-to-b from-rose-50/60 to-white">
                  <p className="text-[10px] font-black uppercase tracking-widest text-rose-400 mb-4">Nuevo evento</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="sm:col-span-2"><Label>Nombre *</Label><Input value={eventTitle} onChange={e=>setEventTitle(e.target.value)} placeholder="Ej. Nuestra Boda"/></div>
                    <div><Label>Fecha y hora *</Label><Input type="datetime-local" value={eventDateTime} onChange={e=>setEventDateTime(e.target.value)}/></div>
                    <div><Label>Venue</Label><Input value={venueName} onChange={e=>setVenueName(e.target.value)} placeholder="Ej. Edificio Ipiña"/></div>
                    <div><Label>Ciudad / Lugar</Label><Input value={eventLocation} onChange={e=>setEventLocation(e.target.value)} placeholder="Ej. San Luis Potosí"/></div>
                    <div><Label>Google Maps</Label><Input value={locationUrl} onChange={e=>setLocationUrl(e.target.value)} placeholder="https://maps.google.com/…"/></div>
                    <div className="sm:col-span-2 rounded-xl border border-amber-100 bg-amber-50/50 p-3 grid sm:grid-cols-2 gap-3">
                      <p className="sm:col-span-2 text-[10px] font-black uppercase tracking-widest text-amber-500 flex items-center gap-1.5"><Ico.Gift/>Mesas de regalos</p>
                      <div><Label>Mesa #1</Label><Input value={giftUrl1} onChange={e=>setGiftUrl1(e.target.value)} placeholder="Liverpool, Palacio…"/></div>
                      <div><Label>Mesa #2</Label><Input value={giftUrl2} onChange={e=>setGiftUrl2(e.target.value)} placeholder="Amazon, etc."/></div>
                    </div>
                    <div><Label>Número de cuenta</Label><Input value={bankAccount} onChange={e=>setBankAccount(e.target.value)} placeholder="CLABE / tarjeta"/></div>
                    <div><Label>Descripción</Label><Input value={eventDesc} onChange={e=>setEventDesc(e.target.value)} placeholder="Mensaje para invitados…"/></div>
                  </div>
                  <div className="mt-4 flex justify-end gap-2">
                    <Btn variant="outline" size="sm" onClick={()=>setShowNewEvent(false)}>Cancelar</Btn>
                    <Btn variant="rose" onClick={createEvent} disabled={busyEvent||!eventTitle.trim()||!eventDateTime}>
                      {busyEvent?"Creando…":"Crear evento"}
                    </Btn>
                  </div>
                </Card>
              )}

              {/* event list */}
              {events.length===0?(
                <Card className="p-10 text-center border-dashed">
                  <div className="text-3xl mb-2">📅</div>
                  <p className="text-sm font-medium text-stone-400">Sin eventos todavía</p>
                  <p className="text-xs text-stone-300 mt-1">Presiona "Nuevo evento" para comenzar</p>
                </Card>
              ):(
                <div className="space-y-3">
                  {events.map(ev=>(
                    <Card key={ev.id} className={`overflow-hidden transition-shadow ${selectedEventId===ev.id?"ring-2 ring-rose-200 ring-offset-1 shadow-md":""}`}>
                      <div className="p-4 sm:p-5">
                        <div className="flex items-start justify-between gap-4 flex-wrap">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="text-base font-black text-stone-900">{ev.name}</h3>
                              {selectedEventId===ev.id&&<Badge color="green">Activo</Badge>}
                            </div>
                            <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-xs text-stone-400">
                              {(ev.event_datetime||ev.event_date)&&(
                                <span className="flex items-center gap-1"><Ico.Cal/>{ev.event_datetime?fmtDateTime(ev.event_datetime):fmtDate(ev.event_date)}</span>
                              )}
                              {(ev.location||ev.venue_name)&&(
                                <span className="flex items-center gap-1"><Ico.Pin/>{[ev.venue_name,ev.location].filter(Boolean).join(" · ")}</span>
                              )}
                              {(ev.gift_url_1||ev.gift_url_2)&&(
                                <span className="flex items-center gap-1 text-amber-500 font-medium"><Ico.Gift/>
                                  {[ev.gift_url_1&&"Mesa 1",ev.gift_url_2&&"Mesa 2"].filter(Boolean).join(" + ")}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-1.5 shrink-0">
                            <Btn variant="outline" size="sm" onClick={()=>router.push(`/events/${ev.slug}`)}><Ico.Eye/>Ver</Btn>
                            <Btn variant="outline" size="sm" onClick={()=>copyInviteLink(ev.slug)}><Ico.Copy/>Link</Btn>
                            <Btn variant={editingEventId===ev.id?"amber":"outline"} size="sm"
                              onClick={()=>editingEventId===ev.id?stopEditingEvent():startEditingEvent(ev)}>
                              <Ico.Edit/>{editingEventId===ev.id?"Cancelar":"Editar"}
                            </Btn>
                            <Btn variant={selectedEventId===ev.id?"primary":"outline"} size="sm"
                              onClick={async()=>{setSelectedEventId(ev.id);await loadGuests(ev.id);}}>
                              <Ico.Users/>{selectedEventId===ev.id?"Invitados ✓":"Invitados"}
                            </Btn>
                          </div>
                        </div>
                      </div>

                      {/* edit panel */}
                      {editingEventId===ev.id&&(
                        <div className="border-t border-stone-100 bg-amber-50/30 px-5 py-4">
                          <p className="text-[10px] font-black uppercase tracking-widest text-amber-500 mb-3">Editar evento</p>
                          <div className="grid gap-3 sm:grid-cols-2">
                            <div className="sm:col-span-2"><Label>Nombre *</Label><Input value={editEventTitle} onChange={e=>setEditEventTitle(e.target.value)}/></div>
                            <div><Label>Fecha y hora *</Label><Input type="datetime-local" value={editEventDateTime} onChange={e=>setEditEventDateTime(e.target.value)}/></div>
                            <div><Label>Venue</Label><Input value={editEventVenueName} onChange={e=>setEditEventVenueName(e.target.value)}/></div>
                            <div><Label>Ciudad / Lugar</Label><Input value={editEventLocation} onChange={e=>setEditEventLocation(e.target.value)}/></div>
                            <div><Label>Google Maps</Label><Input value={editEventLocationUrl} onChange={e=>setEditEventLocationUrl(e.target.value)}/></div>
                            <div className="sm:col-span-2 rounded-xl border border-amber-200 bg-white p-3 grid sm:grid-cols-2 gap-3">
                              <p className="sm:col-span-2 text-[10px] font-black uppercase tracking-widest text-amber-500 flex items-center gap-1.5"><Ico.Gift/>Mesas de regalos</p>
                              <div><Label>Mesa #1</Label><Input value={editEventGiftUrl1} onChange={e=>setEditEventGiftUrl1(e.target.value)} placeholder="https://…"/></div>
                              <div><Label>Mesa #2</Label><Input value={editEventGiftUrl2} onChange={e=>setEditEventGiftUrl2(e.target.value)} placeholder="https://…"/></div>
                            </div>
                            <div><Label>Número de cuenta</Label><Input value={editEventBankAccount} onChange={e=>setEditEventBankAccount(e.target.value)}/></div>
                            <div><Label>Descripción</Label><Input value={editEventDesc} onChange={e=>setEditEventDesc(e.target.value)}/></div>

                            {/* ── PERSONALIZACIÓN DE LA INVITACIÓN ── */}
                            <div className="sm:col-span-2 rounded-xl border border-stone-200 bg-stone-50 p-4 mt-1">
                              <p className="text-[10px] font-black uppercase tracking-widest text-stone-500 mb-3">Personalización de la invitación</p>
                              <div className="grid sm:grid-cols-2 gap-3">

                                <div className="sm:col-span-2">
                                  <Label>Nombre de la pareja / festejado</Label>
                                  <Input value={editCoupleName} onChange={e=>setEditCoupleName(e.target.value)} placeholder="Ej. Andy y Emilio"/>
                                </div>

                                <div className="sm:col-span-2">
                                  <Label>Mensaje principal</Label>
                                  <textarea className="w-full rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 text-sm text-stone-800 placeholder:text-stone-300 outline-none transition focus:border-rose-300 focus:ring-2 focus:ring-rose-100 resize-none" rows={3} value={editMainMessage} onChange={e=>setEditMainMessage(e.target.value)} placeholder="Nos encantaría contar con tu presencia..."/>
                                </div>

                                {/* dress code toggle */}
                                <div className="sm:col-span-2 flex items-center gap-3">
                                  <button type="button" onClick={()=>setEditShowDressCode(v=>!v)} className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors ${editShowDressCode?"bg-rose-500":"bg-stone-200"}`}>
                                    <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${editShowDressCode?"translate-x-4":"translate-x-0"}`}/>
                                  </button>
                                  <Label>Mostrar Dress Code</Label>
                                </div>
                                {editShowDressCode&&(
                                  <div>
                                    <Label>Texto Dress Code</Label>
                                    <Input value={editDressCodeText} onChange={e=>setEditDressCodeText(e.target.value)} placeholder="Formal"/>
                                  </div>
                                )}

                                {/* kids policy toggle */}
                                <div className="flex items-center gap-3">
                                  <button type="button" onClick={()=>setEditShowKidsPolicy(v=>!v)} className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors ${editShowKidsPolicy?"bg-rose-500":"bg-stone-200"}`}>
                                    <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${editShowKidsPolicy?"translate-x-4":"translate-x-0"}`}/>
                                  </button>
                                  <Label>Política de niños</Label>
                                </div>
                                {editShowKidsPolicy&&(
                                  <div>
                                    <Label>Texto política niños</Label>
                                    <Input value={editKidsPolicyText} onChange={e=>setEditKidsPolicyText(e.target.value)} placeholder="Sin niños"/>
                                  </div>
                                )}

                                {/* gifts toggle */}
                                <div className="sm:col-span-2 flex items-center gap-3">
                                  <button type="button" onClick={()=>setEditShowGifts(v=>!v)} className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors ${editShowGifts?"bg-rose-500":"bg-stone-200"}`}>
                                    <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${editShowGifts?"translate-x-4":"translate-x-0"}`}/>
                                  </button>
                                  <Label>Mostrar mesas de regalos</Label>
                                </div>
                                {editShowGifts&&(
                                  <>
                                    <div><Label>Etiqueta Mesa #1</Label><Input value={editGiftLabel1} onChange={e=>setEditGiftLabel1(e.target.value)} placeholder="Liverpool"/></div>
                                    <div><Label>Etiqueta Mesa #2</Label><Input value={editGiftLabel2} onChange={e=>setEditGiftLabel2(e.target.value)} placeholder="Amazon"/></div>
                                  </>
                                )}

                                {/* bank toggle */}
                                <div className="sm:col-span-2 flex items-center gap-3">
                                  <button type="button" onClick={()=>setEditShowBank(v=>!v)} className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors ${editShowBank?"bg-rose-500":"bg-stone-200"}`}>
                                    <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${editShowBank?"translate-x-4":"translate-x-0"}`}/>
                                  </button>
                                  <Label>Mostrar cuenta bancaria</Label>
                                </div>
                                {editShowBank&&(
                                  <div>
                                    <Label>Nombre del banco</Label>
                                    <Input value={editBankName} onChange={e=>setEditBankName(e.target.value)} placeholder="BANAMEX, BBVA, SPEI…"/>
                                  </div>
                                )}

                              </div>
                            </div>

                          </div>
                          <div className="mt-4 flex gap-2 justify-end">
                            <Btn variant="outline" size="sm" onClick={stopEditingEvent}>Cancelar</Btn>
                            <Btn variant="amber" size="sm" onClick={updateEvent} disabled={busyUpdateEvent||!editEventTitle.trim()||!editEventDateTime}>
                              {busyUpdateEvent?"Guardando…":<><Ico.Check/>Guardar cambios</>}
                            </Btn>
                          </div>
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              )}
            </section>

            {/* GUESTS */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-black text-stone-900">Invitados</h2>
                  <p className="text-xs text-stone-400">
                    {currentEvent
                      ?<>Para <span className="font-semibold text-stone-600">{currentEvent.name}</span> — {guests.length} invitado{guests.length!==1?"s":""}</>
                      :"Selecciona un evento arriba"}
                  </p>
                </div>
                {selectedEventId&&(
                  <Btn variant={showGuestForm?"outline":"primary"} size="sm" onClick={()=>setShowGuestForm(!showGuestForm)}>
                    {showGuestForm?<><Ico.X/>Cancelar</>:<><Ico.Plus/>Agregar</>}
                  </Btn>
                )}
              </div>

              {/* add guest */}
              {showGuestForm&&(
                <Card className="mb-4 p-5">
                  <p className="text-[10px] font-black uppercase tracking-widest text-stone-400 mb-3">Nuevo invitado</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div><Label>Nombre *</Label><Input value={guestName} onChange={e=>setGuestName(e.target.value)} placeholder="Nombre completo"/></div>
                    <div><Label>Pases</Label><Input type="number" min={1} max={20} value={guestPasses} onChange={e=>setGuestPasses(e.target.value)}/></div>
                    <div><Label>Email</Label><Input value={guestEmail} onChange={e=>setGuestEmail(e.target.value)} placeholder="Opcional"/></div>
                    <div><Label>Teléfono</Label><Input value={guestPhone} onChange={e=>setGuestPhone(e.target.value)} placeholder="Opcional"/></div>
                  </div>
                  <div className="mt-4 flex justify-end gap-2">
                    <Btn variant="outline" size="sm" onClick={()=>setShowGuestForm(false)}>Cancelar</Btn>
                    <Btn variant="primary" onClick={addGuest} disabled={busyGuest||!guestName.trim()}>
                      {busyGuest?"Agregando…":<><Ico.Plus/>Agregar invitado</>}
                    </Btn>
                  </div>
                </Card>
              )}

              {!selectedEventId?(
                <Card className="p-10 text-center border-dashed">
                  <div className="text-3xl mb-2">👥</div>
                  <p className="text-sm font-medium text-stone-400">Selecciona un evento para gestionar invitados</p>
                </Card>
              ):guests.length===0?(
                <Card className="p-10 text-center border-dashed">
                  <div className="text-3xl mb-2">👥</div>
                  <p className="text-sm font-medium text-stone-400">Sin invitados todavía</p>
                  <p className="text-xs text-stone-300 mt-1">Presiona "Agregar" para empezar</p>
                </Card>
              ):(
                <Card className="overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-stone-100 bg-stone-50/80">
                          {["Nombre","Email","Teléfono","Pases","RSVP","Asistentes","Link",""].map((h,i)=>(
                            <th key={i} className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-wider text-stone-400 whitespace-nowrap">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-50">
                        {guests.map(g=>{
                          const isEditing=editingGuestId===g.id;
                          return(
                            <tr key={g.id} className={`transition-colors ${isEditing?"bg-stone-50":"hover:bg-stone-50/40"}`}>
                              <td className="px-4 py-3">
                                {isEditing
                                  ?<Input className="py-1.5 text-xs" value={editGuestName} onChange={e=>setEditGuestName(e.target.value)}/>
                                  :<span className="font-semibold text-stone-800">{g.name}</span>}
                              </td>
                              <td className="px-4 py-3 text-stone-400 text-xs">
                                {isEditing?<Input className="py-1.5 text-xs" value={editGuestEmail} onChange={e=>setEditGuestEmail(e.target.value)} placeholder="—"/>:(g.email??<span className="text-stone-200">—</span>)}
                              </td>
                              <td className="px-4 py-3 text-stone-400 text-xs">
                                {isEditing?<Input className="py-1.5 text-xs" value={editGuestPhone} onChange={e=>setEditGuestPhone(e.target.value)} placeholder="—"/>:(g.phone??<span className="text-stone-200">—</span>)}
                              </td>
                              <td className="px-4 py-3">
                                {isEditing?<Input type="number" min={1} max={20} className="py-1.5 text-xs w-16" value={editGuestPasses} onChange={e=>setEditGuestPasses(e.target.value)}/>:<Badge>{g.max_guests??1}</Badge>}
                              </td>
                              <td className="px-4 py-3">
                                {g.rsvp_status==="yes"&&<Badge color="green">Sí ✓</Badge>}
                                {g.rsvp_status==="no" &&<Badge color="red">No</Badge>}
                                {!g.rsvp_status       &&<span className="text-stone-200 text-xs">—</span>}
                              </td>
                              <td className="px-4 py-3 text-center font-bold text-stone-700">
                                {g.rsvp_count??<span className="text-stone-200 font-normal text-xs">—</span>}
                              </td>
                              <td className="px-4 py-3">
                                {g.token&&<Btn variant="ghost" size="sm" onClick={()=>copyGuestLink(g)}><Ico.Copy/>Copiar</Btn>}
                              </td>
                              <td className="px-4 py-3">
                                {isEditing?(
                                  <div className="flex gap-1.5">
                                    <Btn variant="primary" size="sm" onClick={saveGuestEdits} disabled={busyUpdateGuest}>{busyUpdateGuest?"…":<Ico.Check/>}</Btn>
                                    <Btn variant="outline" size="sm" onClick={stopEditingGuest}><Ico.X/></Btn>
                                  </div>
                                ):(
                                  <div className="flex gap-1.5">
                                    <Btn variant="ghost" size="sm" onClick={()=>startEditingGuest(g)}><Ico.Edit/></Btn>
                                    <Btn variant="danger" size="sm" onClick={()=>deleteGuest(g.id)} disabled={busyDeleteGuestId===g.id}>
                                      {busyDeleteGuestId===g.id?"…":<Ico.Trash/>}
                                    </Btn>
                                  </div>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </Card>
              )}
            </section>

          </div>
        </div>
      </main>
    </div>
  );
}