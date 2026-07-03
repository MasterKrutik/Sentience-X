"use client";
import { useRef, useEffect, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { useStore } from "@/lib/store";

// ─── Node data seeded from Mental Twin ───────────────────────────────────────
interface GlobeNode {
  position: [number, number, number];
  color: string;
  size: number;
  type: "MoodState" | "Habit" | "Trigger" | "Relationship";
}

function generateNodePositions(count: number): GlobeNode[] {
  const nodes: GlobeNode[] = [];
  const colorMap = {
    MoodState: "#a855f7",    // purple
    Habit: "#06b6d4",        // teal
    Trigger: "#f97316",      // orange
    Relationship: "#ec4899", // pink
  };
  const types: Array<keyof typeof colorMap> = ["MoodState", "Habit", "Trigger", "Relationship"];

  for (let i = 0; i < count; i++) {
    // Fibonacci sphere distribution
    const phi = Math.acos(1 - (2 * (i + 0.5)) / count);
    const theta = Math.PI * (1 + Math.sqrt(5)) * i;
    const r = 2.5 + Math.random() * 0.5;
    const type = types[Math.floor(Math.random() * types.length)];
    nodes.push({
      position: [
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.sin(phi) * Math.sin(theta),
        r * Math.cos(phi),
      ],
      color: colorMap[type],
      size: 0.02 + Math.random() * 0.04,
      type,
    });
  }
  return nodes;
}

function generateEdges(nodes: GlobeNode[], edgeCount: number): [number, number][] {
  const edges: [number, number][] = [];
  for (let i = 0; i < edgeCount; i++) {
    const a = Math.floor(Math.random() * nodes.length);
    let b = Math.floor(Math.random() * nodes.length);
    while (b === a) b = Math.floor(Math.random() * nodes.length);
    edges.push([a, b]);
  }
  return edges;
}

// ─── Particle Nodes Mesh ──────────────────────────────────────────────────────
function NodeParticles({ nodes }: { nodes: GlobeNode[] }) {
  const meshRef = useRef<THREE.Points>(null!);
  const crisisScore = useStore((s) => s.crisisScore);

  const { positions, colors, sizes } = useMemo(() => {
    const pos = new Float32Array(nodes.length * 3);
    const col = new Float32Array(nodes.length * 3);
    const sz = new Float32Array(nodes.length);
    nodes.forEach((n, i) => {
      pos[i * 3] = n.position[0];
      pos[i * 3 + 1] = n.position[1];
      pos[i * 3 + 2] = n.position[2];
      const c = new THREE.Color(n.color);
      col[i * 3] = c.r;
      col[i * 3 + 1] = c.g;
      col[i * 3 + 2] = c.b;
      sz[i] = n.size;
    });
    return { positions: pos, colors: col, sizes: sz };
  }, [nodes]);

  useFrame((state) => {
    if (!meshRef.current) return;
    meshRef.current.rotation.y += crisisScore > 90 ? 0.008 : 0.002;
    meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.15) * 0.08;
  });

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
        <bufferAttribute attach="attributes-size" args={[sizes, 1]} />
      </bufferGeometry>
      <pointsMaterial
        vertexColors
        sizeAttenuation
        transparent
        opacity={0.85}
        size={0.08}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

// ─── Edge Lines ───────────────────────────────────────────────────────────────
function EdgeLines({ nodes, edges }: { nodes: GlobeNode[]; edges: [number, number][] }) {
  const lineRef = useRef<THREE.LineSegments>(null!);
  const crisisScore = useStore((s) => s.crisisScore);

  const { positions, lineColors } = useMemo(() => {
    const pos = new Float32Array(edges.length * 6);
    const col = new Float32Array(edges.length * 6);
    edges.forEach(([a, b], i) => {
      const na = nodes[a];
      const nb = nodes[b];
      pos[i * 6] = na.position[0]; pos[i * 6 + 1] = na.position[1]; pos[i * 6 + 2] = na.position[2];
      pos[i * 6 + 3] = nb.position[0]; pos[i * 6 + 4] = nb.position[1]; pos[i * 6 + 5] = nb.position[2];
      // Edge color: gradient between node colors
      const ca = new THREE.Color(na.color);
      const cb = new THREE.Color(nb.color);
      col[i * 6] = ca.r; col[i * 6 + 1] = ca.g; col[i * 6 + 2] = ca.b;
      col[i * 6 + 3] = cb.r; col[i * 6 + 4] = cb.g; col[i * 6 + 5] = cb.b;
    });
    return { positions: pos, lineColors: col };
  }, [nodes, edges]);

  useFrame((state) => {
    if (!lineRef.current) return;
    lineRef.current.rotation.y += crisisScore > 90 ? 0.008 : 0.002;
    lineRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.15) * 0.08;
    const mat = lineRef.current.material as THREE.LineBasicMaterial;
    mat.opacity = 0.15 + Math.sin(state.clock.elapsedTime * 0.8) * 0.05;
  });

  return (
    <lineSegments ref={lineRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[lineColors, 3]} />
      </bufferGeometry>
      <lineBasicMaterial vertexColors transparent opacity={0.2} blending={THREE.AdditiveBlending} depthWrite={false} />
    </lineSegments>
  );
}

// ─── Crisis Pulse Ring ────────────────────────────────────────────────────────
function CrisisPulse({ score }: { score: number }) {
  const ringRef = useRef<THREE.Mesh>(null!);
  
  useFrame((state) => {
    if (!ringRef.current) return;
    const scale = 1 + ((state.clock.elapsedTime % 3) / 3) * 3;
    ringRef.current.scale.setScalar(scale);
    const mat = ringRef.current.material as THREE.MeshBasicMaterial;
    mat.opacity = Math.max(0, 1 - (state.clock.elapsedTime % 3) / 3);
  });

  if (score < 90) return null;

  return (
    <mesh ref={ringRef}>
      <ringGeometry args={[2.4, 2.6, 64]} />
      <meshBasicMaterial color="#ef4444" transparent opacity={0.6} side={THREE.DoubleSide} />
    </mesh>
  );
}

// ─── Ambient Glow Sphere ──────────────────────────────────────────────────────
function GlowSphere({ crisisScore }: { crisisScore: number }) {
  const meshRef = useRef<THREE.Mesh>(null!);
  
  useFrame((state) => {
    if (!meshRef.current) return;
    const mat = meshRef.current.material as THREE.MeshBasicMaterial;
    const pulse = Math.sin(state.clock.elapsedTime * 1.5) * 0.1;
    mat.opacity = (crisisScore > 90 ? 0.15 : 0.06) + pulse;
    meshRef.current.scale.setScalar(1 + Math.sin(state.clock.elapsedTime * 0.8) * 0.02);
  });

  const color = crisisScore > 90 ? "#ef4444" : crisisScore > 75 ? "#f59e0b" : "#a855f7";

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[2.8, 32, 32]} />
      <meshBasicMaterial color={color} transparent opacity={0.06} side={THREE.BackSide} />
    </mesh>
  );
}

// ─── Scene ────────────────────────────────────────────────────────────────────
function Scene({ nodeCount, edgeCount }: { nodeCount: number; edgeCount: number }) {
  const crisisScore = useStore((s) => s.crisisScore);
  
  const nodes = useMemo(() => generateNodePositions(nodeCount), [nodeCount]);
  const edges = useMemo(() => generateEdges(nodes, edgeCount), [nodes, edgeCount]);

  return (
    <>
      <ambientLight intensity={0.3} />
      <pointLight position={[5, 5, 5]} intensity={1} color="#a855f7" />
      <pointLight position={[-5, -5, -5]} intensity={0.5} color="#06b6d4" />
      <GlowSphere crisisScore={crisisScore} />
      <EdgeLines nodes={nodes} edges={edges} />
      <NodeParticles nodes={nodes} />
      <CrisisPulse score={crisisScore} />
    </>
  );
}

// ─── Main Globe Component ─────────────────────────────────────────────────────
interface MentalTwinGlobeProps {
  nodeCount?: number;
  edgeCount?: number;
  height?: number;
  interactive?: boolean;
  className?: string;
}

export default function MentalTwinGlobe({
  nodeCount = 200,
  edgeCount = 500,
  height = 400,
  interactive = true,
  className = "",
}: MentalTwinGlobeProps) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl ${className}`}
      style={{ height, background: "radial-gradient(circle at center, oklch(12% 0.015 270) 0%, oklch(8% 0.01 270) 100%)" }}
    >
      <Canvas
        camera={{ position: [0, 0, 7], fov: 50 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: "transparent" }}
      >
        <Scene nodeCount={nodeCount} edgeCount={edgeCount} />
        {interactive && (
          <OrbitControls
            enablePan={false}
            enableZoom={false}
            autoRotate={false}
            maxPolarAngle={Math.PI / 1.5}
            minPolarAngle={Math.PI / 3}
          />
        )}
      </Canvas>

      {/* Legend overlay */}
      <div className="absolute bottom-4 left-4 flex flex-col gap-1.5">
        {[
          { color: "#a855f7", label: "Mood State" },
          { color: "#06b6d4", label: "Habit" },
          { color: "#f97316", label: "Trigger" },
          { color: "#ec4899", label: "Relationship" },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ background: item.color, boxShadow: `0 0 8px ${item.color}` }} />
            <span style={{ fontSize: "11px", color: "oklch(58% 0.02 270)", fontFamily: "'DM Mono', monospace" }}>
              {item.label}
            </span>
          </div>
        ))}
      </div>

      {/* Center label */}
      <div className="absolute top-4 left-0 right-0 flex justify-center pointer-events-none">
        <span style={{ fontSize: "11px", color: "oklch(65% 0.22 300 / 0.7)", fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.15em" }}>
          MENTAL TWIN · LIVE
        </span>
      </div>
    </div>
  );
}
