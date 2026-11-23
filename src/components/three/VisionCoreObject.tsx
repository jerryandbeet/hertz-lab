import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface Props {
  isActive?: boolean;
}

export const VisionCoreObject: React.FC<Props> = ({ isActive = true }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const stateRef = useRef({
    mouseX: 0,
    mouseY: 0,
    targetRotX: 0.2,
    targetRotY: -0.3,
    isDragging: false,
    prevMouseX: 0,
    prevMouseY: 0,
    dragVelX: 0,
    dragVelY: 0,
    isActive
  });

  useEffect(() => {
    stateRef.current.isActive = isActive;
  }, [isActive]);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    let width = container.clientWidth;
    let height = container.clientHeight;

    const scene = new THREE.Scene();
    scene.background = null;

    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
    camera.position.set(0, 0, 7.2);

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Studio Multi-Point Lighting for Precision Optics
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.1);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0x2563eb, 3.2);
    keyLight.position.set(6, 6, 6);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x06b6d4, 2.5);
    rimLight.position.set(-6, -4, 5);
    scene.add(rimLight);

    const warmLight = new THREE.PointLight(0xf59e0b, 2.2, 12);
    warmLight.position.set(0, 3, 4);
    scene.add(warmLight);

    const cursorLight = new THREE.PointLight(0x38bdf8, 2.0, 10);
    scene.add(cursorLight);

    // Root Group for interactive rotation
    const rootGroup = new THREE.Group();
    scene.add(rootGroup);

    // 1. External Mechanical Titanium Lens Barrel
    const barrelGeo = new THREE.CylinderGeometry(2.1, 2.3, 0.9, 64, 1, true);
    const barrelMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      metalness: 0.9,
      roughness: 0.22
    });
    const barrel = new THREE.Mesh(barrelGeo, barrelMat);
    barrel.rotation.x = Math.PI / 2;
    rootGroup.add(barrel);

    // Fluted Grip Ridges on outer barrel
    const ringGripGeo = new THREE.TorusGeometry(2.28, 0.04, 16, 80);
    const ringGripMat = new THREE.MeshStandardMaterial({ color: 0x2563eb, metalness: 0.95, roughness: 0.15 });
    for (let r = -0.35; r <= 0.35; r += 0.35) {
      const grip = new THREE.Mesh(ringGripGeo, ringGripMat);
      grip.position.z = r;
      rootGroup.add(grip);
    }

    // 2. Optical Glass Lens Elements (Front & Back Convex Lenses)
    const lensGeo = new THREE.SphereGeometry(1.9, 64, 32, 0, Math.PI * 2, 0, Math.PI / 3.2);
    const lensMat = new THREE.MeshPhysicalMaterial({
      color: 0xe0f2fe,
      roughness: 0.04,
      metalness: 0.1,
      transmission: 0.88,
      ior: 1.58,
      reflectivity: 0.95,
      clearcoat: 1.0,
      clearcoatRoughness: 0.05
    });

    const frontLens = new THREE.Mesh(lensGeo, lensMat);
    frontLens.position.z = 0.35;
    rootGroup.add(frontLens);

    const rearLens = new THREE.Mesh(lensGeo, lensMat);
    rearLens.position.z = -0.35;
    rearLens.rotation.x = Math.PI;
    rootGroup.add(rearLens);

    // 3. Precision Aperture Iris Blades inside
    const irisGroup = new THREE.Group();
    const bladeGeo = new THREE.CylinderGeometry(0.1, 1.4, 0.02, 3);
    const bladeMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      metalness: 0.8,
      roughness: 0.3
    });
    for (let i = 0; i < 9; i++) {
      const angle = (i / 9) * Math.PI * 2;
      const blade = new THREE.Mesh(bladeGeo, bladeMat);
      blade.position.set(Math.cos(angle) * 0.75, Math.sin(angle) * 0.75, 0);
      blade.rotation.z = angle + 0.6;
      irisGroup.add(blade);
    }
    rootGroup.add(irisGroup);

    // 4. Central Coherent Photon Core (Glowing Optical Laser Center)
    const coreGeo = new THREE.SphereGeometry(0.35, 32, 32);
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 1.8,
      roughness: 0.1
    });
    const photonCore = new THREE.Mesh(coreGeo, coreMat);
    rootGroup.add(photonCore);

    // 5. Orbiting Optical Precision Calibration Rings
    const ringTimingGeo = new THREE.TorusGeometry(2.7, 0.025, 16, 120);
    const ringTimingMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      metalness: 0.9,
      roughness: 0.2
    });
    const ringTiming1 = new THREE.Mesh(ringTimingGeo, ringTimingMat);
    rootGroup.add(ringTiming1);

    const ringTiming2 = new THREE.Mesh(ringTimingGeo, ringTimingMat);
    ringTiming2.rotation.x = Math.PI / 2.6;
    rootGroup.add(ringTiming2);

    // 6. Floating Laser Photons around
    const photonParticles = new THREE.Group();
    const pGeo = new THREE.SphereGeometry(0.06, 16, 16);
    const pMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      emissive: 0xd97706,
      emissiveIntensity: 1.2
    });
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const pMesh = new THREE.Mesh(pGeo, pMat);
      pMesh.position.set(Math.cos(angle) * 3.3, Math.sin(angle * 1.5) * 1.4, Math.sin(angle) * 3.3);
      photonParticles.add(pMesh);
    }
    rootGroup.add(photonParticles);

    // Mouse Tracking & Drag
    const onPointerMove = (e: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      const normX = ((e.clientX - rect.left) / width) * 2 - 1;
      const normY = -(((e.clientY - rect.top) / height) * 2 - 1);

      cursorLight.position.set(normX * 5, normY * 5, 4.0);

      if (stateRef.current.isDragging) {
        const deltaX = e.clientX - stateRef.current.prevMouseX;
        const deltaY = e.clientY - stateRef.current.prevMouseY;
        stateRef.current.prevMouseX = e.clientX;
        stateRef.current.prevMouseY = e.clientY;

        stateRef.current.dragVelX = deltaX * 0.007;
        stateRef.current.dragVelY = deltaY * 0.007;

        stateRef.current.targetRotY += deltaX * 0.007;
        stateRef.current.targetRotX += deltaY * 0.007;
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

    const handleResize = () => {
      if (!container) return;
      width = container.clientWidth;
      height = container.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    window.addEventListener('resize', handleResize);

    // Animation Loop
    let animId: number;
    let clock = new THREE.Clock();
    let curRotX = 0;
    let curRotY = 0;

    const render = () => {
      if (!stateRef.current.isActive) {
        animId = requestAnimationFrame(render);
        return;
      }

      const dt = clock.getDelta();
      const time = clock.getElapsedTime();

      if (!stateRef.current.isDragging) {
        stateRef.current.targetRotY += dt * 0.3;
        stateRef.current.targetRotX = stateRef.current.mouseY * 0.4;
        stateRef.current.targetRotY += (stateRef.current.mouseX * 0.45 - stateRef.current.targetRotY) * 0.015;
      } else {
        stateRef.current.targetRotY += stateRef.current.dragVelX;
        stateRef.current.targetRotX += stateRef.current.dragVelY;
        stateRef.current.dragVelX *= 0.93;
        stateRef.current.dragVelY *= 0.93;
      }

      curRotX += (stateRef.current.targetRotX - curRotX) * 0.07;
      curRotY += (stateRef.current.targetRotY - curRotY) * 0.07;

      rootGroup.rotation.x = curRotX;
      rootGroup.rotation.y = curRotY;

      // Independent micro-rotations
      irisGroup.rotation.z = Math.sin(time * 0.8) * 0.15;
      ringTiming1.rotation.z = time * 0.4;
      ringTiming2.rotation.y = -time * 0.3;
      photonParticles.rotation.y = time * 0.5;

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
      barrelGeo.dispose();
      barrelMat.dispose();
      ringGripGeo.dispose();
      ringGripMat.dispose();
      lensGeo.dispose();
      lensMat.dispose();
      bladeGeo.dispose();
      bladeMat.dispose();
      coreGeo.dispose();
      coreMat.dispose();
      ringTimingGeo.dispose();
      ringTimingMat.dispose();
      pGeo.dispose();
      pMat.dispose();
    };
  }, []);

  return (
    <div 
      ref={containerRef} 
      className="relative w-full h-[360px] sm:h-[440px] md:h-[480px] cursor-grab active:cursor-grabbing select-none"
    >
      <canvas ref={canvasRef} className="w-full h-full block" />

      {/* Floating gesture pill */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 glass-pill px-3 py-1 rounded-full text-[11px] font-mono text-slate-500 border border-slate-200/80 shadow-sm pointer-events-none flex items-center gap-1.5 opacity-80 hover:opacity-100 transition-opacity">
        <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
        <span>Фотонный оптический объектив • Потяните для вращения</span>
      </div>
    </div>
  );
};
