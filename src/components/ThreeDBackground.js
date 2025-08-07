import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame, extend } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import * as THREE from 'three';

// Custom shader material for the 3D object
const CustomMaterial = new THREE.ShaderMaterial({
  uniforms: {
    time: { value: 0 },
    color1: { value: new THREE.Color('#3b82f6') },
    color2: { value: new THREE.Color('#8b5cf6') },
  },
  vertexShader: `
    varying vec2 vUv;
    varying vec3 vPosition;
    void main() {
      vUv = uv;
      vPosition = position;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform float time;
    uniform vec3 color1;
    uniform vec3 color2;
    varying vec2 vUv;
    varying vec3 vPosition;
    
    void main() {
      float d = length(vUv - 0.5);
      float a = 1.0 - smoothstep(0.45, 0.5, d);
      float pulse = sin(time * 0.5) * 0.5 + 0.5;
      vec3 color = mix(color1, color2, vUv.y + pulse * 0.2);
      gl_FragColor = vec4(color, a * 0.4);
    }
  `,
  transparent: true,
  blending: THREE.AdditiveBlending,
  side: THREE.DoubleSide,
});

// Animated 3D object component
function AnimatedMesh() {
  const meshRef = useRef();
  const materialRef = useRef();
  
  useFrame(({ clock }) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = clock.getElapsedTime() * 0.1;
      meshRef.current.rotation.y = clock.getElapsedTime() * 0.15;
    }
    if (materialRef.current) {
      materialRef.current.uniforms.time.value = clock.getElapsedTime();
    }
  });

  return (
    <mesh ref={meshRef}>
      <icosahedronGeometry args={[3, 2]} />
      <primitive object={CustomMaterial} ref={materialRef} attach="material" />
    </mesh>
  );
}

export default function ThreeDBackground() {
  // Generate random positions for particles
  const particles = useMemo(() => {
    const count = 1000;
    const positions = new Float32Array(count * 3);
    
    for (let i = 0; i < count * 3; i += 3) {
      // Random positions in a sphere
      const radius = 5 + Math.random() * 20;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      
      positions[i] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i + 2] = radius * Math.cos(phi);
    }
    
    return positions;
  }, []);

  return (
    <div className="fixed inset-0 -z-10">
      <Canvas 
        camera={{ position: [0, 0, 15], fov: 60 }}
        gl={{ antialias: true, alpha: true }}
      >
        {/* Ambient and point lights */}
        <ambientLight intensity={0.2} />
        <pointLight position={[10, 10, 10]} intensity={1} color="#3b82f6" />
        <pointLight position={[-10, -10, -10]} intensity={0.5} color="#8b5cf6" />
        
        {/* Main animated mesh */}
        <AnimatedMesh />
        
        {/* Particle system */}
        <points>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={particles.length / 3}
              array={particles}
              itemSize={3}
            />
          </bufferGeometry>
          <pointsMaterial 
            size={0.1} 
            color="#ffffff" 
            sizeAttenuation={true}
            transparent
            opacity={0.8}
          />
        </points>
        
        {/* Stars background */}
        <Stars 
          radius={100}
          depth={50}
          count={2000}
          factor={4}
          saturation={0}
          fade
          speed={0.5}
        />
        
        {/* Camera controls */}
        <OrbitControls 
          enableZoom={false}
          enablePan={false}
          autoRotate
          autoRotateSpeed={0.3}
          enableDamping={false}
          rotateSpeed={0.5}
        />
      </Canvas>
    </div>
  );
}
