"use client";

import * as THREE from "three";
import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { easing } from "maath";
import { Label, type LabelSpec, type V3 } from "../deck/Label";

// A cutaway block of ground. The front face (z = 0) is the cross-section; the block runs back to z = −BD.
// Scale: the pit is drawn to Bingham Canyon's proportions (≈4 km wide, 1.2 km deep), 1 unit ≈ 357 m.
const BW = 22, BH = 7, BD = 9;
const PCX = -4, R0 = 5.6, PD = 3.36, BENCHES = 8, RB = 0.7;
const SX = 6; // underground shaft
const TOWER = 828 / 357; // Burj Khalifa at the same scale

// pit profile from the rim down to the bottom centre: (radius, height)
const PROFILE: [number, number][] = (() => {
  const pts: [number, number][] = [[R0, 0]];
  const drop = PD / BENCHES, step = (R0 - RB) / BENCHES, face = step * 0.55;
  let r = R0, y = 0;
  for (let i = 0; i < BENCHES; i++) {
    r -= face; y -= drop; pts.push([r, y]);
    r -= step - face; pts.push([r, y]);
  }
  pts.push([0, y]);
  return pts;
})();
const PIT_FLOOR = PROFILE[PROFILE.length - 1][1];
const BENCH = Array.from({ length: BENCHES }, (_, i) => ({ y: PROFILE[2 + i * 2][1], r: (PROFILE[1 + i * 2][0] + PROFILE[2 + i * 2][0]) / 2 }));

// ---------- textures
const PX = 50; // pixels per unit
function strata(features: boolean) {
  const c = document.createElement("canvas");
  c.width = BW * PX;
  c.height = BH * PX;
  const g = c.getContext("2d")!;
  const X = (x: number) => (x + BW / 2) * PX, Y = (y: number) => -y * PX;
  const layers: [number, string][] = [[0, "#7a5636"], [0.35, "#c58a4f"], [1.6, "#9a8b7a"], [3.6, "#5d5662"], [BH, "#5d5662"]];
  for (let i = 0; i < layers.length - 1; i++) {
    g.fillStyle = layers[i][1];
    g.beginPath();
    for (let x = -BW / 2; x <= BW / 2; x += 0.2) g.lineTo(X(x), Y(-(layers[i][0] + (i ? 0.18 * Math.sin(x * 0.55 + i * 2) : 0))));
    for (let x = BW / 2; x >= -BW / 2; x -= 0.2) g.lineTo(X(x), Y(-(layers[i + 1][0] + 0.18 * Math.sin(x * 0.55 + (i + 1) * 2))));
    g.fill();
  }
  // grain
  for (let i = 0; i < 9000; i++) {
    g.fillStyle = `rgba(${Math.random() < 0.5 ? "255,255,255" : "0,0,0"},${0.04 + Math.random() * 0.08})`;
    g.fillRect(Math.random() * c.width, Math.random() * c.height, 2, 2);
  }
  if (features) {
    const ore = (x: number, y: number, rx: number, ry: number, inner: string, outer: string, fleck: string) => {
      const grad = g.createRadialGradient(X(x), Y(y), 0, X(x), Y(y), rx * PX);
      grad.addColorStop(0, inner);
      grad.addColorStop(1, outer);
      g.fillStyle = grad;
      g.beginPath();
      g.ellipse(X(x), Y(y), rx * PX, ry * PX, 0, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = fleck;
      for (let i = 0; i < 260; i++) {
        const a = Math.random() * Math.PI * 2, d = Math.sqrt(Math.random());
        g.fillRect(X(x) + Math.cos(a) * d * rx * PX * 0.9, Y(y) + Math.sin(a) * d * ry * PX * 0.9, 3, 3);
      }
    };
    ore(PCX, -4.5, 3.3, 1.35, "rgba(60,190,150,.95)", "rgba(201,115,47,.15)", "rgba(255,200,120,.9)"); // copper porphyry under the pit
    ore(8.6, -5.0, 2.2, 0.85, "rgba(170,60,45,.95)", "rgba(120,45,40,.15)", "rgba(230,200,190,.8)"); // iron ore body at depth
    // shaft and tunnels
    g.fillStyle = "#141218";
    g.fillRect(X(SX - 0.2), Y(0), 0.4 * PX, 5.7 * PX);
    for (const [y, a, b] of [[-2.6, SX - 2.0, SX + 2.6], [-4.0, SX - 1.4, SX + 3.6], [-5.2, SX - 2.4, SX + 4.2]] as const) {
      g.fillStyle = "#141218";
      g.fillRect(X(a), Y(y) - 0.17 * PX, (b - a) * PX, 0.34 * PX);
      g.fillStyle = "#FFC233";
      for (let x = a + 0.3; x < b; x += 0.55) { g.beginPath(); g.arc(X(x), Y(y) - 0.08 * PX, 3, 0, Math.PI * 2); g.fill(); }
    }
    g.fillStyle = "#FFC233";
    for (let y = -0.4; y > -5.6; y -= 0.6) { g.beginPath(); g.arc(X(SX), Y(y), 3, 0, Math.PI * 2); g.fill(); }
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}
function groundTop() {
  const c = document.createElement("canvas");
  c.width = c.height = 512;
  const g = c.getContext("2d")!;
  g.fillStyle = "#b99566";
  g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 6000; i++) {
    g.fillStyle = `rgba(${Math.random() < 0.5 ? "255,240,210" : "90,60,30"},${0.06 + Math.random() * 0.1})`;
    g.fillRect(Math.random() * 512, Math.random() * 512, 3, 3);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(4, 2);
  return t;
}

// ---------- geometry
function sectionGeometry() {
  const s = new THREE.Shape();
  s.moveTo(-BW / 2, 0);
  s.lineTo(PCX - R0, 0);
  for (const [r, y] of PROFILE.slice(1)) s.lineTo(PCX - r, y);
  for (const [r, y] of [...PROFILE].reverse().slice(1)) s.lineTo(PCX + r, y);
  s.lineTo(BW / 2, 0);
  s.lineTo(BW / 2, -BH);
  s.lineTo(-BW / 2, -BH);
  s.closePath();
  const geo = new THREE.ShapeGeometry(s);
  const pos = geo.attributes.position, uv = geo.attributes.uv;
  for (let i = 0; i < pos.count; i++) uv.setXY(i, (pos.getX(i) + BW / 2) / BW, (pos.getY(i) + BH) / BH);
  return geo;
}
function topGeometry() {
  // drawn in (x, −z) and laid flat; a half-disc bite is taken out for the pit
  const s = new THREE.Shape();
  s.moveTo(-BW / 2, 0);
  s.lineTo(PCX - R0, 0);
  s.absarc(PCX, 0, R0, Math.PI, 0, true);
  s.lineTo(BW / 2, 0);
  s.lineTo(BW / 2, BD);
  s.lineTo(-BW / 2, BD);
  s.closePath();
  return new THREE.ShapeGeometry(s, 48);
}
function pitGeometry() {
  const geo = new THREE.LatheGeometry(PROFILE.map(([r, y]) => new THREE.Vector2(r, y)), 96, Math.PI / 2, Math.PI);
  const pos = geo.attributes.position;
  const col = new Float32Array(pos.count * 3);
  const top = new THREE.Color("#c49a66"), bot = new THREE.Color("#6e6570");
  const tmp = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    tmp.copy(top).lerp(bot, Math.min(1, -pos.getY(i) / PD));
    col.set([tmp.r, tmp.g, tmp.b], i * 3);
  }
  geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
  return geo;
}

// ---------- pieces
function Truck() {
  return (
    <group scale={0.55}>
      <mesh position={[0, 0.16, 0]}>
        <boxGeometry args={[0.62, 0.2, 0.34]} />
        <meshStandardMaterial color="#FFC233" roughness={0.5} />
      </mesh>
      <mesh position={[-0.08, 0.32, 0]}>
        <boxGeometry args={[0.42, 0.14, 0.32]} />
        <meshStandardMaterial color="#c98a2b" roughness={0.6} />
      </mesh>
      <mesh position={[0.26, 0.3, 0]}>
        <boxGeometry args={[0.12, 0.12, 0.3]} />
        <meshStandardMaterial color="#1D1B4B" roughness={0.4} />
      </mesh>
      {[-0.2, 0.2].map((x) => [-0.17, 0.17].map((z) => (
        <mesh key={`${x}${z}`} position={[x, 0.07, z]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.08, 0.08, 0.06, 12]} />
          <meshStandardMaterial color="#111" />
        </mesh>
      )))}
    </group>
  );
}

function Trucks() {
  const refs = useRef<(THREE.Group | null)[]>([]);
  const lanes = [1, 2, 3, 4, 5, 6, 2, 4];
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    lanes.forEach((b, i) => {
      const g = refs.current[i];
      if (!g) return;
      const { r, y } = BENCH[b];
      const dir = i % 2 ? 1 : -1;
      const u = ((t * 0.06 * (1 + (i % 3) * 0.25) + i * 0.37) % 1 + 1) % 1;
      const phi = Math.PI / 2 + (dir > 0 ? u : 1 - u) * Math.PI;
      g.position.set(PCX + r * Math.sin(phi), y, r * Math.cos(phi));
      g.rotation.y = phi + (dir > 0 ? 0 : Math.PI);
    });
  });
  return <>{lanes.map((_, i) => <group key={i} ref={(el) => { refs.current[i] = el; }}><Truck /></group>)}</>;
}

function Headframe() {
  const steel = <meshStandardMaterial color="#FF6B5B" metalness={0.3} roughness={0.5} />;
  return (
    <group position={[SX, 0, -1.4]}>
      {[-0.35, 0.35].map((x) => (
        <mesh key={x} position={[x * 0.6, 1.05, 0]} rotation={[0, 0, x > 0 ? 0.12 : -0.12]}>
          <boxGeometry args={[0.1, 2.1, 0.1]} />
          {steel}
        </mesh>
      ))}
      <mesh position={[0.55, 0.8, 0.3]} rotation={[0, 0, -0.55]}>
        <boxGeometry args={[0.09, 1.9, 0.09]} />
        {steel}
      </mesh>
      <mesh position={[0, 2.12, 0]}>
        <boxGeometry args={[0.8, 0.12, 0.5]} />
        {steel}
      </mesh>
      <mesh position={[0, 2.42, 0]}>
        <torusGeometry args={[0.28, 0.04, 10, 32]} />
        <meshStandardMaterial color="#d8dbe0" metalness={0.9} roughness={0.3} />
      </mesh>
      <mesh position={[1.3, 0.35, -0.2]}>
        <boxGeometry args={[1.1, 0.7, 0.9]} />
        <meshStandardMaterial color="#e9e3d6" roughness={0.8} />
      </mesh>
      <mesh position={[1.3, 0.74, -0.2]}>
        <boxGeometry args={[1.16, 0.08, 0.96]} />
        <meshStandardMaterial color="#3A3770" roughness={0.6} />
      </mesh>
    </group>
  );
}

function Tower() {
  const segs: [number, number][] = [[0.55, 0.42], [0.45, 0.34], [0.4, 0.27], [0.3, 0.2], [0.18, 0.13], [0.12, 0.08]];
  let y = 0;
  const glass = { color: "#eef3ff", metalness: 0.6, roughness: 0.2, emissive: "#8fa6ff", emissiveIntensity: 0.55 } as const;
  return (
    <>
      {segs.map(([h, w], i) => {
        const m = (
          <mesh key={i} position={[0, y + h / 2, 0]}>
            <boxGeometry args={[w, h, w]} />
            <meshStandardMaterial {...glass} />
          </mesh>
        );
        y += h;
        return m;
      })}
      <mesh position={[0, y + (TOWER - y) / 2, 0]}>
        <cylinderGeometry args={[0.012, 0.03, TOWER - y, 8]} />
        <meshStandardMaterial {...glass} />
      </mesh>
    </>
  );
}

/** Group that eases its scale toward 1 or ~0, used to grow/hide step-specific props. */
function Reveal({ on, children, axis = "xyz" }: { on: boolean; children: React.ReactNode; axis?: "xyz" | "y" }) {
  const ref = useRef<THREE.Group>(null!);
  useFrame((_, dt) => {
    const k = on ? 1 : 0.001;
    easing.damp3(ref.current.scale, axis === "y" ? [1, k, 1] : [k, k, k], on ? 0.5 : 0.2, dt);
    ref.current.visible = ref.current.scale.y > 0.01;
  });
  return <group ref={ref} scale={axis === "y" ? [1, 0.001, 1] : 0.001}>{children}</group>;
}

// ---------- scene
export default function MineScene({ step, active = true }: { step: number; active?: boolean }) {
  const { size, camera } = useThree();
  const wide = size.width > 900;
  const fov = (camera as THREE.PerspectiveCamera).fov ?? 32;
  const ppu0 = size.height / (2 * camera.position.z * Math.tan(((fov / 2) * Math.PI) / 180));

  const tex = useMemo(() => ({ section: strata(true), side: strata(false), top: groundTop() }), []);
  const geo = useMemo(() => ({ section: sectionGeometry(), top: topGeometry(), pit: pitGeometry() }), []);

  // block pose per slide: [position, rotation, scale]
  const lay = (p: V3, r: V3, s: number, np: V3 = [0, 5.5, 0], ns = 0.34) => (wide ? { p, r, s } : { p: np, r, s: ns });
  const G = [
    lay([6, 0.8, 0], [0.45, -0.6, 0], 0.6),
    lay([6, 1.6, 0], [0.32, -0.38, 0], 0.62),
    lay([6.2, 1.9, 0], [0.2, -0.14, 0], 0.62),
    lay([5.4 + 4 * 1.25, -0.6 + 1.7 * 1.25, 0], [0.12, -0.1, 0], 1.25, [4 * 0.62, 5 + 1.7 * 0.62, 0], 0.62),
    lay([8.2, 3.6, 0], [0.5, -0.7, 0], 0.4),
    lay([8.2, 3.6, 0], [0.5, -0.7, 0], 0.4),
    lay([8.4, 3.8, 0], [0.55, -0.8, 0], 0.38),
  ];
  const t = G[Math.min(step, G.length - 1)];
  const ppu = ppu0 * t.s;

  const block = useRef<THREE.Group>(null!);
  useFrame((state, dt) => {
    easing.damp3(block.current.position, [t.p[0], t.p[1] + Math.sin(state.clock.elapsedTime * 0.6) * 0.08, t.p[2]], 0.6, dt);
    easing.dampE(block.current.rotation, t.r, 0.6, dt);
    easing.damp3(block.current.scale, [t.s, t.s, t.s], 0.6, dt);
  });

  const labels: LabelSpec[] = [
    { steps: [1], title: "Copper ore", note: "A rich zone of copper minerals", els: ["Cu"], at: [PCX - 3.2, -4.5, 0.05], side: "left", reach: 0.6 },
    { steps: [1], title: "Iron ore", note: "Deep below the surface", els: ["Fe"], at: [8.6 + 1.8, -5.0, 0.05], side: "right", reach: 0.4 },
    { steps: [2], title: "Open pit", note: "Bingham Canyon, USA", at: [PCX, 0.2, -2.5], side: "top", reach: 1.2 },
    { steps: [2], title: "Underground mine", note: "Kiruna, Sweden", at: [SX, 2.6, -1.4], side: "top", reach: 0.6 },
    { steps: [3], title: "Bingham Canyon", note: "1.2 km deep · 4 km wide", at: [PCX + R0 + 0.5, PIT_FLOOR / 2, 0.05], side: "right", reach: 0.4 },
    { steps: [3], title: "Burj Khalifa", note: "828 m tall", at: [PCX, PIT_FLOOR + TOWER + 0.05, -1.0], side: "top", reach: 1.6 },
  ];
  const stepOn = (s: number[]) => active && s.includes(step);

  return (
    <>
      <directionalLight position={[-6, 9, 8]} intensity={1.2} color="#ffe2b8" />
      <group ref={block} position={G[0].p} rotation={G[0].r} scale={G[0].s}>
        {/* cross-section, sides, top and pit walls */}
        <mesh geometry={geo.section}>
          <meshStandardMaterial map={tex.section} roughness={0.95} />
        </mesh>
        <mesh position={[BW / 2, -BH / 2, -BD / 2]} rotation={[0, Math.PI / 2, 0]}>
          <planeGeometry args={[BD, BH]} />
          <meshStandardMaterial map={tex.side} roughness={0.95} />
        </mesh>
        <mesh position={[-BW / 2, -BH / 2, -BD / 2]} rotation={[0, -Math.PI / 2, 0]}>
          <planeGeometry args={[BD, BH]} />
          <meshStandardMaterial map={tex.side} roughness={0.95} />
        </mesh>
        <mesh position={[0, -BH / 2, -BD]} rotation={[0, Math.PI, 0]}>
          <planeGeometry args={[BW, BH]} />
          <meshStandardMaterial map={tex.side} roughness={0.95} />
        </mesh>
        <mesh geometry={geo.top} rotation={[-Math.PI / 2, 0, 0]}>
          <meshStandardMaterial map={tex.top} roughness={1} />
        </mesh>
        <mesh geometry={geo.pit} position={[PCX, 0, 0]}>
          <meshStandardMaterial vertexColors roughness={1} flatShading side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[PCX, PIT_FLOOR + 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[RB + 0.35, 48, 0, Math.PI]} />
          <meshStandardMaterial color="#2fb9a8" roughness={0.15} metalness={0.2} emissive="#0f5a52" />
        </mesh>

        <Headframe />
        <Trucks />

        {/* Burj Khalifa to scale, standing on the pit floor */}
        <group position={[PCX, PIT_FLOOR, -1.0]}>
          <Reveal on={stepOn([3])} axis="y">
            <Tower />
          </Reveal>
        </group>
        {/* depth and width markers */}
        <Reveal on={stepOn([3])}>
          <mesh position={[PCX + R0 + 0.5, PIT_FLOOR / 2, 0.05]}>
            <boxGeometry args={[0.05, -PIT_FLOOR, 0.02]} />
            <meshBasicMaterial color="#FFC233" toneMapped={false} />
          </mesh>
          {[0, PIT_FLOOR].map((y) => (
            <mesh key={y} position={[PCX + R0 + 0.5, y, 0.05]}>
              <boxGeometry args={[0.4, 0.05, 0.02]} />
              <meshBasicMaterial color="#FFC233" toneMapped={false} />
            </mesh>
          ))}
          <mesh position={[PCX, 0.55, 0.05]}>
            <boxGeometry args={[2 * R0, 0.05, 0.02]} />
            <meshBasicMaterial color="#FFC233" toneMapped={false} />
          </mesh>
          {[PCX - R0, PCX + R0].map((x) => (
            <mesh key={x} position={[x, 0.55, 0.05]}>
              <boxGeometry args={[0.05, 0.4, 0.02]} />
              <meshBasicMaterial color="#FFC233" toneMapped={false} />
            </mesh>
          ))}
        </Reveal>

        {labels.map((l, i) => <Label key={i} spec={l} on={stepOn(l.steps)} ppu={ppu} />)}
      </group>
    </>
  );
}

