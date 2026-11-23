import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useStationVisibility } from '../../hooks/useStationVisibility';

interface Props {
  isActive?: boolean;
}

export const AmbientPhotonicBackground: React.FC<Props> = ({ isActive = true }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { isPaused } = useStationVisibility(containerRef);
  const isEffectivelyActive = isActive && !isPaused;

  const animIdRef = useRef<number | null>(null);
  const animateRef = useRef<(() => void) | null>(null);

  // Resume or stop animation loop strictly based on visibility
  useEffect(() => {
    if (isEffectivelyActive) {
      if (animateRef.current && animIdRef.current === null) {
        animIdRef.current = requestAnimationFrame(animateRef.current);
      }
    } else {
      if (animIdRef.current !== null) {
        cancelAnimationFrame(animIdRef.current);
        animIdRef.current = null;
      }
    }
  }, [isEffectivelyActive]);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    let width = container.clientWidth;
    let height = container.clientHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0, 7.5);

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Ambient Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0x3b82f6, 1.5);
    dirLight1.position.set(5, 5, 5);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x10b981, 1.0);
    dirLight2.position.set(-5, -3, 3);
    scene.add(dirLight2);

    // Group for ambient rotating optical orbital rings & particles
    const group = new THREE.Group();
    scene.add(group);

    // Subtle optical refraction rings (Apple hardware style)
    const ringMat1 = new THREE.MeshPhysicalMaterial({
      color: 0x2563eb,
      roughness: 0.1,
      metalness: 0.1,
      transmission: 0.85,
      ior: 1.4,
      transparent: true,
      opacity: 0.45,
      wireframe: false
    });

    const ringMat2 = new THREE.MeshPhysicalMaterial({
      color: 0x06b6d4,
      roughness: 0.1,
      metalness: 0.2,
      transmission: 0.8,
      ior: 1.35,
      transparent: true,
      opacity: 0.35
    });

    const ringGeo1 = new THREE.TorusGeometry(3.2, 0.04, 16, 100);
    const ring1 = new THREE.Mesh(ringGeo1, ringMat1);
    ring1.rotation.x = Math.PI * 0.35;
    ring1.rotation.y = Math.PI * 0.15;
    group.add(ring1);

    const ringGeo2 = new THREE.TorusGeometry(2.4, 0.03, 16, 90);
    const ring2 = new THREE.Mesh(ringGeo2, ringMat2);
    ring2.rotation.x = -Math.PI * 0.25;
    ring2.rotation.y = Math.PI * 0.4;
    group.add(ring2);

    const ringGeo3 = new THREE.TorusGeometry(1.6, 0.02, 16, 80);
    const ringMat3 = new THREE.MeshBasicMaterial({
      color: 0x60a5fa,
      wireframe: true,
      transparent: true,
      opacity: 0.25
    });
    const ring3 = new THREE.Mesh(ringGeo3, ringMat3);
    ring3.rotation.z = Math.PI * 0.5;
    group.add(ring3);

    // Orbiting Photons (Particles)
    const particleCount = 80;
    const particleGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const particleRadii = new Float32Array(particleCount);
    const particleSpeeds = new Float32Array(particleCount);
    const particlePhases = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      const radius = 1.2 + Math.random() * 2.5;
      particleRadii[i] = radius;
      particleSpeeds[i] = (0.2 + Math.random() * 0.6) * (Math.random() > 0.5 ? 1 : -1);
      particlePhases[i] = Math.random() * Math.PI * 2;

      positions[i * 3] = Math.cos(particlePhases[i]) * radius;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 0.8;
      positions[i * 3 + 2] = Math.sin(particlePhases[i]) * radius;
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0x38bdf8,
      size: 0.06,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending
    });
    const particleSystem = new THREE.Points(particleGeo, particleMat);
    group.add(particleSystem);

    // Mouse movement parallax
    let mouseX = 0;
    let mouseY = 0;
    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth) * 2 - 1;
      const y = -(e.clientY / window.innerHeight) * 2 + 1;
      mouseX = x * 0.12;
      mouseY = y * 0.12;
    };
    window.addEventListener('mousemove', handleMouseMove);

    const handleResize = () => {
      if (!container) return;
      width = container.clientWidth;
      height = container.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    window.addEventListener('resize', handleResize);

    const clock = new THREE.Clock();

    const animate = () => {
      const elapsedTime = clock.getElapsedTime();

      // Smooth slow ambient drift
      group.rotation.y = elapsedTime * 0.08 + mouseX;
      group.rotation.x = Math.sin(elapsedTime * 0.05) * 0.1 + mouseY;

      ring1.rotation.z = elapsedTime * 0.05;
      ring2.rotation.z = -elapsedTime * 0.07;

      renderer.render(scene, camera);
      animIdRef.current = requestAnimationFrame(animate);
    };

    animateRef.current = animate;
    if (isEffectivelyActive && animIdRef.current === null) {
      animIdRef.current = requestAnimationFrame(animate);
    }

    return () => {
      if (animIdRef.current !== null) {
        cancelAnimationFrame(animIdRef.current);
        animIdRef.current = null;
      }
      animateRef.current = null;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      ringGeo1.dispose();
      ringGeo2.dispose();
      ringGeo3.dispose();
      ringMat1.dispose();
      ringMat2.dispose();
      particleGeo.dispose();
      particleMat.dispose();
    };
  }, []);

  return (
    <div ref={containerRef} className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      <canvas ref={canvasRef} className="w-full h-full block opacity-60" />
    </div>
  );
};
