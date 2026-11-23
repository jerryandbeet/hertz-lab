import { useState, useEffect, useRef } from 'react';
import { TelemetryData } from '../types';

export function useFpsTelemetry(): TelemetryData {
  const [telemetry, setTelemetry] = useState<TelemetryData>({
    fps: 60,
    frametime: 16.67,
    avgFrametime: 16.67,
    low1Percent: 55,
    jitter: 0.2,
    estimatedHz: 60,
    frameHistory: new Array(40).fill(16.67)
  });

  const stateRef = useRef({
    lastTime: 0,
    frameDeltas: [] as number[],
    recentHistory: [] as number[],
    lastHudUpdate: 0,
    hzSamples: [] as number[]
  });

  useEffect(() => {
    let animId: number;

    const onFrame = (now: number) => {
      const state = stateRef.current;
      if (state.lastTime === 0) {
        state.lastTime = now;
        animId = requestAnimationFrame(onFrame);
        return;
      }

      const delta = now - state.lastTime;
      state.lastTime = now;

      // Filter out abnormal sleep/tab switch delta
      if (delta > 0 && delta < 500) {
        state.frameDeltas.push(delta);
        if (state.frameDeltas.length > 120) {
          state.frameDeltas.shift();
        }

        state.recentHistory.push(delta);
        if (state.recentHistory.length > 40) {
          state.recentHistory.shift();
        }

        // Hz estimation samples (last 60 frames)
        state.hzSamples.push(delta);
        if (state.hzSamples.length > 90) {
          state.hzSamples.shift();
        }
      }

      // Update React state roughly every 100ms (10 times a second) to prevent React re-render choke
      if (now - state.lastHudUpdate >= 100) {
        state.lastHudUpdate = now;

        const deltas = state.frameDeltas;
        if (deltas.length > 0) {
          const currentFrametime = deltas[deltas.length - 1];
          const avgFt = deltas.reduce((a, b) => a + b, 0) / deltas.length;
          const currentFps = Math.round(1000 / (avgFt || 16.67));

          // 1% Low: sort deltas ascending (slowest frames have highest deltas)
          const sorted = [...deltas].sort((a, b) => b - a);
          // 99th percentile frametime (representing the slowest 1% of frames)
          const index99 = Math.max(0, Math.floor(sorted.length * 0.05));
          const p99Frametime = sorted[index99] || avgFt;
          const low1PercentFps = Math.max(1, Math.round(1000 / p99Frametime));

          // Jitter: average difference between successive frames
          let totalDiff = 0;
          for (let i = 1; i < deltas.length; i++) {
            totalDiff += Math.abs(deltas[i] - deltas[i - 1]);
          }
          const jitter = deltas.length > 1 ? Number((totalDiff / (deltas.length - 1)).toFixed(2)) : 0;

          // Estimate Hz by finding median delta
          const hzSorted = [...state.hzSamples].sort((a, b) => a - b);
          const medianDelta = hzSorted[Math.floor(hzSorted.length / 2)] || 16.67;
          const rawHz = 1000 / medianDelta;

          // Snap to standard refresh rates
          let estimatedHz = Math.round(rawHz);
          const standardRates = [60, 75, 90, 100, 120, 144, 165, 240, 360];
          for (const rate of standardRates) {
            if (Math.abs(rawHz - rate) <= 3) {
              estimatedHz = rate;
              break;
            }
          }

          setTelemetry({
            fps: Math.min(480, Math.max(1, currentFps)),
            frametime: Number(currentFrametime.toFixed(1)),
            avgFrametime: Number(avgFt.toFixed(1)),
            low1Percent: low1PercentFps,
            jitter,
            estimatedHz,
            frameHistory: [...state.recentHistory]
          });
        }
      }

      animId = requestAnimationFrame(onFrame);
    };

    animId = requestAnimationFrame(onFrame);
    return () => cancelAnimationFrame(animId);
  }, []);

  return telemetry;
}
