export interface ScanResult {
  exactHz: number;
  matchedHz: number;
  intervalMs: number;
  jitterMs: number;
  confidence: number;
  totalFrames: number;
  standardName: string;
  isThrottled?: boolean;
}

// Global flag to pause other active Canvas/Three.js loops during calibration
let isCalibratingGlobal = false;
const calibrationListeners: Array<(isCalibrating: boolean) => void> = [];

export function subscribeCalibrationState(cb: (isCalibrating: boolean) => void): () => void {
  calibrationListeners.push(cb);
  cb(isCalibratingGlobal);
  return () => {
    const idx = calibrationListeners.indexOf(cb);
    if (idx !== -1) calibrationListeners.splice(idx, 1);
  };
}

export function isCalibrationActive(): boolean {
  return isCalibratingGlobal;
}

export function runHardwareHzScan(
  onProgress: (current: number, total: number) => void,
  onComplete: (result: ScanResult) => void
): () => void {
  // Notify all scenes to pause to yield 100% thread priority to the measurement loop
  isCalibratingGlobal = true;
  calibrationListeners.forEach((fn) => fn(true));

  const targetSamples = 90; // ~1.5 sec at 60Hz - optimal sample window
  const rawDeltas: number[] = [];
  let lastTime = 0;
  let animId: number;
  let isCancelled = false;

  const standardRates = [60, 75, 90, 100, 120, 144, 165, 240, 280, 360, 480, 540];

  const cleanup = () => {
    isCancelled = true;
    cancelAnimationFrame(animId);
    isCalibratingGlobal = false;
    calibrationListeners.forEach((fn) => fn(false));
  };

  const loop = (now: number) => {
    if (isCancelled) return;

    if (lastTime !== 0) {
      const dt = now - lastTime;
      // Filter out OS thread switches / background sleeps
      if (dt > 1.0 && dt < 400) {
        rawDeltas.push(dt);
        onProgress(rawDeltas.length, targetSamples);
      }
    }
    lastTime = now;

    if (rawDeltas.length >= targetSamples) {
      cleanup();

      // Discard initial 5 warm-up frames
      const samples = rawDeltas.slice(5);

      // Sort intervals ascending
      const sorted = [...samples].sort((a, b) => a - b);

      // Interquartile Range (IQR): discard 20% lowest and 20% highest to eliminate GC/composite hiccups
      const p20 = Math.floor(sorted.length * 0.2);
      const p80 = Math.ceil(sorted.length * 0.8);
      const trimmed = sorted.slice(p20, p80);

      const medianInterval = trimmed[Math.floor(trimmed.length / 2)] || 16.67;
      const exactHz = 1000 / medianInterval;

      // Calculate jitter (standard deviation over trimmed window)
      let sumSq = 0;
      for (const val of trimmed) {
        sumSq += Math.pow(val - medianInterval, 2);
      }
      const jitterMs = Math.sqrt(sumSq / trimmed.length);

      // Evaluate system throttling: high jitter (>2.5ms) indicates browser background load/frame drops
      const isThrottled = jitterMs > 2.5;

      // Match to closest standard rate
      let matchedHz = Math.round(exactHz);
      let minDiff = Infinity;
      let matchedStandard = 60;

      for (const rate of standardRates) {
        const diff = Math.abs(exactHz - rate);
        if (diff < minDiff) {
          minDiff = diff;
          matchedStandard = rate;
        }
      }

      // If difference is small and jitter is reasonable, snap to standard hardware refresh rate
      if (minDiff <= 3.5 && jitterMs < 3.0) {
        matchedHz = matchedStandard;
      } else {
        matchedHz = Math.round(exactHz);
      }

      // Honest confidence calculation: drops significantly if jitter is high
      let confidence = Math.min(99.9, Math.max(10, 100 - jitterMs * 16));
      if (isThrottled) {
        confidence = Math.min(confidence, 65);
      }

      onComplete({
        exactHz: Number(exactHz.toFixed(2)),
        matchedHz,
        intervalMs: Number(medianInterval.toFixed(3)),
        jitterMs: Number(jitterMs.toFixed(3)),
        confidence: Number(confidence.toFixed(1)),
        totalFrames: samples.length,
        standardName: `${matchedHz} Гц (${matchedHz >= 120 ? 'High-Refresh' : 'Standard 60Hz'})`,
        isThrottled
      });
      return;
    }

    animId = requestAnimationFrame(loop);
  };

  animId = requestAnimationFrame(loop);
  return cleanup;
}
