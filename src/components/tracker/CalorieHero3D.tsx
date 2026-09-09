"use client";

import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { animate } from "motion";

const SEGMENTS_RADIAL = 10;
const SEGMENTS_TUBULAR = 56;
const TWO_PI = Math.PI * 2;

function ringGeometry(radius: number, tube: number, arc: number) {
  return new THREE.TorusGeometry(radius, tube, SEGMENTS_RADIAL, SEGMENTS_TUBULAR, Math.max(0.001, arc));
}

interface RingSpec {
  pct: number;
  color: string;
  radius: number;
  tube: number;
}

function ProgressRing({ pct, color, radius, tube }: RingSpec) {
  const fillRef = useRef<THREE.Mesh>(null);
  const current = useRef(0);
  const { invalidate } = useThree();

  useEffect(() => {
    const controls = animate(current.current, pct, {
      type: "spring",
      stiffness: 85,
      damping: 20,
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
      <mesh rotation={[0, 0, 0]}>
        <torusGeometry args={[radius, tube, SEGMENTS_RADIAL, SEGMENTS_TUBULAR]} />
        <meshStandardMaterial color="#3a453f" roughness={0.75} metalness={0.05} transparent opacity={0.45} />
      </mesh>
      <mesh ref={fillRef} rotation={[0, 0, Math.PI / 2]}>
        <torusGeometry args={[radius, tube, SEGMENTS_RADIAL, SEGMENTS_TUBULAR, 0.001]} />
        <meshStandardMaterial color={color} roughness={0.32} metalness={0.18} />
      </mesh>
    </>
  );
}

export interface HeroRingData {
  calPct: number;
  proteinPct: number;
  carbsPct: number;
  fatPct: number;
  calColor: string;
  proteinColor: string;
  carbsColor: string;
  fatColor: string;
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
      target.current = { x: ny * 0.1, y: nx * 0.14 };
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
    <group ref={groupRef} rotation={[Math.PI / 2.35, 0, 0]}>
      <ProgressRing pct={data.calPct} color={data.calColor} radius={1.42} tube={0.155} />
      <ProgressRing pct={data.proteinPct} color={data.proteinColor} radius={1.04} tube={0.085} />
      <ProgressRing pct={data.carbsPct} color={data.carbsColor} radius={0.8} tube={0.085} />
      <ProgressRing pct={data.fatPct} color={data.fatColor} radius={0.56} tube={0.085} />
    </group>
  );
}

export default function CalorieHero3D(data: HeroRingData) {
  const dpr = useMemo<[number, number]>(() => [1, 1.5], []);
  return (
    <Canvas
      frameloop="demand"
      dpr={dpr}
      camera={{ position: [0, 3.4, 3.7], fov: 30 }}
      gl={{ antialias: true, alpha: true, powerPreference: "low-power" }}
      style={{ width: "100%", height: "100%" }}
    >
      <ambientLight intensity={0.55} />
      <directionalLight position={[3, 4.5, 5]} intensity={1.15} />
      <directionalLight position={[-3, -1.5, -2]} intensity={0.22} />
      <Scene data={data} />
    </Canvas>
  );
}
