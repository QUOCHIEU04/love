// src/GalaxyLoveComponent.jsx
import React, { useRef, useMemo, useState, useEffect } from "react";
import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber";
import { OrbitControls, Stars, Text } from "@react-three/drei";
import * as THREE from "three";

/* ---------- Quả cầu phát sáng ---------- */
function GlowingPlanet() {
  const ref = useRef();
  useFrame(() => (ref.current.rotation.y += 0.002));
  return (
    <mesh ref={ref} position={[0, 0, 0]}>
      <sphereGeometry args={[6.5, 64, 64]} />
      <meshStandardMaterial
        color="#ff66cc"
        emissive="#ff99ff"
        emissiveIntensity={1.8}
        roughness={0.25}
        metalness={0.2}
        transparent
        opacity={0.95}
      />
    </mesh>
  );
}

/* ---------- Vòng sáng quanh quả cầu ---------- */
function OrbitRings() {
  return (
    <group rotation={[Math.PI / 2, 0, 0]}>
      {[9, 11.5, 13.5].map((r, i) => (
        <mesh key={i} rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[r - 0.06, r + 0.06, 128]} />
          <meshBasicMaterial
            color="#ffd6ff"
            transparent
            opacity={0.3 - i * 0.07}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </group>
  );
}

/* ---------- Text xoay quanh ---------- */
/* ---------- Text xoay quanh trục X ---------- */
function RotatingTexts({ messages }) {
  const group = useRef();

  // Quay quanh trục X (chạy dọc quả cầu)
  useFrame(() => {
    if (group.current) group.current.rotation.x += 0.004;
  });

  return (
    <group ref={group}>
      {messages.map((m, i) => {
        const angle = (i / messages.length) * Math.PI * 2;
        const radius = 22; // bán kính vòng chữ
        const y = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        const x = 0; // giữ text ở mặt phẳng dọc (X cố định)

        return (
          <Text
            key={i}
            position={[x, y, z]}
            rotation={[0, 0, angle + Math.PI / 2]} // hướng chữ ra ngoài
            fontSize={2.2}
            color="#ffffff"
            anchorX="center"
            anchorY="middle"
          >
            {m}
          </Text>
        );
      })}
    </group>
  );
}


/* ---------- Các ô vuông nhỏ hiển thị ảnh (giữ rõ khi zoom gần) ---------- */
function FloatingImages({ urls, baseCount = 300 }) {
  const { camera } = useThree();
  const group = useRef();
  const textures = useLoader(THREE.TextureLoader, urls);
  const [hovered, setHovered] = useState(null);

  // Tạo trước nhiều ảnh, chỉ thay đổi opacity khi zoom
  const items = useMemo(() => {
    const arr = [];
    for (let i = 0; i < baseCount * 5; i++) { // tạo nhiều hơn (5 lần)
      const radius = 35 + Math.random() * 30;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.sin(phi) * Math.sin(theta);
      const z = radius * Math.cos(phi);
      arr.push({
        pos: new THREE.Vector3(x, y, z),
        tex: textures[Math.floor(Math.random() * textures.length)],
        size: 0.6 + Math.random() * 0.5,
      });
    }
    return arr;
  }, [textures, baseCount]);

  useEffect(() => {
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    function onMove(e) {
      mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      if (!group.current) return;
      const intersects = raycaster.intersectObjects(group.current.children);
      setHovered(intersects[0]?.object || null);
    }

    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, [camera]);

  useFrame(() => {
    if (!group.current) return;

    group.current.rotation.y += 0.001;
    const dist = camera.position.length();

    // Tính mức độ zoom (xa - gần)
    const zoomFactor = THREE.MathUtils.clamp(100 / dist, 0, 1);

    group.current.children.forEach((mesh) => {
      const isHover = mesh === hovered;

      // Nếu zoom gần => tăng opacity ảnh
      const opacity =
        zoomFactor > 0.7
          ? 0.9 // gần rất rõ
          : zoomFactor > 0.5
          ? 0.5 // trung bình
          : 0.1; // xa gần như mờ

      mesh.material.opacity = THREE.MathUtils.lerp(
        mesh.material.opacity,
        isHover ? 1 : opacity,
        0.08
      );

      // Zoom gần cũng scale to hơn
      const scale = mesh.userData?.size || 1;
      const nearFactor = 0.5 + zoomFactor * 1.5;
      mesh.scale.lerp(
        new THREE.Vector3(scale * nearFactor, scale * nearFactor, scale * nearFactor),
        0.1
      );
    });
  });

  return (
    <group ref={group}>
      {items.map((it, i) => (
        <mesh
          key={i}
          position={it.pos}
          userData={{ size: it.size }}
        >
          <planeGeometry args={[it.size, it.size]} />
          <meshBasicMaterial
            map={it.tex}
            transparent
            opacity={0.1}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  );
}



/* ---------- Component chính ---------- */
export default function GalaxyLoveComponent() {
  const imgPaths = [
    "/images/photo1.jpg",
    "/images/photo2.jpg",
    "/images/heart1.jpg",
    "/images/heart2.jpg",
    // "/images/photo3.jpg",
  ];
  const messages = [
    "Mãi yêu em",
    "Anh yêu em",
    "Chúc em mãi xinh đẹp",
    "20-10 vui vẻ",
    "Mãi bên nhau",
  ];

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        background: "radial-gradient(circle at 30% 10%, #3b0f3b, #0b0010)",
      }}
    >
      <Canvas camera={{ position: [0, 0, 80], fov: 60 }}>
        <ambientLight intensity={0.8} />
        <pointLight position={[40, 50, 50]} intensity={1.5} color="#ff99cc" />
        <Stars radius={300} depth={80} count={6000} factor={4} saturation={0} fade />

        <GlowingPlanet />
        <OrbitRings />
        <RotatingTexts messages={messages} />
        <FloatingImages urls={imgPaths} count={900} />

        <OrbitControls enableZoom enablePan enableRotate minDistance={10} maxDistance={200} />
      </Canvas>
    </div>
  );
}
