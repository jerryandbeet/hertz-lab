import React, { useState, useEffect, useRef } from 'react';
import { Eye, ShieldAlert, CheckCircle2, Zap, ArrowRight } from 'lucide-react';
import { audio } from '../../services/audioService';
import { useStationVisibility } from '../../hooks/useStationVisibility';

interface Props {
  isActive?: boolean;
}

export const Station3ScreenTearing: React.FC<Props> = ({ isActive = true }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { isPaused } = useStationVisibility(containerRef);

  const [syncMode, setSyncMode] = useState<'no-sync' | 'vsync' | 'vrr'>('no-sync');
  const [gpuFrametime, setGpuFrametime] = useState<number>(11.5); // ms
  const [panSpeed, setPanSpeed] = useState<number>(700); // px/sec

  const stateRef = useRef({
    syncMode,
    gpuFrametime,
    panSpeed,
    isActive: isActive && !isPaused,
    panX: 0,
    scanY: 0,
    tearY: 140,
    lastTime: 0
  });

  useEffect(() => {
    stateRef.current.syncMode = syncMode;
    stateRef.current.gpuFrametime = gpuFrametime;
    stateRef.current.panSpeed = panSpeed;
    stateRef.current.isActive = isActive && !isPaused;
  }, [syncMode, gpuFrametime, panSpeed, isActive, isPaused]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const render = (now: number) => {
      const state = stateRef.current;
      if (!state.isActive) {
        animId = requestAnimationFrame(render);
        return;
      }

      if (state.lastTime === 0) state.lastTime = now;
      const dt = Math.min((now - state.lastTime) / 1000, 0.05);
      state.lastTime = now;

      const w = canvas.width;
      const h = canvas.height;

      // Pan motion calculation
      state.panX = (state.panX + state.panSpeed * dt) % 1200;

      // Monitor raster scanline simulation (60Hz = 16.67ms per full sweep)
      const scanPeriod = 16.67;
      state.scanY = ((now % scanPeriod) / scanPeriod) * h;

      // If No-Sync is active, buffer flips asynchronously mid-frame
      if (state.syncMode === 'no-sync') {
        const flipInterval = state.gpuFrametime;
        const flipPhase = (now % flipInterval) / flipInterval;
        state.tearY = flipPhase * h;
      }

      // Background
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(0, 0, w, h);

      // Tech Grid
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1;
      for (let x = 0; x < w; x += 50) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }

      // World Geometry: Vertical high-contrast pillars
      const drawWorldPillars = (clipY1: number, clipY2: number, offsetX: number) => {
        ctx.save();
        ctx.beginPath();
        ctx.rect(0, clipY1, w, clipY2 - clipY1);
        ctx.clip();

        const colWidth = 65;
        const colGap = 135;
        const totalW = colWidth + colGap;
        const span = w + 400;

        for (let x = -200; x < w + 200; x += totalW) {
          const val = x - offsetX;
          const drawX = (((val % span) + span) % span) - 100;

          // Shadow
          ctx.fillStyle = 'rgba(15, 23, 42, 0.04)';
          ctx.fillRect(drawX + 8, 30, colWidth, h - 50);

          // Column gradient
          const grad = ctx.createLinearGradient(drawX, 0, drawX + colWidth, 0);
          grad.addColorStop(0, '#3b82f6');
          grad.addColorStop(0.5, '#2563eb');
          grad.addColorStop(1, '#1d4ed8');
          ctx.fillStyle = grad;
          ctx.fillRect(drawX, 30, colWidth, h - 50);

          // Horizontal reference bars
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(drawX + 6, 65, colWidth - 12, 12);
          ctx.fillRect(drawX + 6, 125, colWidth - 12, 12);
          ctx.fillRect(drawX + 6, 185, colWidth - 12, 12);

          // Pillar label
          ctx.fillStyle = '#bfdbfe';
          ctx.font = 'bold 9px ui-monospace, SFMono-Regular, monospace';
          ctx.fillText(`COL-${Math.abs(Math.floor((x + offsetX) / 100))}`, drawX + 4, 44);
        }

        ctx.restore();
      };

      if (state.syncMode === 'no-sync') {
        const tearOffset = (state.panSpeed * (state.gpuFrametime / 1000)) * 1.5;
        drawWorldPillars(0, state.tearY, state.panX);
        drawWorldPillars(state.tearY, h, state.panX + tearOffset);

        // Visible tear line
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 4]);
        ctx.beginPath();
        ctx.moveTo(0, state.tearY);
        ctx.lineTo(w, state.tearY);
        ctx.stroke();
        ctx.setLineDash([]);

        // Tearing badge with clean legible backdrop
        const tearText = '▲ РАЗРЫВ КАДРА (BUFFER FLIP MID-SCAN)';
        ctx.font = 'bold 10px ui-monospace, SFMono-Regular, monospace';
        const tw = ctx.measureText(tearText).width;
        const badgeY = Math.max(20, Math.min(h - 20, state.tearY - 6));

        ctx.fillStyle = 'rgba(254, 242, 242, 0.95)';
        ctx.fillRect(10, badgeY - 11, tw + 14, 17);
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
        ctx.lineWidth = 1;
        ctx.strokeRect(10, badgeY - 11, tw + 14, 17);

        ctx.fillStyle = '#b91c1c';
        ctx.fillText(tearText, 17, badgeY + 1);

      } else if (state.syncMode === 'vsync') {
        const isStuttering = state.gpuFrametime > 16.67;
        const effectivePan = isStuttering ? Math.floor(state.panX / 30) * 30 : state.panX;
        drawWorldPillars(0, h, effectivePan);
      } else if (state.syncMode === 'vrr') {
        drawWorldPillars(0, h, state.panX);
      }

      // Raster laser scanline
      ctx.strokeStyle = 'rgba(59, 130, 246, 0.35)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, state.scanY);
      ctx.lineTo(w, state.scanY);
      ctx.stroke();

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <div ref={containerRef} className="space-y-4">
      {/* Simulation Screen Header - Badges outside Canvas to prevent overlap */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="glass-pill px-3 py-1 rounded-lg text-xs font-mono font-bold text-slate-800 shadow-sm border border-slate-200">
            Синхронизация: <strong className={syncMode === 'no-sync' ? 'text-rose-600' : syncMode === 'vrr' ? 'text-emerald-600' : 'text-blue-600'}>
              {syncMode === 'no-sync' ? 'NO V-SYNC (TEARING)' : syncMode === 'vrr' ? 'VRR (G-SYNC/FREESYNC)' : 'V-SYNC ON'}
            </strong>
          </span>
          <span className="glass-pill px-2.5 py-1 rounded-lg text-xs font-mono text-slate-600 shadow-sm border border-slate-200 hidden sm:inline-block">
            Время GPU: <strong>{gpuFrametime} мс</strong> ({Math.round(1000 / gpuFrametime)} FPS)
          </span>
        </div>

        {syncMode === 'vsync' && gpuFrametime > 16.67 && (
          <span className="glass-pill px-3 py-1 rounded-lg text-xs font-mono font-bold text-amber-700 bg-amber-50/95 border border-amber-300 shadow-sm flex items-center gap-1.5 animate-pulse">
            <span>⚠ Пропуск V-Blank: Статтер и задержка ввода +33мс</span>
          </span>
        )}
      </div>

      {/* Canvas Viewport */}
      <div className="glass-panel p-3 rounded-2xl border border-slate-200/90 relative overflow-hidden shadow-inner bg-slate-900/5">
        <canvas
          ref={canvasRef}
          width={800}
          height={280}
          className="w-full h-[250px] sm:h-[280px] rounded-xl block border border-slate-200 bg-white"
        />
      </div>

      {/* Control Module */}
      <div className="glass-panel p-5 rounded-2xl space-y-5">
        <div>
          <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-2.5">
            Режим синхронизации кадрового буфера:
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              onClick={() => {
                setSyncMode('no-sync');
                audio.playSwitchTone(false);
              }}
              className={`tap-spring p-3 rounded-xl border text-left transition-all ${
                syncMode === 'no-sync'
                  ? 'bg-rose-50 border-rose-400 text-rose-950 shadow-sm ring-1 ring-rose-400/20'
                  : 'bg-white border-slate-200/90 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <div className="text-xs font-bold flex items-center gap-1.5 text-rose-700">
                <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
                Без V-Sync (No Sync)
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Буфер отдается немедленно. При развертке экран делится на части из разных кадров (Tearing).
              </p>
            </button>

            <button
              onClick={() => {
                setSyncMode('vsync');
                audio.playSwitchTone(true);
              }}
              className={`tap-spring p-3 rounded-xl border text-left transition-all ${
                syncMode === 'vsync'
                  ? 'bg-blue-50 border-blue-400 text-blue-950 shadow-sm ring-1 ring-blue-400/20'
                  : 'bg-white border-slate-200/90 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <div className="text-xs font-bold flex items-center gap-1.5 text-blue-700">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" />
                Классический V-Sync
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Переключение кадра строго в момент V-Blank. Нет разрывов, но при падении FPS возникает статтер.
              </p>
            </button>

            <button
              onClick={() => {
                setSyncMode('vrr');
                audio.playSwitchTone(true);
              }}
              className={`tap-spring p-3 rounded-xl border text-left transition-all ${
                syncMode === 'vrr'
                  ? 'bg-emerald-50 border-emerald-400 text-emerald-950 shadow-sm ring-1 ring-emerald-400/20'
                  : 'bg-white border-slate-200/90 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <div className="text-xs font-bold flex items-center gap-1.5 text-emerald-700">
                <Zap className="w-3.5 h-3.5 text-emerald-500" />
                VRR (G-Sync / FreeSync)
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Монитор динамически подстраивает герцовку под время готовности кадра GPU. Идеальная плавность.
              </p>
            </button>
          </div>
        </div>

        {/* Sliders Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-3 border-t border-slate-100">
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-medium text-slate-700">
              <span>Время генерации кадра GPU (Фреймтайм):</span>
              <span className="font-mono text-blue-600 font-bold">{gpuFrametime} мс ({Math.round(1000 / gpuFrametime)} FPS)</span>
            </div>
            <input
              type="range"
              min="5"
              max="28"
              step="0.5"
              value={gpuFrametime}
              onChange={(e) => {
                const val = Number(e.target.value);
                setGpuFrametime(val);
                audio.playSliderTick(val / 28);
              }}
              className="w-full"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>5мс (200 FPS)</span>
              <span className="text-blue-500 font-bold">16.6мс (60 FPS V-Blank)</span>
              <span>28мс (35 FPS)</span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs font-medium text-slate-700">
              <span>Скорость движения камеры:</span>
              <span className="font-mono text-blue-600 font-bold">{panSpeed} px/с</span>
            </div>
            <input
              type="range"
              min="200"
              max="1500"
              step="50"
              value={panSpeed}
              onChange={(e) => {
                const val = Number(e.target.value);
                setPanSpeed(val);
                audio.playSliderTick(val / 1500);
              }}
              className="w-full"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>200 px/с (Медленно)</span>
              <span>1500 px/с (Резкий стрейф)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
