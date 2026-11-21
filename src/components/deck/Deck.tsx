"use client";

import { Canvas } from "@react-three/fiber";
import { PerformanceMonitor, PresentationControls } from "@react-three/drei";
import { useCallback, useEffect, useRef, useState } from "react";
import PhoneModel from "../phone/PhoneModel";
import { Effects, StageSet, StudioLights } from "../phone/Stage";
import { COVER, ELEMENTS, STEPS, type El } from "../phone/data";
import MineScene from "../mine/MineScene";
import { CHALLENGES, MINE_STEPS, PROCESS, type MinePanel } from "../mine/data";

type Slide = { kind: "cover" } | { kind: "phone"; step: number } | { kind: "mine"; step: number };
type Scene = "phone" | "mine";

const SLIDES: Slide[] = [
  { kind: "cover" },
  ...STEPS.map((_, step) => ({ kind: "phone" as const, step })),
  ...MINE_STEPS.map((_, step) => ({ kind: "mine" as const, step })),
];
const sceneOf = (s: Slide): Scene => (s.kind === "mine" ? "mine" : "phone");
const SECTION_LABEL: Record<Slide["kind"], string> = { cover: "", phone: "INSIDE A SMARTPHONE", mine: "LEVEL 1 · MINING 101" };
const FADE_MS = 380;

function Tile({ el }: { el: El }) {
  const e = ELEMENTS[el];
  return (
    <span className="inline-flex h-8 min-w-[38px] items-center justify-center rounded-lg border-2 border-[#1D1B4B] px-1.5 text-[15px] font-bold shadow-[2px_2px_0_#1D1B4B]" style={{ background: e.bg, color: e.fg }}>
      {el}
    </span>
  );
}

const card = "rounded-2xl border-2 border-[#1D1B4B] bg-white/95 text-[#1D1B4B] shadow-[4px_4px_0_rgba(0,0,0,.45)]";

function Panel({ id }: { id: MinePanel }) {
  if (id === "stats")
    return (
      <div className="mt-6 grid grid-cols-3 gap-3 max-[900px]:mt-3 max-[900px]:gap-2">
        {[["1.2 km", "deep"], ["4 km", "wide"], ["828 m", "Burj Khalifa"]].map(([n, l], i) => (
          <div key={l} className={`${card} p-3 max-[900px]:p-2 ${i === 2 ? "bg-[#FFC233]!" : ""}`}>
            <div className="text-3xl font-black leading-none max-[900px]:text-xl">{n}</div>
            <div className="mt-1 text-sm font-semibold text-[#4E4C70] max-[900px]:text-xs">{l}</div>
          </div>
        ))}
      </div>
    );
  if (id === "process")
    return (
      <ol className="mt-6 space-y-2.5 max-[900px]:mt-3 max-[900px]:space-y-1.5">
        {PROCESS.map((p, i) => (
          <li key={p.title} className={`${card} flex items-center gap-3 px-3 py-2.5 max-[900px]:py-1.5`} style={{ animation: `rise .6s ${0.12 * i}s both` }}>
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border-2 border-[#1D1B4B] text-base font-black max-[900px]:h-7 max-[900px]:w-7 max-[900px]:text-sm" style={{ background: ["#FFC233", "#FF6B5B", "#1FC8A9", "#3DA5FF", "#6C63FF"][i], color: i === 4 ? "#fff" : "#1D1B4B" }}>{i + 1}</span>
            <span className="w-28 shrink-0 text-[17px] font-bold max-[900px]:w-24 max-[900px]:text-sm">{p.title}</span>
            <span className="text-[14px] leading-snug text-[#4E4C70] max-[900px]:text-xs">{p.text}</span>
          </li>
        ))}
      </ol>
    );
  if (id === "dots") {
    // 1,000 dots = 1 tonne of ore at 1 kg per dot; 6 copper dots
    const copper = new Set([412, 413, 452, 453, 454, 493]);
    return (
      <div className={`${card} mt-6 p-4 max-[900px]:mt-3 max-[900px]:p-3`}>
        <div className="grid gap-[3px]" style={{ gridTemplateColumns: "repeat(40, minmax(0, 1fr))" }}>
          {Array.from({ length: 1000 }, (_, i) => (
            <span key={i} className="aspect-square rounded-full" style={{ background: copper.has(i) ? "#D9843A" : "#d9d6e8", boxShadow: copper.has(i) ? "0 0 0 2px #FFC233" : undefined, animation: copper.has(i) ? "pulse-dot 1.6s ease-in-out infinite" : undefined }} />
          ))}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm font-semibold max-[900px]:text-xs">
          <span className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-[#d9d6e8]" />1 dot = 1 kg of rock</span>
          <span className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-[#D9843A] ring-2 ring-[#FFC233]" />6 kg of copper</span>
        </div>
        <div className="mt-2 text-[15px] font-bold max-[900px]:text-xs">≈ 170 tonnes of ore for every tonne of copper</div>
      </div>
    );
  }
  return (
    <div className="mt-6 grid grid-cols-2 gap-3 max-[900px]:mt-3 max-[900px]:gap-2">
      {CHALLENGES.map((c, i) => (
        <div key={c.title} className={`${card} p-3.5 max-[900px]:p-2`} style={{ animation: `rise .6s ${0.1 * i}s both` }}>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: c.color }} />
            <span className="text-xs font-bold uppercase tracking-[0.18em] text-[#4E4C70]">{c.title}</span>
          </div>
          <div className="mt-1.5 text-3xl font-black leading-none max-[900px]:text-xl" style={{ color: c.color === "#FFC233" ? "#1D1B4B" : c.color }}>{c.stat}</div>
          <div className="mt-1.5 text-[13.5px] leading-snug max-[900px]:text-[11px]">{c.text}</div>
        </div>
      ))}
      <div className="col-span-2 rounded-2xl bg-[#FFC233] px-4 py-2.5 text-center text-[15px] font-bold text-[#1D1B4B] max-[900px]:text-xs">Smart mining is about solving these four problems.</div>
    </div>
  );
}

// ?slide=N (1-based) opens the deck on that slide, handy for rehearsing or jumping during a talk
function initialSlide() {
  const n = Number(new URLSearchParams(window.location.search).get("slide"));
  return Number.isFinite(n) && n >= 1 ? Math.min(SLIDES.length - 1, Math.floor(n) - 1) : 0;
}

export default function Deck() {
  const [i, setI] = useState(initialSlide);
  const [shown, setShown] = useState<Scene>(() => sceneOf(SLIDES[initialSlide()]));
  const [fading, setFading] = useState(false);
  const [fx, setFx] = useState(() => new URLSearchParams(window.location.search).get("fx") !== "0"); // post-processing; off with ?fx=0 or automatically on slow machines
  const [dpr, setDpr] = useState(1.5);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const at = useRef({ i, scene: shown });
  const goTo = useCallback((n: number) => {
    const next = Math.min(SLIDES.length - 1, Math.max(0, n));
    const sc = sceneOf(SLIDES[next]);
    at.current.i = next;
    setI(next);
    if (sc !== at.current.scene) {
      // fade the canvas out, swap the 3D scene, fade back in
      at.current.scene = sc;
      setFading(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => { setShown(sc); setFading(false); }, FADE_MS);
    }
  }, []);
  const go = useCallback((d: number) => goTo(at.current.i + d), [goTo]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (["ArrowRight", "PageDown", " ", "Enter"].includes(e.key)) { e.preventDefault(); go(1); }
      if (["ArrowLeft", "PageUp", "Backspace"].includes(e.key)) { e.preventDefault(); go(-1); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go]);

  const slide = SLIDES[i];
  const phoneStep = slide.kind === "phone" ? slide.step : slide.kind === "mine" ? STEPS.length - 1 : 0;
  const mineStep = slide.kind === "mine" ? slide.step : 0;
  const ph = slide.kind === "phone" ? STEPS[slide.step] : null;
  const mi = slide.kind === "mine" ? MINE_STEPS[slide.step] : null;
  const wide = mi?.panel === "process" || mi?.panel === "dots" || mi?.panel === "challenges";

  return (
    <main className="relative h-dvh w-full overflow-hidden bg-[radial-gradient(ellipse_at_68%_42%,#3a3490_0%,#1D1B4B_52%,#110f30_100%)] text-white select-none">
      <div className="absolute inset-0 transition-opacity" style={{ opacity: fading ? 0 : 1, transitionDuration: `${FADE_MS}ms` }}>
        <Canvas dpr={dpr} camera={{ position: [0, 0, 40], fov: 32 }} gl={{ antialias: true, alpha: true }}>
          <PerformanceMonitor onDecline={() => { setFx(false); setDpr(1); }} onIncline={() => setDpr(2)} flipflops={3} onFallback={() => { setFx(false); setDpr(1); }} />
          <StudioLights />
          {/* both scenes stay mounted (unmounting drei <Html> labels throws); only the active one is drawn */}
          <group visible={shown === "phone"}>
            <StageSet step={phoneStep} cover={slide.kind === "cover"} />
            <PresentationControls global snap speed={1.4} polar={[-0.5, 0.5]} azimuth={[-Infinity, Infinity]} enabled={shown === "phone"}>
              <PhoneModel step={phoneStep} cover={slide.kind === "cover"} active={shown === "phone" && !fading} />
            </PresentationControls>
          </group>
          <group visible={shown === "mine"}>
            <MineScene step={mineStep} active={shown === "mine" && !fading} />
          </group>
          {fx && <Effects />}
        </Canvas>
      </div>

      {/* section label */}
      <div className={`pointer-events-none absolute left-8 top-7 flex items-center gap-3 transition-opacity duration-500 ${slide.kind === "cover" ? "opacity-0" : ""}`}>
        <span className="rounded-full bg-[#FFC233] px-3.5 py-1 text-xs font-bold tracking-[0.2em] text-[#1D1B4B]">MINE QUEST</span>
        <span className="text-xs font-semibold tracking-[0.25em] text-white/60">{SECTION_LABEL[slide.kind]}</span>
      </div>

      {/* cover */}
      {slide.kind === "cover" && (
        <section className="animate-rise pointer-events-none absolute bottom-24 left-10 top-16 flex w-[min(620px,calc(100%-5rem))] flex-col justify-center max-[900px]:inset-x-0 max-[900px]:top-auto max-[900px]:bottom-0 max-[900px]:w-full max-[900px]:bg-gradient-to-t max-[900px]:from-[#121033] max-[900px]:via-[#1D1B4B]/95 max-[900px]:to-transparent max-[900px]:px-6 max-[900px]:pb-24 max-[900px]:pt-20">
          <span className="w-max rounded-full bg-[#FFC233] px-4 py-1.5 text-xs font-bold uppercase tracking-[0.22em] text-[#1D1B4B]">{COVER.tag}</span>
          <h1 className="mt-6 text-[104px] font-black uppercase leading-[0.9] tracking-tight max-[900px]:text-6xl">
            {COVER.title.split(" ").map((w, k) => (
              <span key={w} className={`block ${k === 1 ? "text-[#FFC233]" : ""}`}>{w}</span>
            ))}
          </h1>
          <p className="mt-6 max-w-[520px] text-2xl leading-snug text-[#E6E4F5] max-[900px]:text-lg">{COVER.subtitle}</p>
          <div className="mt-10 flex items-center gap-4 max-[900px]:mt-6">
            <span className="h-[3px] w-14 rounded-full bg-[#FFC233]" />
            <span className="text-sm font-semibold uppercase tracking-[0.25em] text-white/70">{COVER.meta}</span>
          </div>
        </section>
      )}

      {/* section divider */}
      {mi?.divider && (
        <section key={i} className="animate-rise pointer-events-none absolute bottom-24 left-10 top-16 flex w-[min(560px,calc(100%-5rem))] flex-col justify-center max-[900px]:inset-x-0 max-[900px]:top-auto max-[900px]:bottom-0 max-[900px]:w-full max-[900px]:bg-gradient-to-t max-[900px]:from-[#121033] max-[900px]:via-[#1D1B4B]/95 max-[900px]:to-transparent max-[900px]:px-6 max-[900px]:pb-24 max-[900px]:pt-20">
          <span className="w-max rounded-full bg-[#FF6B5B] px-4 py-1.5 text-xs font-bold uppercase tracking-[0.22em] text-white">{mi.kicker} of 4</span>
          <h1 className="mt-5 text-[88px] font-black leading-[0.95] tracking-tight max-[900px]:text-5xl">{mi.title}</h1>
          <p className="mt-5 max-w-[460px] text-2xl leading-snug text-[#E6E4F5] max-[900px]:text-lg">{mi.body}</p>
        </section>
      )}

      {/* content slides */}
      {(ph || (mi && !mi.divider)) && (
        <section className={`pointer-events-none absolute bottom-24 left-8 top-20 flex flex-col justify-center max-[900px]:inset-x-0 max-[900px]:top-auto max-[900px]:bottom-0 max-[900px]:w-full max-[900px]:bg-gradient-to-t max-[900px]:from-[#121033] max-[900px]:via-[#1D1B4B]/95 max-[900px]:to-transparent max-[900px]:px-6 max-[900px]:pb-24 max-[900px]:pt-16 ${wide ? "w-[min(600px,calc(100%-4rem))]" : "w-[min(420px,calc(100%-4rem))]"}`}>
          <div key={i} className="animate-rise">
            <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#FFC233]">{(ph ?? mi)!.kicker}</p>
            <h1 className="mt-3 text-[44px] font-extrabold leading-[1.05] tracking-tight max-[900px]:text-3xl">{(ph ?? mi)!.title}</h1>
            <p className={`mt-5 text-lg leading-relaxed text-[#E6E4F5] max-[900px]:mt-3 max-[900px]:text-[15px] ${ph?.facts && ph.facts.length <= 2 ? "max-[900px]:hidden" : ""}`}>{(ph ?? mi)!.body}</p>
            {ph?.facts && (
              <ul className="mt-6 space-y-3 max-[900px]:mt-3 max-[900px]:space-y-2">
                {ph.facts.map((f, k) => (
                  <li key={k} className={`${card} flex items-start gap-3 p-3 text-[15px] leading-snug max-[900px]:p-2 max-[900px]:text-[12.5px]`}>
                    <span className="flex shrink-0 gap-1">{f.el.map((e) => <Tile key={e} el={e} />)}</span>
                    <span>{f.text}</span>
                  </li>
                ))}
              </ul>
            )}
            {mi?.panel && <Panel id={mi.panel} />}
            {mi?.source && <p className="mt-4 text-xs italic text-white/50 max-[900px]:hidden">Source: {mi.source}</p>}
          </div>
        </section>
      )}

      {/* navigation */}
      <nav className="absolute bottom-7 left-1/2 flex -translate-x-1/2 items-center gap-4 max-[900px]:gap-3">
        <button onClick={() => go(-1)} disabled={i === 0} aria-label="Previous slide" className="grid h-11 w-11 place-items-center rounded-full border-2 border-white/30 text-xl transition hover:bg-white/10 disabled:opacity-30">←</button>
        <div className="flex items-center gap-2 max-[900px]:gap-1.5">
          {SLIDES.map((s, k) => (
            <span key={k} className="flex items-center gap-2 max-[900px]:gap-1.5">
              {k > 0 && s.kind !== SLIDES[k - 1].kind && <span className="h-4 w-px bg-white/25" />}
              <button onClick={() => goTo(k)} aria-label={k === 0 ? "Go to the cover" : `Go to slide ${k + 1}`} className={`h-2.5 rounded-full transition-all max-[900px]:h-2 ${k === i ? "w-8 bg-[#FFC233] max-[900px]:w-5" : "w-2.5 bg-white/35 hover:bg-white/60 max-[900px]:w-2"}`} />
            </span>
          ))}
        </div>
        <button onClick={() => go(1)} disabled={i === SLIDES.length - 1} aria-label="Next slide" className="grid h-11 w-11 place-items-center rounded-full bg-[#FFC233] text-xl font-bold text-[#1D1B4B] transition hover:scale-105 disabled:opacity-30">→</button>
      </nav>
      {sceneOf(slide) === "phone" && slide.kind !== "cover" && <p className="pointer-events-none absolute bottom-8 right-8 text-xs text-white/45 max-[900px]:hidden">Generic iPhone-style model, for illustration</p>}
    </main>
  );
}
