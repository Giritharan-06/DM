'use client';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, RoundedBox, ContactShadows } from '@react-three/drei';
import { useRef } from 'react';
import type { Group } from 'three';
function Model() {
  const ref = useRef<Group>(null);
  useFrame(({ pointer }) => {
    if (ref.current) {
      ref.current.rotation.y +=
        (pointer.x * 0.15 - 0.28 - ref.current.rotation.y) * 0.03;
      ref.current.rotation.x +=
        (pointer.y * 0.05 + 0.05 - ref.current.rotation.x) * 0.03;
    }
  });
  return (
    <Float speed={1.5} rotationIntensity={0.1} floatIntensity={0.4}>
      <group ref={ref} rotation={[0.05, -0.28, 0]}>
        <RoundedBox
          args={[3.3, 2.15, 0.12]}
          radius={0.07}
          position={[0, 0.45, 0]}
        >
          <meshStandardMaterial color="#29213e" roughness={0.3} />
        </RoundedBox>
        <RoundedBox
          args={[3.05, 1.9, 0.02]}
          radius={0.03}
          position={[0, 0.45, 0.075]}
        >
          <meshStandardMaterial color="#f7f6ff" />
        </RoundedBox>
        <mesh position={[-1.18, 0.45, 0.092]}>
          <planeGeometry args={[0.42, 1.8]} />
          <meshBasicMaterial color="#e7dfff" />
        </mesh>
        <mesh position={[0.22, 1.11, 0.1]}>
          <planeGeometry args={[1.94, 0.1]} />
          <meshBasicMaterial color="#6c4dff" />
        </mesh>
        {[0.22, 0.5, 0.37, 0.69, 0.62, 1].map((h, i) => (
          <RoundedBox
            key={i}
            args={[0.24, h, 0.04]}
            radius={0.02}
            position={[-0.58 + i * 0.35, -0.15 + h / 2, 0.105]}
          >
            <meshStandardMaterial color={i === 5 ? '#4f8cff' : '#a58bfa'} />
          </RoundedBox>
        ))}
        {[0, 1, 2].map((i) => (
          <RoundedBox
            key={i}
            args={[0.58, 0.38, 0.03]}
            radius={0.03}
            position={[-0.47 + i * 0.71, 0.72, 0.1]}
          >
            <meshStandardMaterial color="#e5ddff" />
          </RoundedBox>
        ))}
        <RoundedBox
          args={[3.7, 0.1, 2.1]}
          radius={0.05}
          position={[0, -0.66, 0.95]}
        >
          <meshStandardMaterial
            color="#c9c6d5"
            metalness={0.6}
            roughness={0.25}
          />
        </RoundedBox>
        <RoundedBox
          args={[2.9, 0.02, 1]}
          radius={0.04}
          position={[0, -0.6, 0.74]}
        >
          <meshStandardMaterial color="#454052" />
        </RoundedBox>
        <RoundedBox
          args={[0.8, 0.015, 0.4]}
          radius={0.04}
          position={[0, -0.6, 1.46]}
        >
          <meshStandardMaterial color="#aaa6ba" />
        </RoundedBox>
      </group>
    </Float>
  );
}
export default function Laptop() {
  return (
    <Canvas
      camera={{ position: [0, 1.5, 6.8], fov: 39 }}
      dpr={[1, 1.5]}
      aria-label="A floating laptop with an illustrative marketing dashboard"
    >
      <ambientLight intensity={1.4} />
      <directionalLight position={[3, 5, 3]} intensity={3} />
      <directionalLight position={[-3, 2, -2]} color="#a78bfa" intensity={2} />
      <Model />
      <ContactShadows
        position={[0, -1.35, 0]}
        opacity={0.18}
        scale={8}
        blur={2.8}
        far={3}
      />
    </Canvas>
  );
}
