import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

interface Props {
  shardCount: number;
  lightCount: number;
  cpuLoadMs: number;
  isActive?: boolean;
}

export const ApolloBustScene: React.FC<Props> = ({
  shardCount,
  lightCount,
  cpuLoadMs,
  isActive = true
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const stateRef = useRef({
    shardCount,
    lightCount,
    cpuLoadMs,
    isActive
  });

  useEffect(() => {
    stateRef.current.shardCount = shardCount;
    stateRef.current.lightCount = lightCount;
    stateRef.current.cpuLoadMs = cpuLoadMs;
    stateRef.current.isActive = isActive;
  }, [shardCount, lightCount, cpuLoadMs, isActive]);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    let width = container.clientWidth;
    let height = container.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf8fafc);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0.5, 6.8);

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Studio Lighting for Classical Sculpture
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.5);
    keyLight.position.set(5, 6, 5);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 1.8);
    rimLight.position.set(-5, -2, -3);
    scene.add(rimLight);

    // Dynamic RGB studio lights
    const dynamicLights: THREE.PointLight[] = [];
    const lightColors = [0x3b82f6, 0x10b981, 0x8b5cf6, 0xf59e0b, 0x06b6d4, 0xec4899];
    for (let i = 0; i < 6; i++) {
      const pl = new THREE.PointLight(lightColors[i], 1.5, 12);
      scene.add(pl);
      dynamicLights.push(pl);
    }

    // Root Group
    const rootGroup = new THREE.Group();
    scene.add(rootGroup);

    const bustGroup = new THREE.Group();
    rootGroup.add(bustGroup);

    // Marble Material
    const marbleMat = new THREE.MeshPhysicalMaterial({
      color: 0xf8fafc,
      roughness: 0.2,
      metalness: 0.05,
      clearcoat: 0.5,
      clearcoatRoughness: 0.15
    });

    // 1. Classical Apollo Bust Model
    const loader = new GLTFLoader();
    const base = import.meta.env.BASE_URL || './';
    const cleanBase = base.endsWith('/') ? base : `${base}/`;
    const modelUrl = `${cleanBase}models/head.glb`;

    loader.load(
      modelUrl,
      (gltf) => {
        const model = gltf.scene;
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 2.9 / maxDim;

        model.position.set(-center.x * scale, -center.y * scale + 0.35, -center.z * scale);
        model.scale.set(scale, scale, scale);

        model.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            mesh.material = marbleMat;

            // Subtle cyan wireframe overlay
            const wireGeo = new THREE.WireframeGeometry(mesh.geometry);
            const wireMat = new THREE.LineBasicMaterial({
              color: 0x0ea5e9,
              transparent: true,
              opacity: 0.2
            });
            const wire = new THREE.LineSegments(wireGeo, wireMat);
            mesh.add(wire);
          }
        });

        bustGroup.add(model);
      },
      undefined,
      (err) => {
        console.error('Failed to load Apollo head model, trying bust.glb:', err);
        loader.load(`${cleanBase}models/bust.glb`, (gltf2) => {
          const model2 = gltf2.scene;
          const box2 = new THREE.Box3().setFromObject(model2);
          const center2 = box2.getCenter(new THREE.Vector3());
          const size2 = box2.getSize(new THREE.Vector3());
          const maxDim2 = Math.max(size2.x, size2.y, size2.z);
          const scale2 = 2.9 / maxDim2;
          model2.position.set(-center2.x * scale2, -center2.y * scale2 + 0.35, -center2.z * scale2);
          model2.scale.set(scale2, scale2, scale2);
          model2.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
              const mesh = child as THREE.Mesh;
              mesh.material = marbleMat;
              const wireGeo = new THREE.WireframeGeometry(mesh.geometry);
              const wireMat = new THREE.LineBasicMaterial({
                color: 0x0ea5e9,
                transparent: true,
                opacity: 0.2
              });
              mesh.add(new THREE.LineSegments(wireGeo, wireMat));
            }
          });
          bustGroup.add(model2);
        });
      }
    );

    // 2. Matte Architectural Studio Pedestal (Zero glitched reflections)
    const pedestalGeo = new THREE.CylinderGeometry(1.2, 1.4, 0.7, 32);
    const pedestalMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.6,
      metalness: 0.1
    });
    const pedestal = new THREE.Mesh(pedestalGeo, pedestalMat);
    pedestal.position.y = -1.45;
    bustGroup.add(pedestal);

    // 3. Surrounding Floating Stone & Marble Shards (InstancedMesh up to 15,000 shards!)
    const MAX_SHARDS = 15000;
    const shardGeo = new THREE.TetrahedronGeometry(0.12, 0);
    const shardMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      roughness: 0.4,
      metalness: 0.1
    });

    const instancedShards = new THREE.InstancedMesh(shardGeo, shardMat, MAX_SHARDS);
    instancedShards.count = Math.min(MAX_SHARDS, Math.max(100, stateRef.current.shardCount));
    rootGroup.add(instancedShards);

    const dummy = new THREE.Object3D();
    const shardRadii: number[] = [];
    const shardSpeeds: number[] = [];
    const shardYOffs: number[] = [];

    for (let i = 0; i < MAX_SHARDS; i++) {
      // Form an elliptical cloud surrounding Apollo in 3D space
      const radius = 2.0 + Math.random() * 4.5;
      const theta = Math.random() * Math.PI * 2;
      const y = (Math.random() - 0.5) * 5.0;

      dummy.position.set(Math.cos(theta) * radius, y, Math.sin(theta) * radius);
      dummy.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
      const s = 0.5 + Math.random() * 1.5;
      dummy.scale.set(s, s, s);
      dummy.updateMatrix();

      instancedShards.setMatrixAt(i, dummy.matrix);

      shardRadii.push(radius);
      shardSpeeds.push((Math.random() - 0.5) * 0.4);
      shardYOffs.push(y);
    }
    instancedShards.instanceMatrix.needsUpdate = true;

    // Resize observer
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

    const renderLoop = () => {
      if (!stateRef.current.isActive) {
        animId = requestAnimationFrame(renderLoop);
        return;
      }

      const { shardCount: targetShards, lightCount: targetLights, cpuLoadMs: targetCpu } = stateRef.current;

      // Update shard count
      instancedShards.count = Math.min(MAX_SHARDS, Math.max(100, targetShards));

      // Simulate artificial CPU main thread starvation
      if (targetCpu > 0) {
        const start = performance.now();
        while (performance.now() - start < targetCpu) {
          // Burn CPU
        }
      }

      const elapsed = clock.getElapsedTime();

      // Rotate bust gently
      bustGroup.rotation.y = elapsed * 0.35;

      // Rotate surrounding stone shards cloud
      instancedShards.rotation.y = -elapsed * 0.15;
      instancedShards.rotation.x = Math.sin(elapsed * 0.2) * 0.1;

      // Orbit dynamic studio lights
      for (let i = 0; i < 6; i++) {
        const pl = dynamicLights[i];
        if (i < targetLights) {
          pl.visible = true;
          const angle = elapsed * 0.8 + (i / targetLights) * Math.PI * 2;
          pl.position.set(Math.cos(angle) * 3.8, Math.sin(angle * 2) * 1.5 + 0.5, Math.sin(angle) * 3.8);
        } else {
          pl.visible = false;
        }
      }

      renderer.render(scene, camera);
      animId = requestAnimationFrame(renderLoop);
    };

    animId = requestAnimationFrame(renderLoop);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      marbleMat.dispose();
      pedestalGeo.dispose();
      pedestalMat.dispose();
      shardGeo.dispose();
      shardMat.dispose();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[380px] sm:h-[440px] rounded-2xl overflow-hidden border border-slate-200/90 shadow-inner bg-slate-50 select-none"
    >
      <canvas ref={canvasRef} className="w-full h-full block" />

      {/* Real-time Scene Telemetry Overlay */}
      <div className="absolute bottom-3 left-3 right-3 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        <div className="glass-pill px-3 py-1 rounded-lg text-xs font-mono font-semibold text-slate-800 shadow-sm border border-slate-200 bg-white/90">
          3D-геометрия • Осколков камня: <strong className="text-blue-600">{shardCount.toLocaleString()}</strong>
        </div>
        <div className="glass-pill px-2.5 py-1 rounded-lg text-xs font-mono text-slate-500 shadow-sm border border-slate-200 bg-white/90">
          Свет: <strong>{lightCount} ламп</strong>
        </div>
      </div>
    </div>
  );
};
