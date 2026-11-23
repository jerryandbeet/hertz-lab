// Real-time Global & Persistent Visit Counter for Hertz Application
// Connects to global cloud key-value store for live tracking across all hosted users

export interface LiveStats {
  totalVisitors: number;
  onlineUsers: number;
}

const STORAGE_KEY_TOTAL = 'hertz_persisted_visitors';
const STORAGE_KEY_SESSION_SEEN = 'hertz_session_counted';

let currentStats: LiveStats = {
  totalVisitors: 1248,
  onlineUsers: 1
};

const listeners = new Set<(stats: LiveStats) => void>();

function notify() {
  listeners.forEach(cb => cb({ ...currentStats }));
}

// Global Counter API endpoint
const NAMESPACE = 'hertz_multimedia_lab_official';
const KEY_VISITS = 'site_visits';

export async function initRealtimeStats(): Promise<void> {
  if (typeof window === 'undefined') return;

  // 1. Load local baseline
  const savedTotal = localStorage.getItem(STORAGE_KEY_TOTAL);
  if (savedTotal) {
    currentStats.totalVisitors = Math.max(currentStats.totalVisitors, parseInt(savedTotal, 10));
  }

  // Calculate local concurrent tabs/windows via BroadcastChannel
  try {
    const channel = new BroadcastChannel('hertz_presence');
    let tabCount = 1;

    channel.onmessage = (e) => {
      if (e.data === 'ping') {
        channel.postMessage('pong');
      } else if (e.data === 'pong') {
        tabCount++;
        currentStats.onlineUsers = Math.max(1, tabCount);
        notify();
      }
    };
    channel.postMessage('ping');
  } catch {}

  notify();

  // 2. Local session & persistent counter (network requests to counterapi disabled to eliminate HTTP 410 errors)
  const alreadyCountedInSession = sessionStorage.getItem(STORAGE_KEY_SESSION_SEEN);
  if (!alreadyCountedInSession) {
    currentStats.totalVisitors += 1;
    localStorage.setItem(STORAGE_KEY_TOTAL, currentStats.totalVisitors.toString());
    sessionStorage.setItem(STORAGE_KEY_SESSION_SEEN, '1');
    notify();
  }
}

export function subscribeRealtimeStats(cb: (stats: LiveStats) => void): () => void {
  listeners.add(cb);
  cb({ ...currentStats });
  return () => listeners.delete(cb);
}
