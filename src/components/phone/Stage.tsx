"use client";

import * as THREE from "three";
import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { ContactShadows, Environment, Lightformer, MeshReflectorMaterial } from "@react-three/drei";
import { Bloom, EffectComposer, N8AO, ToneMapping, Vignette } from "@react-three/postprocessing";
import { ToneMappingMode } from "postprocessing";
import { easing } from "maath";

const FLOOR_Y = -8.6;

/** Product-shot studio: strip lights for crisp edge highlights on the metal frame and glass. */
export function StudioLights() {
  return (
    <>
      <ambientLight intensity={0.35} />
      <directionalLight position={[6, 10, 12]} intensity={1.4} />
      <directionalLight position={[-8, -4, -10]} intensity={0.7} color="#9d97ff" />
      <Environment resolution={512} frames={1}>
        <color attach="background" args={["#0b0a1e"]} />
        {/* overhead softbox */}
        <Lightformer form="rect" intensity={3} position={[0, 12, 2]} rotation-x={Math.PI / 2} scale={[16, 6, 1]} />
        {/* tall strip lights left and right: the long highlights along the frame */}
        <Lightformer form="rect" intensity={6} position={[-9, 0, 4]} rotation-y={Math.PI / 2.4} scale={[1.2, 22, 1]} />
        <Lightformer form="rect" intensity={4} position={[9, 0, 4]} rotation-y={-Math.PI / 2.4} scale={[1.2, 22, 1]} />
        {/* key light in front, behind the camera */}
        <Lightformer form="rect" intensity={2.2} position={[0, 2, 14]} scale={[12, 5, 1]} />
        {/* coloured rims from behind for the brand mood */}
        <Lightformer form="ring" color="#6C63FF" intensity={8} position={[8, 6, -10]} scale={7} onUpdate={(s) => s.lookAt(0, 0, 0)} />
        <Lightformer form="circle" color="#FF6B5B" intensity={4} position={[-10, -4, -8]} scale={5} onUpdate={(s) => s.lookAt(0, 0, 0)} />
      </Environment>
    </>
  );
}

/** White centre fading to black: used as the floor's alpha so the mirror melts into the page background. */
function fadeTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 512;
  const g = c.getContext("2d")!;
  const r = g.createRadialGradient(256, 256, 0, 256, 256, 256);
  r.addColorStop(0, "#fff");
  r.addColorStop(0.35, "#bbb");
  r.addColorStop(1, "#000");
  g.fillStyle = r;
  g.fillRect(0, 0, 512, 512);
  return new THREE.CanvasTexture(c);
}

/** Mirror floor that fades out at its edges, plus a contact shadow; the page gradient shows through behind. */
export function StageSet({ step, cover = false }: { step: number; cover?: boolean }) {
  const { size } = useThree();
  const wide = size.width > 900;
  const fade = useMemo(() => fadeTexture(), []);
  const floor = useRef<THREE.Mesh>(null!);
  const fx = !wide ? 0 : cover ? 6.2 : [4, 4, 6, 4.6, 5.4][step];
  useFrame((_, dt) => easing.damp(floor.current.position, "x", fx, 0.6, dt));
  return (
    <>
      <mesh ref={floor} rotation-x={-Math.PI / 2} position={[fx, FLOOR_Y, 0]}>
        <planeGeometry args={[40, 40]} />
        <MeshReflectorMaterial
          resolution={512}
          blur={[300, 90]}
          mixBlur={1}
          mixStrength={2.5}
          mixContrast={1}
          depthScale={1.2}
          minDepthThreshold={0.35}
          maxDepthThreshold={1.4}
          roughness={0.9}
          metalness={0.4}
          color="#14123a"
          mirror={0.6}
          transparent
          alphaMap={fade}
          depthWrite={false}
        />
      </mesh>
      <ContactShadows position={[0, FLOOR_Y + 0.02, 0]} opacity={0.6} scale={34} blur={2.8} far={14} color="#000000" />
    </>
  );
}

/** Ambient occlusion (contact darkening between parts), a soft bloom on bright glass, filmic tone mapping. */
export function Effects() {
  return (
    <EffectComposer multisampling={2}>
      <N8AO aoRadius={1.6} distanceFalloff={1.2} intensity={2.2} quality="performance" halfRes color="#05040f" />
      <Bloom mipmapBlur luminanceThreshold={1.05} luminanceSmoothing={0.15} intensity={0.35} radius={0.6} />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      <Vignette eskil={false} offset={0.25} darkness={0.55} />
    </EffectComposer>
  );
}
