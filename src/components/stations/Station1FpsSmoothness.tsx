import React, { useState, useEffect, useRef } from 'react';
import { Sliders, Clock, Info, CheckCircle2, Volume2, VolumeX, Radio, AlertCircle } from 'lucide-react';
import { RotatingGemScene } from '../three/RotatingGemScene';
import { audio } from '../../services/audioService';
import { useStationVisibility } from '../../hooks/useStationVisibility';

interface Props {
  isActive?: boolean;
  calibratedHz?: number | null;
}

export const Station1FpsSmoothness: React.FC<Props> = ({ isActive = true, calibratedHz }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { isPaused } = useStationVisibility(containerRef);

  const displayHz = calibratedHz || 60;
  const [fpsLeft, setFpsLeft] = useState<number>(30);
  const [fpsRight, setFpsRight] = useState<number>(180);
  const [splitPos, setSplitPos] = useState<number>(50);
  const [speed, setSpeed] = useState<number>(1.0);
  const [activePreset, setActivePreset] = useState<string>('30vs180');
  const [motionMode, setMotionMode] = useState<'rotate' | 'sweep'>('sweep');

  // Acoustic Frequency Pitch Generator
  const [acousticActive, setAcousticActive] = useState<boolean>(false);
  const [acousticHz, setAcousticHz] = useState<number>(60);

  const presets = [
    { id: '15vs30', label: '15 vs 30 FPS', left: 15, right: 30, desc: 'Критическое стробирование vs минимальный порог играбельности' },
    { id: '30vs60', label: '30 vs 60 FPS', left: 30, right: 60, desc: 'Классический переход консолей к стандарту плавности' },
    { id: '30vs180', label: '30 vs 180 FPS', left: 30, right: 180, desc: 'Фреймтайм 5.5мс против 33.3мс' },
    { id: '60vs120', label: '60 vs 120 FPS', left: 60, right: 120, desc: 'Киберспортивная отзывчивость и микрочёткость' },
  ];

  const applyPreset = (preset: typeof presets[0]) => {
    setActivePreset(preset.id);
    setFpsLeft(preset.left);
    setFpsRight(preset.right);
    audio.playSwitchTone(true);
  };

  const handleToggleAcoustic = (hz: number) => {
    if (acousticActive && acousticHz === hz) {
      audio.stopContinuousHum();
      setAcousticActive(false);
    } else {
      audio.startContinuousHum(hz);
      setAcousticHz(hz);
      setAcousticActive(true);
    }
  };

  // Auto-mute acoustic hum when station is offscreen or tab is hidden
  useEffect(() => {
    if ((!isActive || isPaused) && acousticActive) {
      audio.stopContinuousHum();
      setAcousticActive(false);
    }
  }, [isActive, isPaused, acousticActive]);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden && acousticActive) {
        audio.stopContinuousHum();
        setAcousticActive(false);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      audio.stopContinuousHum();
    };
  }, [acousticActive]);

  return (
    <div ref={containerRef} className="space-y-6">
      {/* 3D Scene Viewport */}
      <RotatingGemScene
        fpsLeft={fpsLeft}
        fpsRight={fpsRight}
        splitPos={splitPos}
        speed={speed}
        motionMode={motionMode}
        showMarkers={true}
        isActive={isActive && !isPaused}
        onSplitChange={setSplitPos}
      />

      {/* Monitor Physical Refresh Limit Hint */}
      {fpsRight > displayHz && (
        <div className="p-3 rounded-xl bg-blue-50/80 border border-blue-200/80 text-xs text-blue-900 flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 text-blue-600 shrink-0" />
          <span>
            <strong>Аппаратный контекст:</strong> Ваш монитор работает на <strong>{displayHz} Гц</strong>. Пресет {fpsRight} FPS демонстрирует математическую разницу во времени генерации кадра (5.5 мс vs 33.3 мс), однако фактическая скорость обновления экрана ограничена физической разверткой вашей матрицы.
          </span>
        </div>
      )}

      {/* Interactive Controls Bar */}
      <div className="glass-panel p-3.5 sm:p-5 rounded-2xl space-y-4 sm:space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-bold text-slate-800">Пресеты:</span>
            </div>

            {/* Motion Mode Selector (Rotation vs Sweep) */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200">
              <button
                onClick={() => { setMotionMode('rotate'); audio.playSwitchTone(false); }}
                className={`px-3 py-2 sm:py-1.5 rounded-lg text-xs font-semibold min-h-[36px] flex items-center transition-all ${
                  motionMode === 'rotate' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                3D Вращение
              </button>
              <button
                onClick={() => { setMotionMode('sweep'); audio.playSwitchTone(true); }}
                className={`px-3 py-2 sm:py-1.5 rounded-lg text-xs font-semibold min-h-[36px] flex items-center transition-all ${
                  motionMode === 'sweep' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Маятник (Sweep)
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            {presets.map((p) => {
              const isSelected = activePreset === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => applyPreset(p)}
                  className={`tap-spring px-3 py-2 sm:px-3.5 sm:py-1.5 rounded-xl text-xs font-semibold min-h-[36px] flex items-center transition-all border ${
                    isSelected
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                      : 'bg-white text-slate-700 border-slate-200/90 hover:bg-slate-50'
                  }`}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Sliders Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Split position slider */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-medium text-slate-700">
              <span>Положение разделителя:</span>
              <span className="font-mono text-blue-600">{splitPos}%</span>
            </div>
            <input
              type="range"
              min="10"
              max="90"
              value={splitPos}
              onChange={(e) => {
                const val = Number(e.target.value);
                setSplitPos(val);
                audio.playSliderTick(val / 100);
              }}
              className="w-full"
            />
          </div>

          {/* Left Side FPS */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-medium text-slate-700">
              <span>Левая зона:</span>
              <span className="font-mono text-blue-600 font-bold">{fpsLeft} FPS</span>
            </div>
            <input
              type="range"
              min="10"
              max="60"
              step="5"
              value={fpsLeft}
              onChange={(e) => {
                const val = Number(e.target.value);
                setFpsLeft(val);
                setActivePreset('custom');
                audio.playSliderTick((val - 10) / 50);
              }}
              className="w-full"
            />
          </div>

          {/* Right Side FPS */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-medium text-slate-700">
              <span>Правая зона:</span>
              <span className="font-mono text-emerald-600 font-bold">{fpsRight >= 180 ? '180 FPS (Native)' : `${fpsRight} FPS`}</span>
            </div>
            <input
              type="range"
              min="30"
              max="180"
              step="10"
              value={fpsRight}
              onChange={(e) => {
                const val = Number(e.target.value);
                setFpsRight(val);
                setActivePreset('custom');
                audio.playSliderTick((val - 30) / 150);
              }}
              className="w-full"
            />
          </div>
        </div>

        {/* Speed Slider */}
        <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
          <div className="flex items-center justify-between text-xs font-medium text-slate-600">
            <span>Скорость вращения 3D сцены:</span>
            <span className="sm:hidden font-mono text-slate-500">{speed.toFixed(1)}x</span>
          </div>
          <input
            type="range"
            min="0.2"
            max="2.5"
            step="0.1"
            value={speed}
            onChange={(e) => {
              const val = Number(e.target.value);
              setSpeed(val);
              audio.playSliderTick((val - 0.2) / 2.3);
            }}
            className="flex-1 w-full"
          />
          <span className="hidden sm:inline-block text-xs font-mono text-slate-500 w-10 text-right">{speed.toFixed(1)}x</span>
        </div>
      </div>

      {/* Acoustic Frequency Hum Module (Услышать герцы ушами) */}
      <div className="glass-panel p-3.5 sm:p-5 rounded-2xl border border-slate-200/90 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-purple-600" />
            <div>
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Акустический генератор: Услышать разницу герц ушами (Web Audio API)
              </h4>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Каждый кадр превращается в звуковую волну синусоиды. Послушайте, как звучат 30 Гц, 60 Гц и 120 Гц:
              </p>
            </div>
          </div>

          {acousticActive && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 text-xs font-mono border border-purple-200">
              <span className="w-2 h-2 rounded-full bg-purple-500 animate-ping"></span>
              Воспроизведение: {acousticHz} Гц
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-1">
          {[
            { hz: 30, label: '30 Гц (Басовый гул 33.3мс)', note: 'Редкий пульс' },
            { hz: 60, label: '60 Гц (Плотный фон 16.6мс)', note: 'Стандарт' },
            { hz: 120, label: '120 Гц (Высокий тон 8.3мс)', note: 'Удвоенная частота' },
          ].map((item) => {
            const isPlaying = acousticActive && acousticHz === item.hz;
            return (
              <button
                key={item.hz}
                onClick={() => handleToggleAcoustic(item.hz)}
                className={`tap-spring px-3.5 py-2 rounded-xl text-xs font-mono font-bold border flex items-center gap-2 transition-all ${
                  isPlaying
                    ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                    : 'bg-white hover:bg-purple-50 text-slate-700 border-slate-200'
                }`}
              >
                {isPlaying ? <Volume2 className="w-3.5 h-3.5 animate-bounce" /> : <VolumeX className="w-3.5 h-3.5 text-slate-400" />}
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Technical Deep Dive Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-panel p-4 rounded-xl border border-slate-200/80 space-y-2">
          <div className="flex items-center gap-2 text-blue-600">
            <Clock className="w-4 h-4" />
            <h4 className="text-xs font-bold uppercase tracking-wider">Фреймтайм (Frametime)</h4>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Кадровая частота нелинейна. Разница между 30 FPS (33.3 мс) и 60 FPS (16.6 мс) колоссальна — целых <strong>16.7 мс экономии задержки</strong> на каждый кадр.
          </p>
          <div className="text-[11px] font-mono text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-200/60">
            • 30 FPS = 33.3 мс<br/>
            • 60 FPS = 16.6 мс<br/>
            • 120 FPS = 8.3 мс<br/>
            • 240 FPS = 4.1 мс
          </div>
        </div>

        <div className="glass-panel p-4 rounded-xl border border-slate-200/80 space-y-2">
          <div className="flex items-center gap-2 text-indigo-600">
            <Info className="w-4 h-4" />
            <h4 className="text-xs font-bold uppercase tracking-wider">Стробоскопический шаг</h4>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            При низкой частоте кадров (15–30 FPS) мозг видит не плавное движение, а последовательность дискретных прыжков объекта. Чем выше угловая скорость, тем сильнее заметен этот эффект «размножения» граней.
          </p>
        </div>

        <div className="glass-panel p-4 rounded-xl border border-slate-200/80 space-y-2">
          <div className="flex items-center gap-2 text-emerald-600">
            <CheckCircle2 className="w-4 h-4" />
            <h4 className="text-xs font-bold uppercase tracking-wider">Глаз человека и миф о 24 кадрах</h4>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Глаз не работает на фиксированной частоте развертки. Сетчатка способна улавливать сверхкороткие световые вспышки длительностью до 1–2 миллисекунд (эквивалент 500+ FPS), особенно на периферии зрения.
          </p>
        </div>
      </div>
    </div>
  );
};
