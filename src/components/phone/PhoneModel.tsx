"use client";

import * as THREE from "three";
import { useMemo, useRef, useState, type ReactNode } from "react";
import { useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { easing } from "maath";
import { Label, type LabelSpec } from "../deck/Label";
import { batteryTexture, boardTexture, frostTexture, homeScreenTexture, midplateTexture, socTexture } from "./textures";

// Real-world proportions in cm (iPhone-class: 70.6 × 146.6 × 8.25 mm). Front faces +z, so the back view mirrors x.
const W = 7.06, H = 14.66, D = 0.83, R = 1.1;
const STEPS = 5;
const STAGGER = 0.07; // seconds between layers when the phone comes apart / goes back together

type V3 = [number, number, number];
type Pose = { p: V3; r: V3; s: number; o: number; via?: { p: V3; r?: V3; t: number } };

function poses(p: V3, over: Partial<Record<number, Partial<Pose>>> = {}): Pose[] {
  return Array.from({ length: STEPS }, (_, i) => ({ p, r: [0, 0, 0] as V3, s: 1, o: 1, ...over[i] }));
}

// ---------- geometry helpers
function rrShape(w: number, h: number, r: number) {
  const s = new THREE.Shape();
  const x = -w / 2, y = -h / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.absarc(x + w - r, y + r, r, -Math.PI / 2, 0, false);
  s.lineTo(x + w, y + h - r);
  s.absarc(x + w - r, y + h - r, r, 0, Math.PI / 2, false);
  s.lineTo(x + r, y + h);
  s.absarc(x + r, y + h - r, r, Math.PI / 2, Math.PI, false);
  s.lineTo(x, y + r);
  s.absarc(x + r, y + r, r, Math.PI, Math.PI * 1.5, false);
  return s;
}
/** Rounded slab centred on z=0; UVs span the face (mirrored when it is meant to be read from the back). */
function slab(w: number, h: number, r: number, depth: number, bevel = 0.025, fromBack = false) {
  const g = new THREE.ExtrudeGeometry(rrShape(w, h, r), { depth, bevelEnabled: bevel > 0, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 4, curveSegments: 32 });
  g.translate(0, 0, -depth / 2);
  const pos = g.attributes.position, uv = g.attributes.uv;
  for (let i = 0; i < pos.count; i++) {
    const u = (pos.getX(i) + w / 2) / w;
    uv.setXY(i, fromBack ? 1 - u : u, (pos.getY(i) + h / 2) / h);
  }
  return g;
}
function flatPanel(w: number, h: number, r: number) {
  const g = new THREE.ShapeGeometry(rrShape(w, h, r), 32);
  const pos = g.attributes.position, uv = g.attributes.uv;
  for (let i = 0; i < pos.count; i++) uv.setXY(i, (pos.getX(i) + w / 2) / w, (pos.getY(i) + h / 2) / h);
  return g;
}

// ---------- animated part
type PartProps = { step: number; pose: Pose[]; order: number; labels?: LabelSpec[]; ppu: number; wide: boolean; active: boolean; hoverable?: boolean; children: ReactNode };

function Part({ step, pose, order, labels, ppu, wide, active, hoverable, children }: PartProps) {
  const ref = useRef<THREE.Group>(null!);
  const op = useRef(pose[0].o);
  const last = useRef({ step, at: 0, delay: 0 });
  const [hover, setHover] = useState(false);
  const canHover = !!hoverable && (step === 2 || step === 3) && pose[step].o > 0.5;

  useFrame((state, dt) => {
    const now = state.clock.elapsedTime;
    const L = last.current;
    if (L.step !== step) {
      // outer layers lead when coming apart, inner layers lead when going back together
      L.delay = (step > L.step ? order : 6 - order) * STAGGER;
      L.step = step;
      L.at = now;
    }
    const since = now - L.at - L.delay;
    if (since < 0) return;
    const t = pose[step];
    const via = t.via && since < t.via.t ? t.via : null;
    const g = ref.current;
    const s = t.s * (canHover && hover ? 1.05 : 1);
    easing.damp3(g.position, via ? via.p : t.p, via ? 0.18 : 0.42, dt);
    easing.dampE(g.rotation, via?.r ?? t.r, via ? 0.25 : 0.42, dt);
    easing.damp3(g.scale, [s, s, s], 0.25, dt);
    op.current += (t.o - op.current) * (1 - Math.exp(-dt * (via ? 0 : 5)));
    const o = op.current;
    g.visible = o > 0.01;
    g.traverse((obj) => {
      const m = (obj as THREE.Mesh).material as THREE.Material | THREE.Material[] | undefined;
      if (!m) return;
      for (const mm of Array.isArray(m) ? m : [m]) {
        const want = o < 0.99;
        if (mm.transparent !== want) { mm.transparent = want; mm.needsUpdate = true; }
        mm.opacity = o;
      }
    });
  });

  const over = (e: ThreeEvent<PointerEvent>) => { if (!canHover) return; e.stopPropagation(); setHover(true); document.body.style.cursor = "pointer"; };
  const out = () => { setHover(false); document.body.style.cursor = ""; };

  return (
    <group ref={ref} position={pose[0].p} rotation={pose[0].r} scale={pose[0].s} onPointerOver={over} onPointerOut={out}>
      {children}
      {labels?.map((l, i) => <Label key={i} spec={wide || !l.narrow ? l : { ...l, ...l.narrow }} on={active && l.steps.includes(step) && pose[step].o > 0.5} glow={canHover && hover} ppu={ppu} />)}
    </group>
  );
}

// ---------- small building blocks
const metal = (color = "#c9ccd2", roughness = 0.3) => <meshStandardMaterial color={color} metalness={1} roughness={roughness} />;

function Lens({ x, y }: { x: number; y: number }) {
  return (
    <group position={[x, y, -0.42]} rotation={[Math.PI / 2, 0, 0]}>
      <mesh>
        <cylinderGeometry args={[0.66, 0.68, 0.36, 48]} />
        {metal("#d3d6db", 0.2)}
      </mesh>
      <mesh position={[0, -0.18, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.6, 0.035, 12, 48]} />
        {metal("#8e9198", 0.35)}
      </mesh>
      <mesh position={[0, -0.185, 0]}>
        <cylinderGeometry args={[0.56, 0.56, 0.02, 48]} />
        <meshPhysicalMaterial color="#080a1a" roughness={0.03} metalness={0.3} clearcoat={1} clearcoatRoughness={0.02} />
      </mesh>
      <mesh position={[0, -0.19, 0]}>
        <cylinderGeometry args={[0.3, 0.3, 0.01, 32]} />
        <meshStandardMaterial color="#232a72" roughness={0.08} metalness={0.7} emissive="#3a44c8" emissiveIntensity={0.8} />
      </mesh>
      <mesh position={[0, -0.195, 0]}>
        <cylinderGeometry args={[0.1, 0.1, 0.01, 24]} />
        <meshBasicMaterial color="#000" />
      </mesh>
    </group>
  );
}

/** Small round holes on an edge, e.g. speaker grille and mic. Axis along y. */
function Holes({ xs, y, r = 0.045 }: { xs: number[]; y: number; r?: number }) {
  return (
    <>
      {xs.map((x) => (
        <mesh key={x} position={[x, y, 0]}>
          <cylinderGeometry args={[r, r, 0.02, 16]} />
          <meshBasicMaterial color="#060608" />
        </mesh>
      ))}
    </>
  );
}

function Screw({ x, y, z }: { x: number; y: number; z: number }) {
  return (
    <group position={[x, y, z]} rotation={[Math.PI / 2, 0, 0]}>
      <mesh>
        <cylinderGeometry args={[0.1, 0.1, 0.04, 20]} />
        {metal("#dadde2", 0.25)}
      </mesh>
      <mesh position={[0, -0.021, 0]}>
        <boxGeometry args={[0.1, 0.005, 0.02]} />
        <meshBasicMaterial color="#555960" />
      </mesh>
    </group>
  );
}

function Flex({ x, y, z, w, h }: { x: number; y: number; z: number; w: number; h: number }) {
  return (
    <mesh position={[x, y, z]}>
      <boxGeometry args={[w, h, 0.02]} />
      <meshStandardMaterial color="#c98a2b" roughness={0.45} metalness={0.3} />
    </mesh>
  );
}

export default function PhoneModel({ step, cover = false, active = true }: { step: number; cover?: boolean; active?: boolean }) {
  const { size, camera } = useThree();
  const wide = size.width > 900;
  const fov = (camera as THREE.PerspectiveCamera).fov ?? 32;
  const ppu0 = size.height / (2 * camera.position.z * Math.tan(((fov / 2) * Math.PI) / 180));

  const tx = useMemo(() => ({ home: homeScreenTexture(), bat: batteryTexture(), board: boardTexture(), soc: socTexture(), mid: midplateTexture(), frost: frostTexture() }), []);
  const geo = useMemo(() => {
    const outer = rrShape(W, H, R);
    outer.holes.push(rrShape(W - 0.36, H - 0.36, R - 0.18) as unknown as THREE.Path);
    const frame = new THREE.ExtrudeGeometry(outer, { depth: D - 0.06, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.03, bevelSegments: 5, curveSegments: 40 });
    frame.translate(0, 0, -(D - 0.06) / 2);
    return {
      frame,
      display: slab(W - 0.3, H - 0.3, R - 0.15, 0.1, 0.02),
      screen: flatPanel(W - 0.55, H - 0.55, R - 0.3),
      mid: slab(W - 0.4, H - 0.4, R - 0.2, 0.06, 0.01, true),
      back: slab(W - 0.3, H - 0.3, R - 0.15, 0.07, 0.02),
      bump: slab(3.3, 3.35, 0.78, 0.1, 0.03),
      cam: slab(3.1, 3.15, 0.6, 0.3, 0.02),
      bracket: slab(3.3, 3.35, 0.66, 0.1, 0.01),
    };
  }, []);

  // ---------- step poses (phone coordinates)
  const lift: Pose["via"] = { p: [0, 0, -3.2], r: [0.12, -0.1, 0], t: 0.45 }; // back glass first lifts toward the viewer…
  const fly: Partial<Pose> = { p: [-12, 7, -4], r: [0.5, 0.75, 0.35], o: 0, via: lift }; // …then sweeps away
  const gone: Partial<Pose> = { o: 0, s: 0.6 };
  const P = {
    display: poses([0, 0, 0.32], { 3: { p: [0, 0, 6.6] }, 4: gone }),
    mid: poses([0, 0, 0.17], { 3: { p: [0, 0, 3.7] }, 4: gone }),
    frame: poses([0, 0, 0], { 3: { p: [0, 0, 1.0] }, 4: gone }),
    camera: poses([1.46, 5.22, 0], { 3: { p: [1.46, 5.22, -1.5] }, 4: gone }),
    board: poses([-1.7, 4.11, -0.04], { 3: { p: [-1.7, 4.11, -1.5] }, 4: gone }),
    soc: poses([-1.68, 4.84, -0.17], { 3: { p: [-1.68, 4.84, -1.66] }, 4: { p: [4.4, 1.3, 4], r: [0.25, -0.45, 0.05], s: 2.4 } }),
    battery: poses([-0.02, -2.23, -0.03], { 3: { p: [-0.02, -2.23, -1.5] }, 4: { p: [-2.2, -0.4, 2.5], r: [0.18, 0.42, -0.04], s: 1.05 } }),
    taptic: poses([1.47, -6.34, -0.03], { 3: { p: [1.47, -6.34, -1.5] }, 4: gone }),
    speaker: poses([-1.67, -6.34, -0.03], { 3: { p: [-1.67, -6.34, -1.5] }, 4: gone }),
    coil: poses([0, -1.2, -0.27], { 2: { ...fly, via: { ...lift, p: [0, -1.2, -3.0] } }, 3: { p: [0, -1.2, -3.9] }, 4: gone }),
    back: poses([0, 0, -0.36], { 2: fly, 3: { p: [0, 0, -6.3] }, 4: gone }),
  };
  const edge = (x: number, side: "left" | "right") => (side === "left" ? W / 2 - x + 0.2 : W / 2 + x + 0.2);

  // ---------- whole-phone pose per step (+ turntable on step 1)
  const group = useRef<THREE.Group>(null!);
  const spin = useRef(0);
  // wide screens: phone on the right of the text; narrow screens: phone in the top half, text below
  const lay = (x: number, y: number, sc: number, ny = 5.2, nk = 0.55, nx = 0): { p: V3; s: number } => (wide ? { p: [x, y, 0], s: sc } : { p: [nx, ny, 0], s: sc * nk });
  const G: { p: V3; r: V3; s: number }[] = [
    { ...lay(4, 0, 1), r: [0.12, 0, 0.05] },
    { ...lay(4, 0, 1), r: [0.08, Math.PI, -0.04] },
    { ...lay(6, 0, 0.86), r: [0.1, Math.PI - 0.18, 0] },
    { ...lay(4.6, 0, 0.7, 4.6, 0.55, -1.1), r: [0.32, Math.PI + 0.95, 0.02] },
    { ...lay(5.4, 0.2, 0.95, 7.0, 0.5), r: [0, 0, 0] },
  ];
  const ppu = ppu0 * G[step].s;
  // cover: the assembled phone, big and tilted like a product hero shot
  const COVER_POSE: { p: V3; r: V3; s: number } = wide ? { p: [6.2, -0.6, 4], r: [0.22, -0.55, 0.32], s: 1.12 } : { p: [0.6, 5.6, 0], r: [0.22, -0.55, 0.32], s: 0.62 };
  useFrame((state, dt) => {
    const g = group.current, t = cover ? COVER_POSE : G[step];
    if (cover) {
      const ty = t.r[1] + Math.sin(state.clock.elapsedTime * 0.4) * 0.12 + Math.PI * 2 * Math.round((g.rotation.y - t.r[1]) / (Math.PI * 2));
      easing.dampE(g.rotation, [t.r[0], ty, t.r[2]], 0.6, dt);
      spin.current = g.rotation.y;
    } else if (step === 0) {
      spin.current += dt * 0.5;
      easing.damp(g.rotation, "y", spin.current, 0.25, dt);
      easing.damp(g.rotation, "x", t.r[0] + Math.sin(state.clock.elapsedTime * 0.7) * 0.05, 0.4, dt);
      easing.damp(g.rotation, "z", t.r[2], 0.4, dt);
    } else {
      const ty = t.r[1] + Math.PI * 2 * Math.round((g.rotation.y - t.r[1]) / (Math.PI * 2));
      easing.dampE(g.rotation, [t.r[0], ty, t.r[2]], 0.5, dt);
      spin.current = g.rotation.y;
    }
    easing.damp3(g.position, [t.p[0], t.p[1] + Math.sin(state.clock.elapsedTime * 0.9) * 0.12, t.p[2]], 0.5, dt);
    easing.damp3(g.scale, [t.s, t.s, t.s], 0.5, dt);
  });

  const titanium = { color: "#d7d9de", metalness: 1, roughness: 0.24, anisotropy: 0.7, clearcoat: 0.15, clearcoatRoughness: 0.2 } as const;
  const FE = W / 2 + 0.03, FB = -H / 2 - 0.03; // frame outer edge (x) and bottom edge (y)

  return (
    <group ref={group}>
      {/* DISPLAY: glossy black glass with an emissive home screen that still catches reflections */}
      <Part step={step} order={0} pose={P.display} ppu={ppu} wide={wide} active={active && !cover} hoverable labels={[{ steps: [3], title: "Display & touch glass", els: ["In", "Si"], at: [0, H / 2, 0], side: "top", reach: 0.4 }]}>
        <mesh geometry={geo.display}>
          <meshPhysicalMaterial color="#050507" roughness={0.08} metalness={0.1} clearcoat={1} />
        </mesh>
        <mesh geometry={geo.screen} position={[0, 0, 0.075]}>
          <meshPhysicalMaterial color="#000" emissive="#fff" emissiveMap={tx.home} emissiveIntensity={1.0} roughness={0.12} metalness={0} clearcoat={1} clearcoatRoughness={0.03} toneMapped={false} />
        </mesh>
      </Part>

      {/* MID-FRAME: graphite sheet, screws, side flex, USB-C module */}
      <Part step={step} order={1} pose={P.mid} ppu={ppu} wide={wide} active={active && !cover} hoverable labels={[{ steps: [3], title: "Mid-frame", els: ["Al"], at: [0, -H / 2, 0], side: "bottom", reach: 0.4 }]}>
        <mesh geometry={geo.mid}>
          <meshStandardMaterial map={tx.mid} metalness={0.6} roughness={0.55} />
        </mesh>
        {([[2.95, 6.6], [-2.95, 6.6], [2.95, -6.0], [-2.95, -6.0], [-0.95, 1.25], [2.95, 0.5]] as const).map(([x, y]) => <Screw key={`${x}${y}`} x={x} y={y} z={-0.05} />)}
        <Flex x={-3.08} y={-2.3} z={-0.05} w={0.24} h={7.0} />
        <group position={[-0.1, -6.62, -0.2]}>
          <mesh>
            <boxGeometry args={[1.05, 0.55, 0.3]} />
            {metal("#c4c7cc", 0.3)}
          </mesh>
          <mesh position={[0, -0.28, 0]}>
            <boxGeometry args={[0.85, 0.02, 0.22]} />
            <meshBasicMaterial color="#0a0a0c" />
          </mesh>
        </group>
      </Part>

      {/* OUTER FRAME: titanium band, buttons, antenna lines, port and grilles */}
      <Part step={step} order={2} pose={P.frame} ppu={ppu} wide={wide} active={active && !cover} hoverable labels={[{ steps: [3], title: "Outer frame", els: ["Ti", "Al"], at: [0, H / 2, 0], side: "top", reach: 4.3, narrow: { reach: 2.2 } }]}>
        <mesh geometry={geo.frame}>
          <meshPhysicalMaterial {...titanium} />
        </mesh>
        {[[-W / 2 - 0.04, 3.9, 0.55], [-W / 2 - 0.04, 2.5, 1.0], [-W / 2 - 0.04, 1.2, 1.0], [W / 2 + 0.04, 2.4, 1.6], [W / 2 + 0.04, -1.4, 0.75]].map(([x, y, h], i) => (
          <mesh key={i} position={[x, y, 0]}>
            <boxGeometry args={[0.1, h, i === 4 ? 0.28 : 0.34]} />
            <meshPhysicalMaterial {...titanium} roughness={i === 4 ? 0.1 : 0.24} />
          </mesh>
        ))}
        {/* antenna bands */}
        {[[FE, H / 2 - 1.7], [-FE, H / 2 - 1.7], [FE, -H / 2 + 1.7], [-FE, -H / 2 + 1.7]].map(([x, y], i) => (
          <mesh key={`a${i}`} position={[x, y, 0]}>
            <boxGeometry args={[0.03, 0.07, D - 0.12]} />
            <meshStandardMaterial color="#5f6268" roughness={0.6} />
          </mesh>
        ))}
        {[[W / 2 - 1.5, H / 2 + 0.03], [-(W / 2 - 1.5), FB]].map(([x, y], i) => (
          <mesh key={`b${i}`} position={[x, y, 0]}>
            <boxGeometry args={[0.07, 0.03, D - 0.12]} />
            <meshStandardMaterial color="#5f6268" roughness={0.6} />
          </mesh>
        ))}
        {/* USB-C port, speaker grille and mic on the bottom edge */}
        <mesh position={[0, FB, 0]}>
          <boxGeometry args={[0.92, 0.03, 0.3]} />
          <meshBasicMaterial color="#060608" />
        </mesh>
        <Holes xs={[1.05, 1.27, 1.49, 1.71, 1.93, 2.15]} y={FB} />
        <Holes xs={[-1.05, -1.27, -1.49]} y={FB} />
      </Part>

      {/* CAMERA MODULE (lenses face the back, −z) */}
      <Part step={step} order={3} pose={P.camera} ppu={ppu} wide={wide} active={active && !cover} hoverable labels={[{ steps: [2], title: "Camera", els: ["Si", "Al"], at: [0, 0.6, -0.5], side: "left", reach: edge(1.46, "left") }]}>
        <mesh geometry={geo.bracket} position={[0, 0, 0.12]}>
          {metal("#a7aab0", 0.4)}
        </mesh>
        <mesh geometry={geo.cam}>
          <meshStandardMaterial color="#25282e" metalness={0.6} roughness={0.4} />
        </mesh>
        <Lens x={0.7} y={0.72} />
        <Lens x={0.7} y={-0.72} />
        <Lens x={-0.7} y={0} />
        <mesh position={[-0.78, 1.08, -0.17]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.22, 0.22, 0.04, 32]} />
          <meshStandardMaterial color="#f6edd0" emissive="#fff1c4" emissiveIntensity={0.9} roughness={0.3} />
        </mesh>
        <mesh position={[-0.78, -1.08, -0.17]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.18, 0.18, 0.04, 32]} />
          <meshPhysicalMaterial color="#111" roughness={0.1} clearcoat={1} />
        </mesh>
        <Flex x={-1.0} y={-1.75} z={0.0} w={0.5} h={0.6} />
      </Part>

      {/* LOGIC BOARD: PCB + EMI shields + connectors */}
      <Part step={step} order={3} pose={P.board} ppu={ppu} wide={wide} active={active && !cover} hoverable labels={[{ steps: [2], title: "Logic board", els: ["Cu", "Au", "Sn"], at: [0, -1.2, -0.1], side: "right", reach: edge(-1.7, "right") }]}>
        <mesh>
          <boxGeometry args={[2.75, 5.5, 0.1]} />
          <meshStandardMaterial map={tx.board} roughness={0.55} metalness={0.2} />
        </mesh>
        {[[0, 2.15, 2.3, 0.95], [-0.55, -1.0, 1.4, 1.3], [0.65, -1.55, 1.15, 1.9]].map(([x, y, w, h], i) => (
          <mesh key={i} position={[x, y, -0.09]}>
            <boxGeometry args={[w, h, 0.08]} />
            {metal("#cfd2d7", 0.38)}
          </mesh>
        ))}
        {[[-0.9, -2.35], [0.95, 1.55]].map(([x, y], i) => (
          <group key={`c${i}`} position={[x, y, -0.08]}>
            <mesh>
              <boxGeometry args={[0.6, 0.22, 0.07]} />
              <meshStandardMaterial color="#111" roughness={0.6} />
            </mesh>
            <mesh position={[0, 0, -0.036]}>
              <boxGeometry args={[0.5, 0.06, 0.005]} />
              {metal("#e2b04a", 0.3)}
            </mesh>
          </group>
        ))}
      </Part>

      {/* SoC */}
      <Part step={step} order={3} pose={P.soc} ppu={ppu} wide={wide} active={active && !cover} labels={[{ steps: [4], title: "Processor chip", els: ["Si", "Cu", "Au"], at: [0, -1.05, 0], side: "bottom", reach: 0.2, big: true }]}>
        <mesh>
          <boxGeometry args={[1.8, 1.8, 0.14]} />
          <meshStandardMaterial attach="material-0" color="#2b2b2f" />
          <meshStandardMaterial attach="material-1" color="#2b2b2f" />
          <meshStandardMaterial attach="material-2" color="#2b2b2f" />
          <meshStandardMaterial attach="material-3" color="#2b2b2f" />
          <meshStandardMaterial attach="material-4" map={tx.soc} metalness={0.85} roughness={0.32} />
          <meshStandardMaterial attach="material-5" map={tx.soc} metalness={0.85} roughness={0.32} />
        </mesh>
        {Array.from({ length: 12 }, (_, i) => (
          <mesh key={i} position={[-0.83 + (i % 6) * 0.33, i < 6 ? 0.93 : -0.93, 0]}>
            <boxGeometry args={[0.12, 0.06, 0.04]} />
            {metal("#e2b04a", 0.3)}
          </mesh>
        ))}
      </Part>

      {/* BATTERY: pouch cell with label, connector flex and pull tabs */}
      <Part step={step} order={3} pose={P.battery} ppu={ppu} wide={wide} active={active && !cover} hoverable labels={[
        { steps: [2], title: "Battery", els: ["Li", "Co", "C"], at: [0, 0, -0.3], side: "left", reach: edge(-0.02, "left") },
        { steps: [3], title: "Battery & logic board", els: ["Li", "Co", "Si", "Cu", "Au"], at: [0, -3.3, 0], side: "bottom", reach: 4.3, narrow: { reach: 6.5 } },
        { steps: [4], title: "Lithium-ion battery", els: ["Li", "Co", "C"], at: [0, -3.35, 0], side: "bottom", reach: 0.2, big: true },
      ]}>
        <mesh>
          <boxGeometry args={[5.65, 6.55, 0.42]} />
          <meshStandardMaterial attach="material-0" color="#1a1a1f" roughness={0.5} />
          <meshStandardMaterial attach="material-1" color="#1a1a1f" roughness={0.5} />
          <meshStandardMaterial attach="material-2" color="#1a1a1f" roughness={0.5} />
          <meshStandardMaterial attach="material-3" color="#1a1a1f" roughness={0.5} />
          <meshPhysicalMaterial attach="material-4" map={tx.bat} roughness={0.35} clearcoat={0.5} />
          <meshPhysicalMaterial attach="material-5" map={tx.bat} roughness={0.35} clearcoat={0.5} />
        </mesh>
        <Flex x={-0.85} y={3.5} z={-0.2} w={0.7} h={0.6} />
        <mesh position={[-0.85, 3.75, -0.24]}>
          <boxGeometry args={[0.6, 0.25, 0.08]} />
          <meshStandardMaterial color="#111" roughness={0.5} />
        </mesh>
        {[-1.6, 1.6].map((x) => (
          <mesh key={x} position={[x, -3.45, -0.15]}>
            <boxGeometry args={[0.9, 0.5, 0.03]} />
            <meshStandardMaterial color="#e9e6dc" roughness={0.8} />
          </mesh>
        ))}
      </Part>

      {/* VIBRATION MOTOR */}
      <Part step={step} order={3} pose={P.taptic} ppu={ppu} wide={wide} active={active && !cover} hoverable labels={[{ steps: [2], title: "Vibration motor", els: ["Nd"], at: [0, 0, -0.2], side: "left", reach: edge(1.47, "left") }]}>
        <mesh>
          <boxGeometry args={[2.57, 0.89, 0.3]} />
          {metal("#c4c7cc", 0.3)}
        </mesh>
        <mesh position={[0, 0, -0.16]}>
          <boxGeometry args={[1.9, 0.3, 0.01]} />
          <meshStandardMaterial color="#7c8087" metalness={0.8} roughness={0.5} />
        </mesh>
      </Part>

      {/* SPEAKER */}
      <Part step={step} order={3} pose={P.speaker} ppu={ppu} wide={wide} active={active && !cover} hoverable labels={[{ steps: [2], title: "Speaker", els: ["Nd"], at: [0, 0, -0.2], side: "right", reach: edge(-1.67, "right") }]}>
        <mesh>
          <boxGeometry args={[2.18, 0.89, 0.3]} />
          <meshStandardMaterial color="#3a3d43" metalness={0.5} roughness={0.5} />
        </mesh>
        {Array.from({ length: 16 }, (_, i) => (
          <mesh key={i} position={[-0.84 + (i % 8) * 0.24, i < 8 ? 0.14 : -0.14, -0.16]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.055, 0.055, 0.02, 12]} />
            <meshBasicMaterial color="#0b0b0e" />
          </mesh>
        ))}
      </Part>

      {/* WIRELESS CHARGING COIL (rides on the back glass) */}
      <Part step={step} order={4} pose={P.coil} ppu={ppu} wide={wide} active={active && !cover} hoverable labels={[{ steps: [3], title: "Charging coil", els: ["Cu"], at: [0, 2.57, 0], side: "top", reach: 6.4, narrow: { reach: 4.6 } }]}>
        {[0.95, 1.15, 1.35, 1.55, 1.75, 1.95].map((r) => (
          <mesh key={r}>
            <torusGeometry args={[r, 0.05, 12, 96]} />
            <meshStandardMaterial color="#c97a3a" metalness={1} roughness={0.3} />
          </mesh>
        ))}
        <mesh>
          <torusGeometry args={[2.45, 0.12, 12, 96]} />
          <meshStandardMaterial color="#6a6e75" metalness={0.8} roughness={0.4} />
        </mesh>
        <mesh position={[0, 0, 0.03]}>
          <circleGeometry args={[2.3, 64]} />
          <meshStandardMaterial color="#111216" roughness={0.7} side={THREE.DoubleSide} />
        </mesh>
      </Part>

      {/* BACK GLASS: frosted, with a glossy camera plateau */}
      <Part step={step} order={5} pose={P.back} ppu={ppu} wide={wide} active={active && !cover} hoverable labels={[{ steps: [3], title: "Back glass", els: ["Si"], at: [-W / 2, -2.5, 0], side: "right", reach: 0.3, narrow: { at: [-W / 2, 5.5, 0], side: "right", reach: 0 } }]}>
        <mesh geometry={geo.back}>
          <meshPhysicalMaterial color="#3e4c66" roughness={0.6} roughnessMap={tx.frost} metalness={0.15} clearcoat={0.6} clearcoatRoughness={0.5} sheen={0.4} sheenColor="#8fa0c4" sheenRoughness={0.6} />
        </mesh>
        <mesh geometry={geo.bump} position={[1.46, 5.22, -0.08]}>
          <meshPhysicalMaterial color="#334059" roughness={0.1} metalness={0.2} clearcoat={1} />
        </mesh>
      </Part>
    </group>
  );
}
