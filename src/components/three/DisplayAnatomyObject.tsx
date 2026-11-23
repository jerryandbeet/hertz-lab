import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface Props {
  isActive?: boolean;
}

export const DisplayAnatomyObject: React.FC<Props> = ({ isActive = true }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const stateRef = useRef({
    mouseX: 0,
    mouseY: 0,
    targetRotX: 0.15,
    targetRotY: -0.2,
    isDragging: false,
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

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(0, 0, 6.2);

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Studio Key Lights (Apple Pro Hardware Studio Lighting)
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 3.0);
    keyLight.position.set(5, 7, 6);
    scene.add(keyLight);

    const rimBlue = new THREE.DirectionalLight(0x38bdf8, 2.5);
    rimBlue.position.set(-6, -4, 4);
    scene.add(rimBlue);

    const cyanSpec = new THREE.PointLight(0x06b6d4, 1.8, 10);
    cyanSpec.position.set(0, 3, 4);
    scene.add(cyanSpec);

    // Root Display Assembly Group
    const displayGroup = new THREE.Group();
    scene.add(displayGroup);

    // 1. CNC Aerospace Aluminum Unibody Chassis (Space Gray / Titanium)
    const chassisGeo = new THREE.BoxGeometry(4.2, 2.7, 0.16);
    const chassisMat = new THREE.MeshPhysicalMaterial({
      color: 0x1e293b,
      metalness: 0.88,
      roughness: 0.22,
      clearcoat: 0.3,
      clearcoatRoughness: 0.15,
      reflectivity: 0.9
    });
    const chassisMesh = new THREE.Mesh(chassisGeo, chassisMat);
    displayGroup.add(chassisMesh);

    // 2. Beveled Polished Edge Frame
    const bevelGeo = new THREE.BoxGeometry(4.24, 2.74, 0.04);
    const bevelMat = new THREE.MeshStandardMaterial({
      color: 0x64748b,
      metalness: 0.95,
      roughness: 0.15
    });
    const bevelMesh = new THREE.Mesh(bevelGeo, bevelMat);
    bevelMesh.position.z = 0.08;
    displayGroup.add(bevelMesh);

    // 3. Subpixel OLED / Mini-LED Matrix Grid Canvas Texture
    const createSubpixelTexture = () => {
      const c = document.createElement('canvas');
      c.width = 128;
      c.height = 128;
      const ctx = c.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#090d16';
        ctx.fillRect(0, 0, 128, 128);

        // Subpixel bars: Red, Green, Blue triplets
        const colW = 128 / 8;
        for (let x = 0; x < 8; x++) {
          for (let y = 0; y < 8; y++) {
            const bx = x * colW;
            const by = y * colW;
            // Red subpixel
            ctx.fillStyle = 'rgba(239, 68, 68, 0.75)';
            ctx.fillRect(bx + 1, by + 1, colW / 3 - 1, colW - 2);
            // Green subpixel
            ctx.fillStyle = 'rgba(34, 197, 94, 0.75)';
            ctx.fillRect(bx + colW / 3 + 1, by + 1, colW / 3 - 1, colW - 2);
            // Blue subpixel
            ctx.fillStyle = 'rgba(59, 130, 246, 0.85)';
            ctx.fillRect(bx + (colW * 2) / 3 + 1, by + 1, colW / 3 - 1, colW - 2);
          }
        }
      }
      const tex = new THREE.CanvasTexture(c);
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(12, 8);
      return tex;
    };

    const panelGeo = new THREE.PlaneGeometry(4.08, 2.58);
    const panelMat = new THREE.MeshStandardMaterial({
      map: createSubpixelTexture(),
      roughness: 0.35,
      metalness: 0.1,
      emissive: 0x0f172a,
      emissiveIntensity: 0.4
    });
    const panelMesh = new THREE.Mesh(panelGeo, panelMat);
    panelMesh.position.z = 0.11;
    displayGroup.add(panelMesh);

    // 4. Optical Front Glass Layer (Floating slightly forward with real physical refraction)
    const glassGeo = new THREE.BoxGeometry(4.14, 2.64, 0.05);
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transmission: 0.92,
      opacity: 1,
      transparent: true,
      roughness: 0.04,
      ior: 1.52,
      clearcoat: 1.0,
      clearcoatRoughness: 0.05,
      reflectivity: 0.95
    });
    const glassMesh = new THREE.Mesh(glassGeo, glassMat);
    glassMesh.position.z = 0.19;
    displayGroup.add(glassMesh);

    // 5. Active Frame Scanline Beam (Laser line sweeping down at high refresh rate)
    const scanlineGeo = new THREE.PlaneGeometry(4.08, 0.05);
    const scanlineMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.95
    });
    const scanlineMesh = new THREE.Mesh(scanlineGeo, scanlineMat);
    scanlineMesh.position.z = 0.13;
    displayGroup.add(scanlineMesh);

    // 6. Subpixel Calibration HUD Glow Reticle in Center
    const ringGeo = new THREE.RingGeometry(0.35, 0.38, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x60a5fa,
      transparent: true,
      opacity: 0.65,
      side: THREE.DoubleSide
    });
    const reticleRing = new THREE.Mesh(ringGeo, ringMat);
    reticleRing.position.z = 0.14;
    displayGroup.add(reticleRing);

    // Pointer event interaction
    const onPointerMove = (e: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const ny = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      stateRef.current.mouseX = nx;
      stateRef.current.mouseY = ny;
    };

    let isDown = false;
    let prevX = 0;
    let prevY = 0;

    const onPointerDown = (e: PointerEvent) => {
      isDown = true;
      prevX = e.clientX;
      prevY = e.clientY;
      container.setPointerCapture?.(e.pointerId);
    };

    const onPointerUp = (e: PointerEvent) => {
      isDown = false;
      try {
        container.releasePointerCapture?.(e.pointerId);
      } catch {}
    };

    const onPointerDrag = (e: PointerEvent) => {
      if (!isDown) return;
      const dx = (e.clientX - prevX) * 0.008;
      const dy = (e.clientY - prevY) * 0.008;
      prevX = e.clientX;
      prevY = e.clientY;
      stateRef.current.targetRotY += dx;
      stateRef.current.targetRotX += dy;
    };

    container.addEventListener('pointermove', onPointerMove);
    container.addEventListener('pointerdown', onPointerDown);
    container.addEventListener('pointermove', onPointerDrag);
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

    // Render loop
    let animId: number;
    let curRotX = 0.15;
    let curRotY = -0.2;
    let scanY = 1.25;

    const render = (time: number) => {
      if (!stateRef.current.isActive) {
        animId = requestAnimationFrame(render);
        return;
      }

      // Smooth cursor follow inertia
      if (!isDown) {
        stateRef.current.targetRotX = stateRef.current.mouseY * 0.35 + 0.1;
        stateRef.current.targetRotY = stateRef.current.mouseX * 0.45;
      }

      curRotX += (stateRef.current.targetRotX - curRotX) * 0.06;
      curRotY += (stateRef.current.targetRotY - curRotY) * 0.06;

      displayGroup.rotation.x = curRotX;
      displayGroup.rotation.y = curRotY;

      // Sweeping high-refresh scanline (travels down 120 times/sec normalized)
      scanY -= 0.035;
      if (scanY < -1.25) scanY = 1.25;
      scanlineMesh.position.y = scanY;

      // Subtle reticle pulse
      reticleRing.scale.setScalar(1 + Math.sin(time * 0.004) * 0.05);

      renderer.render(scene, camera);
      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      container.removeEventListener('pointermove', onPointerMove);
      container.removeEventListener('pointerdown', onPointerDown);
      container.removeEventListener('pointermove', onPointerDrag);
      container.removeEventListener('pointerup', onPointerUp);
      renderer.dispose();
      chassisGeo.dispose();
      chassisMat.dispose();
      bevelGeo.dispose();
      bevelMat.dispose();
      panelGeo.dispose();
      panelMat.dispose();
      glassGeo.dispose();
      glassMat.dispose();
      scanlineGeo.dispose();
      scanlineMat.dispose();
      ringGeo.dispose();
      ringMat.dispose();
    };
  }, []);

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-[320px] sm:h-[380px] flex items-center justify-center cursor-grab active:cursor-grabbing select-none"
    >
      <canvas ref={canvasRef} className="w-full h-full block" />
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 glass-pill px-3 py-1 rounded-full text-[11px] font-mono text-slate-500 border border-slate-200/80 shadow-sm pointer-events-none">
        Дисплейная матрица в разрезе • Потяните для осмотра
      </div>
    </div>
  );
};
