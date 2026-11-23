export type StationId = 'fps' | 'blur' | 'tearing' | 'pacing' | 'input-lag' | 'sandbox';
export type AppView = 'hero' | StationId;

export interface StationMeta {
  id: StationId;
  index: number;
  title: string;
  shortTitle: string;
  badge: string;
  description: string;
  iconName: string;
  tourNote?: string;
}

export interface TelemetryData {
  fps: number;
  frametime: number;
  avgFrametime: number;
  low1Percent: number;
  jitter: number;
  estimatedHz: number;
  frameHistory: number[];
}
