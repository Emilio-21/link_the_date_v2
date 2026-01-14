"use client";

export function ButtonMesaDeWrapper({ className = "", href, label = "Amazon" }) {
  const disabled = !href;

  return (
    <button
      type="button"
      className={[
        "!top-[1248px] !absolute !w-[109px] !h-8 !bg-[#f2ccaa] !rounded-[21px]",
        className,
      ].join(" ")}
      onClick={() => {
        if (!href) return;
        window.open(href, "_blank", "noopener,noreferrer");
      }}
      aria-disabled={disabled}
      title={disabled ? "Falta link de mesa de regalos" : "Abrir mesa de regalos"}
    >
      <span
        className="block w-full text-center font-normal text-black text-[10px] tracking-[3.80px] leading-[normal]"
        style={{ fontFamily: "Cinzel, serif" }}
      >
        {label}
      </span>
    </button>
  );
}