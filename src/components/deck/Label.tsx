"use client";

import { Html } from "@react-three/drei";
import { ELEMENTS, type El } from "../phone/data";

export type V3 = [number, number, number];
export type Side = "left" | "right" | "top" | "bottom";
export type LabelSpec = {
  steps: number[];
  title: string;
  els?: El[];
  note?: string;
  at: V3;
  side: Side;
  reach?: number;
  big?: boolean;
  narrow?: Partial<Omit<LabelSpec, "narrow">>;
};

export function Chip({ el, big }: { el: El; big?: boolean }) {
  const e = ELEMENTS[el];
  if (big)
    return (
      <div className="flex h-[78px] w-[64px] flex-col items-center justify-center rounded-lg border-2 border-[#1D1B4B] font-bold leading-none shadow-[3px_3px_0_#1D1B4B]" style={{ background: e.bg, color: e.fg }}>
        <span className="text-[11px]">{e.n}</span>
        <span className="text-[28px]">{el}</span>
        <span className="mt-0.5 text-[9.5px]">{e.name}</span>
      </div>
    );
  return (
    <span className="inline-flex h-6 min-w-[30px] items-center justify-center rounded-md border border-[#1D1B4B] px-1 text-[13px] font-bold" style={{ background: e.bg, color: e.fg }}>
      {el}
    </span>
  );
}

const NO_POINTER = { pointerEvents: "none" } as const;
const Z_RANGE: [number, number] = [30, 0];

export function Label({ spec, on, glow = false, ppu }: { spec: LabelSpec; on: boolean; glow?: boolean; ppu: number }) {
  const reach = Math.max(0, (spec.reach ?? 0) * ppu);
  const horiz = spec.side === "left" || spec.side === "right";
  const flex = { left: "flex-row-reverse", right: "flex-row", top: "flex-col-reverse", bottom: "flex-col" }[spec.side];
  const shift = { left: "translate(-100%,-50%)", right: "translate(0,-50%)", top: "translate(-50%,-100%)", bottom: "translate(-50%,0)" }[spec.side];
  return (
    <Html position={spec.at} zIndexRange={Z_RANGE} style={NO_POINTER}>
      <div className={`flex items-center transition-opacity duration-500 ${flex}`} style={{ transform: shift, opacity: on ? 1 : 0 }}>
        <span className={`h-3 w-3 shrink-0 rounded-full border-2 border-[#1D1B4B] bg-[#FFC233] transition-transform ${glow ? "scale-150" : ""}`} />
        <span className="shrink-0 bg-[#FFC233]" style={horiz ? { width: reach + 12, height: 2 } : { height: reach + 10, width: 2 }} />
        <div className={`w-max max-w-[230px] origin-center rounded-xl max-[900px]:text-[11px] max-[900px]:[zoom:0.72] border-2 border-[#1D1B4B] px-3 py-2 text-[#1D1B4B] shadow-[4px_4px_0_rgba(0,0,0,.45)] transition-all duration-300 ${glow ? "scale-110 bg-[#FFC233]" : "bg-white"}`}>
          <div className="text-[14px] font-bold leading-tight">{spec.title}</div>
          {spec.note && <div className="mt-0.5 text-[12px] leading-snug text-[#4E4C70]">{spec.note}</div>}
          {spec.els && <div className={`mt-1.5 flex ${spec.big ? "gap-2" : "gap-1.5"}`}>{spec.els.map((e) => <Chip key={e} el={e} big={spec.big} />)}</div>}
        </div>
      </div>
    </Html>
  );
}

