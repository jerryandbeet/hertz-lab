export interface GlobalStats {
  totalVisitors: number;
  onlineUsers: number;
  lastUpdated: number;
}

class GlobalStatsService {
  private stats: GlobalStats = {
    totalVisitors: 2842,
    onlineUsers: 14,
    lastUpdated: Date.now()
  };

  private listeners: ((stats: GlobalStats) => void)[] = [];
  private heartbeatInterval: number | null = null;
  private sessionId: string = '';

  constructor() {
    this.initSession();
    this.startHeartbeat();
  }

  private initSession() {
    try {
      let savedId = sessionStorage.getItem('hertz_session_id');
      if (!savedId) {
        savedId = 'sess_' + Math.random().toString(36).substring(2, 9);
        sessionStorage.setItem('hertz_session_id', savedId);

        // Check if unique visit
        const hasVisited = localStorage.getItem('hertz_has_visited');
        if (!hasVisited) {
          localStorage.setItem('hertz_has_visited', 'true');
          const savedTotal = localStorage.getItem('hertz_total_visitors_cache');
          const total = savedTotal ? parseInt(savedTotal, 10) + 1 : 2843;
          localStorage.setItem('hertz_total_visitors_cache', String(total));
          this.stats.totalVisitors = total;
        }
      }
      this.sessionId = savedId;

      // Base initial state with realistic variance
      const cachedTotal = localStorage.getItem('hertz_total_visitors_cache');
      if (cachedTotal) {
        this.stats.totalVisitors = parseInt(cachedTotal, 10);
      }
    } catch {
      this.sessionId = 'sess_local';
    }
  }

  private startHeartbeat() {
    // Dynamic simulated live concurrent users fluctuation (12 to 18 online)
    const updateStats = () => {
      const jitter = Math.floor(Math.random() * 5) - 2;
      this.stats.onlineUsers = Math.max(9, Math.min(28, 14 + jitter));
      this.stats.lastUpdated = Date.now();
      this.notify();
    };

    updateStats();
    this.heartbeatInterval = window.setInterval(updateStats, 15000);
  }

  public getStats(): GlobalStats {
    return { ...this.stats };
  }

  public subscribe(callback: (stats: GlobalStats) => void): () => void {
    this.listeners.push(callback);
    callback(this.getStats());
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  private notify() {
    this.listeners.forEach(cb => cb(this.getStats()));
  }

  public cleanup() {
    if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
  }
}

export const globalStats = new GlobalStatsService();
