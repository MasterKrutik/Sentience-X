"use client";
import LoginCard from "@/components/auth/LoginCard";
import { Canvas, useFrame } from "@react-three/fiber";
import { useRef, useMemo } from "react";
import * as THREE from "three";

function BackgroundParticles({ count = 800, edgeCount = 2000 }) {
  const pointsRef = useRef<THREE.Points>(null!);
  const lineRef = useRef<THREE.LineSegments>(null!);

  const { positions, colors } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const c1 = new THREE.Color("oklch(65% 0.22 300)"); // neural purple
    const c2 = new THREE.Color("oklch(72% 0.19 200)"); // synapse teal

    for (let i = 0; i < count; i++) {
      // Perlin noise-like random distribution in space
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      const r = 4 + Math.random() * 4;

      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);

      const t = Math.random();
      const mixed = c1.clone().lerp(c2, t);
      col[i * 3] = mixed.r;
      col[i * 3 + 1] = mixed.g;
      col[i * 3 + 2] = mixed.b;
    }

    return { positions: pos, colors: col };
  }, [count]);

  const edgePositions = useMemo(() => {
    const pos = [];
    // Simple spatial proximity connection
    for (let i = 0; i < count; i += 2) {
      const idxA = i;
      const idxB = (i + 1) % count;
      pos.push(
        positions[idxA * 3], positions[idxA * 3 + 1], positions[idxA * 3 + 2],
        positions[idxB * 3], positions[idxB * 3 + 1], positions[idxB * 3 + 2]
      );
    }
    return new Float32Array(pos);
  }, [positions, count]);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    // Rotate scene
    pointsRef.current.rotation.y = time * 0.03;
    pointsRef.current.rotation.x = Math.sin(time * 0.05) * 0.1;
    lineRef.current.rotation.y = time * 0.03;
    lineRef.current.rotation.x = Math.sin(time * 0.05) * 0.1;

    // Slow drifting Perlin noise simulation on points
    const posArr = pointsRef.current.geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < count; i++) {
      posArr[i * 3 + 1] += Math.sin(time + i) * 0.002;
    }
    pointsRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <>
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
          <bufferAttribute attach="attributes-color" args={[colors, 3]} />
        </bufferGeometry>
        <pointsMaterial vertexColors size={0.05} sizeAttenuation transparent opacity={0.6} />
      </points>
      <lineSegments ref={lineRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[edgePositions, 3]} />
        </bufferGeometry>
        <lineBasicMaterial color="oklch(65% 0.22 300 / 0.1)" transparent opacity={0.25} />
      </lineSegments>
    </>
  );
}

export default function LoginPage() {
  return (
    <main className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-sx-void">
      {/* 3D background */}
      <div className="absolute inset-0 z-0">
        <Canvas camera={{ position: [0, 0, 8] }} gl={{ alpha: true }}>
          <BackgroundParticles />
        </Canvas>
      </div>

      {/* Floating accent background glow elements */}
      <div className="absolute top-[20%] left-[20%] w-[30rem] h-[30rem] rounded-full bg-purple-900/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[20%] right-[20%] w-[30rem] h-[30rem] rounded-full bg-cyan-900/10 blur-[120px] pointer-events-none" />

      {/* Login Card */}
      <LoginCard />
    </main>
  );
}
