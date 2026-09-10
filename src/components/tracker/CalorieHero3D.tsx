"use client";

import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { animate } from "motion";

const SEGMENTS_RADIAL = 12;
const SEGMENTS_TUBULAR = 64;
const TWO_PI = Math.PI * 2;

function ringGeometry(radius: number, tube: number, arc: number) {
  return new THREE.TorusGeometry(radius, tube, SEGMENTS_RADIAL, SEGMENTS_TUBULAR, Math.max(0.001, arc));
}

function ProgressRing({
  pct,
  color,
  radius,
  tube,
  trackOpacity = 0.35,
}: {
  pct: number;
  color: string;
  radius: number;
  tube: number;
  trackOpacity?: number;
}) {
  const fillRef = useRef<THREE.Mesh>(null);
  const current = useRef(0);
  const { invalidate } = useThree();

  useEffect(() => {
    const controls = animate(current.current, pct, {
      type: "spring",
      stiffness: 80,
      damping: 22,
      onUpdate: (v) => {
        current.current = v;
        const mesh = fillRef.current;
        if (mesh) {
          mesh.geometry.dispose();
          mesh.geometry = ringGeometry(radius, tube, (v / 100) * TWO_PI);
        }
        invalidate();
      },
    });
    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pct]);

  return (
    <>
      <mesh>
        <torusGeometry args={[radius, tube, SEGMENTS_RADIAL, SEGMENTS_TUBULAR]} />
        <meshStandardMaterial color="#4a5754" roughness={0.85} metalness={0} transparent opacity={trackOpacity} />
      </mesh>
      <mesh ref={fillRef} rotation={[0, 0, Math.PI / 2]}>
        <torusGeometry args={[radius, tube, SEGMENTS_RADIAL, SEGMENTS_TUBULAR, 0.001]} />
        <meshStandardMaterial color={color} roughness={0.4} metalness={0.08} />
      </mesh>
    </>
  );
}

// A quiet, fixed ring purely for dimensional layering — not a second data
// series. Sits inside the calorie ring, thin and low-opacity, in the
// accent color so it reads as a deliberate frame, not a competing metric.
function AccentRing({ radius, tube, color }: { radius: number; tube: number; color: string }) {
  return (
    <mesh>
      <torusGeometry args={[radius, tube, SEGMENTS_RADIAL, SEGMENTS_TUBULAR]} />
      <meshStandardMaterial color={color} roughness={0.55} metalness={0.1} transparent opacity={0.55} />
    </mesh>
  );
}

// A soft, barely-there disc behind the number — the "center surface" it
// sits on, not another progress indicator.
function CenterSurface({ radius, color }: { radius: number; color: string }) {
  return (
    <mesh position={[0, 0, -0.05]}>
      <circleGeometry args={[radius, 48]} />
      <meshStandardMaterial color={color} roughness={0.9} metalness={0} transparent opacity={0.5} />
    </mesh>
  );
}

export interface HeroRingData {
  calPct: number;
  calColor: string;
  accentColor: string;
  surfaceColor: string;
}

function Scene({ data }: { data: HeroRingData }) {
  const groupRef = useRef<THREE.Group>(null);
  const target = useRef({ x: 0, y: 0 });
  const { invalidate, gl } = useThree();

  useEffect(() => {
    const el = gl.domElement;
    function onMove(e: PointerEvent) {
      const rect = el.getBoundingClientRect();
      const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const ny = ((e.clientY - rect.top) / rect.height) * 2 - 1;
      target.current = { x: ny * 0.08, y: nx * 0.11 };
      invalidate();
    }
    function onLeave() {
      target.current = { x: 0, y: 0 };
      invalidate();
    }
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);
    return () => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
    };
  }, [gl, invalidate]);

  useFrame(() => {
    const g = groupRef.current;
    if (!g) return;
    const dx = target.current.x - g.rotation.x;
    const dy = target.current.y - g.rotation.y;
    g.rotation.x += dx * 0.08;
    g.rotation.y += dy * 0.08;
    if (Math.abs(dx) > 0.0004 || Math.abs(dy) > 0.0004) invalidate();
  });

  return (
    <group ref={groupRef} rotation={[Math.PI / 2.3, 0, 0]}>
      <CenterSurface radius={0.64} color={data.surfaceColor} />
      <AccentRing radius={0.86} tube={0.025} color={data.accentColor} />
      <ProgressRing pct={data.calPct} color={data.calColor} radius={1.32} tube={0.105} trackOpacity={0.32} />
    </group>
  );
}

export default function CalorieHero3D(data: HeroRingData) {
  const dpr = useMemo<[number, number]>(() => [1, 1.5], []);
  return (
    <Canvas
      frameloop="demand"
      dpr={dpr}
      camera={{ position: [0, 3.6, 3.9], fov: 28 }}
      gl={{ antialias: true, alpha: true, powerPreference: "low-power" }}
      style={{ width: "100%", height: "100%" }}
    >
      <ambientLight intensity={0.68} />
      <directionalLight position={[2.5, 4, 4.5]} intensity={0.85} />
      <directionalLight position={[-2.5, 1, -1.5]} intensity={0.35} />
      <Scene data={data} />
    </Canvas>
  );
}
