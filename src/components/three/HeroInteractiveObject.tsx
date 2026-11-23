import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export const HeroInteractiveObject: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const stateRef = useRef({
    mouseX: 0,
    mouseY: 0,
    targetRotX: 0,
    targetRotY: 0,
    isDragging: false,
    prevMouseX: 0,
    prevMouseY: 0,
    dragVelX: 0,
    dragVelY: 0
  });

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    let width = container.clientWidth;
    let height = container.clientHeight;

    const scene = new THREE.Scene();
    // Transparent scene background to merge seamlessly into glassmorphism
    scene.background = null;

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(0, 0, 7.5);

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Dynamic Multi-color Studio Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0x3b82f6, 2.5);
    keyLight.position.set(5, 5, 5);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x10b981, 2.0);
    rimLight.position.set(-5, -3, 4);
    scene.add(rimLight);

    const purpleLight = new THREE.PointLight(0xa855f7, 2.0, 15);
    purpleLight.position.set(0, 4, 3);
    scene.add(purpleLight);

    const cursorLight = new THREE.PointLight(0x06b6d4, 1.5, 10);
    scene.add(cursorLight);

    // Root Group for interactive rotation
    const rootGroup = new THREE.Group();
    scene.add(rootGroup);

    // 1. Central Refractive Crystal Core
    const coreGeo = new THREE.IcosahedronGeometry(1.6, 0);
    const coreMat = new THREE.MeshPhysicalMaterial({
      color: 0x2563eb,
      emissive: 0x0f172a,
      roughness: 0.1,
      metalness: 0.15,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
      transmission: 0.5,
      ior: 1.6,
      reflectivity: 0.9,
      flatShading: true
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    rootGroup.add(coreMesh);

    // Core Wireframe Facets
    const wireGeo = new THREE.WireframeGeometry(coreGeo);
    const wireMat = new THREE.LineBasicMaterial({
      color: 0x93c5fd,
      transparent: true,
      opacity: 0.75,
      linewidth: 1.5
    });
    const wireframe = new THREE.LineSegments(wireGeo, wireMat);
    coreMesh.add(wireframe);

    // 2. Concentric Gyroscopic Rings
    const ringMat1 = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      metalness: 0.8,
      roughness: 0.2
    });
    const ringGeo1 = new THREE.TorusGeometry(2.3, 0.04, 16, 100);
    const ringMesh1 = new THREE.Mesh(ringGeo1, ringMat1);
    rootGroup.add(ringMesh1);

    const ringMat2 = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      metalness: 0.85,
      roughness: 0.2
    });
    const ringGeo2 = new THREE.TorusGeometry(2.7, 0.035, 16, 100);
    const ringMesh2 = new THREE.Mesh(ringGeo2, ringMat2);
    ringMesh2.rotation.x = Math.PI / 2.8;
    rootGroup.add(ringMesh2);

    // 3. Orbiting Sparkle Quantum Nodes
    const orbitNodes = new THREE.Group();
    const nodeGeo = new THREE.SphereGeometry(0.09, 16, 16);
    const nodeMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      emissive: 0xd97706,
      roughness: 0.2
    });
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const node = new THREE.Mesh(nodeGeo, nodeMat);
      node.position.set(Math.cos(angle) * 3.1, Math.sin(angle * 1.5) * 1.2, Math.sin(angle) * 3.1);
      orbitNodes.add(node);
    }
    rootGroup.add(orbitNodes);

    // Resize Handler
    const handleResize = () => {
      if (!container) return;
      width = container.clientWidth;
      height = container.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    window.addEventListener('resize', handleResize);

    // Mouse Tracking for Parallax & Drag
    const onPointerMove = (e: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      const normX = ((e.clientX - rect.left) / width) * 2 - 1;
      const normY = -(((e.clientY - rect.top) / height) * 2 - 1);

      cursorLight.position.set(normX * 4, normY * 4, 3.5);

      if (stateRef.current.isDragging) {
        const deltaX = e.clientX - stateRef.current.prevMouseX;
        const deltaY = e.clientY - stateRef.current.prevMouseY;
        stateRef.current.prevMouseX = e.clientX;
        stateRef.current.prevMouseY = e.clientY;

        stateRef.current.dragVelX = deltaX * 0.008;
        stateRef.current.dragVelY = deltaY * 0.008;

        stateRef.current.targetRotY += deltaX * 0.008;
        stateRef.current.targetRotX += deltaY * 0.008;
      } else {
        stateRef.current.mouseX = normX;
        stateRef.current.mouseY = normY;
      }
    };

    const onPointerDown = (e: PointerEvent) => {
      stateRef.current.isDragging = true;
      stateRef.current.prevMouseX = e.clientX;
      stateRef.current.prevMouseY = e.clientY;
      container.setPointerCapture(e.pointerId);
    };

    const onPointerUp = (e: PointerEvent) => {
      stateRef.current.isDragging = false;
      try {
        container.releasePointerCapture(e.pointerId);
      } catch {}
    };

    container.addEventListener('pointermove', onPointerMove);
    container.addEventListener('pointerdown', onPointerDown);
    container.addEventListener('pointerup', onPointerUp);

    // Animation Loop
    let animId: number;
    let clock = new THREE.Clock();
    let curRotX = 0;
    let curRotY = 0;

    const render = () => {
      const dt = clock.getDelta();
      const time = clock.getElapsedTime();

      // Natural continuous auto-rotation
      if (!stateRef.current.isDragging) {
        stateRef.current.targetRotY += dt * 0.35;
        stateRef.current.targetRotX = stateRef.current.mouseY * 0.45;
        stateRef.current.targetRotY += (stateRef.current.mouseX * 0.5 - stateRef.current.targetRotY) * 0.02;
      } else {
        // Dampen drag velocity
        stateRef.current.targetRotY += stateRef.current.dragVelX;
        stateRef.current.targetRotX += stateRef.current.dragVelY;
        stateRef.current.dragVelX *= 0.94;
        stateRef.current.dragVelY *= 0.94;
      }

      // Smooth lerp rotation
      curRotX += (stateRef.current.targetRotX - curRotX) * 0.08;
      curRotY += (stateRef.current.targetRotY - curRotY) * 0.08;

      rootGroup.rotation.x = curRotX;
      rootGroup.rotation.y = curRotY;

      // Concentric gimbals rotate independently
      ringMesh1.rotation.z = time * 0.5;
      ringMesh2.rotation.y = -time * 0.4;
      orbitNodes.rotation.y = time * 0.6;
      coreMesh.rotation.y = time * 0.2;

      renderer.render(scene, camera);
      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      container.removeEventListener('pointermove', onPointerMove);
      container.removeEventListener('pointerdown', onPointerDown);
      container.removeEventListener('pointerup', onPointerUp);
      renderer.dispose();
      coreGeo.dispose();
      coreMat.dispose();
      wireGeo.dispose();
      wireMat.dispose();
      ringGeo1.dispose();
      ringMat1.dispose();
      ringGeo2.dispose();
      ringMat2.dispose();
      nodeGeo.dispose();
      nodeMat.dispose();
    };
  }, []);

  return (
    <div 
      ref={containerRef} 
      className="relative w-full h-[360px] sm:h-[440px] md:h-[480px] cursor-grab active:cursor-grabbing select-none"
    >
      <canvas ref={canvasRef} className="w-full h-full block" />

      {/* Floating subtle gesture hint */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 glass-pill px-3 py-1 rounded-full text-[11px] font-mono text-slate-500 border border-slate-200/80 shadow-sm pointer-events-none flex items-center gap-1.5 opacity-80 hover:opacity-100 transition-opacity">
        <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
        <span>Потяните курсором для вращения 3D-ядра</span>
      </div>
    </div>
  );
};
