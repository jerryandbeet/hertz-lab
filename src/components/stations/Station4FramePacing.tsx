import React, { useState, useEffect, useRef } from 'react';
import { Activity, AlertOctagon, CheckCircle2, RefreshCw } from 'lucide-react';
import { audio } from '../../services/audioService';
import { useStationVisibility } from '../../hooks/useStationVisibility';

interface Props {
  isActive?: boolean;
}

export const Station4FramePacing: React.FC<Props> = ({ isActive = true }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { isPaused } = useStationVisibility(containerRef);

  const [pacingMode, setPacingMode] = useState<'stable' | 'erratic'>('stable');
  const [injectedSpike, setInjectedSpike] = useState<boolean>(false);
  const spikeTimerRef = useRef<number | null>(null);
  const [stats, setStats] = useState({
    avgFps: 60,
    low1Percent: 58,
    low01Percent: 52,
    jitterMs: 0.3,
    pacingScore: 98
  });

  const stateRef = useRef({
    pacingMode,
    injectedSpike,
    isActive: isActive && !isPaused,
    ballX: 0,
    history: new Array(120).fill(16.67),
    lastTime: 0
  });

  useEffect(() => {
    stateRef.current.pacingMode = pacingMode;
    stateRef.current.injectedSpike = injectedSpike;
    stateRef.current.isActive = isActive && !isPaused;
  }, [pacingMode, injectedSpike, isActive, isPaused]);

  const triggerSpike = () => {
    if (injectedSpike) return;
    setInjectedSpike(true);
    audio.playGlitchSound();
    if (spikeTimerRef.current) clearTimeout(spikeTimerRef.current);
    spikeTimerRef.current = window.setTimeout(() => {
      setInjectedSpike(false);
      spikeTimerRef.current = null;
    }, 220);
  };

  useEffect(() => {
    return () => {
      if (spikeTimerRef.current) {
        clearTimeout(spikeTimerRef.current);
        spikeTimerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let statTimer = 0;

    const render = (now: number) => {
      const state = stateRef.current;
      if (!state.isActive) {
        animId = requestAnimationFrame(render);
        return;
      }

      if (state.lastTime === 0) state.lastTime = now;
      state.lastTime = now;

      const w = canvas.width;
      const h = canvas.height;
      const isFrozen = state.injectedSpike;

      let simulatedDelta: number;
      if (isFrozen) {
        simulatedDelta = 195.0; // Clear tangible 200ms freeze hitch
      } else if (state.pacingMode === 'stable') {
        simulatedDelta = 16.67 + (Math.sin(now * 0.01) * 0.3);
      } else {
        const cycle = Math.floor(now / 33) % 2;
        simulatedDelta = cycle === 0 ? 7.0 + Math.random() * 2 : 26.3 + Math.random() * 2;
      }

      state.history.push(simulatedDelta);
      if (state.history.length > 100) {
        state.history.shift();
      }

      // Smooth moving ball tracking (Freezes completely during hitch!)
      if (!isFrozen) {
        const dtSec = (state.pacingMode === 'stable' ? 16.67 : simulatedDelta) / 1000;
        state.ballX = (state.ballX + 420 * dtSec) % (w - 70);
      }

      // Periodically compute statistics
      if (now - statTimer > 120) {
        statTimer = now;
        const history = state.history;
        const avgFt = history.reduce((a, b) => a + b, 0) / history.length;
        const sorted = [...history].sort((a, b) => b - a);
        const p99 = sorted[Math.floor(sorted.length * 0.01)] || avgFt;
        const p999 = sorted[0] || avgFt;

        const avgFps = Math.round(1000 / avgFt);
        const low1 = Math.round(1000 / p99);
        const low01 = Math.round(1000 / p999);

        let totalDiff = 0;
        for (let i = 1; i < history.length; i++) {
          totalDiff += Math.abs(history[i] - history[i - 1]);
        }
        const jitter = Number((totalDiff / history.length).toFixed(1));
        const score = Math.max(10, Math.min(100, Math.round(100 - (jitter * 4.5) - (avgFt > 20 ? 30 : 0))));

        setStats({
          avgFps: Math.min(240, Math.max(1, avgFps)),
          low1Percent: isFrozen ? 5 : Math.min(avgFps, Math.max(1, low1)),
          low01Percent: isFrozen ? 5 : Math.min(avgFps, Math.max(1, low01)),
          jitterMs: isFrozen ? 14.5 : jitter,
          pacingScore: isFrozen ? 20 : score
        });
      }

      // Background
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(0, 0, w, h);

      // Graph area
      const graphBottom = h - 60;
      const graphTop = 20;
      const graphHeight = graphBottom - graphTop;
      const maxMs = 60;

      const getY = (ms: number) => {
        const clamped = Math.max(0, Math.min(maxMs, ms));
        return graphBottom - (clamped / maxMs) * graphHeight;
      };

      // 16.6ms reference line
      const line16 = getY(16.67);
      ctx.strokeStyle = '#93c5fd';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(0, line16);
      ctx.lineTo(w, line16);
      ctx.stroke();

      ctx.fillStyle = '#3b82f6';
      ctx.font = '10px ui-monospace, SFMono-Regular, monospace';
      ctx.fillText('16.6 ms (ИДЕАЛЬНЫЙ ТАКТ 60 FPS)', 10, line16 - 4);

      // 33.3ms reference line
      const line33 = getY(33.33);
      ctx.strokeStyle = '#fca5a5';
      ctx.beginPath();
      ctx.moveTo(0, line33);
      ctx.lineTo(w, line33);
      ctx.stroke();

      ctx.fillStyle = '#ef4444';
      ctx.fillText('33.3 ms (ПРОПУСК КАДРА)', 10, line33 - 4);
      ctx.setLineDash([]);

      // Draw Frametime Graph Line
      const stepX = w / (state.history.length - 1);
      ctx.beginPath();
      state.history.forEach((ms, i) => {
        const x = i * stepX;
        const y = getY(ms);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.strokeStyle = state.pacingMode === 'stable' && !isFrozen ? '#10b981' : '#f59e0b';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Highlight spikes in red
      state.history.forEach((ms, i) => {
        if (ms > 35) {
          const x = i * stepX;
          const y = getY(ms);
          ctx.fillStyle = '#ef4444';
          ctx.beginPath();
          ctx.arc(x, y, 5, 0, Math.PI * 2);
          ctx.fill();

          ctx.font = 'bold 9px ui-monospace, SFMono-Regular, monospace';
          ctx.fillText(`${ms.toFixed(0)}ms`, x - 12, y - 8);
        }
      });

      // Bottom Track: Visual Object Motion
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, h - 50, w, 50);
      ctx.strokeStyle = '#e2e8f0';
      ctx.strokeRect(0, h - 50, w, 50);

      // Moving runner badge (expanded capsule so text never clips)
      const ballDrawX = state.ballX + 35;
      const capsuleW = 66;
      const capsuleH = 24;
      const capsuleX = ballDrawX - capsuleW / 2;
      const capsuleY = h - 37;

      if (isFrozen) {
        ctx.fillStyle = 'rgba(239, 68, 68, 0.2)';
        ctx.beginPath();
        ctx.roundRect(capsuleX - 6, capsuleY - 4, capsuleW + 12, capsuleH + 8, 14);
        ctx.fill();

        ctx.fillStyle = '#ef4444';
        ctx.font = 'bold 10px ui-monospace, SFMono-Regular, monospace';
        ctx.textAlign = 'center';
        ctx.fillText('⚠ МИКРОФРИЗ (+200ms)', ballDrawX, h - 42);
      }

      ctx.fillStyle = isFrozen ? '#ef4444' : state.pacingMode === 'stable' ? '#10b981' : '#f59e0b';
      ctx.beginPath();
      ctx.roundRect(capsuleX, capsuleY, capsuleW, capsuleH, 12);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 11px ui-monospace, SFMono-Regular, monospace';
      ctx.textAlign = 'center';
      ctx.fillText(isFrozen ? 'HITCH' : '60 FPS', ballDrawX, h - 21);
      ctx.textAlign = 'start';

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <div ref={containerRef} className="space-y-4">
      {/* Simulation Screen */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-200/90 relative overflow-hidden shadow-inner bg-slate-900/5">
        <canvas
          ref={canvasRef}
          width={800}
          height={280}
          className="w-full h-[250px] sm:h-[280px] rounded-xl block border border-slate-200 bg-white"
        />

        {/* Live HUD Badges */}
        <div className="absolute top-6 left-6 flex flex-wrap gap-2 pointer-events-none">
          <span className="glass-pill px-3 py-1 rounded-lg text-xs font-mono font-bold text-slate-800 shadow-sm border border-slate-200">
            Каденция: <strong className={pacingMode === 'stable' ? 'text-emerald-600' : 'text-amber-600'}>
              {pacingMode === 'stable' ? 'ИДЕАЛЬНЫЙ ТАКТ (16.6ms)' : 'НЕРАВНОМЕРНЫЙ (ERRATIC)'}
            </strong>
          </span>
        </div>

        {/* Inject Spike Action Button */}
        <div className="absolute top-6 right-6">
          <button
            onClick={triggerSpike}
            disabled={injectedSpike}
            className={`tap-spring px-3.5 py-1.5 rounded-xl text-xs font-bold border shadow-sm flex items-center gap-1.5 transition-all ${
              injectedSpike
                ? 'bg-rose-500 text-white border-rose-600 animate-pulse'
                : 'bg-white hover:bg-rose-50 text-rose-600 border-rose-200'
            }`}
          >
            <AlertOctagon className="w-3.5 h-3.5" />
            Инжектировать микрофриз (+200ms)
          </button>
        </div>
      </div>

      {/* Metrics Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="glass-panel p-3 rounded-xl border border-slate-200 text-center">
          <div className="text-[10px] text-slate-400 font-mono uppercase">Средний FPS</div>
          <div className="text-xl font-mono font-extrabold text-blue-600 mt-0.5">{stats.avgFps}</div>
        </div>

        <div className="glass-panel p-3 rounded-xl border border-slate-200 text-center">
          <div className="text-[10px] text-slate-400 font-mono uppercase">1% Low FPS</div>
          <div className={`text-xl font-mono font-extrabold mt-0.5 ${stats.low1Percent < 45 ? 'text-rose-600' : 'text-emerald-600'}`}>
            {stats.low1Percent}
          </div>
        </div>

        <div className="glass-panel p-3 rounded-xl border border-slate-200 text-center">
          <div className="text-[10px] text-slate-400 font-mono uppercase">0.1% Low FPS</div>
          <div className={`text-xl font-mono font-extrabold mt-0.5 ${stats.low01Percent < 35 ? 'text-rose-600' : 'text-emerald-600'}`}>
            {stats.low01Percent}
          </div>
        </div>

        <div className="glass-panel p-3 rounded-xl border border-slate-200 text-center">
          <div className="text-[10px] text-slate-400 font-mono uppercase">Дрожание (Jitter)</div>
          <div className={`text-xl font-mono font-extrabold mt-0.5 ${stats.jitterMs > 2 ? 'text-amber-600' : 'text-slate-700'}`}>
            ±{stats.jitterMs}ms
          </div>
        </div>

        <div className="glass-panel p-3 rounded-xl border border-slate-200 text-center col-span-2 sm:col-span-1">
          <div className="text-[10px] text-slate-400 font-mono uppercase">Индекс плавности</div>
          <div className={`text-xl font-mono font-black mt-0.5 ${stats.pacingScore >= 90 ? 'text-emerald-600' : stats.pacingScore >= 70 ? 'text-amber-600' : 'text-rose-600'}`}>
            {stats.pacingScore}%
          </div>
        </div>
      </div>

      {/* Mode Selector */}
      <div className="glass-panel p-4 rounded-xl border border-slate-200/90 flex flex-wrap items-center justify-between gap-3">
        <span className="text-xs font-semibold text-slate-700">Сравнение равномерности подачи кадров:</span>
        <div className="flex gap-2">
          <button
            onClick={() => {
              setPacingMode('stable');
              audio.playSwitchTone(true);
            }}
            className={`tap-spring px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              pacingMode === 'stable'
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            Идеальный Frame Pacing (16.6ms)
          </button>
          <button
            onClick={() => {
              setPacingMode('erratic');
              audio.playSwitchTone(false);
            }}
            className={`tap-spring px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              pacingMode === 'erratic'
                ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            Неравномерная каденция (Erratic)
          </button>
        </div>
      </div>
    </div>
  );
};
