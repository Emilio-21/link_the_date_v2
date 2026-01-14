"use client";

export function ButtonLocation({ className = "", href }) {
  const disabled = !href;

  return (
    <button
      type="button"
      className={[
        "!top-[853px] !absolute !w-[109px] !h-8 !bg-[#f1cca9] !rounded-[21px]",
        className,
      ].join(" ")}
      onClick={() => {
        if (!href) return;
        window.open(href, "_blank", "noopener,noreferrer");
      }}
      aria-disabled={disabled}
      title={disabled ? "Falta link de ubicación" : "Abrir ubicación"}
    >
      <span
        className="block w-full text-center font-normal text-black text-[10px] tracking-[3.80px] leading-[normal]"
        style={{ fontFamily: "Cinzel, serif" }}
      >
        Ubicación
      </span>
    </button>
  );
}