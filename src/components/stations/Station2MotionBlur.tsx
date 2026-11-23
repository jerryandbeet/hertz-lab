import React, { useState, useEffect, useRef } from 'react';
import { Eye, Flame, Sparkles, Pause, Play, SplitSquareHorizontal, Layers, CheckCircle2 } from 'lucide-react';
import { audio } from '../../services/audioService';
import { useStationVisibility } from '../../hooks/useStationVisibility';

interface Props {
  isActive?: boolean;
  calibratedHz?: number | null;
}

export const Station2MotionBlur: React.FC<Props> = ({ isActive = true, calibratedHz }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { isPaused: isOffscreenPaused } = useStationVisibility(containerRef);
  const isEffectivelyActive = isActive && !isOffscreenPaused;

  const animIdRef = useRef<number | null>(null);
  const renderRef = useRef<((now: number) => void) | null>(null);

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

      // Target Renderer Function
      const drawObject = (
        x: number, 
        y: number, 
        alpha: number, 
        isSharp: boolean, 
        blurPx: number = 0
      ) => {
        ctx.save();
        ctx.globalAlpha = alpha;

        // If simulated blur is active, apply horizontal shadow/blur
        if (!isSharp && blurPx > 0) {
          ctx.shadowColor = 'rgba(37, 99, 235, 0.45)';
          ctx.shadowBlur = blurPx;
        }

        // Space Shuttle / UFO Body
        ctx.fillStyle = isSharp ? '#059669' : '#2563eb';
        ctx.beginPath();
        ctx.ellipse(x, y - 6, 40, 14, 0, 0, Math.PI * 2);
        ctx.fill();

        // Cockpit Glass
        ctx.fillStyle = isSharp ? '#a7f3d0' : '#bae6fd';
        ctx.beginPath();
        ctx.ellipse(x, y - 12, 20, 10, 0, Math.PI, 0);
        ctx.fill();

        // High frequency lights
        for (let i = -3; i <= 3; i++) {
          ctx.fillStyle = i % 2 === 0 ? '#fef08a' : '#f59e0b';
          ctx.beginPath();
          ctx.arc(x + i * 11, y - 4, 2.5, 0, Math.PI * 2);
          ctx.fill();
        }

        // Test Text: Dynamic Hardware Hz
        ctx.fillStyle = isSharp ? '#064e3b' : '#0f172a';
        ctx.font = 'bold 13px ui-monospace, SFMono-Regular, monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`HERTZ ${state.calibratedHz}Hz LAB`, x, y + 24);

        // Subtext
        ctx.font = '10px ui-monospace, SFMono-Regular, monospace';
        ctx.fillStyle = isSharp ? '#047857' : '#475569';
        ctx.fillText(isSharp ? 'ЧЕТКИЙ СТРОБ • BFI ON' : 'СМАЗ СЕТЧАТКИ • SAMPLE-AND-HOLD', x, y + 38);

        // High frequency vertical bars
        const barY = y + 46;
        for (let b = -12; b <= 12; b++) {
          ctx.fillStyle = (b + 12) % 2 === 0 ? (isSharp ? '#065f46' : '#1e293b') : '#e2e8f0';
          ctx.fillRect(x + b * 4, barY, 3, 8);
        }

        ctx.restore();
      };

      const topY = h * 0.25;
      const bottomY = h * 0.75;

      const smearDist = (state.speed / 60) * 1.8 * state.blurIntensity;

      if (state.viewMode === 'split') {
        // --- TOP LANE: Sample-and-Hold Blur (Eye tracking retinal smear simulation) ---
        const steps = 14;
        for (let i = steps; i >= 1; i--) {
          const smearX = currentX - (i * smearDist) / steps;
          const ghostAlpha = 0.08 * (1 - i / steps);
          drawObject(smearX, topY, ghostAlpha, false, smearDist * 0.4);
        }
        drawObject(currentX, topY, 0.85, false, smearDist * 0.2);

        // --- BOTTOM LANE: BFI / Strobed Backlight (Pin-sharp readability) ---
        drawObject(currentX, bottomY, 1.0, true, 0);

      } else if (state.viewMode === 'sample-and-hold') {
        // Full screen Sample-and-Hold
        const steps = 14;
        for (let i = steps; i >= 1; i--) {
          const smearX = currentX - (i * smearDist) / steps;
          const ghostAlpha = 0.08 * (1 - i / steps);
          drawObject(smearX, h * 0.5, ghostAlpha, false, smearDist * 0.4);
        }
        drawObject(currentX, h * 0.5, 0.85, false, smearDist * 0.2);

      } else if (state.viewMode === 'bfi') {
        // Full screen BFI Strobe (100% sharp)
        drawObject(currentX, h * 0.5, 1.0, true, 0);

      } else if (state.viewMode === 'camera-blur') {
        // Camera Optical Shutter Blur (Linear motion trail)
        const steps = 16;
        for (let i = 0; i < steps; i++) {
          const trailX = currentX - (i / steps) * smearDist * 1.5;
          drawObject(trailX, h * 0.5, 1 / steps, false, 0);
        }
      }

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
