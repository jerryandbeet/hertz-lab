import React, { useState, useEffect } from 'react';
import { 
  Volume2, 
  VolumeX, 
  Activity, 
  Globe, 
  Maximize2, 
  Minimize2, 
  ShieldCheck, 
  X, 
  Cpu, 
  Clock, 
  CheckCircle2,
  Menu,
  ChevronDown,
  Layers,
  Sparkles
} from 'lucide-react';
import { TelemetryData, StationId } from '../types';
import { audio } from '../services/audioService';
import { STATIONS } from './StationNavigation';
import { subscribeRealtimeStats, initRealtimeStats, LiveStats } from '../services/visitService';

interface Props {
  telemetry: TelemetryData;
  activeStationId: StationId | 'hero';
  onScrollToStation: (id: StationId | 'hero') => void;
  isMuted: boolean;
  onToggleMute: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  calibratedHz: number | null;
}

export const DynamicIslandHUD: React.FC<Props> = ({
  telemetry,
  activeStationId,
  onScrollToStation,
  isMuted,
  onToggleMute,
  isFullscreen,
  onToggleFullscreen,
  calibratedHz
}) => {
  const { fps, frametime, frameHistory } = telemetry;
  const [liveStats, setLiveStats] = useState<LiveStats>({ totalVisitors: 1248, onlineUsers: 1 });
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [showModulesMenu, setShowModulesMenu] = useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    initRealtimeStats();
    const unsub = subscribeRealtimeStats(setLiveStats);
    return unsub;
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowModulesMenu(false);
      }
    };
    if (showModulesMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showModulesMenu]);

  // Close dropdown on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showModulesMenu) {
        setShowModulesMenu(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showModulesMenu]);

  const currentStation = STATIONS.find(s => s.id === activeStationId);

  // Color indicators based on FPS
  const getFpsColor = () => {
    if (fps >= 100) return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    if (fps >= 55) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (fps >= 28) return 'text-amber-600 bg-amber-50 border-amber-200';
    return 'text-rose-600 bg-rose-50 border-rose-200';
  };

  return (
    <>
      <aside 
        aria-label="Живая телеметрия и навигация приложения Hertz"
        className="fixed top-3 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 pointer-events-auto max-w-[96vw]"
      >
        <div className="glass-pill rounded-full px-2.5 py-1.5 sm:px-4 sm:py-2 flex items-center gap-1.5 sm:gap-3 shadow-hud border border-white/80">
          {/* Hertz Brand Badge / Home Button */}
          <button
            onClick={() => {
              onScrollToStation('hero');
              audio.playSoftClick(480, 0.03);
            }}
            className="flex items-center gap-1.5 tap-spring focus:outline-hidden p-1"
            title="На главную (Титульный экран)"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-blue-400"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span>
            </span>
            <span className="font-mono font-black text-xs text-slate-800 tracking-wider">
              Hertz
            </span>
          </button>

          <div className="h-4 w-px bg-slate-200/80"></div>

          {/* Real-time FPS Badge */}
          <div className={`px-2 py-0.5 rounded-full border text-xs font-mono font-bold flex items-center gap-1 transition-colors ${getFpsColor()}`}>
            <Activity className="w-3 h-3" />
            <span>{fps} <span className="hidden sm:inline">FPS</span></span>
          </div>

          {/* Frametime (Hidden on smallest mobile) */}
          <div className="hidden lg:flex items-center gap-1.5 text-xs font-mono text-slate-500">
            <span>{frametime} ms</span>
          </div>

          {/* Calibrated Hz Badge */}
          {calibratedHz ? (
            <div className="hidden sm:flex items-center gap-1 text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/90">
              <ShieldCheck className="w-3 h-3 text-emerald-600" />
              <span>{calibratedHz} Гц</span>
            </div>
          ) : null}

          <div className="h-4 w-px bg-slate-200/80"></div>

          {/* Unified Apple macOS Style Lab Modules Menu Trigger */}
          <button
            onClick={() => {
              setShowModulesMenu(!showModulesMenu);
              audio.playSoftClick(500, 0.03);
            }}
            className={`tap-spring flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 rounded-full text-xs font-mono font-bold transition-all border ${
              showModulesMenu
                ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                : 'bg-slate-100/90 hover:bg-slate-200/90 text-slate-800 border-slate-200/90'
            }`}
            title="Открыть оглавление модулей лаборатории [1]–[6]"
            aria-expanded={showModulesMenu}
          >
            <Layers className={`w-3.5 h-3.5 ${showModulesMenu ? 'text-white' : 'text-blue-600'}`} />
            <span className="hidden sm:inline max-w-[210px] truncate">
              {activeStationId === 'hero' 
                ? 'Модули лаборатории' 
                : `0${currentStation?.index}. ${currentStation?.shortTitle}`
              }
            </span>
            <span className="sm:hidden font-mono text-[11px]">
              {activeStationId === 'hero' ? 'Модули' : `0${currentStation?.index ?? 1}`}
            </span>
            <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${showModulesMenu ? 'rotate-180' : ''}`} />
          </button>

          <div className="h-4 w-px bg-slate-200/80"></div>

          {/* Real Global Visitors & Online Badge */}
          <button
            onClick={() => {
              setShowStatsModal(true);
              audio.playSoftClick(540, 0.04);
            }}
            title="Глобальная статистика: Онлайн и всего визитов"
            className="tap-spring flex items-center gap-1 sm:gap-1.5 text-xs font-mono text-slate-600 hover:text-blue-600 bg-slate-100/80 hover:bg-blue-50/80 px-2 py-0.5 rounded-full border border-slate-200/70 transition-all"
          >
            <span className="flex items-center gap-1 text-emerald-600 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>{liveStats.onlineUsers} <span className="hidden sm:inline">онлайн</span></span>
            </span>
            <span className="text-slate-300 hidden sm:inline">•</span>
            <span className="hidden sm:inline-flex items-center gap-1 text-slate-500">
              <Globe className="w-3 h-3 text-slate-400" />
              <span>{liveStats.totalVisitors.toLocaleString()}</span>
            </span>
          </button>

          {/* Keynote Presentation Fullscreen Toggle [F] (Desktop Only) */}
          <button
            onClick={() => {
              onToggleFullscreen();
              audio.playSoftClick(580, 0.03);
            }}
            className={`tap-spring p-2 rounded-full transition-all border hidden sm:flex items-center gap-1 ${
              isFullscreen 
                ? 'text-blue-700 bg-blue-100/80 border-blue-300 shadow-xs'
                : 'text-slate-500 bg-slate-100/70 border-slate-200 hover:text-slate-800'
            }`}
            title="Полноэкранный режим [F]"
            aria-label="Полноэкранный режим"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>

          {/* Audio Mute Toggle Button */}
          <button
            onClick={() => {
              onToggleMute();
              audio.playSoftClick(550, 0.04);
            }}
            className={`tap-spring p-2 rounded-full transition-all border ${
              isMuted 
                ? 'text-slate-400 bg-slate-100/70 border-slate-200' 
                : 'text-blue-600 bg-blue-50/90 border-blue-200 shadow-xs'
            }`}
            title={isMuted ? "Включить звук" : "Выключить звук"}
            aria-label="Звук"
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 animate-pulse" />}
          </button>
        </div>

        {/* Apple macOS Style Glass Dropdown Menu for Modules */}
        {showModulesMenu && (
          <div 
            ref={menuRef}
            className="mt-2 mx-auto glass-panel p-2.5 rounded-2xl border border-slate-200/90 shadow-2xl space-y-1.5 animate-fadeIn w-[340px] sm:w-[420px] max-w-[94vw] max-h-[75vh] overflow-y-auto backdrop-blur-xl bg-white/95"
          >
            <div className="flex items-center justify-between px-2.5 py-1.5 border-b border-slate-100">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-blue-500" />
                Оглавление лаборатории Hertz
              </span>
              <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200/60">
                Клавиши [1]–[6]
              </span>
            </div>

            <div className="space-y-1 pt-0.5">
              {STATIONS.map((station) => {
                const isActive = activeStationId === station.id;
                return (
                  <button
                    key={station.id}
                    onClick={() => {
                      onScrollToStation(station.id);
                      setShowModulesMenu(false);
                      audio.playSoftClick(400 + station.index * 35, 0.03);
                    }}
                    className={`w-full text-left px-3 py-2.5 rounded-xl text-xs flex items-center justify-between transition-all group ${
                      isActive
                        ? 'bg-blue-600 text-white font-bold shadow-sm'
                        : 'text-slate-700 hover:bg-slate-100/90 hover:text-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className={`w-6 h-6 rounded-lg flex items-center justify-center font-mono text-xs font-bold shrink-0 ${
                        isActive 
                          ? 'bg-white/20 text-white' 
                          : 'bg-blue-50 text-blue-600 border border-blue-200/80 group-hover:bg-blue-100'
                      }`}>
                        0{station.index}
                      </span>
                      <div className="min-w-0">
                        <div className="font-semibold truncate">{station.title}</div>
                        <div className={`text-[10px] font-mono truncate ${isActive ? 'text-blue-100' : 'text-slate-400'}`}>
                          {station.badge}
                        </div>
                      </div>
                    </div>
                    <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ml-2 shrink-0 ${
                      isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200'
                    }`}>
                      [{station.index}]
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </aside>

      {/* Global Realtime Telemetry Modal */}
      {showStatsModal && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn"
          onClick={() => setShowStatsModal(false)}
        >
          <div 
            className="w-full max-w-lg bg-white rounded-3xl p-5 sm:p-7 shadow-2xl border border-slate-200/90 space-y-5 max-h-[88vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 tracking-tight">
                    Глобальная телеметрия приложения Hertz
                  </h3>
                  <p className="text-xs text-slate-500 font-mono">
                    Живой счетчик посетителей и онлайн-сессий
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowStatsModal(false)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                aria-label="Закрыть"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-1">
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <Globe className="w-3.5 h-3.5 text-blue-500" />
                  <span>Всего заходов за всё время</span>
                </div>
                <div className="text-2xl font-black font-mono text-slate-900">
                  {liveStats.totalVisitors.toLocaleString()}
                </div>
                <div className="text-[10px] text-blue-600 font-mono">
                  Глобальный облачный счетчик (API)
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-1">
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <Activity className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Пользователей онлайн</span>
                </div>
                <div className="text-2xl font-black font-mono text-emerald-600 flex items-center gap-2">
                  <span>{liveStats.onlineUsers}</span>
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-emerald-400"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 font-mono">
                  Активные вкладки в реальном времени
                </div>
              </div>
            </div>

            {/* Hardware Environment */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600 space-y-2 font-mono">
              <div className="flex items-center gap-2 font-bold text-slate-900">
                <Cpu className="w-4 h-4 text-blue-600" />
                <span>Аппаратная среда вашего экрана</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                <div>• Текущий FPS: <span className="font-bold text-blue-600">{fps}</span></div>
                <div>• Фреймтайм: <span className="font-bold text-blue-600">{frametime} мс</span></div>
                <div>• Герцовка экрана: <span className="font-bold text-emerald-600">{calibratedHz ? `${calibratedHz} Гц` : 'Не калибровано'}</span></div>
                <div>• Ускорение: <span className="font-bold text-slate-800">WebGL 2.0 (Three.js)</span></div>
              </div>
            </div>

            {/* Footer Close */}
            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowStatsModal(false)}
                className="tap-spring px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors"
              >
                Вернуться к исследованию
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
