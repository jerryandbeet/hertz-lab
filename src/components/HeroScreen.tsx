import React from 'react';
import { 
  ArrowDown, 
  Sparkles, 
  Zap, 
  Cpu, 
  Gauge, 
  ChevronDown,
  Layers,
  Activity,
  Flame,
  Radio
} from 'lucide-react';
import { AmbientPhotonicBackground } from './three/AmbientPhotonicBackground';
import { audio } from '../services/audioService';
import { StationId } from '../types';

interface Props {
  onScrollToStation: (stationId: StationId | 'hero', startTour?: boolean) => void;
  isActive?: boolean;
}

export const HeroScreen: React.FC<Props> = ({ onScrollToStation, isActive = true }) => {
  const handleStart = () => {
    audio.playChordEnter();
    onScrollToStation('fps', false);
  };

  return (
    <section className="relative w-full min-h-[100dvh] flex flex-col justify-center items-center px-4 pt-20 pb-10 safe-pt safe-pb overflow-hidden">
      {/* Ambient Interactive 3D Photonic Wave Canvas (Background Layer) */}
      <AmbientPhotonicBackground isActive={isActive} />

      <div className="relative z-10 w-full max-w-4xl mx-auto flex flex-col items-center text-center space-y-5 sm:space-y-6">
        {/* Top Academic Tag */}
        <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3.5 py-1.5 rounded-full bg-white/90 backdrop-blur-md border border-blue-200/90 shadow-sm text-blue-700 text-[10px] sm:text-xs font-mono font-bold tracking-wide uppercase animate-fadeIn max-w-[92vw] flex-wrap justify-center">
          <Sparkles className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
          <span>Мультимедийное приложение Hertz</span>
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
          <span>6 интерактивных модулей • WebGL 3D</span>
        </div>

        {/* Main Title */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-black text-slate-900 tracking-tight leading-[1.08]">
          Анатомия кадровой частоты,{' '}
          <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 bg-clip-text text-transparent">
            плавности и отклика
          </span>
        </h1>

        {/* Academic Slogan Quote Card (Approved Option A) */}
        <div className="w-full max-w-3xl glass-panel p-6 sm:p-7 rounded-3xl border border-blue-200/70 shadow-glass text-center space-y-3 relative overflow-hidden backdrop-blur-lg bg-white/80">
          <div className="text-lg sm:text-xl md:text-2xl font-serif italic text-slate-800 font-medium leading-relaxed">
            «Истинная плавность — не в абстрактных цифрах FPS, а во времени доставки каждого фотона на сетчатку глаза.»
          </div>
          <div className="h-px w-24 bg-gradient-to-r from-transparent via-blue-400 to-transparent mx-auto"></div>
          <p className="text-xs sm:text-sm text-slate-600 font-mono tracking-wide">
            Лаборатория субмиллисекундного отклика, кинематики развертки и биологии человеческого зрения
          </p>
        </div>

        {/* Quick Module Capabilities Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-2 text-xs font-mono text-slate-600 max-w-2xl">
          <span className="px-3 py-1 rounded-full bg-white/80 border border-slate-200/80 shadow-xs flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-blue-500" />
            30 vs 180 FPS тест
          </span>
          <span className="px-3 py-1 rounded-full bg-white/80 border border-slate-200/80 shadow-xs flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5 text-amber-500" />
            Motion Blur & BFI
          </span>
          <span className="px-3 py-1 rounded-full bg-white/80 border border-slate-200/80 shadow-xs flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-indigo-500" />
            Tearing & 1% Low
          </span>
          <span className="px-3 py-1 rounded-full bg-white/80 border border-slate-200/80 shadow-xs flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-purple-500" />
            Jelly Input Lag
          </span>
          <span className="px-3 py-1 rounded-full bg-white/80 border border-slate-200/80 shadow-xs flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
            DLSS Frame Gen
          </span>
        </div>

        {/* Action Button & Down Scroll Affordance */}
        <div className="pt-4 flex flex-col items-center gap-3">
          <button
            onClick={handleStart}
            className="tap-spring px-8 py-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm sm:text-base flex items-center gap-3 shadow-lg shadow-blue-500/25 border border-blue-500 transition-all hover:scale-105"
          >
            <span>Начать исследование</span>
            <ArrowDown className="w-4 h-4 animate-bounce" />
          </button>
          
          <button
            onClick={handleStart}
            className="text-xs font-mono text-slate-400 hover:text-slate-700 flex items-center gap-1 transition-colors mt-2"
          >
            <span>Листайте вниз или нажмите для перехода к модулю 01</span>
            <ChevronDown className="w-3 h-3" />
          </button>
        </div>
      </div>
    </section>
  );
};
