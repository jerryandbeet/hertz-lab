import React, { useState, useEffect, useRef } from 'react';
import { Eye, Flame, Sparkles, Pause, Play, SplitSquareHorizontal, Layers, CheckCircle2 } from 'lucide-react';
import { audio } from '../../services/audioService';
import { useStationVisibility } from '../../hooks/useStationVisibility';

interface Props {
  isActive?: boolean;
  calibratedHz?: number | null;
}

// Pre-render cached sprite buffers once so the 60fps render loop never stalls on filter allocations
function renderShuttleSprites(calibratedHz: number, blurIntensity: number) {
  const spriteW = 220;
  const spriteH = 110;
  const cx = 95;
  const cy = 55;

  const drawShuttleGeometry = (ctx: CanvasRenderingContext2D, x: number, y: number, isSharp: boolean) => {
    // --- Rocket Exhaust Plume (Left of tail) ---
    const plumeColor = isSharp ? 'rgba(16, 185, 129, 0.85)' : 'rgba(59, 130, 246, 0.85)';
    const plumeLength = 32;

    ctx.fillStyle = plumeColor;
    ctx.beginPath();
    ctx.moveTo(x - 52, y - 8);
    ctx.lineTo(x - 52 - plumeLength, y - 8);
    ctx.lineTo(x - 52, y - 4);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = isSharp ? '#34d399' : '#93c5fd';
    ctx.beginPath();
    ctx.moveTo(x - 52, y - 3);
    ctx.lineTo(x - 52 - plumeLength * 1.3, y);
    ctx.lineTo(x - 52, y + 3);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = plumeColor;
    ctx.beginPath();
    ctx.moveTo(x - 52, y + 4);
    ctx.lineTo(x - 52 - plumeLength, y + 8);
    ctx.lineTo(x - 52, y + 8);
    ctx.closePath();
    ctx.fill();

    // --- Delta Wings ---
    ctx.fillStyle = isSharp ? '#047857' : '#1e3a8a';
    ctx.beginPath();
    ctx.moveTo(x - 20, y - 10);
    ctx.lineTo(x - 48, y - 36);
    ctx.lineTo(x - 44, y - 38);
    ctx.lineTo(x + 10, y - 12);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(x - 20, y + 10);
    ctx.lineTo(x - 48, y + 36);
    ctx.lineTo(x - 44, y + 38);
    ctx.lineTo(x + 10, y + 12);
    ctx.closePath();
    ctx.fill();

    // Black thermal tiles
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.moveTo(x + 10, y - 12);
    ctx.lineTo(x - 44, y - 38);
    ctx.lineTo(x - 40, y - 36);
    ctx.lineTo(x + 6, y - 10);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(x + 10, y + 12);
    ctx.lineTo(x - 44, y + 38);
    ctx.lineTo(x - 40, y + 36);
    ctx.lineTo(x + 6, y + 10);
    ctx.closePath();
    ctx.fill();

    // Navigation lights
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(x - 46, y - 37, 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.arc(x - 46, y + 37, 2, 0, Math.PI * 2);
    ctx.fill();

    // Main Fuselage
    ctx.fillStyle = isSharp ? '#f8fafc' : '#f1f5f9';
    ctx.beginPath();
    ctx.moveTo(x + 55, y);
    ctx.bezierCurveTo(x + 40, y - 11, x + 15, y - 14, x - 50, y - 14);
    ctx.lineTo(x - 52, y + 14);
    ctx.bezierCurveTo(x + 15, y + 14, x + 40, y + 11, x + 55, y);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = isSharp ? '#059669' : '#2563eb';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Nose cap
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.moveTo(x + 55, y);
    ctx.bezierCurveTo(x + 48, y - 5, x + 44, y - 7, x + 40, y - 7);
    ctx.lineTo(x + 40, y + 7);
    ctx.bezierCurveTo(x + 44, y + 7, x + 48, y + 5, x + 55, y);
    ctx.closePath();
    ctx.fill();

    // Cockpit
    ctx.fillStyle = isSharp ? '#6ee7b7' : '#38bdf8';
    ctx.beginPath();
    ctx.moveTo(x + 36, y - 2);
    ctx.lineTo(x + 30, y - 6);
    ctx.lineTo(x + 28, y - 2);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x + 36, y + 2);
    ctx.lineTo(x + 30, y + 6);
    ctx.lineTo(x + 28, y + 2);
    ctx.closePath();
    ctx.fill();

    // Engine nozzles
    ctx.fillStyle = '#334155';
    ctx.fillRect(x - 55, y - 10, 5, 5);
    ctx.fillRect(x - 56, y - 3, 6, 6);
    ctx.fillRect(x - 55, y + 5, 5, 5);

    // High contrast text
    ctx.fillStyle = isSharp ? '#064e3b' : '#1e3a8a';
    ctx.font = 'bold 9.5px ui-monospace, SFMono-Regular, monospace';
    ctx.textAlign = 'center';
    ctx.fillText(isSharp ? 'HERTZ • 100% SHARP' : 'HERTZ • BLURRED', x - 5, y + 3);

    // High frequency micro-bars (optical resolution target)
    const barY = y - 9;
    for (let b = -8; b <= 8; b++) {
      ctx.fillStyle = b % 2 === 0 ? (isSharp ? '#022c22' : '#0f172a') : '#ffffff';
      ctx.fillRect(x + b * 4, barY, 2.5, 3.5);
    }
  };

  // Green Sharp Shuttle Canvas (BFI Strobe Mode)
  const green = document.createElement('canvas');
  green.width = spriteW;
  green.height = spriteH;
  const gCtx = green.getContext('2d');
  if (gCtx) {
    drawShuttleGeometry(gCtx, cx, cy, true);
  }

  // Blue Shuttle Canvas (Sample-and-Hold Mode)
  const blue = document.createElement('canvas');
  blue.width = spriteW;
  blue.height = spriteH;
  const bCtx = blue.getContext('2d');
  if (bCtx) {
    drawShuttleGeometry(bCtx, cx, cy, false);
  }

  return { green, blue, cx, cy };
}

export const Station2MotionBlur: React.FC<Props> = ({ isActive = true, calibratedHz }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { isPaused: isOffscreenPaused } = useStationVisibility(containerRef);
  const isEffectivelyActive = isActive && !isOffscreenPaused;

  const animIdRef = useRef<number | null>(null);
  const renderRef = useRef<((now: number) => void) | null>(null);
  const spritesRef = useRef<ReturnType<typeof renderShuttleSprites> | null>(null);

  const [speed, setSpeed] = useState<number>(750); // pixels per sec
  const [viewMode, setViewMode] = useState<'split' | 'sample-and-hold' | 'bfi' | 'camera-blur'>('split');
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [blurIntensity, setBlurIntensity] = useState<number>(1.2);

  const stateRef = useRef({
    speed,
    viewMode,
    isPaused,
    blurIntensity,
    isActive: isEffectivelyActive,
    calibratedHz: calibratedHz || 60,
    xPos: 0,
    lastTime: 0
  });

  // Re-generate sprite buffer only when calibration or intensity slider changes
  useEffect(() => {
    spritesRef.current = renderShuttleSprites(calibratedHz || 60, blurIntensity);
  }, [calibratedHz, blurIntensity]);

  useEffect(() => {
    stateRef.current.speed = speed;
    stateRef.current.viewMode = viewMode;
    stateRef.current.isPaused = isPaused;
    stateRef.current.blurIntensity = blurIntensity;
    stateRef.current.isActive = isEffectivelyActive;
    stateRef.current.calibratedHz = calibratedHz || 60;
  }, [speed, viewMode, isPaused, blurIntensity, isEffectivelyActive, calibratedHz]);

  // Resume or stop animation loop strictly based on visibility
  useEffect(() => {
    if (isEffectivelyActive) {
      stateRef.current.lastTime = 0;
      if (renderRef.current && animIdRef.current === null) {
        animIdRef.current = requestAnimationFrame(renderRef.current);
      }
    } else {
      if (animIdRef.current !== null) {
        cancelAnimationFrame(animIdRef.current);
        animIdRef.current = null;
      }
    }
  }, [isEffectivelyActive]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = (now: number) => {
      const state = stateRef.current;
      if (state.lastTime === 0) {
        state.lastTime = now;
      }
      const dt = Math.min((now - state.lastTime) / 1000, 0.1);
      state.lastTime = now;

      const w = canvas.width;
      const h = canvas.height;

      if (!state.isPaused) {
        state.xPos = (state.xPos + state.speed * dt) % (w + 240);
      }

      const currentX = state.xPos - 120;

      // Background
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(0, 0, w, h);

      // Tech Grid Lines
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1;
      for (let x = 0; x < w; x += 60) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }

      // Draw horizontal lane dividers
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, h / 2);
      ctx.lineTo(w, h / 2);
      ctx.stroke();

      // Fast GPU Texture Blit using pre-rendered sprites
      if (!spritesRef.current) {
        spritesRef.current = renderShuttleSprites(state.calibratedHz, state.blurIntensity);
      }
      const sprites = spritesRef.current;

      const topY = h * 0.25;
      const bottomY = h * 0.75;

      const smearDist = (state.speed / 60) * 1.8 * state.blurIntensity;
      const spread = Math.min(60, smearDist * 0.85);

      if (state.viewMode === 'split') {
        // --- TOP LANE: Sample-and-Hold Blur (Physical directional horizontal accumulation) ---
        const smearSteps = 12;
        for (let i = smearSteps; i >= 1; i--) {
          const smearX = currentX - (i * smearDist) / smearSteps;
          const ghostAlpha = 0.08 * (1 - i / smearSteps);
          ctx.globalAlpha = ghostAlpha;
          ctx.drawImage(sprites.blue, smearX - sprites.cx, topY - sprites.cy);
        }
        ctx.globalAlpha = 0.88;
        ctx.drawImage(sprites.blue, currentX - sprites.cx, topY - sprites.cy);

        // --- BOTTOM LANE: BFI / Strobed Backlight (Zero horizontal smear, 100% sharp single pulse) ---
        ctx.globalAlpha = 1.0;
        ctx.drawImage(sprites.green, currentX - sprites.cx, bottomY - sprites.cy);

      } else if (state.viewMode === 'sample-and-hold') {
        // Full screen Sample-and-Hold
        const smearSteps = 12;
        for (let i = smearSteps; i >= 1; i--) {
          const smearX = currentX - (i * smearDist) / smearSteps;
          const ghostAlpha = 0.08 * (1 - i / smearSteps);
          ctx.globalAlpha = ghostAlpha;
          ctx.drawImage(sprites.blue, smearX - sprites.cx, h * 0.5 - sprites.cy);
        }
        ctx.globalAlpha = 0.88;
        ctx.drawImage(sprites.blue, currentX - sprites.cx, h * 0.5 - sprites.cy);

      } else if (state.viewMode === 'bfi') {
        // Full screen BFI Strobe (100% sharp single pulse)
        ctx.globalAlpha = 1.0;
        ctx.drawImage(sprites.green, currentX - sprites.cx, h * 0.5 - sprites.cy);

      } else if (state.viewMode === 'camera-blur') {
        // Camera Optical Shutter Blur (Linear motion integration across exposure time)
        const steps = 14;
        for (let i = 0; i < steps; i++) {
          const trailX = currentX - (i / steps) * smearDist * 1.3;
          ctx.globalAlpha = 1.0 / steps;
          ctx.drawImage(sprites.blue, trailX - sprites.cx, h * 0.5 - sprites.cy);
        }
      }
      ctx.globalAlpha = 1.0;

      animIdRef.current = requestAnimationFrame(render);
    };

    renderRef.current = render;
    if (isEffectivelyActive && animIdRef.current === null) {
      animIdRef.current = requestAnimationFrame(render);
    }

    return () => {
      if (animIdRef.current !== null) {
        cancelAnimationFrame(animIdRef.current);
        animIdRef.current = null;
      }
      renderRef.current = null;
    };
  }, []);

  return (
    <div ref={containerRef} className="space-y-6">
      {/* Simulation Screen */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-200/90 relative overflow-hidden shadow-inner bg-slate-900/5">
        <canvas
          ref={canvasRef}
          width={900}
          height={320}
          className="w-full h-[280px] sm:h-[320px] rounded-xl block border border-slate-200 bg-white"
        />

        {/* Live overlay badges (Desktop) */}
        <div className="hidden sm:flex absolute top-6 left-6 flex-wrap items-center gap-2 pointer-events-none">
          <span className="glass-pill px-3 py-1 rounded-lg text-xs font-mono font-semibold text-slate-800 shadow-sm border border-slate-200">
            Режим: <strong className="text-blue-600 uppercase">{viewMode}</strong>
          </span>
          <span className="glass-pill px-3 py-1 rounded-lg text-xs font-mono text-slate-600 shadow-sm border border-slate-200">
            Скорость: <strong>{speed} px/s</strong>
          </span>
        </div>

        {/* Lane labels for Split mode */}
        {viewMode === 'split' && (
          <>
            <div className="absolute top-3 left-3 sm:top-6 sm:left-auto sm:right-6 glass-pill px-2.5 py-1 rounded-lg text-[10px] sm:text-xs font-mono font-bold text-blue-700 border border-blue-200 bg-blue-50/95 shadow-sm pointer-events-none">
              <span className="sm:hidden">ВЕРХ: Sample-and-Hold</span>
              <span className="hidden sm:inline">ВЕРХ: Sample-and-Hold (Размытие сетчатки)</span>
            </div>
            <div className="absolute bottom-3 left-3 sm:bottom-6 sm:left-auto sm:right-6 glass-pill px-2.5 py-1 rounded-lg text-[10px] sm:text-xs font-mono font-bold text-emerald-700 border border-emerald-200 bg-emerald-50/95 shadow-sm pointer-events-none">
              <span className="sm:hidden">НИЗ: BFI Строб (Четко)</span>
              <span className="hidden sm:inline">НИЗ: BFI / Стробирование (100% Четкость)</span>
            </div>
          </>
        )}

        {/* Play/Pause Button */}
        <div className="absolute top-3 right-3 sm:top-6 sm:right-auto sm:left-1/2 sm:-translate-x-1/2">
          <button
            onClick={() => {
              setIsPaused(!isPaused);
              audio.playSoftClick(isPaused ? 600 : 400, 0.03);
            }}
            className="tap-spring px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-xl bg-white/95 hover:bg-slate-50 text-slate-800 text-[11px] sm:text-xs font-mono font-bold border border-slate-300 shadow-sm flex items-center gap-1.5 sm:gap-2"
          >
            {isPaused ? <Play className="w-3.5 h-3.5 text-emerald-600 fill-emerald-600" /> : <Pause className="w-3.5 h-3.5 text-slate-600" />}
            <span>{isPaused ? 'Пуск' : 'Стоп-кадр'}</span>
          </button>
        </div>
      </div>

      {/* Interactive Controls Bar */}
      <div className="glass-panel p-3.5 sm:p-5 rounded-2xl space-y-5">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-slate-800">
            <Layers className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-bold uppercase tracking-wider">Режим отображения размытия:</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {[
              { id: 'split', title: 'Бок о бок (Side-by-Side)', desc: 'Верх: Размытие LCD vs Низ: Четкий BFI', icon: SplitSquareHorizontal },
              { id: 'sample-and-hold', title: 'Sample-and-Hold', desc: 'Удержание кадра на сетчатке глаза', icon: Eye },
              { id: 'bfi', title: 'BFI Стробирование', desc: 'Импульсная подсветка (нулевой смаз)', icon: Sparkles },
              { id: 'camera-blur', title: 'Оптический затвор', desc: 'Смаз камеры (Shutter Angle)', icon: Flame }
            ].map((btn) => {
              const isSelected = viewMode === btn.id;
              const Icon = btn.icon;
              return (
                <button
                  key={btn.id}
                  onClick={() => {
                    setViewMode(btn.id as any);
                    audio.playSwitchTone(true);
                  }}
                  className={`tap-spring p-3 rounded-xl border text-left transition-all ${
                    isSelected
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                      : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Icon className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-blue-600'}`} />
                    <span className="text-xs font-bold">{btn.title}</span>
                  </div>
                  <p className={`text-[11px] leading-snug ${isSelected ? 'text-blue-100' : 'text-slate-500'}`}>
                    {btn.desc}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Sliders Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-3 border-t border-slate-100">
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-medium text-slate-700">
              <span>Скорость движения объектов:</span>
              <span className="font-mono text-blue-600 font-bold">{speed} px/s</span>
            </div>
            <input
              type="range"
              min="300"
              max="1500"
              step="50"
              value={speed}
              onChange={(e) => {
                const val = Number(e.target.value);
                setSpeed(val);
                audio.playSliderTick((val - 300) / 1200);
              }}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs font-medium text-slate-700">
              <span>Интенсивность симуляции смаза сетчатки:</span>
              <span className="font-mono text-blue-600 font-bold">{(blurIntensity * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="2.5"
              step="0.1"
              value={blurIntensity}
              onChange={(e) => {
                const val = Number(e.target.value);
                setBlurIntensity(val);
                audio.playSliderTick((val - 0.5) / 2.0);
              }}
              className="w-full"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
