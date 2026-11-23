import React, { useState, useEffect, useRef } from 'react';
import { useFpsTelemetry } from './hooks/useFpsTelemetry';
import { DynamicIslandHUD } from './components/DynamicIslandHUD';
import { STATIONS } from './components/StationNavigation';
import { HeroScreen } from './components/HeroScreen';
import { Station1FpsSmoothness } from './components/stations/Station1FpsSmoothness';
import { Station2MotionBlur } from './components/stations/Station2MotionBlur';
import { Station3ScreenTearing } from './components/stations/Station3ScreenTearing';
import { Station4FramePacing } from './components/stations/Station4FramePacing';
import { Station5InputLag } from './components/stations/Station5InputLag';
import { Station7BenchmarkSandbox } from './components/stations/Station7BenchmarkSandbox';
import { StationId } from './types';
import { audio } from './services/audioService';
import { ArrowUp, Award, BookOpen, Sparkles } from 'lucide-react';

export default function App() {
  const [activeStationId, setActiveStationId] = useState<StationId | 'hero'>('hero');
  const [isMuted, setIsMuted] = useState<boolean>(() => audio.getMuted());
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [calibratedHz, setCalibratedHz] = useState<number | null>(null);

  const telemetry = useFpsTelemetry();
  const lastActiveRef = useRef<string>('hero');

  // Fullscreen state listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const handleToggleMute = () => {
    const newState = audio.toggleMute();
    setIsMuted(newState);
  };

  // Smooth scroll to station helper
  const scrollToStation = (id: StationId | 'hero') => {
    const targetElement = id === 'hero' ? document.getElementById('hero') : document.getElementById(`station-${id}`);
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Keyboard Navigation:
  // Key F: Toggle Fullscreen
  // Keys 1 to 7: Smooth scroll to Station
  // Key 0 / Escape: Smooth scroll to Hero
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      
      if (e.key === 'f' || e.key === 'F' || e.key === 'а' || e.key === 'А') {
        toggleFullscreen();
        audio.playSoftClick(580, 0.03);
        return;
      }

      if (e.key === '0' || e.key === 'Escape') {
        scrollToStation('hero');
        audio.playSoftClick(380, 0.03);
        return;
      }

      const num = parseInt(e.key, 10);
      if (num >= 1 && num <= STATIONS.length) {
        const target = STATIONS[num - 1];
        if (target) {
          scrollToStation(target.id);
          audio.playSoftClick(400 + num * 40, 0.03);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // IntersectionObserver for Scrollytelling scroll-spy and tactile haptics
  useEffect(() => {
    const sectionIds = ['hero', ...STATIONS.map(s => `station-${s.id}`)];
    const elements = sectionIds.map(id => document.getElementById(id)).filter(Boolean) as HTMLElement[];

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const rawId = entry.target.id;
            const currentId = rawId === 'hero' ? 'hero' : (rawId.replace('station-', '') as StationId);
            setActiveStationId(currentId);

            if (lastActiveRef.current !== currentId) {
              lastActiveRef.current = currentId;
              audio.playScrollHaptic();
            }
          }
        });
      },
      {
        rootMargin: '-30% 0px -40% 0px',
        threshold: 0.1
      }
    );

    elements.forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const currentStation = STATIONS.find(s => s.id === activeStationId);

  return (
    <div className="min-h-screen flex flex-col justify-between selection:bg-blue-600/15 selection:text-blue-900 bg-slate-50 text-slate-800">
      {/* Dynamic Island HUD with integrated Module Buttons and Live Global Counters */}
      <DynamicIslandHUD
        telemetry={telemetry}
        activeStationId={activeStationId}
        onScrollToStation={scrollToStation}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        isFullscreen={isFullscreen}
        onToggleFullscreen={toggleFullscreen}
        calibratedHz={calibratedHz}
      />

      {/* Executive Hero Screen with Ambient 3D & Scientific Slogan - Clean 100dvh without Bottom Encroachment */}
      <section id="hero" className="w-full">
        <HeroScreen onScrollToStation={scrollToStation} isActive={activeStationId === 'hero'} />
      </section>

      {/* Scrollytelling Column of 7 Interactive Laboratory Stations */}
      <main className="w-full max-w-6xl mx-auto px-4 space-y-24 pb-28">
        {/* Station 01 */}
        <section id="station-fps" className="scroll-mt-36">
          <div className="glass-panel p-5 sm:p-8 rounded-3xl shadow-glass border border-slate-200/80">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200/70 pb-5 mb-6 gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200/80">
                    Модуль 01 / 06
                  </span>
                  <span className="text-xs font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md hidden sm:inline-block">
                    Клавиша [1]
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight mt-2">
                  {STATIONS[0].title}
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  {STATIONS[0].description}
                </p>
              </div>
              <div className="self-start sm:self-center">
                <span className="text-xs font-mono font-semibold text-slate-600 bg-slate-100/90 px-3 py-1.5 rounded-full border border-slate-200/70">
                  {STATIONS[0].badge}
                </span>
              </div>
            </div>
            <Station1FpsSmoothness isActive={activeStationId === 'fps'} calibratedHz={calibratedHz} />
          </div>
        </section>

        {/* Station 02 */}
        <section id="station-blur" className="scroll-mt-36">
          <div className="glass-panel p-5 sm:p-8 rounded-3xl shadow-glass border border-slate-200/80">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200/70 pb-5 mb-6 gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200/80">
                    Модуль 02 / 06
                  </span>
                  <span className="text-xs font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md hidden sm:inline-block">
                    Клавиша [2]
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight mt-2">
                  {STATIONS[1].title}
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  {STATIONS[1].description}
                </p>
              </div>
              <div className="self-start sm:self-center">
                <span className="text-xs font-mono font-semibold text-slate-600 bg-slate-100/90 px-3 py-1.5 rounded-full border border-slate-200/70">
                  {STATIONS[1].badge}
                </span>
              </div>
            </div>
            <Station2MotionBlur isActive={activeStationId === 'blur'} calibratedHz={calibratedHz} />
          </div>
        </section>

        {/* Station 03 */}
        <section id="station-tearing" className="scroll-mt-36">
          <div className="glass-panel p-5 sm:p-8 rounded-3xl shadow-glass border border-slate-200/80">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200/70 pb-5 mb-6 gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200/80">
                    Модуль 03 / 06
                  </span>
                  <span className="text-xs font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md hidden sm:inline-block">
                    Клавиша [3]
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight mt-2">
                  {STATIONS[2].title}
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  {STATIONS[2].description}
                </p>
              </div>
              <div className="self-start sm:self-center">
                <span className="text-xs font-mono font-semibold text-slate-600 bg-slate-100/90 px-3 py-1.5 rounded-full border border-slate-200/70">
                  {STATIONS[2].badge}
                </span>
              </div>
            </div>
            <Station3ScreenTearing isActive={activeStationId === 'tearing'} />
          </div>
        </section>

        {/* Station 04 */}
        <section id="station-pacing" className="scroll-mt-36">
          <div className="glass-panel p-5 sm:p-8 rounded-3xl shadow-glass border border-slate-200/80">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200/70 pb-5 mb-6 gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200/80">
                    Модуль 04 / 06
                  </span>
                  <span className="text-xs font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md hidden sm:inline-block">
                    Клавиша [4]
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight mt-2">
                  {STATIONS[3].title}
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  {STATIONS[3].description}
                </p>
              </div>
              <div className="self-start sm:self-center">
                <span className="text-xs font-mono font-semibold text-slate-600 bg-slate-100/90 px-3 py-1.5 rounded-full border border-slate-200/70">
                  {STATIONS[3].badge}
                </span>
              </div>
            </div>
            <Station4FramePacing isActive={activeStationId === 'pacing'} />
          </div>
        </section>

        {/* Station 05 */}
        <section id="station-input-lag" className="scroll-mt-36">
          <div className="glass-panel p-5 sm:p-8 rounded-3xl shadow-glass border border-slate-200/80">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200/70 pb-5 mb-6 gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200/80">
                    Модуль 05 / 06
                  </span>
                  <span className="text-xs font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md hidden sm:inline-block">
                    Клавиша [5]
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight mt-2">
                  {STATIONS[4].title}
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  {STATIONS[4].description}
                </p>
              </div>
              <div className="self-start sm:self-center">
                <span className="text-xs font-mono font-semibold text-slate-600 bg-slate-100/90 px-3 py-1.5 rounded-full border border-slate-200/70">
                  {STATIONS[4].badge}
                </span>
              </div>
            </div>
            <Station5InputLag isActive={activeStationId === 'input-lag'} />
          </div>
        </section>

        {/* Station 06 */}
        <section id="station-sandbox" className="scroll-mt-36">
          <div className="glass-panel p-5 sm:p-8 rounded-3xl shadow-glass border border-slate-200/80">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200/70 pb-5 mb-6 gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200/80">
                    Модуль 06 / 06
                  </span>
                  <span className="text-xs font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md hidden sm:inline-block">
                    Клавиша [6]
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight mt-2">
                  {STATIONS[5].title}
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  {STATIONS[5].description}
                </p>
              </div>
              <div className="self-start sm:self-center">
                <span className="text-xs font-mono font-semibold text-slate-600 bg-slate-100/90 px-3 py-1.5 rounded-full border border-slate-200/70">
                  {STATIONS[5].badge}
                </span>
              </div>
            </div>
            <Station7BenchmarkSandbox 
              isActive={activeStationId === 'sandbox'} 
              onCalibrated={(hz) => setCalibratedHz(hz)}
            />
          </div>
        </section>
      </main>

      {/* Academic Footer */}
      <footer className="w-full border-t border-slate-200/80 bg-white/70 backdrop-blur-md py-8 px-4 text-xs text-slate-500 font-mono">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-blue-600" />
            <span className="font-bold text-slate-800">Hertz</span>
            <span>•</span>
            <span>Мультимедийное приложение • Лаборатория кадровой частоты и плавности</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                scrollToStation('hero');
                audio.playSoftClick(500, 0.03);
              }}
              className="tap-spring flex items-center gap-1.5 text-blue-600 hover:text-blue-800 font-semibold"
            >
              <ArrowUp className="w-3.5 h-3.5" />
              <span>Наверх</span>
            </button>
            <span>[F] Полноэкранный режим Keynote</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
