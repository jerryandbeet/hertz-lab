import { useState, useEffect, RefObject } from 'react';
import { subscribeCalibrationState } from '../utils/refreshRateDetector';

/**
 * High-performance visibility hook that combines IntersectionObserver with
 * global hardware calibration pausing to eliminate 0-GPU overhead when offscreen.
 */
export function useStationVisibility(
  ref: RefObject<HTMLElement | null>,
  rootMargin = '100px 0px 100px 0px'
): { isVisible: boolean; isPaused: boolean } {
  const [inView, setInView] = useState<boolean>(true);
  const [isCalibrating, setIsCalibrating] = useState<boolean>(false);

  // Subscribe to calibration state
  useEffect(() => {
    return subscribeCalibrationState((calibrating) => {
      setIsCalibrating(calibrating);
    });
  }, []);

  // IntersectionObserver for element
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setInView(entry.isIntersecting);
      },
      {
        rootMargin,
        threshold: 0.01 // Active as soon as 1% is in viewport or margin
      }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [ref, rootMargin]);

  const isPaused = !inView || isCalibrating;
  return { isVisible: inView, isPaused };
}
