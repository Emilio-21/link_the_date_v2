"use client";

export function ButtonSiAsistir({ className = "", label = "SÍ AHÍ ESTARÉ" }) {
  return (
<button
  type="button"
  className={[
    "w-[123px] h-[45px] rounded-[31px] border border-black bg-transparent",
    "text-[10px] tracking-[3.2px] font-cinzel leading-[12px]",
    "px-2 flex items-center justify-center text-center whitespace-normal",
    "hover:bg-black hover:text-white transition",
    className,
  ].join(" ")}
>
  <span className="block max-w-[105px]">{label}</span>
</button>
  );
}

export default ButtonSiAsistir;