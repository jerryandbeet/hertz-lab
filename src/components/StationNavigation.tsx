import React from 'react';
import { 
  Zap, 
  Eye, 
  SplitSquareHorizontal, 
  BarChart2, 
  MousePointerClick, 
  Sparkles, 
  Gauge,
  Home,
  Compass,
  ArrowRight,
  ArrowLeft,
  X,
  Tv
} from 'lucide-react';
import { StationId, StationMeta } from '../types';
import { audio } from '../services/audioService';

export const STATIONS: StationMeta[] = [
  {
    id: 'fps',
    index: 1,
    title: 'Кадровая частота и плавность',
    shortTitle: 'FPS & Плавность',
    badge: '15 / 30 / 60 / 120+ FPS',
    description: 'Интерактивный сплиттер кадровой частоты на 3D-геометрии и динамических маркерах.',
    iconName: 'Zap',
    tourNote: 'Ключевая мысль: Время кадра нелинейно. Переход от 30 FPS к 60 FPS экономит целых 16.7 мс задержки!'
  },
  {
    id: 'blur',
    index: 2,
    title: 'Motion Blur и BFI',
    shortTitle: 'Motion Blur',
    badge: 'Sample-and-Hold vs Строб',
    description: 'Размытие при отслеживании глазом vs выдержка, симуляция Black Frame Insertion.',
    iconName: 'Eye',
    tourNote: 'Ключевая мысль: Даже на мгновенном OLED картинка размывается, пока глаз скользит, если подсветка не стробируется.'
  },
  {
    id: 'tearing',
    index: 3,
    title: 'V-Sync, Tearing и VRR',
    shortTitle: 'Tearing & V-Sync',
    badge: 'Разрыв кадра & Фаза',
    description: 'Физика развертки матрицы: двойная буферизация, рассинхронизация и адаптивная частота.',
    iconName: 'SplitSquareHorizontal',
    tourNote: 'Ключевая мысль: Тиринг возникает, когда буфер сменяется во время строчной развертки. G-Sync заставляет монитор ждать GPU.'
  },
  {
    id: 'pacing',
    index: 4,
    title: 'Frame Pacing и 1% Low',
    shortTitle: 'Frame Pacing',
    badge: '16.6ms vs Микрофризы',
    description: 'Осциллограф фреймтайма: почему стабильные 60 FPS плавнее дерганых 60 FPS.',
    iconName: 'BarChart2',
    tourNote: 'Ключевая мысль: Средний FPS обманчив! Равномерные 16.6 мс ощущаются в разы комфортнее скачущих 60 FPS.'
  },
  {
    id: 'input-lag',
    index: 5,
    title: 'Click-to-Photon Input Lag',
    shortTitle: 'Задержка отклика',
    badge: 'Сенсор → Пиксель',
    description: 'Цепочка очередей рендеринга и тактильная симуляция запаздывания курсора.',
    iconName: 'MousePointerClick',
    tourNote: 'Ключевая мысль: Задержка ввода складывается из мыши, ОС, очереди буфера GPU и развертки монитора.'
  },
  {
    id: 'sandbox',
    index: 6,
    title: 'Детектор герцовки & Песочница',
    shortTitle: 'Hz Тест & Бенчмарк',
    badge: 'High-Precision Scan',
    description: 'Высокоточный замер реальной частоты монитора и 3D-стресс-тестирование графики.',
    iconName: 'Gauge',
    tourNote: 'Ключевая мысль: Измеряйте свой реальный монитор и тестируйте пределы GPU и CPU в песочнице.'
  }
];

interface Props {
  activeStationId: StationId | 'hero';
  onScrollToStation: (id: StationId | 'hero') => void;
  isTourMode?: boolean;
  onToggleTour?: () => void;
  onNextTour?: () => void;
  onPrevTour?: () => void;
}

export const StationNavigation: React.FC<Props> = ({
  activeStationId,
  onScrollToStation,
  isTourMode = false,
  onToggleTour,
  onNextTour,
  onPrevTour
}) => {
  const currentIndex = STATIONS.findIndex(s => s.id === activeStationId);
  const currentStation = STATIONS[currentIndex] || STATIONS[0];

  const getIcon = (name: string, active: boolean) => {
    const className = `w-4 h-4 shrink-0 transition-colors ${active ? 'text-blue-600' : 'text-slate-400'}`;
    switch (name) {
      case 'Zap': return <Zap className={className} />;
      case 'Eye': return <Eye className={className} />;
      case 'SplitSquareHorizontal': return <SplitSquareHorizontal className={className} />;
      case 'BarChart2': return <BarChart2 className={className} />;
      case 'MousePointerClick': return <MousePointerClick className={className} />;
      case 'Tv': return <Tv className={className} />;
      case 'Sparkles': return <Sparkles className={className} />;
      case 'Gauge': return <Gauge className={className} />;
      default: return <Zap className={className} />;
    }
  };

  return (
    <>
      {/* Sticky Top Navigation Bar (Clean Apple Segmented Bar, Zero Horizontal Scrollbar) */}
      <nav 
        aria-label="Навигация по интерактивным модулям"
        className="sticky top-20 z-40 w-full max-w-6xl mx-auto px-4 mb-8"
      >
        <div className="glass-panel p-1.5 sm:p-2 rounded-2xl shadow-glass border border-slate-200/90 flex flex-wrap items-center justify-between gap-1.5">
          {/* Home button */}
          <button
            onClick={() => {
              onScrollToStation('hero');
              audio.playSoftClick(420, 0.03);
            }}
            className={`tap-spring px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shrink-0 ${
              activeStationId === 'hero'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
            }`}
            title="Титульный экран (Клавиша 0 / Esc)"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Титул</span>
          </button>

          <div className="h-4 w-px bg-slate-200 hidden sm:block shrink-0"></div>

          {/* 7 Station Tab Buttons (Responsive grid/flex without overflow slider) */}
          <div className="flex flex-wrap items-center justify-center gap-1 sm:gap-1.5 flex-1">
            {STATIONS.map((station) => {
              const isActive = activeStationId === station.id;
              return (
                <button
                  key={station.id}
                  onClick={() => {
                    onScrollToStation(station.id);
                    audio.playSoftClick(400 + station.index * 35, 0.03);
                  }}
                  className={`tap-spring px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all ${
                    isActive
                      ? 'bg-white text-blue-700 shadow-sm border border-slate-200 font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
                  }`}
                  title={`${station.title} [Клавиша ${station.index}]`}
                >
                  {getIcon(station.iconName, isActive)}
                  <span className="hidden md:inline">{station.shortTitle}</span>
                  <span className="md:hidden font-mono font-bold text-xs">0{station.index}</span>
                  <span className={`hidden md:inline-block text-[10px] font-mono px-1 py-0.5 rounded ${
                    isActive ? 'bg-blue-50 text-blue-600' : 'text-slate-400 bg-slate-100'
                  }`}>
                    0{station.index}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="h-5 w-px bg-slate-200 shrink-0"></div>

          {/* Tour Mode Toggle */}
          {onToggleTour && (
            <button
              onClick={() => {
                onToggleTour();
                audio.playSoftClick(560, 0.04);
              }}
              className={`tap-spring px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shrink-0 border ${
                isTourMode
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                  : 'text-slate-600 bg-slate-50 border-slate-200/80 hover:bg-slate-100'
              }`}
              title="Режим интерактивной пошаговой экскурсии"
            >
              <Compass className={`w-3.5 h-3.5 ${isTourMode ? 'animate-spin' : ''}`} />
              <span className="hidden md:inline">Экскурсия</span>
            </button>
          )}
        </div>

        {/* Tour Mode Floating Guidance Banner */}
        {isTourMode && activeStationId !== 'hero' && (
          <div className="mt-3 glass-panel p-4 rounded-2xl border border-indigo-200/90 shadow-glass animate-fadeIn flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-indigo-50/90 to-blue-50/90">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-indigo-600 text-white shrink-0 mt-0.5">
                <Compass className="w-4 h-4 animate-spin" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-indigo-700 uppercase tracking-wider">
                    Гид по модулю {currentStation.index} из {STATIONS.length}
                  </span>
                  <span className="text-xs text-slate-400">•</span>
                  <span className="text-xs font-semibold text-slate-800">{currentStation.title}</span>
                </div>
                <p className="text-xs text-slate-600 mt-1">
                  {currentStation.tourNote}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
              {currentIndex > 0 && onPrevTour && (
                <button
                  onClick={onPrevTour}
                  className="tap-spring px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200 flex items-center gap-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Назад</span>
                </button>
              )}

              {onNextTour && (
                <button
                  onClick={onNextTour}
                  className="tap-spring px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1 shadow-sm"
                >
                  <span>{currentIndex < STATIONS.length - 1 ? 'Дальше' : 'Завершить'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}

              {onToggleTour && (
                <button
                  onClick={onToggleTour}
                  className="tap-spring p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-white/80"
                  title="Выйти из режима экскурсии"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Right-Side Floating Keynote Timeline (Desktop Only) */}
      <aside 
        aria-label="Шкала глав презентации"
        className="fixed right-4 top-1/2 -translate-y-1/2 z-40 hidden xl:flex flex-col items-center gap-3 glass-panel py-4 px-2.5 rounded-full shadow-glass border border-slate-200/90"
      >
        {/* Hero dot */}
        <button
          onClick={() => {
            onScrollToStation('hero');
            audio.playSoftClick(420, 0.03);
          }}
          className="group relative flex items-center justify-center p-1"
          title="Титульный экран"
        >
          <span className={`rounded-full transition-all duration-300 ${
            activeStationId === 'hero'
              ? 'w-3.5 h-3.5 bg-blue-600 ring-4 ring-blue-100 shadow-sm'
              : 'w-2 h-2 bg-slate-300 group-hover:bg-slate-400 group-hover:scale-125'
          }`} />
          {/* Tooltip */}
          <span className="absolute right-7 px-2.5 py-1 rounded-lg bg-slate-900 text-white text-[11px] font-sans font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity shadow-lg">
            HERTZ • Титульный экран
          </span>
        </button>

        <div className="w-3 h-px bg-slate-200"></div>

        {/* 7 Station dots */}
        {STATIONS.map((station) => {
          const isActive = activeStationId === station.id;
          return (
            <button
              key={station.id}
              onClick={() => {
                onScrollToStation(station.id);
                audio.playSoftClick(400 + station.index * 35, 0.03);
              }}
              className="group relative flex items-center justify-center p-1"
              title={`Модуль ${station.index}: ${station.shortTitle}`}
            >
              <span className={`rounded-full transition-all duration-300 ${
                isActive
                  ? 'w-3.5 h-3.5 bg-blue-600 ring-4 ring-blue-100 shadow-sm'
                  : 'w-2 h-2 bg-slate-300 group-hover:bg-slate-400 group-hover:scale-125'
              }`} />
              {/* Tooltip */}
              <span className="absolute right-7 px-2.5 py-1 rounded-lg bg-slate-900 text-white text-[11px] font-sans font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity shadow-lg">
                Модуль 0{station.index}. {station.title}
              </span>
            </button>
          );
        })}
      </aside>
    </>
  );
};
