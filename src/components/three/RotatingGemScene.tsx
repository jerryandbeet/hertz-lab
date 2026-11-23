import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

import { audio } from '../../services/audioService';

interface Props {
  fpsLeft: number;
  fpsRight: number;
  splitPos: number; // 0 to 100
  speed: number;
  motionMode?: 'rotate' | 'sweep';
  showMarkers?: boolean;
  isActive?: boolean;
  onSplitChange?: (split: number) => void;
}

export const RotatingGemScene: React.FC<Props> = ({
  fpsLeft,
  fpsRight,
  splitPos,
  speed,
  motionMode = 'rotate',
  showMarkers = true,
  isActive = true,
  onSplitChange
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ufoCanvasRef = useRef<HTMLCanvasElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const stateRef = useRef({
    fpsLeft,
    fpsRight,
    splitPos,
    speed,
    motionMode,
    showMarkers,
    isActive,
  });

  // Keep stateRef up to date with props without re-initializing Three.js
  useEffect(() => {
    stateRef.current.fpsLeft = fpsLeft;
    stateRef.current.fpsRight = fpsRight;
    stateRef.current.splitPos = splitPos;
    stateRef.current.speed = speed;
    stateRef.current.motionMode = motionMode;
    stateRef.current.showMarkers = showMarkers;
    stateRef.current.isActive = isActive;
  }, [fpsLeft, fpsRight, splitPos, speed, motionMode, showMarkers, isActive]);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    let width = container.clientWidth;
    let height = container.clientHeight;

    // Setup Three.js scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf1f5f9);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0, 5.5);

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance'
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0x3b82f6, 1.8);
    dirLight1.position.set(4, 5, 4);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x10b981, 1.2);
    dirLight2.position.set(-4, -3, 3);
    scene.add(dirLight2);

    const pointLight = new THREE.PointLight(0xffffff, 1.0, 10);
    pointLight.position.set(0, 0, 3);
    scene.add(pointLight);

    // Multi-faceted 3D Gem Mesh
    const gemGeometry = new THREE.IcosahedronGeometry(1.4, 0);
    const gemMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x2563eb,
      emissive: 0x0f172a,
      roughness: 0.15,
      metalness: 0.2,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
      transmission: 0.4,
      ior: 1.5,
      reflectivity: 0.9,
      flatShading: true
    });
    const gemMesh = new THREE.Mesh(gemGeometry, gemMaterial);
    scene.add(gemMesh);

    // Wireframe overlay for high-precision contrast
    const wireGeo = new THREE.WireframeGeometry(gemGeometry);
    const wireMat = new THREE.LineBasicMaterial({ color: 0x93c5fd, linewidth: 1.5, transparent: true, opacity: 0.8 });
    const wireframe = new THREE.LineSegments(wireGeo, wireMat);
    gemMesh.add(wireframe);

    // Subtle orbiting satellites / particles
    const orbitGroup = new THREE.Group();
    const sphereGeo = new THREE.SphereGeometry(0.08, 16, 16);
    const sphereMat = new THREE.MeshStandardMaterial({ color: 0x06b6d4, emissive: 0x0891b2 });
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2;
      const sphere = new THREE.Mesh(sphereGeo, sphereMat);
      sphere.position.set(Math.cos(angle) * 2.2, Math.sin(angle) * 0.8, Math.sin(angle) * 2.2);
      orbitGroup.add(sphere);
    }
    scene.add(orbitGroup);

    // Background Tech Grid
    const gridHelper = new THREE.GridHelper(10, 20, 0x94a3b8, 0xcbd5e1);
    gridHelper.position.y = -2;
    scene.add(gridHelper);

    // Resize observer
    const handleResize = () => {
      if (!container) return;
      width = container.clientWidth;
      height = container.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);

      const ufoCanvas = ufoCanvasRef.current;
      if (ufoCanvas) {
        const ufoRect = ufoCanvas.parentElement?.getBoundingClientRect();
        if (ufoRect && ufoRect.width > 0) {
          ufoCanvas.width = ufoRect.width * (window.devicePixelRatio || 1);
          ufoCanvas.height = ufoRect.height * (window.devicePixelRatio || 1);
        }
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);

    let animId: number;
    let hasRendered = false;

    const renderLoop = (now: number) => {
      if (!stateRef.current.isActive && hasRendered) {
        animId = requestAnimationFrame(renderLoop);
        return;
      }
      hasRendered = true;

      const { fpsLeft, fpsRight, splitPos, speed, motionMode } = stateRef.current;

      // Exact mathematical discrete time sampling:
      // Both sides rotate/translate at the EXACT SAME continuous physical velocity,
      // but low-FPS samples discrete steps (e.g. 33.3ms for 30 FPS) while 180 FPS samples at 5.5ms.
      const stepLeftMs = fpsLeft >= 180 ? 0 : 1000 / fpsLeft;
      const stepRightMs = fpsRight >= 180 ? 0 : 1000 / fpsRight;

      const discreteLeftTime = stepLeftMs > 0 ? (Math.floor(now / stepLeftMs) * stepLeftMs) / 1000 : now / 1000;
      const discreteRightTime = stepRightMs > 0 ? (Math.floor(now / stepRightMs) * stepRightMs) / 1000 : now / 1000;

      const leftAngle = discreteLeftTime * speed * 2.2;
      const rightAngle = discreteRightTime * speed * 2.2;

      // Motion Mode: Rotation vs Sweep (Horizontal oscillation)
      const isSweep = motionMode === 'sweep';
      const leftSweepX = isSweep ? Math.sin(discreteLeftTime * speed * 2.4) * 2.2 : 0;
      const rightSweepX = isSweep ? Math.sin(discreteRightTime * speed * 2.4) * 2.2 : 0;

      // Render split-screen using scissor test
      const splitPx = Math.floor((splitPos / 100) * width);

      renderer.setScissorTest(true);

      // --- Left Viewport ---
      if (splitPx > 0) {
        renderer.setScissor(0, 0, splitPx, height);
        renderer.setViewport(0, 0, width, height);

        gemMesh.position.x = leftSweepX;
        gemMesh.rotation.x = leftAngle * 0.7;
        gemMesh.rotation.y = leftAngle;
        orbitGroup.position.x = leftSweepX;
        orbitGroup.rotation.y = -leftAngle * 1.5;

        renderer.render(scene, camera);
      }

      // --- Right Viewport ---
      if (width - splitPx > 0) {
        renderer.setScissor(splitPx, 0, width - splitPx, height);
        renderer.setViewport(0, 0, width, height);

        gemMesh.position.x = rightSweepX;
        gemMesh.rotation.x = rightAngle * 0.7;
        gemMesh.rotation.y = rightAngle;
        orbitGroup.position.x = rightSweepX;
        orbitGroup.rotation.y = -rightAngle * 1.5;

        renderer.render(scene, camera);
      }

      renderer.setScissorTest(false);

      // --- 2D Real-time Synchronized UFO Track Rendering ---
      const ufoCanvas = ufoCanvasRef.current;
      if (ufoCanvas) {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const parentW = ufoCanvas.parentElement?.clientWidth || 320;
        const parentH = ufoCanvas.parentElement?.clientHeight || 76;
        const targetW = Math.round(parentW * dpr);
        const targetH = Math.round(parentH * dpr);
        if (ufoCanvas.width !== targetW || ufoCanvas.height !== targetH) {
          ufoCanvas.width = targetW;
          ufoCanvas.height = targetH;
        }

        const uctx = ufoCanvas.getContext('2d');
        if (uctx) {
          const cw = ufoCanvas.width / dpr;
          const ch = ufoCanvas.height / dpr;

          uctx.save();
          uctx.scale(dpr, dpr);
          uctx.clearRect(0, 0, cw, ch);

          const trackWidth = cw - 70;
          const ufoSpeed = 340 * speed; // pixels per sec
          const ufoXLeft = ((discreteLeftTime * ufoSpeed) % trackWidth);
          const ufoXRight = ((discreteRightTime * ufoSpeed) % trackWidth);

          // Lane dividing line
          uctx.strokeStyle = '#e2e8f0';
          uctx.lineWidth = 1;
          uctx.beginPath();
          uctx.moveTo(10, ch / 2);
          uctx.lineTo(cw - 10, ch / 2);
          uctx.stroke();

          // Helper to draw a sleek Supersonic Cyber Bolide (distinct from Module 02's UFO)
          const drawCyberBolide = (x: number, y: number, color: string, badgeText: string, isSmooth: boolean) => {
            uctx.save();
            uctx.translate(x + 35, y);

            // Strobe ghost trails if low FPS
            if (!isSmooth) {
              uctx.fillStyle = 'rgba(59, 130, 246, 0.18)';
              uctx.fillRect(-28, -8, 22, 16);
            }

            // Exhaust plasma flame
            uctx.fillStyle = isSmooth ? '#10b981' : '#f59e0b';
            uctx.beginPath();
            uctx.moveTo(-24, -3);
            uctx.lineTo(-34 - (Math.random() * 4), 0);
            uctx.lineTo(-24, 3);
            uctx.closePath();
            uctx.fill();

            // Main aerodynamic chassis / body
            uctx.fillStyle = color;
            uctx.beginPath();
            uctx.moveTo(-22, 6);
            uctx.lineTo(24, 6);   // Flat bottom
            uctx.lineTo(28, 2);   // Front nose splitter
            uctx.lineTo(16, -2);  // Hood slope
            uctx.lineTo(4, -7);   // Windshield slope
            uctx.lineTo(-14, -7); // Roofline
            uctx.lineTo(-22, 0);  // Rear tail
            uctx.closePath();
            uctx.fill();

            // Windshield / cockpit glass
            uctx.fillStyle = '#e0f2fe';
            uctx.beginPath();
            uctx.moveTo(3, -6);
            uctx.lineTo(14, -2);
            uctx.lineTo(4, 0);
            uctx.lineTo(-6, -6);
            uctx.closePath();
            uctx.fill();

            // Rear racing spoiler / aero wing
            uctx.fillStyle = isSmooth ? '#047857' : '#1e3a8a';
            uctx.fillRect(-23, -11, 4, 8);
            uctx.fillRect(-25, -12, 10, 2);

            // Front LED laser headlight
            uctx.fillStyle = '#ffffff';
            uctx.beginPath();
            uctx.arc(26, 3, 2, 0, Math.PI * 2);
            uctx.fill();

            // Cyber glowing neon wheels
            const wheelColor = '#0f172a';
            const rimColor = isSmooth ? '#34d399' : '#60a5fa';

            // Rear wheel
            uctx.fillStyle = wheelColor;
            uctx.beginPath();
            uctx.arc(-13, 7, 5, 0, Math.PI * 2);
            uctx.fill();
            uctx.fillStyle = rimColor;
            uctx.beginPath();
            uctx.arc(-13, 7, 2.5, 0, Math.PI * 2);
            uctx.fill();

            // Front wheel
            uctx.fillStyle = wheelColor;
            uctx.beginPath();
            uctx.arc(15, 7, 5, 0, Math.PI * 2);
            uctx.fill();
            uctx.fillStyle = rimColor;
            uctx.beginPath();
            uctx.arc(15, 7, 2.5, 0, Math.PI * 2);
            uctx.fill();

            // Speed & FPS Badge (responsive on mobile!)
            const isMobile = cw < 480;
            uctx.fillStyle = isSmooth ? '#047857' : '#1d4ed8';
            uctx.font = 'bold 10px ui-monospace, SFMono-Regular, monospace';
            uctx.textAlign = 'left';
            if (isMobile) {
              uctx.fillText(isSmooth ? '180 FPS • Плавный' : `${fpsLeft} FPS • Рывок`, 34, 4);
            } else {
              uctx.fillText(badgeText, 34, 4);
            }

            uctx.restore();
          };

          // Top Lane: Left FPS (e.g. 30 FPS - Stroboscopic discrete jumps)
          drawCyberBolide(ufoXLeft, ch * 0.26, '#2563eb', `${fpsLeft} FPS (${(1000 / fpsLeft).toFixed(1)} мс) • Дискретный шаг`, false);

          // Bottom Lane: Right FPS (e.g. 180 FPS - Liquid continuous glide)
          drawCyberBolide(ufoXRight, ch * 0.74, '#059669', `${fpsRight >= 180 ? '180 FPS' : `${fpsRight} FPS`} (${(1000 / fpsRight).toFixed(1)} мс) • Нативная плавность`, true);

          uctx.restore();
        }
      }

      animId = requestAnimationFrame(renderLoop);
    };

    animId = requestAnimationFrame(renderLoop);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      gemGeometry.dispose();
      gemMaterial.dispose();
      wireGeo.dispose();
      wireMat.dispose();
    };
  }, []);

  const updateSplitFromPointer = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const relX = clientX - rect.left;
    const pct = Math.max(10, Math.min(90, Math.round((relX / rect.width) * 100)));
    if (onSplitChange && pct !== splitPos) {
      onSplitChange(pct);
      audio.playSliderTick(pct / 100);
    }
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    updateSplitFromPointer(e.clientX);
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    updateSplitFromPointer(e.clientX);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isDragging) {
      setIsDragging(false);
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId);
      } catch {}
    }
  };

  return (
    <div 
      ref={containerRef} 
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      className={`relative w-full h-[380px] sm:h-[440px] rounded-2xl overflow-hidden border border-slate-200/90 shadow-inner bg-slate-100 select-none cursor-ew-resize ${
        isDragging ? 'cursor-grabbing' : ''
      }`}
    >
      <canvas ref={canvasRef} className="w-full h-full block pointer-events-none" />

      {/* Split Divider line (Stops cleanly above the UFO track to prevent visual overflow) */}
      <div 
        className="absolute top-0 bottom-24 w-0.5 bg-blue-500 shadow-[0_0_12px_rgba(37,99,235,0.8)] z-10 pointer-events-none"
        style={{ left: `${splitPos}%` }}
      >
        <div 
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-9 h-9 rounded-full bg-white shadow-lg border-2 border-blue-500 flex items-center justify-center pointer-events-auto cursor-ew-resize hover:scale-110 active:scale-95 transition-transform"
          style={{ touchAction: 'none' }}
        >
          <div className="flex gap-0.5 pointer-events-none">
            <span className="w-0.5 h-3 bg-blue-500 rounded-full"></span>
            <span className="w-0.5 h-3 bg-blue-500 rounded-full"></span>
          </div>
        </div>
      </div>

      {/* Left side badge */}
      <div 
        className="absolute top-2.5 left-2.5 sm:top-3 sm:left-3 z-10 glass-pill px-2.5 py-1 sm:px-3 sm:py-1 rounded-lg text-[11px] sm:text-xs font-mono font-bold border border-slate-200 text-slate-800 shadow-sm pointer-events-none"
      >
        <span className="hidden sm:inline">Левая: </span><span className="text-blue-600">{fpsLeft} FPS</span>
        <span className="ml-1 text-[10px] text-slate-400 font-normal">({(1000 / fpsLeft).toFixed(1)}ms)</span>
      </div>

      {/* Right side badge */}
      <div 
        className="absolute top-2.5 right-2.5 sm:top-3 sm:right-3 z-10 glass-pill px-2.5 py-1 sm:px-3 sm:py-1 rounded-lg text-[11px] sm:text-xs font-mono font-bold border border-slate-200 text-slate-800 shadow-sm pointer-events-none"
      >
        <span className="hidden sm:inline">Правая: </span><span className="text-emerald-600">{fpsRight >= 180 ? '180 FPS' : `${fpsRight} FPS`}</span>
        <span className="ml-1 text-[10px] text-slate-400 font-normal">({(1000 / fpsRight).toFixed(1)}ms)</span>
      </div>

      {/* Dynamic 2D Real-time UFO Test Strip (Dual-Lane Hardware-accurate sync) */}
      {showMarkers && (
        <div className="absolute bottom-3 left-3 right-3 h-20 bg-white/95 backdrop-blur-md rounded-xl border border-slate-200/90 overflow-hidden flex flex-col justify-center px-2 z-20 shadow-sm pointer-events-auto">
          <div className="relative w-full h-full">
            <canvas ref={ufoCanvasRef} className="w-full h-full block" />
          </div>
        </div>
      )}
    </div>
  );
};
