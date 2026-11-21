export type MinePanel = "stats" | "process" | "dots" | "challenges";

export type MineStep = {
  kicker: string;
  title: string;
  body: string;
  panel?: MinePanel;
  source?: string;
  divider?: boolean;
};

const K = (n: number) => `Mining 101 · ${n} / 6`;

export const MINE_STEPS: MineStep[] = [
  {
    kicker: "Level 1",
    title: "Mining 101",
    body: "Where the materials in our phones, homes and cities really come from.",
    divider: true,
  },
  {
    kicker: K(1),
    title: "What is mining?",
    body: "Mining means digging useful rocks and minerals out of the Earth, then turning them into the things we use every day: metals, stone, salt, fertilizer and fuel. Geologists look for ore, rock rich enough in a mineral to be worth mining.",
  },
  {
    kicker: K(2),
    title: "Two ways to reach the ore",
    body: "Ore near the surface is dug out of a giant terraced hole, an open pit, like Bingham Canyon in the USA. Deep ore is reached through shafts and tunnels: an underground mine, like Kiruna in Sweden, which works more than a kilometre below the surface.",
  },
  {
    kicker: K(3),
    title: "Deeper than the tallest building",
    body: "Bingham Canyon in Utah is one of the largest holes ever dug by people. The Burj Khalifa, the world's tallest building, would fit inside it with room to spare.",
    panel: "stats",
    source: "Rio Tinto Kennecott; Emaar. Pit and tower shown to the same scale.",
  },
  {
    kicker: K(4),
    title: "From rock to your charger cable",
    body: "Every metal goes on the same five-stage journey before it reaches a factory.",
    panel: "process",
  },
  {
    kicker: K(5),
    title: "Mountains of rock for a little metal",
    body: "In a typical copper mine, a tonne of ore holds only about 6 kg of copper. The rest is crushed, separated and left behind.",
    panel: "dots",
    source: "Typical copper ore grade ≈ 0.6% (industry averages).",
  },
  {
    kicker: K(6),
    title: "Why mining needs an upgrade",
    body: "Traditional mining has four big problems. Solving them is what smart mining is about.",
    panel: "challenges",
    source: "Minerals Council South Africa; McKinsey and industry estimates of mining's share of emissions.",
  },
];

export const PROCESS = [
  { title: "Find", text: "Geologists search with maps, satellites and drill samples." },
  { title: "Dig", text: "Drills and controlled blasts break the rock loose." },
  { title: "Move", text: "Giant trucks and conveyors haul it away." },
  { title: "Crush & sort", text: "Mills grind it to powder; the metal is separated from the waste." },
  { title: "Make", text: "Smelters and factories turn the metal into wire, chips and parts." },
];

export const CHALLENGES = [
  { stat: "484", title: "Danger", text: "miners died in South Africa's mines in 1994 alone.", color: "#FF6B5B" },
  { stat: "4–7%", title: "Emissions", text: "of the world's greenhouse gases are estimated to come from mining.", color: "#6C63FF" },
  { stat: "Water", title: "Thirst", text: "Processing ore needs huge amounts of water, often in deserts like Chile's Atacama.", color: "#3DA5FF" },
  { stat: "≈170 t", title: "Waste", text: "of ore are dug and crushed for every tonne of copper.", color: "#1FC8A9" },
];
