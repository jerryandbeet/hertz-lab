import React, { useState, useEffect, useRef } from 'react';
import { MousePointerClick, Timer, Zap, CheckCircle2, AlertCircle, Cpu } from 'lucide-react';
import { audio } from '../../services/audioService';
import { useStationVisibility } from '../../hooks/useStationVisibility';

interface Props {
  isActive?: boolean;
}

export const Station5InputLag: React.FC<Props> = ({ isActive = true }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const arenaRef = useRef<HTMLDivElement>(null);
  const trailCanvasRef = useRef<HTMLCanvasElement>(null);
  const { isPaused } = useStationVisibility(containerRef);
  const [pollingRateHz, setPollingRateHz] = useState<number>(1000); // 125, 500, 1000, 8000
  const [reactionState, setReactionState] = useState<'idle' | 'waiting' | 'ready' | 'result' | 'early'>('idle');
  const [reactionTime, setReactionTime] = useState<number | null>(null);
  const [bestScore, setBestScore] = useState<number | null>(null);

  const [lagDelayMs, setLagDelayMs] = useState<number>(50);
  const mouseHistoryRef = useRef<{ x: number; y: number; time: number }[]>([]);
  const cursorRef = useRef<HTMLDivElement>(null);
  const ghostRef = useRef<HTMLDivElement>(null);
  const reactionTimerRef = useRef<number | null>(null);
  const waitStartTimeRef = useRef<number>(0);
  const lastSampleTimeRef = useRef<number>(0);

  const isActiveRef = useRef(isActive);
  useEffect(() => {
    isActiveRef.current = isActive;
  }, [isActive]);

  // Synchronize trail canvas buffer with container dimensions via ResizeObserver
  useEffect(() => {
    const arena = arenaRef.current;
    const canvas = trailCanvasRef.current;
    if (!arena || !canvas) return;

    const syncCanvasSize = () => {
      const rect = arena.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
    };

    syncCanvasSize();

    const resizeObserver = new ResizeObserver(() => {
      syncCanvasSize();
    });

    resizeObserver.observe(arena);
    return () => resizeObserver.disconnect();
  }, []);

  // Pointer & Touch tracking inside arena with simulated polling rate and latency queue
  const updatePointerPosition = (clientX: number, clientY: number) => {
    if (!arenaRef.current) return;
    const now = performance.now();

    // Respect polling rate filter
    const minInterval = 1000 / pollingRateHz;
    if (now - lastSampleTimeRef.current < minInterval && pollingRateHz < 8000) {
      return;
    }
    lastSampleTimeRef.current = now;

    const rect = arenaRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, clientX - rect.left));
    const y = Math.max(0, Math.min(rect.height, clientY - rect.top));

    if (ghostRef.current) {
      ghostRef.current.style.left = '0px';
      ghostRef.current.style.top = '0px';
      ghostRef.current.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`;
      ghostRef.current.style.opacity = '1';
    }

    if (cursorRef.current && cursorRef.current.style.opacity === '0') {
      cursorRef.current.style.left = '0px';
      cursorRef.current.style.top = '0px';
      cursorRef.current.style.opacity = '1';
    }

    mouseHistoryRef.current.push({ x, y, time: now });
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    updatePointerPosition(e.clientX, e.clientY);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    updatePointerPosition(e.clientX, e.clientY);
  };

  useEffect(() => {
    let animId: number;

    const updateLaggedCursor = () => {
      if (!isActiveRef.current || isPaused) {
        animId = requestAnimationFrame(updateLaggedCursor);
        return;
      }
      const now = performance.now();
      const targetTime = now - lagDelayMs;
      const history = mouseHistoryRef.current;

      while (history.length > 2 && history[0].time < targetTime - 300) {
        history.shift();
      }

      // Draw discrete polling rate points
      const canvas = trailCanvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const dpr = window.devicePixelRatio || 1;
          ctx.save();
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
          ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
          const recentPoints = history.filter((p) => now - p.time < 250);

          if (recentPoints.length > 1) {
            recentPoints.forEach((p) => {
              const age = (now - p.time) / 250;
              const alpha = (1 - age) * 0.7;
              ctx.fillStyle = `rgba(168, 85, 247, ${alpha})`;
              ctx.beginPath();
              ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
              ctx.fill();
            });
          }
          ctx.restore();
        }
      }

      if (history.length > 0 && cursorRef.current) {
        let targetPos = history[0];
        if (lagDelayMs === 0) {
          targetPos = history[history.length - 1];
        } else {
          for (let i = history.length - 1; i >= 0; i--) {
            if (history[i].time <= targetTime) {
              targetPos = history[i];
              break;
            }
          }
        }
        cursorRef.current.style.transform = `translate3d(${targetPos.x}px, ${targetPos.y}px, 0) translate(-50%, -50%)`;
        cursorRef.current.style.opacity = '1';
      }

      animId = requestAnimationFrame(updateLaggedCursor);
    };

    animId = requestAnimationFrame(updateLaggedCursor);
    return () => cancelAnimationFrame(animId);
  }, [lagDelayMs, isPaused]);

  // Reaction tester logic
  const startReactionTest = () => {
    if (reactionTimerRef.current) {
      clearTimeout(reactionTimerRef.current);
      reactionTimerRef.current = null;
    }
    setReactionState('waiting');
    setReactionTime(null);
    audio.playSoftClick(400, 0.03);

    const randomDelay = 1500 + Math.random() * 2500;
    reactionTimerRef.current = window.setTimeout(() => {
      setReactionState('ready');
      waitStartTimeRef.current = performance.now();
      audio.playSwitchTone(true);
    }, randomDelay);
  };

  const handleReactionClick = () => {
    if (reactionState === 'waiting') {
      if (reactionTimerRef.current) {
        clearTimeout(reactionTimerRef.current);
        reactionTimerRef.current = null;
      }
      setReactionState('early');
      audio.playSoftClick(200, 0.05);
    } else if (reactionState === 'ready') {
      const delta = Math.round(performance.now() - waitStartTimeRef.current);
      setReactionTime(delta);
      setReactionState('result');
      audio.playSwitchTone(true);
      if (!bestScore || delta < bestScore) {
        setBestScore(delta);
      }
    } else {
      startReactionTest();
    }
  };

  // Cancel active timer if station is hidden/paused
  useEffect(() => {
    if (!isActive || isPaused) {
      if (reactionTimerRef.current) {
        clearTimeout(reactionTimerRef.current);
        reactionTimerRef.current = null;
      }
      setReactionState((prev) => (prev === 'waiting' ? 'idle' : prev));
    }
  }, [isActive, isPaused]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (reactionTimerRef.current) {
        clearTimeout(reactionTimerRef.current);
        reactionTimerRef.current = null;
      }
    };
  }, []);

  return (
    <div ref={containerRef} className="space-y-6">
      {/* Interactive Lag Tracking Arena */}
      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <MousePointerClick className="w-4 h-4 text-blue-600" />
            Зона 1: Тактильный тренажер задержки ввода (Jelly Cursor)
          </label>
          <div className="flex items-center gap-3 text-xs font-mono text-slate-500">
            <span>Опрос сенсора/мыши: <strong className="text-purple-600">{pollingRateHz} Гц</strong></span>
            <span>•</span>
            <span>Задержка: <strong className="text-blue-600">{lagDelayMs} мс</strong></span>
          </div>
        </div>

        {/* Clean explanatory helper banner outside the interactive arena */}
        <div className="px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600 flex items-center gap-2 shadow-xs">
          <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0"></span>
          <span>
            Ведите пальцем или курсором внутри зоны. Серый маркер — мгновенная позиция касания, синий прицел — запаздывающий кадр рендера (<strong className="text-blue-600 font-mono">{lagDelayMs} мс</strong>).
          </span>
        </div>

        <div
          ref={arenaRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerEnter={(e) => updatePointerPosition(e.clientX, e.clientY)}
          onPointerLeave={() => {
            if (ghostRef.current) ghostRef.current.style.opacity = '0.35';
            if (cursorRef.current) cursorRef.current.style.opacity = '0.75';
          }}
          style={{ touchAction: 'none' }}
          className="relative w-full h-[280px] bg-slate-900/5 rounded-2xl border border-slate-200 overflow-hidden cursor-none shadow-inner flex flex-col items-center justify-center select-none"
        >
          {/* Background grid */}
          <div className="absolute inset-0 bg-[radial-gradient(#94a3b8_1px,transparent_1px)] [background-size:20px_20px] opacity-40 pointer-events-none"></div>

          {/* Mouse polling samples trail canvas */}
          <canvas
            ref={trailCanvasRef}
            className="absolute inset-0 w-full h-full pointer-events-none z-0"
          />

          {/* Instant ghost position (your actual hardware hand movement) */}
          <div
            ref={ghostRef}
            className="absolute left-1/2 top-1/2 pointer-events-none opacity-40 transition-opacity duration-150 z-10"
            style={{ willChange: 'transform', transform: 'translate(-50%, -50%)' }}
          >
            <div className="w-3.5 h-3.5 rounded-full bg-slate-500/80 border border-slate-700/50 shadow-xs"></div>
          </div>

          {/* Delayed Gaming Crosshair */}
          <div
            ref={cursorRef}
            className="absolute left-1/2 top-1/2 pointer-events-none opacity-85 transition-opacity duration-150 z-20"
            style={{ willChange: 'transform', transform: 'translate(-50%, -50%)' }}
          >
            <div className="relative flex items-center justify-center">
              <div className="w-8 h-8 rounded-full border-2 border-blue-600/90 shadow-md"></div>
              <div className="absolute w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
              <div className="absolute -top-2 w-0.5 h-2 bg-blue-600"></div>
              <div className="absolute -bottom-2 w-0.5 h-2 bg-blue-600"></div>
              <div className="absolute -left-2 w-2 h-0.5 bg-blue-600"></div>
              <div className="absolute -right-2 w-2 h-0.5 bg-blue-600"></div>
            </div>
          </div>
        </div>

        {/* Controls: Presets & Polling Rate */}
        <div className="glass-panel p-4 rounded-xl border border-slate-200/80 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-700">Очередь задержки рендера (Input Lag):</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                { ms: 0, label: '0 мс (Ultra Responsive / 240+ Hz)', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
                { ms: 16, label: '16 мс (Стандарт 60 FPS)', color: 'text-blue-700 bg-blue-50 border-blue-200' },
                { ms: 50, label: '50 мс (Тройной буфер / ТВ)', color: 'text-amber-700 bg-amber-50 border-amber-200' },
                { ms: 120, label: '120 мс (Облачный гейминг)', color: 'text-rose-700 bg-rose-50 border-rose-200' }
              ].map((preset) => (
                <button
                  key={preset.ms}
                  onClick={() => {
                    setLagDelayMs(preset.ms);
                    audio.playSoftClick(400 + preset.ms * 2, 0.03);
                  }}
                  className={`tap-spring px-3 py-1.5 rounded-xl text-xs font-mono font-bold border transition-all ${
                    lagDelayMs === preset.ms
                      ? `${preset.color} ring-2 ring-blue-500/20 shadow-sm`
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-purple-600" />
              <span className="text-xs font-semibold text-slate-700">Частота опроса сенсора мыши (Polling Rate):</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                { hz: 125, labelShort: '125 Гц', labelFull: '125 Гц (8.0 мс • Офис)', note: 'Рывки курсора' },
                { hz: 500, labelShort: '500 Гц', labelFull: '500 Гц (2.0 мс)', note: 'Хорошо' },
                { hz: 1000, labelShort: '1000 Гц', labelFull: '1000 Гц (1.0 мс • Pro)', note: 'Стандарт' },
                { hz: 8000, labelShort: '8000 Гц', labelFull: '8000 Гц (0.125 мс)', note: 'Сверхплавно' },
              ].map((item) => (
                <button
                  key={item.hz}
                  onClick={() => {
                    setPollingRateHz(item.hz);
                    audio.playSoftClick(450 + item.hz * 0.05, 0.03);
                  }}
                  className={`tap-spring px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-xl text-xs font-mono font-bold border transition-all ${
                    pollingRateHz === item.hz
                      ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                  title={`${item.hz} Гц — ${item.note}`}
                >
                  <span className="hidden sm:inline">{item.labelFull}</span>
                  <span className="sm:hidden">{item.labelShort}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Zone 2: Reflex Reaction Benchmark */}
      <div className="glass-panel p-5 rounded-2xl space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <Timer className="w-4 h-4 text-emerald-600" />
            Зона 2: Тест скорости реакции (Click-to-Photon Benchmark)
          </label>
          {bestScore && (
            <span className="text-xs font-mono text-emerald-600 font-bold">
              Рекорд: {bestScore} мс
            </span>
          )}
        </div>

        <div
          onClick={handleReactionClick}
          className={`tap-spring w-full h-[180px] rounded-xl flex flex-col items-center justify-center text-center p-6 cursor-pointer select-none transition-all border ${
            reactionState === 'idle'
              ? 'bg-blue-50/70 border-blue-200 hover:bg-blue-50 text-blue-950'
              : reactionState === 'waiting'
              ? 'bg-amber-50 border-amber-300 text-amber-950'
              : reactionState === 'ready'
              ? 'bg-emerald-500 border-emerald-600 text-white shadow-xl shadow-emerald-500/40 ring-4 ring-emerald-400/30'
              : reactionState === 'early'
              ? 'bg-rose-50 border-rose-300 text-rose-950'
              : 'bg-emerald-50 border-emerald-300 text-emerald-950'
          }`}
        >
          {reactionState === 'idle' && (
            <div>
              <Zap className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <div className="font-bold text-base">Нажмите сюда, чтобы начать замер реакции</div>
              <div className="text-xs text-blue-600/80 mt-1">Дождитесь, пока экран загорится зелёным, и кликните мгновенно!</div>
            </div>
          )}

          {reactionState === 'waiting' && (
            <div>
              <div className="w-4 h-4 rounded-full bg-amber-500 animate-ping mx-auto mb-3"></div>
              <div className="font-bold text-base">ЖДИТЕ ЗЕЛЁНОГО СИГНАЛА...</div>
              <div className="text-xs text-amber-700/80 mt-1">Не кликайте раньше времени!</div>
            </div>
          )}

          {reactionState === 'ready' && (
            <div>
              <div className="font-black text-2xl tracking-wider">КЛИКАЙТЕ СЕЙЧАС!</div>
            </div>
          )}

          {reactionState === 'early' && (
            <div>
              <AlertCircle className="w-8 h-8 text-rose-600 mx-auto mb-2" />
              <div className="font-bold text-base">Слишком рано! Фальстарт.</div>
              <div className="text-xs text-rose-600/80 mt-1">Кликните, чтобы попробовать снова</div>
            </div>
          )}

          {reactionState === 'result' && (
            <div>
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-1" />
              <div className="text-3xl font-black font-mono tracking-tight text-emerald-700">
                {reactionTime} мс
              </div>
              <div className="text-xs text-emerald-800/80 mt-1">
                Нервный импульс: ~{(reactionTime || 200) - 25} мс + Задержка экрана и мыши: ~25 мс
              </div>
              <div className="text-[11px] font-semibold text-emerald-600 mt-2">Кликните для нового раунда</div>
            </div>
          )}
        </div>
      </div>

      {/* Anatomy Pipeline Diagram */}
      <div className="glass-panel p-5 rounded-2xl space-y-3">
        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
          Анатомия задержки: путь клика от мыши до фотона на сетчатке
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs font-mono">
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
            <div className="text-[10px] text-slate-400 font-sans">Этап 1</div>
            <div className="font-bold text-slate-700 mt-1">Сенсор мыши</div>
            <div className="text-[10px] text-blue-600 mt-0.5">0.5 – 1 мс</div>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
            <div className="text-[10px] text-slate-400 font-sans">Этап 2</div>
            <div className="font-bold text-slate-700 mt-1">Логика игры</div>
            <div className="text-[10px] text-blue-600 mt-0.5">4 – 8 мс</div>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
            <div className="text-[10px] text-slate-400 font-sans">Этап 3</div>
            <div className="font-bold text-slate-700 mt-1">Очередь драйвера</div>
            <div className="text-[10px] text-amber-600 mt-0.5">8 – 24 мс</div>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
            <div className="text-[10px] text-slate-400 font-sans">Этап 4</div>
            <div className="font-bold text-slate-700 mt-1">Рендер GPU</div>
            <div className="text-[10px] text-blue-600 mt-0.5">4 – 16 мс</div>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 col-span-2 sm:col-span-1">
            <div className="text-[10px] text-slate-400 font-sans">Этап 5</div>
            <div className="font-bold text-slate-700 mt-1">Сканирование матрицы</div>
            <div className="text-[10px] text-emerald-600 mt-0.5">2 – 16 мс</div>
          </div>
        </div>
      </div>
    </div>
  );
};
