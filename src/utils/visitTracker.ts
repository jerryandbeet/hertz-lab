// Real visit and session duration tracker using browser localStorage

interface VisitStats {
  visitCount: number;
  sessionMinutes: number;
  isFirstVisit: boolean;
}

const STORAGE_KEY_VISITS = 'hertz_visit_count';
const STORAGE_KEY_FIRST_SEEN = 'hertz_first_seen';

export function getRealVisitStats(): VisitStats {
  if (typeof window === 'undefined') {
    return { visitCount: 1, sessionMinutes: 0, isFirstVisit: true };
  }

  const now = Date.now();
  const firstSeen = localStorage.getItem(STORAGE_KEY_FIRST_SEEN);
  let isFirstVisit = false;

  if (!firstSeen) {
    localStorage.setItem(STORAGE_KEY_FIRST_SEEN, now.toString());
    isFirstVisit = true;
  }

  // Count visits per session
  const sessionActive = sessionStorage.getItem('hertz_session_active');
  let count = parseInt(localStorage.getItem(STORAGE_KEY_VISITS) || '0', 10);

  if (!sessionActive) {
    count += 1;
    localStorage.setItem(STORAGE_KEY_VISITS, count.toString());
    sessionStorage.setItem('hertz_session_active', '1');
    sessionStorage.setItem('hertz_session_start', now.toString());
  }

  const sessionStart = parseInt(sessionStorage.getItem('hertz_session_start') || now.toString(), 10);
  const sessionMinutes = Math.max(0, Math.floor((now - sessionStart) / 60000));

  return {
    visitCount: count,
    sessionMinutes,
    isFirstVisit
  };
}
