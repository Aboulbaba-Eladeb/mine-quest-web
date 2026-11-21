"use client";

import dynamic from "next/dynamic";

// three.js needs the browser (WebGL, canvas textures), so skip prerendering
const Deck = dynamic(() => import("../deck/Deck"), {
  ssr: false,
  loading: () => <div className="grid h-dvh place-items-center bg-[#1D1B4B] text-sm tracking-[0.25em] text-white/60">LOADING…</div>,
});

export default function PhoneStoryClient() {
  return <Deck />;
}
