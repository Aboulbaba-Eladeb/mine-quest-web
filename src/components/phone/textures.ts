import * as THREE from "three";

function canvas(w: number, h: number) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return [c, c.getContext("2d")!] as const;
}
function rr(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  g.beginPath();
  g.roundRect(x, y, w, h, r);
}
function tex(c: HTMLCanvasElement) {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

/** Home screen: wallpaper, status bar, island, app grid and dock (no real brand icons). */
export function homeScreenTexture() {
  const [c, g] = canvas(1000, 2080);
  const bg = g.createLinearGradient(0, 0, 600, 2080);
  bg.addColorStop(0, "#1D1B4B");
  bg.addColorStop(0.45, "#6C63FF");
  bg.addColorStop(1, "#FF6B5B");
  g.fillStyle = bg;
  g.fillRect(0, 0, 1000, 2080);
  const glow = g.createRadialGradient(760, 620, 0, 760, 620, 620);
  glow.addColorStop(0, "rgba(255,194,51,.7)");
  glow.addColorStop(1, "rgba(255,194,51,0)");
  g.fillStyle = glow;
  g.fillRect(0, 0, 1000, 2080);
  // status bar + island
  g.fillStyle = "#fff";
  g.font = "bold 58px Arial";
  g.fillText("9:41", 110, 120);
  g.strokeStyle = "#fff";
  g.lineWidth = 5;
  rr(g, 780, 82, 84, 40, 10);
  g.stroke();
  rr(g, 788, 90, 60, 24, 6);
  g.fill();
  g.fillStyle = "#000";
  rr(g, 345, 60, 310, 92, 46);
  g.fill();
  // app grid
  const cols = ["#FF6B5B", "#FFC233", "#1FC8A9", "#3DA5FF", "#6C63FF", "#FF8FB1", "#34C759", "#FF9F0A", "#5AC8FA", "#AF52DE", "#FFD60A", "#30B0C7", "#FF453A", "#64D2FF", "#BF5AF2", "#32D74B", "#FFC233", "#3DA5FF", "#1FC8A9", "#FF6B5B"];
  for (let r = 0; r < 5; r++)
    for (let k = 0; k < 4; k++) {
      const x = 95 + k * 220, y = 270 + r * 270, i = r * 4 + k;
      g.fillStyle = cols[i % cols.length];
      rr(g, x, y, 170, 170, 42);
      g.fill();
      g.fillStyle = "rgba(255,255,255,.16)";
      rr(g, x, y, 170, 85, 42);
      g.fill();
      g.fillStyle = "rgba(255,255,255,.92)";
      if (i % 3 === 0) { g.beginPath(); g.arc(x + 85, y + 85, 38, 0, Math.PI * 2); g.fill(); }
      else if (i % 3 === 1) { rr(g, x + 48, y + 48, 74, 74, 18); g.fill(); }
      else { g.beginPath(); g.moveTo(x + 45, y + 122); g.lineTo(x + 85, y + 45); g.lineTo(x + 125, y + 122); g.fill(); }
      g.fillStyle = "rgba(255,255,255,.55)";
      rr(g, x + 25, y + 190, 120, 16, 8);
      g.fill();
    }
  // dock
  g.fillStyle = "rgba(255,255,255,.22)";
  rr(g, 60, 1760, 880, 240, 90);
  g.fill();
  ["#34C759", "#3DA5FF", "#FF9F0A", "#FF453A"].forEach((col, k) => {
    const x = 115 + k * 205;
    g.fillStyle = col;
    rr(g, x, 1795, 170, 170, 42);
    g.fill();
    g.fillStyle = "rgba(255,255,255,.92)";
    g.beginPath();
    g.arc(x + 85, 1880, 38, 0, Math.PI * 2);
    g.fill();
  });
  g.fillStyle = "rgba(255,255,255,.85)";
  rr(g, 340, 2035, 320, 14, 7);
  g.fill();
  return tex(c);
}

export function batteryTexture() {
  const [c, g] = canvas(600, 700);
  const bg = g.createLinearGradient(0, 0, 600, 700);
  bg.addColorStop(0, "#2a2a31");
  bg.addColorStop(1, "#0d0d11");
  g.fillStyle = bg;
  g.fillRect(0, 0, 600, 700);
  g.fillStyle = "rgba(255,255,255,.05)";
  g.beginPath(); g.moveTo(0, 560); g.lineTo(600, 160); g.lineTo(600, 240); g.lineTo(0, 640); g.fill();
  g.strokeStyle = "#fff";
  g.lineWidth = 9;
  rr(g, 190, 230, 210, 110, 16);
  g.stroke();
  g.fillStyle = "#fff";
  rr(g, 404, 262, 18, 46, 5);
  g.fill();
  g.fillStyle = "#1FC8A9";
  rr(g, 206, 246, 128, 78, 8);
  g.fill();
  g.fillStyle = "#fff";
  g.textAlign = "center";
  g.font = "bold 54px Arial";
  g.fillText("Li-ion", 300, 430);
  g.fillStyle = "#b8b8c4";
  g.font = "26px Arial";
  g.fillText("Rechargeable lithium-ion battery", 300, 480);
  g.fillText("3.87 V", 300, 520);
  return tex(c);
}

export function boardTexture() {
  const [c, g] = canvas(500, 1000);
  g.fillStyle = "#14261f";
  g.fillRect(0, 0, 500, 1000);
  g.strokeStyle = "rgba(201,161,75,.55)";
  g.lineWidth = 4;
  for (let i = 0; i < 12; i++) {
    g.beginPath();
    g.moveTo(25 + i * 38, 0);
    g.lineTo(25 + i * 38, 250 + (i % 4) * 70);
    g.lineTo(470 - i * 14, 250 + (i % 4) * 70);
    g.lineTo(470 - i * 14, 1000);
    g.stroke();
  }
  const chips: [number, number, number, number][] = [[40, 60, 150, 100], [290, 70, 160, 80], [50, 700, 190, 120], [280, 720, 170, 170], [60, 880, 140, 70], [50, 560, 90, 70], [370, 560, 80, 60]];
  chips.forEach(([x, y, w, h]) => {
    g.fillStyle = "#111";
    rr(g, x, y, w, h, 8);
    g.fill();
    g.fillStyle = "#333";
    g.fillRect(x + 8, y + 8, w - 16, 10);
  });
  g.fillStyle = "#c9a36a";
  for (let i = 0; i < 40; i++) g.fillRect(30 + ((i * 137) % 430), 520 + ((i * 89) % 440), 26, 12);
  g.strokeStyle = "#c9a14b";
  g.lineWidth = 10;
  g.strokeRect(5, 5, 490, 990);
  return tex(c);
}

export function socTexture() {
  const [c, g] = canvas(512, 512);
  const m = g.createLinearGradient(0, 0, 512, 512);
  m.addColorStop(0, "#f4f5f7");
  m.addColorStop(0.45, "#b9bcc3");
  m.addColorStop(0.55, "#d7d9de");
  m.addColorStop(1, "#8c9097");
  g.fillStyle = "#2b2b2f";
  g.fillRect(0, 0, 512, 512);
  g.fillStyle = m;
  rr(g, 30, 30, 452, 452, 26);
  g.fill();
  g.strokeStyle = "#7d8189";
  g.lineWidth = 6;
  g.strokeRect(130, 130, 252, 252);
  g.fillStyle = "#5b5f66";
  g.font = "bold 84px Arial";
  g.textAlign = "center";
  g.fillText("SoC", 256, 286);
  g.beginPath();
  g.arc(72, 72, 14, 0, Math.PI * 2);
  g.fill();
  return tex(c);
}

/** Inside face of the mid-frame, drawn as seen from the back (camera top-left). */
export function midplateTexture() {
  const [c, g] = canvas(700, 1450);
  g.fillStyle = "#34373d";
  g.fillRect(0, 0, 700, 1450);
  for (let i = 0; i < 1450; i += 3) {
    g.fillStyle = `rgba(255,255,255,${0.012 + ((i * 7919) % 13) / 900})`;
    g.fillRect(0, i, 700, 1);
  }
  g.fillStyle = "#1c1d21";
  rr(g, 40, 330, 620, 900, 24);
  g.fill();
  g.strokeStyle = "rgba(255,255,255,.08)";
  g.lineWidth = 2;
  for (let x = 60; x < 650; x += 28) for (let y = 350; y < 1210; y += 28) { g.beginPath(); g.arc(x, y, 1.6, 0, Math.PI * 2); g.stroke(); }
  g.fillStyle = "rgba(255,255,255,.35)";
  g.font = "bold 22px Arial";
  g.textAlign = "center";
  g.fillText("MINE QUEST  ·  MODEL MQ-1", 350, 1290);
  g.font = "18px Arial";
  g.fillText("Every part inside started in a mine", 350, 1320);
  return tex(c);
}

/** Fine grain for the frosted back glass. */
export function frostTexture() {
  const [c, g] = canvas(512, 512);
  const img = g.createImageData(512, 512);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = 150 + Math.random() * 70;
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
    img.data[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(3, 6);
  return t;
}
