import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface Props {
  objectCount: number; // 1,000 to 50,000
  lightCount: number;  // 1 to 6
  cpuLoadMs: number;   // 0 to 15 ms
  isActive?: boolean;
}

export const InstancedStressScene: React.FC<Props> = ({
  objectCount,
  lightCount,
  cpuLoadMs,
  isActive = true
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const stateRef = useRef({
    objectCount,
    lightCount,
    cpuLoadMs,
    isActive
  });

  useEffect(() => {
    stateRef.current.objectCount = objectCount;
    stateRef.current.lightCount = lightCount;
    stateRef.current.cpuLoadMs = cpuLoadMs;
    stateRef.current.isActive = isActive;
  }, [objectCount, lightCount, cpuLoadMs, isActive]);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    let width = container.clientWidth;
    let height = container.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf8fafc);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0, 7.5);

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Studio Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    const mainKey = new THREE.DirectionalLight(0xffffff, 2.4);
    mainKey.position.set(5, 6, 5);
    scene.add(mainKey);

    const dynamicLights: THREE.PointLight[] = [];
    const colors = [0x2563eb, 0x10b981, 0xf59e0b, 0x8b5cf6, 0x06b6d4, 0xf43f5e];
    for (let i = 0; i < 6; i++) {
      const pl = new THREE.PointLight(colors[i], 2.2, 12);
      scene.add(pl);
      dynamicLights.push(pl);
    }

    // 1. Central Core: Floating Silicon GPU Die Crystal
    const coreGroup = new THREE.Group();
    scene.add(coreGroup);

    const coreGeo = new THREE.OctahedronGeometry(1.2, 0);
    const coreMat = new THREE.MeshPhysicalMaterial({
      color: 0x1e293b,
      metalness: 0.9,
      roughness: 0.15,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
      reflectivity: 0.95,
      flatShading: true
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    coreGroup.add(coreMesh);

    // Core Wireframe Laser Cage
    const coreWireGeo = new THREE.WireframeGeometry(coreGeo);
    const coreWireMat = new THREE.LineBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.7 });
    const coreWire = new THREE.LineSegments(coreWireGeo, coreWireMat);
    coreGroup.add(coreWire);

    // 2. High-Performance GPU Stress: InstancedMesh with 3D Solid Geometry
    const MAX_INSTANCES = 50000;
    const shardGeo = new THREE.TetrahedronGeometry(0.09, 0);
    const shardMat = new THREE.MeshStandardMaterial({
      color: 0x3b82f6,
      metalness: 0.85,
      roughness: 0.2,
      flatShading: true
    });

    const instancedMesh = new THREE.InstancedMesh(shardGeo, shardMat, MAX_INSTANCES);
    scene.add(instancedMesh);

    // Initialize 50,000 3D solid bodies in orbital shell
    const dummy = new THREE.Object3D();
    for (let i = 0; i < MAX_INSTANCES; i++) {
      const radius = 1.8 + Math.sqrt(i / MAX_INSTANCES) * 3.8;
      const phi = Math.acos(-1 + (2 * i) / MAX_INSTANCES);
      const theta = Math.sqrt(MAX_INSTANCES * Math.PI) * phi;

      dummy.position.set(
        radius * Math.cos(theta) * Math.sin(phi),
        (radius * Math.sin(theta) * Math.sin(phi)) * 0.7,
        radius * Math.cos(phi)
      );
      dummy.rotation.set(i * 0.3, i * 0.5, i * 0.7);
      dummy.scale.setScalar(0.7 + (i % 5) * 0.2);
      dummy.updateMatrix();
      instancedMesh.setMatrixAt(i, dummy.matrix);
    }
    instancedMesh.instanceMatrix.needsUpdate = true;
    instancedMesh.count = Math.min(stateRef.current.objectCount, MAX_INSTANCES);

    const handleResize = () => {
      if (!container) return;
      width = container.clientWidth;
      height = container.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    window.addEventListener('resize', handleResize);

    let animId: number;
    let clock = new THREE.Clock();

    const loop = () => {
      const state = stateRef.current;
      if (!state.isActive) {
        animId = requestAnimationFrame(loop);
        return;
      }

      const elapsed = clock.getElapsedTime();

      // Artificial CPU Loop Stutter
      if (state.cpuLoadMs > 0) {
        const start = performance.now();
        while (performance.now() - start < state.cpuLoadMs) {
          // busy wait simulating physics/AI loop
        }
      }

      // Rotate central core
      coreGroup.rotation.x = elapsed * 0.4;
      coreGroup.rotation.y = elapsed * 0.6;

      // Update dynamic RGB lights
      for (let i = 0; i < 6; i++) {
        const pl = dynamicLights[i];
        if (i < state.lightCount) {
          pl.visible = true;
          const a = elapsed * 1.2 + (i / 6) * Math.PI * 2;
          pl.position.set(Math.cos(a) * 4.2, Math.sin(a * 1.5) * 2.2, Math.sin(a) * 4.2);
        } else {
          pl.visible = false;
        }
      }

      // Update InstancedMesh geometry count and GPU rotation
      instancedMesh.count = Math.min(state.objectCount, MAX_INSTANCES);
      instancedMesh.rotation.y = elapsed * 0.35;
      instancedMesh.rotation.x = Math.sin(elapsed * 0.25) * 0.15;
      instancedMesh.rotation.z = Math.cos(elapsed * 0.2) * 0.1;

      renderer.render(scene, camera);
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      coreGeo.dispose();
      coreMat.dispose();
      coreWireGeo.dispose();
      coreWireMat.dispose();
      shardGeo.dispose();
      shardMat.dispose();
    };
  }, []);

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-[320px] sm:h-[380px] rounded-2xl overflow-hidden border border-slate-200 bg-slate-50/80 shadow-inner select-none"
    >
      <canvas ref={canvasRef} className="w-full h-full block" />
      <div className="absolute bottom-2.5 left-3 glass-pill px-3 py-1 rounded-full text-[11px] font-mono text-slate-600 border border-slate-200/90 shadow-sm flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
        <span>Массив 3D объектов: <strong className="text-blue-700">{objectCount.toLocaleString()} тел</strong></span>
        <span>•</span>
        <span>Свет: <strong>{lightCount} ламп</strong></span>
      </div>
    </div>
  );
};
