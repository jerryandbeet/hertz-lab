import React, { useState, useRef, useEffect } from 'react';
import { Gauge, Play, RefreshCw, Cpu, Layers, Sparkles, CheckCircle, Award, ShieldCheck, X, Download, AlertTriangle } from 'lucide-react';
import { runHardwareHzScan, ScanResult } from '../../utils/refreshRateDetector';
import { ApolloBustScene } from '../three/ApolloBustScene';
import { audio } from '../../services/audioService';

interface Props {
  isActive?: boolean;
  onCalibrated?: (hz: number) => void;
}

export const Station7BenchmarkSandbox: React.FC<Props> = ({ isActive = true, onCalibrated }) => {
  // Scanner state
  const [scanning, setScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [showCertificate, setShowCertificate] = useState(false);
  const scanCleanupRef = useRef<(() => void) | null>(null);

  // Cleanup hardware scan on station exit or unmount
  useEffect(() => {
    if (!isActive) {
      if (scanCleanupRef.current) {
        scanCleanupRef.current();
        scanCleanupRef.current = null;
        setScanning(false);
      }
    }
    return () => {
      if (scanCleanupRef.current) {
        scanCleanupRef.current();
        scanCleanupRef.current = null;
      }
    };
  }, [isActive]);

  const downloadCertificatePng = () => {
    if (!scanResult) return;
    const canvas = document.createElement('canvas');
    canvas.width = 900;
    canvas.height = 600;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Card background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 900, 600);

    // Decorative gradient header border
    const grad = ctx.createLinearGradient(0, 0, 900, 0);
    grad.addColorStop(0, '#2563eb');
    grad.addColorStop(0.5, '#06b6d4');
    grad.addColorStop(1, '#10b981');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 900, 10);

    // Outer border
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 2;
    ctx.strokeRect(20, 20, 860, 560);

    // Badge
    ctx.fillStyle = '#eff6ff';
    ctx.fillRect(320, 50, 260, 28);
    ctx.strokeStyle = '#bfdbfe';
    ctx.strokeRect(320, 50, 260, 28);
    ctx.fillStyle = '#1d4ed8';
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('HERTZ LAB • OFFICIAL CERTIFICATE', 450, 68);

    // Title
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 28px sans-serif';
    ctx.fillText('Паспорт аппаратной плавности дисплея', 450, 120);

    ctx.fillStyle = '#64748b';
    ctx.font = '14px sans-serif';
    ctx.fillText('Верифицировано лабораторией исследования кадровой частоты', 450, 150);

    // Main Hz big callout
    ctx.fillStyle = '#2563eb';
    ctx.font = 'black 64px monospace';
    ctx.fillText(`${scanResult.matchedHz} Hz`, 450, 240);

    ctx.fillStyle = '#475569';
    ctx.font = '16px monospace';
    ctx.fillText(`Точное аппаратное значение: ${scanResult.exactHz} Гц • Интервал: ${scanResult.intervalMs} мс`, 450, 280);

    // Data table box
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(80, 320, 740, 150);
    ctx.strokeStyle = '#e2e8f0';
    ctx.strokeRect(80, 320, 740, 150);

    ctx.textAlign = 'left';
    ctx.fillStyle = '#334155';
    ctx.font = '14px sans-serif';

    ctx.fillText(`Дрожание развертки (Jitter): ±${scanResult.jitterMs} мс`, 110, 360);
    ctx.fillText(`Класс монитора: ${scanResult.matchedHz >= 144 ? 'Pro Esports Extreme' : scanResult.matchedHz >= 100 ? 'High-Refresh Gaming' : 'Standard 60Hz'}`, 110, 395);
    ctx.fillText(`Индекс доверия калибровки: ${scanResult.confidence}%`, 110, 430);

    ctx.fillText(`Всего замеров: ${scanResult.totalFrames} кадров`, 500, 360);
    ctx.fillText(`Дата калибровки: ${new Date().toLocaleDateString('ru-RU')}`, 500, 395);
    ctx.fillText(`Статус: ${scanResult.isThrottled ? 'Внимание (фоновая нагрузка)' : 'Калибровано без потерь'}`, 500, 430);

    // Footer
    ctx.textAlign = 'center';
    ctx.fillStyle = '#94a3b8';
    ctx.font = '12px monospace';
    ctx.fillText('HERTZ PRECISION LAB • ДИПЛОМНЫЙ ПРОЕКТ • ВСЕ ПРАВА ЗАЩИЩЕНЫ', 450, 530);

    const link = document.createElement('a');
    link.download = `hertz-display-passport-${scanResult.matchedHz}hz.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    audio.playSoftClick(600, 0.04);
  };

  // 3D Stress Sandbox state
  const [polyCount, setPolyCount] = useState<number>(1200); // 200 to 15,000 floating stone shards
  const [lightCount, setLightCount] = useState<number>(3); // 1 to 6
  const [cpuLoadMs, setCpuLoadMs] = useState<number>(0); // 0 to 14 ms artificial loop

  // Start precision hardware scan
  const handleStartScan = () => {
    if (scanning) return;
    if (scanCleanupRef.current) {
      scanCleanupRef.current();
      scanCleanupRef.current = null;
    }
    setScanning(true);
    setScanProgress(0);
    setScanResult(null);
    audio.playSoftClick(520, 0.04);

    scanCleanupRef.current = runHardwareHzScan(
      (current, total) => {
        setScanProgress(Math.round((current / total) * 100));
      },
      (result) => {
        scanCleanupRef.current = null;
        setScanning(false);
        setScanResult(result);
        audio.playSwitchTone(true);
        audio.playRefreshTick(result.matchedHz);
        if (onCalibrated) {
          onCalibrated(result.matchedHz);
        }
      }
    );
  };

  return (
    <div className="space-y-6">
      {/* Module A: Precision Monitor Refresh Rate Scanner */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-200/90 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Gauge className="w-5 h-5 text-blue-600" />
              <h3 className="text-base font-bold text-slate-900">
                Высокоточный аппаратный детектор герцовки (Screen Hz Analyzer)
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-1 max-w-xl">
              Статистический замер интервалов кадровой развертки через микросекундные временные метки.
            </p>
          </div>

          <button
            onClick={handleStartScan}
            disabled={scanning}
            className={`tap-spring px-4 py-2 rounded-xl text-xs font-bold border flex items-center gap-2 shadow-sm transition-all ${
              scanning
                ? 'bg-blue-100 text-blue-700 border-blue-300 animate-pulse'
                : 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700'
            }`}
          >
            {scanning ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
            {scanning ? `Сканирование... ${scanProgress}%` : 'Запустить глубокое сканирование'}
          </button>
        </div>

        {/* Progress Bar */}
        {scanning && (
          <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
            <div
              className="bg-blue-600 h-full transition-all duration-75 rounded-full"
              style={{ width: `${scanProgress}%` }}
            />
          </div>
        )}

        {/* Scan Result Card */}
        {scanResult && (
          <div className="space-y-3">
            <div className="p-4 rounded-xl bg-gradient-to-r from-blue-50/80 to-emerald-50/80 border border-blue-200/90 grid grid-cols-2 sm:grid-cols-4 gap-4 animate-fadeIn">
              <div>
                <div className="text-[10px] text-slate-500 font-mono uppercase">Определенная частота</div>
                <div className="text-2xl font-mono font-black text-blue-700 mt-0.5">
                  {scanResult.matchedHz} Гц
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">Точно: {scanResult.exactHz} Hz</div>
              </div>

              <div>
                <div className="text-[10px] text-slate-500 font-mono uppercase">Интервал кадра</div>
                <div className="text-2xl font-mono font-bold text-slate-800 mt-0.5">
                  {scanResult.intervalMs} мс
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">Тайминг развертки</div>
              </div>

              <div>
                <div className="text-[10px] text-slate-500 font-mono uppercase">Дрожание (Jitter)</div>
                <div className="text-2xl font-mono font-bold text-slate-800 mt-0.5">
                  ±{scanResult.jitterMs} мс
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">Стабильность потока</div>
              </div>

              <div>
                <div className="text-[10px] text-slate-500 font-mono uppercase">Достоверность</div>
                <div className={`text-2xl font-mono font-black mt-0.5 ${scanResult.isThrottled ? 'text-amber-600' : 'text-emerald-600'}`}>
                  {scanResult.confidence}%
                </div>
                <div className={`text-[10px] flex items-center gap-1 mt-0.5 ${scanResult.isThrottled ? 'text-amber-600 font-semibold' : 'text-emerald-700'}`}>
                  {scanResult.isThrottled ? (
                    <>
                      <AlertTriangle className="w-3 h-3 text-amber-500" /> Фоновая нагрузка
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-3 h-3 text-emerald-600" /> Калибровано
                    </>
                  )}
                </div>
              </div>
            </div>

            {scanResult.isThrottled && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Внимание:</strong> Зафиксирован высокий джиттер (±{scanResult.jitterMs} мс). Браузер испытывает фоновую нагрузку или просадку FPS. Закройте тяжелые вкладки/приложения и запустите сканирование повторно в покое.
                </span>
              </div>
            )}

            {/* Certificate Action Button */}
            <div className="flex justify-end">
              <button
                onClick={() => {
                  setShowCertificate(true);
                  audio.playSwitchTone(true);
                }}
                className="tap-spring px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-2 shadow-sm"
              >
                <Award className="w-4 h-4" />
                Сформировать «Паспорт плавности монитора»
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Module B: GPU Geometry & InstancedMesh Stress Benchmark */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-200/90 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-purple-600" />
            <h3 className="text-sm font-bold text-slate-900">
              GPU Стресс-Песочница
            </h3>
          </div>
          <span className="text-xs font-mono text-slate-400">Three.js • Instanced Shards</span>
        </div>

        {/* Apollo Bust & Stone Shards Viewport */}
        <ApolloBustScene
          shardCount={polyCount}
          lightCount={lightCount}
          cpuLoadMs={cpuLoadMs}
          isActive={isActive}
        />

        {/* Sandbox Stress Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 pt-2">
          {/* Stone Shards Objects */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-medium text-slate-700">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                Осколки камня вокруг:
              </span>
              <span className="font-mono text-blue-600 font-bold">{polyCount.toLocaleString()} осколков</span>
            </div>
            <input
              type="range"
              min="200"
              max="15000"
              step="200"
              value={polyCount}
              onChange={(e) => {
                const val = Number(e.target.value);
                setPolyCount(val);
                audio.playSliderTick((val - 200) / 14800);
              }}
              className="w-full"
            />
          </div>

          {/* Dynamic Lights */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-medium text-slate-700">
              <span className="flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-amber-500" />
                Источники света (RGB):
              </span>
              <span className="font-mono text-amber-600 font-bold">{lightCount}</span>
            </div>
            <input
              type="range"
              min="1"
              max="6"
              step="1"
              value={lightCount}
              onChange={(e) => {
                const val = Number(e.target.value);
                setLightCount(val);
                audio.playSliderTick((val - 1) / 5);
              }}
              className="w-full"
            />
          </div>

          {/* CPU thread work */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-medium text-slate-700">
              <span className="flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-rose-500" />
                Нагрузка потока CPU:
              </span>
              <span className="font-mono text-rose-600 font-bold">{cpuLoadMs} мс/кадр</span>
            </div>
            <input
              type="range"
              min="0"
              max="14"
              step="1"
              value={cpuLoadMs}
              onChange={(e) => {
                const val = Number(e.target.value);
                setCpuLoadMs(val);
                audio.playSliderTick(val / 14);
              }}
              className="w-full"
            />
          </div>
        </div>
      </div>

      {/* Certificate Modal */}
      {showCertificate && scanResult && (
        <div className="fixed inset-0 z-[100] bg-slate-900/50 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/90 shadow-2xl max-w-lg w-full bg-white relative animate-fadeIn pointer-events-auto">
            <button
              onClick={() => setShowCertificate(false)}
              className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="text-center space-y-2 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-emerald-500 text-white flex items-center justify-center mx-auto shadow-md">
                <Award className="w-6 h-6" />
              </div>
              <span className="text-[11px] font-mono font-bold tracking-widest uppercase text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                CALIBRATION CERTIFICATE #2026-HERTZ
              </span>
              <h3 className="text-xl font-black text-slate-900">
                Паспорт аппаратной плавности дисплея
              </h3>
              <p className="text-xs text-slate-500">
                Выдан лабораторией HERTZ на основе калибровочных микросекундных замеров.
              </p>
            </div>

            <div className="space-y-2.5 text-xs font-mono bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500 font-sans">Реальная частота:</span>
                <span className="font-bold text-blue-600 text-sm">{scanResult.exactHz} Hz ({scanResult.matchedHz} Гц)</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500 font-sans">Период развертки:</span>
                <span className="font-bold text-slate-800">{scanResult.intervalMs} мс</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500 font-sans">Джиттер синхронизации:</span>
                <span className="font-bold text-slate-800">±{scanResult.jitterMs} мс</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500 font-sans">Класс монитора:</span>
                <span className="font-bold text-emerald-600">
                  {scanResult.matchedHz >= 240 ? 'Pro Esports Extreme (240Hz+)' : scanResult.matchedHz >= 120 ? 'High-Refresh Gaming (120-165Hz)' : 'Standard Office / Cinematic (60-75Hz)'}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500 font-sans">Индекс доверия теста:</span>
                <span className="font-bold text-emerald-600">{scanResult.confidence}% (Калибровано)</span>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>Верифицировано локально</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={downloadCertificatePng}
                  className="tap-spring px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center gap-1.5 border border-slate-200 shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  Сохранить PNG
                </button>
                <button
                  onClick={() => setShowCertificate(false)}
                  className="px-5 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 shadow-sm"
                >
                  Закрыть
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
