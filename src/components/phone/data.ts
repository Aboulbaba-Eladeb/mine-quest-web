export type El = "Li" | "Co" | "C" | "Si" | "Cu" | "Au" | "Sn" | "In" | "Nd" | "Al" | "Ti" | "Fe";

export const ELEMENTS: Record<El, { n: number; name: string; bg: string; fg: string }> = {
  Li: { n: 3, name: "Lithium", bg: "#FF6B5B", fg: "#ffffff" },
  Co: { n: 27, name: "Cobalt", bg: "#3DA5FF", fg: "#ffffff" },
  C: { n: 6, name: "Carbon", bg: "#5A5A6E", fg: "#ffffff" },
  Si: { n: 14, name: "Silicon", bg: "#6C63FF", fg: "#ffffff" },
  Cu: { n: 29, name: "Copper", bg: "#D9843A", fg: "#ffffff" },
  Au: { n: 79, name: "Gold", bg: "#FFC233", fg: "#1D1B4B" },
  Sn: { n: 50, name: "Tin", bg: "#B8BBC4", fg: "#1D1B4B" },
  In: { n: 49, name: "Indium", bg: "#1FC8A9", fg: "#1D1B4B" },
  Nd: { n: 60, name: "Neodymium", bg: "#FF8FB1", fg: "#1D1B4B" },
  Al: { n: 13, name: "Aluminium", bg: "#C9CCD3", fg: "#1D1B4B" },
  Ti: { n: 22, name: "Titanium", bg: "#9EA3AD", fg: "#1D1B4B" },
  Fe: { n: 26, name: "Iron", bg: "#B5523B", fg: "#ffffff" },
};

export type Step = {
  kicker: string;
  title: string;
  body: string;
  facts?: { el: El[]; text: string }[];
};

export const COVER = {
  tag: "Community service · Grade 9–10",
  title: "Mine Quest",
  subtitle: "Smart mining and the future of the minerals inside everything we use",
  meta: "Community Service Program · 2026",
};

const K = (n: number) => `Inside a smartphone · ${n} / 5`;

export const STEPS: Step[] = [
  {
    kicker: K(1),
    title: "What's really inside your phone?",
    body: "Glass and metal on the outside. Inside, a pocket-sized collection of elements mined in countries all over the world.",
  },
  {
    kicker: K(2),
    title: "The outer shell",
    body: "Even the outside of a phone is made of mined materials.",
    facts: [
      { el: ["Si"], text: "The back and the screen are glass, made from silica sand." },
      { el: ["Al", "Ti"], text: "The frame is aluminium or, on newer models, titanium." },
      { el: ["Al"], text: "Sapphire crystal (aluminium oxide) protects the camera lenses." },
    ],
  },
  {
    kicker: K(3),
    title: "The parts inside",
    body: "Under the back glass, with its wireless-charging coil, sit the camera, the logic board, the battery, the speaker and the vibration motor. Each one is built from different elements.",
  },
  {
    kicker: K(4),
    title: "Layer by layer",
    body: "A phone is a sandwich of layers, each built from different mined elements: indium in the touchscreen, aluminium in the frames, copper in the charging coil.",
  },
  {
    kicker: K(5),
    title: "The battery and the chip",
    body: "These two parts hold some of the most important minerals on Earth.",
    facts: [
      { el: ["Li", "Co"], text: "Charging moves lithium ions into the graphite; using the phone lets them flow back. About 3 in 4 tonnes of mined cobalt come from DR Congo, and Australia mines the most lithium." },
      { el: ["Si", "Au"], text: "Silicon is purified from quartz sand, then printed with billions of transistors, each far smaller than a virus. Gold coats the tiny contacts because it never rusts." },
    ],
  },
];
